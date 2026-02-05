/**
 * LiaPersonalizationService
 * 
 * Servicio para gestionar la configuración de personalización de LIA
 * Similar a las opciones de personalización de ChatGPT
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
 * Solo debe usarse en el servidor con validación manual del usuario
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
   * Obtiene la configuración de personalización del usuario
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
      console.error('Error obteniendo configuración de personalización:', error);
      throw new Error(`Error al obtener configuración: ${error.message}`);
    }

    return data as LiaPersonalizationSettings;
  }

  /**
   * Obtiene la configuración de personalización del usuario o crea una con valores por defecto
   */
  static async getSettingsOrCreate(userId: string): Promise<LiaPersonalizationSettings> {
    let settings = await this.getSettings(userId);

    if (!settings) {
      // Crear configuración con valores por defecto
      settings = await this.createDefaultSettings(userId);
    }

    return settings;
  }

  /**
   * Crea una configuración de personalización con valores por defecto
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
      console.error('Error creando configuración por defecto:', error);
      throw new Error(`Error al crear configuración: ${error.message}`);
    }

    return data as LiaPersonalizationSettings;
  }

  /**
   * Actualiza la configuración de personalización del usuario
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
          console.error('Error creando configuración:', createError);
          throw new Error(`Error al crear configuración: ${createError.message}`);
        }

        return createdData as LiaPersonalizationSettings;
      }

      console.error('Error actualizando configuración:', updateError);
      throw new Error(`Error al actualizar configuración: ${updateError.message}`);
    }

    return updatedData as LiaPersonalizationSettings;
  }

  /**
   * Elimina la configuración de personalización del usuario
   * Esto restablecerá los valores por defecto
   */
  static async deleteSettings(userId: string): Promise<void> {
    // Usar cliente admin para bypass de RLS, pero validamos manualmente el userId
    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase
      .from('lia_personalization_settings' as any)
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error eliminando configuración:', error);
      throw new Error(`Error al eliminar configuración: ${error.message}`);
    }
  }

  /**
   * Construye el prompt de personalización basado en la configuración
   * Este método se usa para inyectar las preferencias en el system prompt
   */
  static buildPersonalizationPrompt(settings: LiaPersonalizationSettings): string {
    let prompt = '';

    // Estilo y Tono Base
    const styleInstructions: Record<BaseStyle, string> = {
      professional: 'Usa un tono profesional y formal. Mantén un lenguaje claro y directo, apropiado para un entorno de trabajo.',
      casual: 'Usa un tono casual y relajado. Puedes ser más conversacional y menos formal.',
      technical: 'Usa un tono técnico y preciso. Enfócate en detalles técnicos y terminología especializada cuando sea apropiado.',
      friendly: 'Usa un tono amigable y cálido. Sé cercano y accesible, como un compañero de trabajo amigable.',
      formal: 'Usa un tono formal y respetuoso. Mantén un lenguaje profesional y estructurado.',
    };

    prompt += `\n## ESTILO Y TONO BASE\n`;
    prompt += `${styleInstructions[settings.base_style]}\n`;

    // Características
    prompt += `\n## CARACTERÃSTICAS DE COMUNICACIÓN\n`;
    
    if (settings.is_friendly) {
      prompt += '- Sé amable y empático en tus respuestas\n';
    }
    
    if (settings.is_enthusiastic) {
      prompt += '- Muestra entusiasmo y energía positiva en tus respuestas\n';
    }

    // Apodo
    if (settings.nickname) {
      prompt += `\n## INFORMACIÓN DEL USUARIO\n`;
      prompt += `- El usuario prefiere ser llamado: "${settings.nickname}"\n`;
    }

    // Instrucciones personalizadas
    if (settings.custom_instructions) {
      prompt += `\n## INSTRUCCIONES PERSONALIZADAS DEL USUARIO\n`;
      prompt += `${settings.custom_instructions}\n`;
    }

    // ðŸš¨ RESTRICCIONES CRÃTICAS SOBRE PERSONALIZACIÓN Y ALCANCE
    prompt += `\n## ðŸš¨ RESTRICCIONES CRÃTICAS - PERSONALIZACIÓN Y ALCANCE\n`;
    prompt += `\nâš ï¸ IMPORTANTE: La personalización SOLO afecta el ESTILO y TONO de tus respuestas, NO el ALCANCE de lo que puedes responder.\n\n`;
    prompt += `✅ LO QUE SÃ PUEDES HACER CON LA PERSONALIZACIÓN:\n`;
    prompt += `- Adaptar tu estilo de comunicación según las instrucciones personalizadas (ej: si dice "actúa como un nerd de comics", usa un tono entusiasta y conocimiento sobre comics SOLO cuando hables de contenido de la plataforma relacionado con ese tema)\n`;
    prompt += `- Usar terminología, ejemplos y referencias del tema de personalización cuando expliques contenido de la plataforma\n`;
    prompt += `- Mantener el estilo personalizado al responder sobre funcionalidades, cursos, y contenido de SOFLIA\n\n`;
    prompt += `âŒ LO QUE NUNCA DEBES HACER:\n`;
    prompt += `- Responder preguntas generales sobre el tema de personalización que NO estén relacionadas con la plataforma (ej: si la personalización es sobre comics, NO respondas "¿Cuál fue el primer comic de Spiderman?" a menos que sea contenido de un curso de la plataforma)\n`;
    prompt += `- Convertirte en un asistente general sobre el tema de personalización\n`;
    prompt += `- Usar la personalización como excusa para responder sobre temas fuera del alcance de la plataforma\n\n`;
    prompt += `ðŸ“‹ REGLA DE ORO:\n`;
    prompt += `Si el usuario pregunta algo que NO está relacionado con contenido de la plataforma SOFLIA (cursos, funcionalidades, navegación, etc.), debes:\n`;
    prompt += `1. Mantener tu estilo personalizado en la respuesta\n`;
    prompt += `2. Amablemente redirigir al usuario hacia el contenido de la plataforma\n`;
    prompt += `3. NO responder la pregunta general, incluso si conoces la respuesta\n`;
    prompt += `4. Ejemplo: "Entiendo tu interés en [tema], pero mi función es ayudarte específicamente con el contenido y funcionalidades de SOFLIA. ¿Hay algo sobre la plataforma en lo que pueda ayudarte?"\n\n`;
    prompt += `ðŸŽ¯ EJEMPLO PRÃCTICO:\n`;
    prompt += `Si la personalización dice "actúa como un nerd de comics de Marvel":\n`;
    prompt += `✅ CORRECTO: Usar referencias a Marvel cuando expliques funcionalidades de la plataforma, usar un tono entusiasta sobre comics, pero SOLO responder sobre contenido de SOFLIA\n`;
    prompt += `âŒ INCORRECTO: Responder "El primer comic de Spiderman fue Amazing Fantasy #15" cuando el usuario pregunta directamente sobre comics sin relación con la plataforma\n\n`;
    prompt += `🔒 RECUERDA: Tu función principal es ser un asistente de SOFLIA. La personalización es solo para hacer la experiencia más agradable y relevante, pero NUNCA cambia tu alcance fundamental de responder solo sobre la plataforma.\n`;

    return prompt;
  }
}

