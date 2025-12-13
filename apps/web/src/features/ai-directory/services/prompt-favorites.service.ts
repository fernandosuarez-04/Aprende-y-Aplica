import { createClient } from '../../../lib/supabase/server'

export class PromptFavoritesService {
  /**
   * Obtiene los favoritos de prompts de un usuario
   */
  static async getUserPromptFavorites(userId: string): Promise<string[]> {
    try {
      const supabase = await createClient()
      
      // Optimizar la query: solo seleccionar prompt_id, ordenar por created_at para consistencia
      const { data, error } = await supabase
        .from('prompt_favorites')
        .select('prompt_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        // console.error('Error fetching user prompt favorites:', error)
        throw new Error(`Error al obtener favoritos de prompts: ${error.message}`)
      }

      return data?.map(favorite => favorite.prompt_id) || []
    } catch (error) {
      // console.error('Error in PromptFavoritesService.getUserPromptFavorites:', error)
      
      // Si es un error de configuración de Supabase, devolver array vacío
      if (error instanceof Error && error.message.includes('Variables de entorno')) {
        // console.warn('Supabase no configurado correctamente, devolviendo favoritos vacíos')
        return []
      }
      
      throw error
    }
  }

  /**
   * Agrega un prompt a favoritos
   */
  static async addPromptToFavorites(userId: string, promptId: string): Promise<void> {
    try {
      const supabase = await createClient()
      
      // Insertar directamente (si ya existe, será manejado por el error)
      const { error } = await supabase
        .from('prompt_favorites')
        .insert({
          user_id: userId,
          prompt_id: promptId
        })

      if (error) {
        // Si es un error de duplicado, ignorarlo (ya existe)
        if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
          // console.warn('Favorito de prompt ya existe, ignorando inserción duplicada')
          return
        }
        // console.error('Error adding prompt to favorites:', error)
        throw new Error(`Error al agregar a favoritos: ${error.message}`)
      }
    } catch (error) {
      // console.error('Error in PromptFavoritesService.addPromptToFavorites:', error)
      throw error
    }
  }

  /**
   * Remueve un prompt de favoritos
   */
  static async removePromptFromFavorites(userId: string, promptId: string): Promise<void> {
    try {
      const supabase = await createClient()
      
      const { error } = await supabase
        .from('prompt_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('prompt_id', promptId)

      if (error) {
        // console.error('Error removing prompt from favorites:', error)
        throw new Error(`Error al remover de favoritos: ${error.message}`)
      }
    } catch (error) {
      // console.error('Error in PromptFavoritesService.removePromptFromFavorites:', error)
      throw error
    }
  }

  /**
   * Verifica si un prompt está en favoritos
   */
  static async isPromptFavorite(userId: string, promptId: string): Promise<boolean> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('prompt_favorites')
        .select('favorite_id')
        .eq('user_id', userId)
        .eq('prompt_id', promptId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        // console.error('Error checking prompt favorite status:', error)
        throw new Error(`Error al verificar favorito: ${error.message}`)
      }

      return !!data
    } catch (error) {
      // console.error('Error in PromptFavoritesService.isPromptFavorite:', error)
      
      // Si es un error de configuración de Supabase, devolver false
      if (error instanceof Error && (
        error.message.includes('Variables de entorno') ||
        error.message.includes('NEXT_PUBLIC_SUPABASE_URL') ||
        error.message.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')
      )) {
        // console.warn('Supabase no configurado, asumiendo que no es favorito')
        return false
      }
      
      throw error
    }
  }

  /**
   * Alterna el estado de favorito de un prompt (optimizado: una sola query)
   */
  static async togglePromptFavorite(userId: string, promptId: string): Promise<boolean> {
    try {
      const supabase = await createClient()
      
      // Primero verificar si existe (una sola query)
      const { data: existing, error: checkError } = await supabase
        .from('prompt_favorites')
        .select('favorite_id')
        .eq('user_id', userId)
        .eq('prompt_id', promptId)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        // console.error('Error checking prompt favorite status:', checkError)
        throw new Error(`Error al verificar favorito: ${checkError.message}`)
      }

      const isCurrentlyFavorite = !!existing

      if (isCurrentlyFavorite) {
        // Eliminar si existe
        const { error: deleteError } = await supabase
          .from('prompt_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('prompt_id', promptId)

        if (deleteError) {
          // console.error('Error removing prompt from favorites:', deleteError)
          throw new Error(`Error al remover de favoritos: ${deleteError.message}`)
        }
        return false
      } else {
        // Insertar si no existe
        const { error: insertError } = await supabase
          .from('prompt_favorites')
          .insert({
            user_id: userId,
            prompt_id: promptId
          })

        if (insertError) {
          // Si es un error de duplicado, significa que se agregó en otro proceso
          if (insertError.code === '23505' || insertError.message.includes('duplicate') || insertError.message.includes('unique')) {
            // console.warn('Favorito de prompt ya existe, asumiendo que fue agregado')
            return true
          }
          // console.error('Error adding prompt to favorites:', insertError)
          throw new Error(`Error al agregar a favoritos: ${insertError.message}`)
        }
        return true
      }
    } catch (error) {
      // console.error('Error in PromptFavoritesService.togglePromptFavorite:', error)
      
      // Si es un error de configuración de Supabase, simular comportamiento
      if (error instanceof Error && (
        error.message.includes('Variables de entorno') ||
        error.message.includes('NEXT_PUBLIC_SUPABASE_URL') ||
        error.message.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')
      )) {
        // console.warn('Supabase no configurado, simulando toggle de favorito')
        return true
      }
      
      throw error
    }
  }
}

