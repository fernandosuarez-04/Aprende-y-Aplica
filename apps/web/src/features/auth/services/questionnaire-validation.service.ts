import { logger } from '@/lib/utils/logger';

// Función helper para obtener el cliente del servidor
// Este servicio solo debe usarse en API routes o Server Components
async function getServerClient() {
  // Verificar que estamos en el servidor
  if (typeof window !== 'undefined') {
    throw new Error('getServerClient can only be used on the server')
  }
  
  // Usar Function constructor para evitar análisis estático de Next.js/Turbopack
  const importServer = new Function('path', 'return import(path)')
  const serverModule = await importServer('@/lib/supabase/server')
  return await serverModule.createClient()
}

/**
 * Servicio para validar el estado del cuestionario de usuarios
 */
export class QuestionnaireValidationService {
  /**
   * Verifica si un usuario tiene cuenta OAuth de Google
   */
  static async isGoogleOAuthUser(userId: string): Promise<boolean> {
    try {
      const supabase = await getServerClient();
      
      const { data, error } = await supabase
        .from('oauth_accounts')
        .select('id')
        .eq('user_id', userId)
        .eq('provider', 'google')
        .limit(1);

      if (error) {
        logger.error('Error verificando cuenta OAuth:', error);
        return false;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      logger.error('Error en isGoogleOAuthUser:', error);
      return false;
    }
  }

  /**
   * Verifica si el usuario ha completado el cuestionario
   * Un cuestionario se considera completo si:
   * 1. Tiene un perfil en user_perfil
   * 2. Tiene al menos una respuesta en respuestas
   */
  static async isQuestionnaireCompleted(userId: string): Promise<boolean> {
    try {
      const supabase = await getServerClient();

      // Verificar si tiene perfil
      const { data: profile, error: profileError } = await supabase
        .from('user_perfil')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile) {
        return false;
      }

      // Verificar si tiene al menos una respuesta
      const { data: responses, error: responsesError } = await supabase
        .from('respuestas')
        .select('id')
        .eq('user_perfil_id', profile.id)
        .limit(1);

      if (responsesError) {
        logger.error('Error verificando respuestas:', responsesError);
        return false;
      }

      return (responses?.length || 0) > 0;
    } catch (error) {
      logger.error('Error en isQuestionnaireCompleted:', error);
      return false;
    }
  }

  /**
   * Verifica si un usuario requiere completar el cuestionario
   * Retorna true si:
   * 1. El usuario no ha completado el cuestionario (todos los usuarios deben completarlo)
   * 
   * NOTA: Esta validación es obligatoria para TODOS los usuarios que quieran acceder a comunidades
   */
  static async requiresQuestionnaire(userId: string): Promise<boolean> {
    try {
      const isCompleted = await this.isQuestionnaireCompleted(userId);
      return !isCompleted;
    } catch (error) {
      logger.error('Error en requiresQuestionnaire:', error);
      return false;
    }
  }

  /**
   * Verifica si un usuario normal (no OAuth) necesita completar el cuestionario
   * Retorna true si:
   * 1. NO es usuario OAuth
   * 2. No ha completado el cuestionario
   * 
   * Esta función es para usuarios que se registraron normalmente y pueden
   * acceder a la plataforma sin completar el cuestionario, pero se les
   * notifica que deberían completarlo.
   */
  static async normalUserNeedsQuestionnaire(userId: string): Promise<boolean> {
    try {
      const isGoogleUser = await this.isGoogleOAuthUser(userId);
      
      // Si es usuario OAuth, no necesita notificación (ya es obligatorio)
      if (isGoogleUser) {
        return false;
      }

      // Para usuarios normales, verificar si no han completado el cuestionario
      const isCompleted = await this.isQuestionnaireCompleted(userId);
      return !isCompleted;
    } catch (error) {
      logger.error('Error en normalUserNeedsQuestionnaire:', error);
      return false;
    }
  }

  /**
   * Obtiene el estado completo del cuestionario para un usuario
   */
  static async getQuestionnaireStatus(userId: string): Promise<{
    isGoogleOAuth: boolean;
    hasProfile: boolean;
    hasResponses: boolean;
    isCompleted: boolean;
    requiresQuestionnaire: boolean;
  }> {
    try {
      const isGoogleOAuth = await this.isGoogleOAuthUser(userId);
      
      if (!isGoogleOAuth) {
        return {
          isGoogleOAuth: false,
          hasProfile: false,
          hasResponses: false,
          isCompleted: false,
          requiresQuestionnaire: false,
        };
      }

      const supabase = await getServerClient();

      // Verificar perfil
      const { data: profile } = await supabase
        .from('user_perfil')
        .select('id')
        .eq('user_id', userId)
        .single();

      const hasProfile = !!profile;

      let hasResponses = false;
      if (hasProfile && profile) {
        const { data: responses } = await supabase
          .from('respuestas')
          .select('id')
          .eq('user_perfil_id', profile.id)
          .limit(1);
        
        hasResponses = (responses?.length || 0) > 0;
      }

      const isCompleted = hasProfile && hasResponses;
      const requiresQuestionnaire = !isCompleted;

      return {
        isGoogleOAuth: true,
        hasProfile,
        hasResponses,
        isCompleted,
        requiresQuestionnaire,
      };
    } catch (error) {
      logger.error('Error en getQuestionnaireStatus:', error);
      return {
        isGoogleOAuth: false,
        hasProfile: false,
        hasResponses: false,
        isCompleted: false,
        requiresQuestionnaire: false,
      };
    }
  }
}

