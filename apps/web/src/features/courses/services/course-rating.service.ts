/**
 * Servicio para gestionar ratings de cursos
 */

export interface CourseRating {
  review_id: string;
  rating: number;
  review_title?: string | null;
  review_content: string;
  created_at: string;
  updated_at: string;
}

export interface RatingCheckResponse {
  success: boolean;
  hasRating: boolean;
  rating: CourseRating | null;
}

export interface SubmitRatingResponse {
  success: boolean;
  rating: CourseRating;
  message: string;
}

export class CourseRatingService {
  /**
   * Verifica si el usuario actual ya calificó un curso
   * @param courseSlug Slug del curso
   * @returns Información sobre si el usuario ya calificó y el rating si existe
   */
  static async checkUserRating(courseSlug: string): Promise<RatingCheckResponse> {
    try {
      const response = await fetch(`/api/courses/${courseSlug}/rating`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No autorizado');
        }
        if (response.status === 404) {
          throw new Error('Curso no encontrado');
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
   * Crea o actualiza el rating de un curso
   * @param courseSlug Slug del curso
   * @param rating Rating (1-5)
   * @param reviewTitle Título opcional de la reseña
   * @param reviewContent Contenido opcional de la reseña
   * @returns Rating creado/actualizado
   */
  static async submitRating(
    courseSlug: string,
    rating: number,
    reviewTitle?: string,
    reviewContent?: string
  ): Promise<SubmitRatingResponse> {
    try {
      // Validar rating
      if (!rating || rating < 1 || rating > 5) {
        throw new Error('El rating debe ser un número entre 1 y 5');
      }

      const response = await fetch(`/api/courses/${courseSlug}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          rating: Math.round(rating),
          review_title: reviewTitle || null,
          review_content: reviewContent || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        
        if (response.status === 401) {
          throw new Error('No autorizado');
        }
        if (response.status === 403) {
          throw new Error('Debes estar inscrito en el curso para calificarlo');
        }
        if (response.status === 404) {
          throw new Error('Curso no encontrado');
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

