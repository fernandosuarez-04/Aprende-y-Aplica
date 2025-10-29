import { createClient } from '../../../lib/supabase/server'
import { Course } from '@aprende-y-aplica/shared'

export interface CourseWithInstructor extends Course {
  instructor_name?: string;
  instructor_email?: string;
  rating?: number;
  price?: string;
  status?: 'Adquirido' | 'Disponible';
  isFavorite?: boolean;
  student_count?: number;
  review_count?: number;
  learning_objectives?: string[];
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
          price,
          average_rating,
          student_count,
          review_count,
          learning_objectives,
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
            .from('app_favorites')
            .select('course_id')
            .eq('user_id', userId)
          
          userFavorites = favoritesData?.map(f => f.course_id) || []
        } catch (favoritesError) {
          console.warn('Error fetching user favorites:', favoritesError)
        }
      }

      // Obtener información de instructores para todos los cursos
      const instructorIds = [...new Set(data.map(course => course.instructor_id).filter(Boolean))];
      const instructorMap = new Map();
      
      if (instructorIds.length > 0) {
        try {
          const { data: instructorsData } = await supabase
            .from('users')
            .select('id, first_name, last_name, email, username')
            .in('id', instructorIds);
          
          if (instructorsData) {
            instructorsData.forEach(instructor => {
              instructorMap.set(instructor.id, {
                name: `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() || instructor.username || 'Instructor',
                email: instructor.email || 'instructor@example.com'
              });
            });
          }
        } catch (instructorError) {
          console.warn('Error fetching instructors info:', instructorError);
        }
      }

      // Transformar los datos de la base de datos al formato esperado por el frontend
      const courses: CourseWithInstructor[] = data.map(course => {
        const instructorInfo = instructorMap.get(course.instructor_id) || {
          name: 'Instructor',
          email: 'instructor@example.com'
        };

        return {
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
          // Datos reales de la base de datos
          rating: course.average_rating || 0,
          price: course.price ? `MX$${course.price.toFixed(0)}` : 'MX$0',
          status: 'Disponible' as 'Disponible' | 'Adquirido', // TODO: Verificar si el usuario ya lo adquirió
          isFavorite: userFavorites.includes(course.id),
          instructor_name: instructorInfo.name,
          instructor_email: instructorInfo.email,
          student_count: course.student_count || 0,
          review_count: course.review_count || 0,
          learning_objectives: course.learning_objectives || [],
        };
      })

      return courses
    } catch (error) {
      console.error('Error in CourseService.getActiveCourses:', error)
      throw error
    }
  }

  /**
   * Obtiene un curso específico por slug
   */
  static async getCourseBySlug(slug: string, userId?: string): Promise<CourseWithInstructor | null> {
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
          price,
          average_rating,
          student_count,
          review_count,
          learning_objectives,
          created_at,
          updated_at
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching course by slug:', error)
        return null
      }

      // Obtener información del instructor
      let instructorInfo = {
        name: 'Instructor',
        email: 'instructor@example.com'
      };

      if (data.instructor_id) {
        try {
          const { data: instructorData } = await supabase
            .from('users')
            .select('first_name, last_name, email, username')
            .eq('id', data.instructor_id)
            .single();
          
          if (instructorData) {
            instructorInfo = {
              name: `${instructorData.first_name || ''} ${instructorData.last_name || ''}`.trim() || instructorData.username || 'Instructor',
              email: instructorData.email || 'instructor@example.com'
            };
          }
        } catch (instructorError) {
          console.warn('Error fetching instructor info:', instructorError);
        }
      }

      // Obtener favoritos del usuario si se proporciona userId
      let userFavorites: string[] = []
      if (userId) {
        try {
          const { data: favoritesData } = await supabase
            .from('app_favorites')
            .select('course_id')
            .eq('user_id', userId)
          
          userFavorites = favoritesData?.map(f => f.course_id) || []
        } catch (favoritesError) {
          console.warn('Error fetching user favorites:', favoritesError)
        }
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
        rating: data.average_rating || 0,
        price: data.price ? `MX$${data.price.toFixed(0)}` : 'MX$0',
        status: 'Disponible',
        isFavorite: userFavorites.includes(data.id),
        instructor_name: instructorInfo.name,
        instructor_email: instructorInfo.email,
        // Datos adicionales de la base de datos
        student_count: data.student_count || 0,
        review_count: data.review_count || 0,
        learning_objectives: data.learning_objectives || [],
      }

      return course
    } catch (error) {
      console.error('Error in CourseService.getCourseBySlug:', error)
      return null
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
          price,
          average_rating,
          student_count,
          review_count,
          learning_objectives,
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

      // Obtener información de instructores para todos los cursos
      const instructorIds = [...new Set(data.map(course => course.instructor_id).filter(Boolean))];
      const instructorMap = new Map();
      
      if (instructorIds.length > 0) {
        try {
          const { data: instructorsData } = await supabase
            .from('users')
            .select('id, first_name, last_name, email, username')
            .in('id', instructorIds);
          
          if (instructorsData) {
            instructorsData.forEach(instructor => {
              instructorMap.set(instructor.id, {
                name: `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() || instructor.username || 'Instructor',
                email: instructor.email || 'instructor@example.com'
              });
            });
          }
        } catch (instructorError) {
          console.warn('Error fetching instructors info:', instructorError);
        }
      }

      // Transformar los datos
      const courses: CourseWithInstructor[] = data.map(course => {
        const instructorInfo = instructorMap.get(course.instructor_id) || {
          name: 'Instructor',
          email: 'instructor@example.com'
        };

        return {
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
          rating: course.average_rating || 0,
          price: course.price ? `MX$${course.price.toFixed(0)}` : 'MX$0',
          status: 'Disponible',
          isFavorite: false,
          instructor_name: instructorInfo.name,
          instructor_email: instructorInfo.email,
          student_count: course.student_count || 0,
          review_count: course.review_count || 0,
          learning_objectives: course.learning_objectives || [],
        };
      })

      return courses
    } catch (error) {
      console.error('Error in CourseService.getCoursesByCategory:', error)
      throw error
    }
  }
}

