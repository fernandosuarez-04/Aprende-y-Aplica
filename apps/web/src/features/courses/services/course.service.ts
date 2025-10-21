import { createClient } from '../../../lib/supabase/server'
import { Course } from '@aprende-y-aplica/shared'

export interface CourseWithInstructor extends Course {
  instructor_name?: string;
  instructor_email?: string;
  rating?: number;
  price?: string;
  status?: 'Adquirido' | 'Disponible';
  isFavorite?: boolean;
}

export interface CourseFilters {
  category?: string;
  userId?: string; // Para obtener favoritos del usuario
}

export class CourseService {
  /**
   * Obtiene todos los cursos activos de la base de datos
   */
  static async getActiveCourses(userId?: string): Promise<CourseWithInstructor[]> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          category,
          level,
          instructor_id,
          duration_total_minutes,
          thumbnail_url,
          slug,
          is_active,
          created_at,
          updated_at
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching courses:', error)
        throw new Error(`Error al obtener cursos: ${error.message}`)
      }

      // Obtener favoritos del usuario si se proporciona userId
      let userFavorites: string[] = []
      if (userId) {
        try {
          const { data: favoritesData } = await supabase
            .from('user_favorites')
            .select('course_id')
            .eq('user_id', userId)
          
          userFavorites = favoritesData?.map(f => f.course_id) || []
        } catch (favoritesError) {
          console.warn('Error fetching user favorites:', favoritesError)
        }
      }

      // Transformar los datos de la base de datos al formato esperado por el frontend
      const courses: CourseWithInstructor[] = data.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail_url,
        status: 'published' as any, // Mapear is_active a status
        estimatedDuration: course.duration_total_minutes,
        difficulty: course.level as any, // Mapear level a difficulty
        isPublic: course.is_active,
        createdAt: new Date(course.created_at),
        updatedAt: new Date(course.updated_at),
        modules: [], // Los módulos se cargarán por separado si es necesario
        category: course.category,
        instructor_id: course.instructor_id,
        slug: course.slug,
        // Datos adicionales para la UI (estos podrían venir de otras tablas)
        rating: 4.5, // TODO: Obtener de tabla de ratings
        price: 'MX$0', // TODO: Obtener de tabla de precios
        status: 'Disponible' as 'Disponible' | 'Adquirido', // TODO: Verificar si el usuario ya lo adquirió
        isFavorite: userFavorites.includes(course.id),
      }))

      return courses
    } catch (error) {
      console.error('Error in CourseService.getActiveCourses:', error)
      throw error
    }
  }

  /**
   * Obtiene un curso específico por ID
   */
  static async getCourseById(courseId: string): Promise<CourseWithInstructor | null> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          category,
          level,
          instructor_id,
          duration_total_minutes,
          thumbnail_url,
          slug,
          is_active,
          created_at,
          updated_at
        `)
        .eq('id', courseId)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching course:', error)
        return null
      }

      // Transformar los datos
      const course: CourseWithInstructor = {
        id: data.id,
        title: data.title,
        description: data.description,
        thumbnail: data.thumbnail_url,
        status: 'published' as any,
        estimatedDuration: data.duration_total_minutes,
        difficulty: data.level as any,
        isPublic: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        modules: [],
        category: data.category,
        instructor_id: data.instructor_id,
        slug: data.slug,
        rating: 4.5,
        price: 'MX$0',
        status: 'Disponible',
        isFavorite: false,
      }

      return course
    } catch (error) {
      console.error('Error in CourseService.getCourseById:', error)
      return null
    }
  }

  /**
   * Obtiene todas las categorías únicas de los cursos activos
   */
  static async getCategories(): Promise<string[]> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('courses')
        .select('category')
        .eq('is_active', true)
        .not('category', 'is', null)

      if (error) {
        console.error('Error fetching categories:', error)
        throw new Error(`Error al obtener categorías: ${error.message}`)
      }

      // Obtener categorías únicas y ordenarlas
      const uniqueCategories = [...new Set(data.map(course => course.category))]
        .filter(category => category && category.trim() !== '')
        .sort()

      return uniqueCategories
    } catch (error) {
      console.error('Error in CourseService.getCategories:', error)
      throw error
    }
  }

  /**
   * Obtiene cursos por categoría
   */
  static async getCoursesByCategory(category: string): Promise<CourseWithInstructor[]> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          category,
          level,
          instructor_id,
          duration_total_minutes,
          thumbnail_url,
          slug,
          is_active,
          created_at,
          updated_at
        `)
        .eq('is_active', true)
        .eq('category', category)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching courses by category:', error)
        throw new Error(`Error al obtener cursos por categoría: ${error.message}`)
      }

      // Transformar los datos
      const courses: CourseWithInstructor[] = data.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail_url,
        status: 'published' as any,
        estimatedDuration: course.duration_total_minutes,
        difficulty: course.level as any,
        isPublic: course.is_active,
        createdAt: new Date(course.created_at),
        updatedAt: new Date(course.updated_at),
        modules: [],
        category: course.category,
        instructor_id: course.instructor_id,
        slug: course.slug,
        rating: 4.5,
        price: 'MX$0',
        status: 'Disponible',
        isFavorite: false,
      }))

      return courses
    } catch (error) {
      console.error('Error in CourseService.getCoursesByCategory:', error)
      throw error
    }
  }
}
