import { createClient } from './supabase/server';

export interface ForbiddenContentResult {
  contains: boolean;
  words: string[];
}

export interface WarningResult {
  warningCount: number;
  userBanned: boolean;
  message: string;
}

/**
 * Verifica si un texto contiene palabras prohibidas
 */
export async function containsForbiddenContent(text: string): Promise<ForbiddenContentResult> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase.rpc('contains_forbidden_content', {
      p_text: text
    });
    
    if (error) {
      console.error('Error checking forbidden content:', error);
      return { contains: false, words: [] };
    }
    
    return {
      contains: data?.contains_forbidden || false,
      words: data?.found_words || []
    };
  } catch (error) {
    console.error('Exception checking forbidden content:', error);
    return { contains: false, words: [] };
  }
}

/**
 * Registra una advertencia para un usuario
 * Si el usuario alcanza 4 advertencias, será baneado automáticamente
 */
export async function registerWarning(
  userId: string,
  content: string,
  contentType: 'post' | 'comment',
  contentId?: string
): Promise<WarningResult> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase.rpc('register_user_warning', {
      p_user_id: userId,
      p_reason: 'contenido_ofensivo',
      p_content_type: contentType,
      p_content_id: contentId || null,
      p_blocked_content: content
    });
    
    if (error) {
      console.error('Error registering warning:', error);
      throw error;
    }
    
    return {
      warningCount: data?.warning_count || 0,
      userBanned: data?.user_banned || false,
      message: data?.message || ''
    };
  } catch (error) {
    console.error('Exception registering warning:', error);
    throw error;
  }
}

/**
 * Verifica si un usuario está baneado
 */
export async function isUserBanned(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase.rpc('is_user_banned', {
      p_user_id: userId
    });
    
    if (error) {
      console.error('Error checking if user is banned:', error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error('Exception checking if user is banned:', error);
    return false;
  }
}

/**
 * Obtiene el historial de advertencias de un usuario
 */
export async function getUserWarningHistory(userId: string) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase.rpc('get_user_warning_history', {
      p_user_id: userId
    });
    
    if (error) {
      console.error('Error getting warning history:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception getting warning history:', error);
    return [];
  }
}

/**
 * Obtiene el conteo de advertencias de un usuario
 */
export async function getUserWarningsCount(userId: string): Promise<number> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase.rpc('get_user_warnings_count', {
      p_user_id: userId
    });
    
    if (error) {
      console.error('Error getting warning count:', error);
      return 0;
    }
    
    return data || 0;
  } catch (error) {
    console.error('Exception getting warning count:', error);
    return 0;
  }
}
