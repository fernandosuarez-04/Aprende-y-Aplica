/**
 * Servicio para gestionar ratings de apps de IA
 */

export interface AppRating {
  rating_id: string;
  rating: number;
  review?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppRatingCheckResponse {
  success: boolean;
  hasRating: boolean;
  rating: AppRating | null;
}

export interface AppSubmitRatingResponse {
  success: boolean;
  rating: AppRating;
  message: string;
}

export class AppRatingService {
  /**
   * Verifica si el usuario actual ya calificó una app
   * @param appSlug Slug de la app
   * @returns Información sobre si el usuario ya calificó y el rating si existe
   */
  static async checkUserRating(appSlug: string): Promise<AppRatingCheckResponse> {
    try {
      const response = await fetch(`/api/ai-directory/apps/${appSlug}/rating`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No autorizado');
        }
        if (response.status === 404) {
          throw new Error('App no encontrada');
        }
        throw new Error('Error al verificar rating');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking user rating:', error);
      throw error;
    }
  }

  /**
   * Crea o actualiza el rating de una app
   * @param appSlug Slug de la app
   * @param rating Rating (1-5)
   * @param review Reseña opcional
   * @returns Rating creado/actualizado
   */
  static async submitRating(
    appSlug: string,
    rating: number,
    review?: string
  ): Promise<AppSubmitRatingResponse> {
    try {
      // Validar rating
      if (!rating || rating < 1 || rating > 5) {
        throw new Error('El rating debe ser un número entre 1 y 5');
      }

      const response = await fetch(`/api/ai-directory/apps/${appSlug}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          rating: Math.round(rating),
          review: review || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        
        if (response.status === 401) {
          throw new Error('No autorizado');
        }
        if (response.status === 404) {
          throw new Error('App no encontrada');
        }
        if (response.status === 400) {
          throw new Error(errorData.error || 'Datos inválidos');
        }
        throw new Error(errorData.error || 'Error al guardar la calificación');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error submitting rating:', error);
      throw error;
    }
  }
}

