/**
 * Servicio para gestionar ratings de prompts
 */

export interface PromptRating {
  rating_id: string;
  rating: number;
  review?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromptRatingCheckResponse {
  success: boolean;
  hasRating: boolean;
  rating: PromptRating | null;
}

export interface PromptSubmitRatingResponse {
  success: boolean;
  rating: PromptRating;
  message: string;
}

export class PromptRatingService {
  /**
   * Verifica si el usuario actual ya calificó un prompt
   * @param promptSlug Slug del prompt
   * @returns Información sobre si el usuario ya calificó y el rating si existe
   */
  static async checkUserRating(promptSlug: string): Promise<PromptRatingCheckResponse> {
    try {
      const response = await fetch(`/api/ai-directory/prompts/${promptSlug}/rating`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No autorizado');
        }
        if (response.status === 404) {
          throw new Error('Prompt no encontrado');
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
   * Crea o actualiza el rating de un prompt
   * @param promptSlug Slug del prompt
   * @param rating Rating (1-5)
   * @param review Reseña opcional
   * @returns Rating creado/actualizado
   */
  static async submitRating(
    promptSlug: string,
    rating: number,
    review?: string
  ): Promise<PromptSubmitRatingResponse> {
    try {
      // Validar rating
      if (!rating || rating < 1 || rating > 5) {
        throw new Error('El rating debe ser un número entre 1 y 5');
      }

      const response = await fetch(`/api/ai-directory/prompts/${promptSlug}/rating`, {
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
          throw new Error('Prompt no encontrado');
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

