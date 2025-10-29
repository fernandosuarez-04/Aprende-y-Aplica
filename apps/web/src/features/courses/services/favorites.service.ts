import { createClient } from '../../../lib/supabase/server'

export class FavoritesService {
  /**
   * Obtiene los favoritos de un usuario
   */
  static async getUserFavorites(userId: string): Promise<string[]> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('app_favorites')
        .select('course_id')
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching user favorites:', error)
        throw new Error(`Error al obtener favoritos: ${error.message}`)
      }

      return data?.map(favorite => favorite.course_id) || []
    } catch (error) {
      console.error('Error in FavoritesService.getUserFavorites:', error)
      
      // Si es un error de configuración de Supabase, devolver array vacío
      if (error instanceof Error && error.message.includes('Variables de entorno')) {
        console.warn('Supabase no configurado correctamente, devolviendo favoritos vacíos')
        return []
      }
      
      throw error
    }
  }

  /**
   * Agrega un curso a favoritos
   */
  static async addToFavorites(userId: string, courseId: string): Promise<void> {
    try {
      const supabase = await createClient()
      
      const { error } = await supabase
        .from('app_favorites')
        .insert({
          user_id: userId,
          course_id: courseId
        })

      if (error) {
        console.error('Error adding to favorites:', error)
        throw new Error(`Error al agregar a favoritos: ${error.message}`)
      }
    } catch (error) {
      console.error('Error in FavoritesService.addToFavorites:', error)
      throw error
    }
  }

  /**
   * Remueve un curso de favoritos
   */
  static async removeFromFavorites(userId: string, courseId: string): Promise<void> {
    try {
      const supabase = await createClient()
      
      const { error } = await supabase
        .from('app_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', courseId)

      if (error) {
        console.error('Error removing from favorites:', error)
        throw new Error(`Error al remover de favoritos: ${error.message}`)
      }
    } catch (error) {
      console.error('Error in FavoritesService.removeFromFavorites:', error)
      throw error
    }
  }

  /**
   * Verifica si un curso está en favoritos
   */
  static async isFavorite(userId: string, courseId: string): Promise<boolean> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('app_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking favorite status:', error)
        throw new Error(`Error al verificar favorito: ${error.message}`)
      }

      return !!data
    } catch (error) {
      console.error('Error in FavoritesService.isFavorite:', error)
      
      // Si es un error de configuración de Supabase, devolver false
      if (error instanceof Error && (
        error.message.includes('Variables de entorno') ||
        error.message.includes('NEXT_PUBLIC_SUPABASE_URL') ||
        error.message.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')
      )) {
        console.warn('Supabase no configurado, asumiendo que no es favorito')
        return false
      }
      
      throw error
    }
  }

  /**
   * Alterna el estado de favorito de un curso
   */
  static async toggleFavorite(userId: string, courseId: string): Promise<boolean> {
    try {
      const isCurrentlyFavorite = await this.isFavorite(userId, courseId)
      
      if (isCurrentlyFavorite) {
        await this.removeFromFavorites(userId, courseId)
        return false
      } else {
        await this.addToFavorites(userId, courseId)
        return true
      }
    } catch (error) {
      console.error('Error in FavoritesService.toggleFavorite:', error)
      
      // Si es un error de configuración de Supabase, simular comportamiento
      if (error instanceof Error && (
        error.message.includes('Variables de entorno') ||
        error.message.includes('NEXT_PUBLIC_SUPABASE_URL') ||
        error.message.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')
      )) {
        console.warn('Supabase no configurado, simulando toggle de favorito')
        // Simular que se agregó a favoritos (puedes cambiar esta lógica según necesites)
        return true
      }
      
      throw error
    }
  }
}
