import { createClient } from '../../../lib/supabase/server'

export class FavoritesService {
  /**
   * Obtiene los favoritos de un usuario
   */
  static async getUserFavorites(userId: string): Promise<string[]> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('user_favorites')
        .select('course_id')
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching user favorites:', error)
        throw new Error(`Error al obtener favoritos: ${error.message}`)
      }

      return data.map(favorite => favorite.course_id)
    } catch (error) {
      console.error('Error in FavoritesService.getUserFavorites:', error)
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
        .from('user_favorites')
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
        .from('user_favorites')
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
        .from('user_favorites')
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
      throw error
    }
  }
}
