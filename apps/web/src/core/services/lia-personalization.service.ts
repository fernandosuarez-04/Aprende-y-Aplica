/**
 * LiaPersonalizationService
 * 
 * Servicio para gestionar la configuraciÃ³n de personalizaciÃ³n de LIA
 * Similar a las opciones de personalizaciÃ³n de ChatGPT
 */

import { createClient } from '../../lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type {
  LiaPersonalizationSettings,
  LiaPersonalizationSettingsInput,
  BaseStyle,
} from '../types/lia-personalization.types';

/**
 * Crea un cliente de Supabase con permisos de administrador (bypass RLS)
 * Solo debe usarse en el servidor con validaciÃ³n manual del usuario
 */
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for admin client');
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================================================
// CLASE PRINCIPAL: LiaPersonalizationService
// ============================================================================

export class LiaPersonalizationService {
  /**
   * Obtiene la configuraciÃ³n de personalizaciÃ³n del usuario
   * Si no existe, retorna null
   */
  static async getSettings(userId: string): Promise<LiaPersonalizationSettings | null> {
    // Usar cliente admin para bypass de RLS, pero validamos manualmente el userId
    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
      .from('lia_personalization_settings' as any)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Si no existe registro, retornar null (no es un error)
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error obteniendo configuraciÃ³n de personalizaciÃ³n:', error);
      throw new Error(`Error al obtener configuraciÃ³n: ${error.message}`);
    }

    return data as LiaPersonalizationSettings;
  }

  /**
   * Obtiene la configuraciÃ³n de personalizaciÃ³n del usuario o crea una con valores por defecto
   */
  static async getSettingsOrCreate(userId: string): Promise<LiaPersonalizationSettings> {
    let settings = await this.getSettings(userId);

    if (!settings) {
      // Crear configuraciÃ³n con valores por defecto
      settings = await this.createDefaultSettings(userId);
    }

    return settings;
  }

  /**
   * Crea una configuraciÃ³n de personalizaciÃ³n con valores por defecto
   */
  static async createDefaultSettings(userId: string): Promise<LiaPersonalizationSettings> {
    // Usar cliente admin para bypass de RLS, pero validamos manualmente el userId
    const adminSupabase = createAdminClient();

    const defaultSettings: Partial<LiaPersonalizationSettings> = {
      user_id: userId,
      base_style: 'professional',
      is_friendly: true,
      is_enthusiastic: true,
      custom_instructions: null,
      nickname: null,
      voice_enabled: true,
      dictation_enabled: false,
    };

    const { data, error } = await adminSupabase
      .from('lia_personalization_settings' as any)
      .insert(defaultSettings)
      .select()
      .single();

    if (error) {
      console.error('Error creando configuraciÃ³n por defecto:', error);
      throw new Error(`Error al crear configuraciÃ³n: ${error.message}`);
    }

    return data as LiaPersonalizationSettings;
  }

  /**
   * Actualiza la configuraciÃ³n de personalizaciÃ³n del usuario
   * Si no existe, la crea con los valores proporcionados
   */
  static async updateSettings(
    userId: string,
    settings: LiaPersonalizationSettingsInput
  ): Promise<LiaPersonalizationSettings> {
    // Usar cliente admin para bypass de RLS, pero validamos manualmente el userId
    const adminSupabase = createAdminClient();

    // Validar longitud de custom_instructions
    if (settings.custom_instructions && settings.custom_instructions.length > 2000) {
      throw new Error('Las instrucciones personalizadas no pueden exceder 2000 caracteres');
    }

    // Validar longitud de nickname
    if (settings.nickname && settings.nickname.length > 50) {
      throw new Error('El apodo no puede exceder 50 caracteres');
    }

    // Verificar que el usuario existe
    const { data: userCheck, error: userCheckError } = await adminSupabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userCheckError || !userCheck) {
      throw new Error(`El usuario no existe: ${userId}`);
    }

    // Intentar actualizar primero
    const { data: updatedData, error: updateError } = await adminSupabase
      .from('lia_personalization_settings' as any)
      .update(settings)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      // Si no existe, crear con los valores proporcionados
      if (updateError.code === 'PGRST116') {
        const { data: createdData, error: createError } = await adminSupabase
          .from('lia_personalization_settings' as any)
          .insert({
            user_id: userId,
            ...settings,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creando configuraciÃ³n:', createError);
          throw new Error(`Error al crear configuraciÃ³n: ${createError.message}`);
        }

        return createdData as LiaPersonalizationSettings;
      }

      console.error('Error actualizando configuraciÃ³n:', updateError);
      throw new Error(`Error al actualizar configuraciÃ³n: ${updateError.message}`);
    }

    return updatedData as LiaPersonalizationSettings;
  }

  /**
   * Elimina la configuraciÃ³n de personalizaciÃ³n del usuario
   * Esto restablecerÃ¡ los valores por defecto
   */
  static async deleteSettings(userId: string): Promise<void> {
    // Usar cliente admin para bypass de RLS, pero validamos manualmente el userId
    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase
      .from('lia_personalization_settings' as any)
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error eliminando configuraciÃ³n:', error);
      throw new Error(`Error al eliminar configuraciÃ³n: ${error.message}`);
    }
  }

  /**
   * Construye el prompt de personalizaciÃ³n basado en la configuraciÃ³n
   * Este mÃ©todo se usa para inyectar las preferencias en el system prompt
   */
  static buildPersonalizationPrompt(settings: LiaPersonalizationSettings): string {
    let prompt = '';

    // Estilo y Tono Base
    const styleInstructions: Record<BaseStyle, string> = {
      professional: 'Usa un tono profesional y formal. MantÃ©n un lenguaje claro y directo, apropiado para un entorno de trabajo.',
      casual: 'Usa un tono casual y relajado. Puedes ser mÃ¡s conversacional y menos formal.',
      technical: 'Usa un tono tÃ©cnico y preciso. EnfÃ³cate en detalles tÃ©cnicos y terminologÃ­a especializada cuando sea apropiado.',
      friendly: 'Usa un tono amigable y cÃ¡lido. SÃ© cercano y accesible, como un compaÃ±ero de trabajo amigable.',
      formal: 'Usa un tono formal y respetuoso. MantÃ©n un lenguaje profesional y estructurado.',
    };

    prompt += `\n## ESTILO Y TONO BASE\n`;
    prompt += `${styleInstructions[settings.base_style]}\n`;

    // CaracterÃ­sticas
    prompt += `\n## CARACTERÃSTICAS DE COMUNICACIÃ“N\n`;
    
    if (settings.is_friendly) {
      prompt += '- SÃ© amable y empÃ¡tico en tus respuestas\n';
    }
    
    if (settings.is_enthusiastic) {
      prompt += '- Muestra entusiasmo y energÃ­a positiva en tus respuestas\n';
    }

    // Apodo
    if (settings.nickname) {
      prompt += `\n## INFORMACIÃ“N DEL USUARIO\n`;
      prompt += `- El usuario prefiere ser llamado: "${settings.nickname}"\n`;
    }

    // Instrucciones personalizadas
    if (settings.custom_instructions) {
      prompt += `\n## INSTRUCCIONES PERSONALIZADAS DEL USUARIO\n`;
      prompt += `${settings.custom_instructions}\n`;
    }

    // ðŸš¨ RESTRICCIONES CRÃTICAS SOBRE PERSONALIZACIÃ“N Y ALCANCE
    prompt += `\n## ðŸš¨ RESTRICCIONES CRÃTICAS - PERSONALIZACIÃ“N Y ALCANCE\n`;
    prompt += `\nâš ï¸ IMPORTANTE: La personalizaciÃ³n SOLO afecta el ESTILO y TONO de tus respuestas, NO el ALCANCE de lo que puedes responder.\n\n`;
    prompt += `âœ… LO QUE SÃ PUEDES HACER CON LA PERSONALIZACIÃ“N:\n`;
    prompt += `- Adaptar tu estilo de comunicaciÃ³n segÃºn las instrucciones personalizadas (ej: si dice "actÃºa como un nerd de comics", usa un tono entusiasta y conocimiento sobre comics SOLO cuando hables de contenido de la plataforma relacionado con ese tema)\n`;
    prompt += `- Usar terminologÃ­a, ejemplos y referencias del tema de personalizaciÃ³n cuando expliques contenido de la plataforma\n`;
    prompt += `- Mantener el estilo personalizado al responder sobre funcionalidades, cursos, y contenido de SOFLIA\n\n`;
    prompt += `âŒ LO QUE NUNCA DEBES HACER:\n`;
    prompt += `- Responder preguntas generales sobre el tema de personalizaciÃ³n que NO estÃ©n relacionadas con la plataforma (ej: si la personalizaciÃ³n es sobre comics, NO respondas "Â¿CuÃ¡l fue el primer comic de Spiderman?" a menos que sea contenido de un curso de la plataforma)\n`;
    prompt += `- Convertirte en un asistente general sobre el tema de personalizaciÃ³n\n`;
    prompt += `- Usar la personalizaciÃ³n como excusa para responder sobre temas fuera del alcance de la plataforma\n\n`;
    prompt += `ðŸ“‹ REGLA DE ORO:\n`;
    prompt += `Si el usuario pregunta algo que NO estÃ¡ relacionado con contenido de la plataforma SOFLIA (cursos, funcionalidades, navegaciÃ³n, etc.), debes:\n`;
    prompt += `1. Mantener tu estilo personalizado en la respuesta\n`;
    prompt += `2. Amablemente redirigir al usuario hacia el contenido de la plataforma\n`;
    prompt += `3. NO responder la pregunta general, incluso si conoces la respuesta\n`;
    prompt += `4. Ejemplo: "Entiendo tu interÃ©s en [tema], pero mi funciÃ³n es ayudarte especÃ­ficamente con el contenido y funcionalidades de SOFLIA. Â¿Hay algo sobre la plataforma en lo que pueda ayudarte?"\n\n`;
    prompt += `ðŸŽ¯ EJEMPLO PRÃCTICO:\n`;
    prompt += `Si la personalizaciÃ³n dice "actÃºa como un nerd de comics de Marvel":\n`;
    prompt += `âœ… CORRECTO: Usar referencias a Marvel cuando expliques funcionalidades de la plataforma, usar un tono entusiasta sobre comics, pero SOLO responder sobre contenido de SOFLIA\n`;
    prompt += `âŒ INCORRECTO: Responder "El primer comic de Spiderman fue Amazing Fantasy #15" cuando el usuario pregunta directamente sobre comics sin relaciÃ³n con la plataforma\n\n`;
    prompt += `ðŸ”’ RECUERDA: Tu funciÃ³n principal es ser un asistente de SOFLIA. La personalizaciÃ³n es solo para hacer la experiencia mÃ¡s agradable y relevante, pero NUNCA cambia tu alcance fundamental de responder solo sobre la plataforma.\n`;

    return prompt;
  }
}

