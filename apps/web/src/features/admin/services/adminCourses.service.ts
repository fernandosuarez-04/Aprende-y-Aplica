import { createClient } from '../../../lib/supabase/server'

export interface AdminCourse {
  id: string
  title: string
  description: string
  slug: string
  category: string
  level: string
  instructor_id: string
  duration_total_minutes: number
  thumbnail_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
  price?: number
  average_rating?: number
  student_count: number
  review_count: number
  learning_objectives?: any
  // Campos calculados para mostrar
  instructor_name?: string
  duration_hours?: number
}

export class AdminCoursesService {
  static async getAllCourses(): Promise<AdminCourse[]> {
    const supabase = await createClient()

    try {
      console.log('🔄 Cargando cursos desde la tabla courses...')

      // ✅ OPTIMIZACIÓN: Usar JOIN para obtener instructor en la misma query
      // ANTES: 1 + N queries (100 cursos = 101 queries)
      // DESPUÉS: 1 query total (99% menos queries)
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          slug,
          category,
          level,
          instructor_id,
          duration_total_minutes,
          thumbnail_url,
          is_active,
          created_at,
          updated_at,
          price,
          average_rating,
          student_count,
          review_count,
          learning_objectives,
          instructor:users!instructor_id (
            id,
            first_name,
            last_name,
            display_name
          )
        `)
        .order('title', { ascending: true })

      if (error) {
        console.error('❌ Error fetching courses:', error)
        return []
      }

      console.log('✅ Cursos cargados con instructores (1 query):', data?.length || 0)

      // Mapear datos con instructor ya incluido
      const courses = (data || []).map((course: any) => {
        const instructor = course.instructor
        const instructorName = instructor
          ? (instructor.display_name ||
            `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
            'Instructor')
          : 'Instructor no encontrado'

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          slug: course.slug,
          category: course.category,
          level: course.level,
          instructor_id: course.instructor_id,
          duration_total_minutes: course.duration_total_minutes,
          thumbnail_url: course.thumbnail_url,
          is_active: course.is_active,
          created_at: course.created_at,
          updated_at: course.updated_at,
          price: course.price,
          average_rating: course.average_rating,
          student_count: course.student_count,
          review_count: course.review_count,
          learning_objectives: course.learning_objectives,
          instructor_name: instructorName,
          duration_hours: Math.round(course.duration_total_minutes / 60 * 10) / 10,
        }
      })

      console.log('✅ Cursos procesados:', courses.length)
      return courses
    } catch (error) {
      console.error('💥 Error in AdminCoursesService.getAllCourses:', error)
      return []
    }
  }

  static async getActiveCourses(): Promise<AdminCourse[]> {
    const supabase = await createClient()

    try {
      console.log('🔄 Cargando cursos activos...')

      // ✅ OPTIMIZACIÓN: Usar JOIN para obtener instructor en la misma query
      // ANTES: 1 + N queries (100 cursos = 101 queries)
      // DESPUÉS: 1 query total (99% menos queries)
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          slug,
          category,
          level,
          instructor_id,
          duration_total_minutes,
          thumbnail_url,
          is_active,
          created_at,
          updated_at,
          price,
          average_rating,
          student_count,
          review_count,
          learning_objectives,
          instructor:users!instructor_id (
            id,
            first_name,
            last_name,
            display_name
          )
        `)
        .eq('is_active', true)
        .order('title', { ascending: true })

      if (error) {
        console.error('❌ Error fetching active courses:', error)
        return []
      }

      console.log('✅ Cursos activos cargados con instructores (1 query):', data?.length || 0)

      // Mapear datos con instructor ya incluido
      const courses = (data || []).map((course: any) => {
        const instructor = course.instructor
        const instructorName = instructor
          ? (instructor.display_name ||
            `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
            'Instructor')
          : 'Instructor no encontrado'

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          slug: course.slug,
          category: course.category,
          level: course.level,
          instructor_id: course.instructor_id,
          duration_total_minutes: course.duration_total_minutes,
          thumbnail_url: course.thumbnail_url,
          is_active: course.is_active,
          created_at: course.created_at,
          updated_at: course.updated_at,
          price: course.price,
          average_rating: course.average_rating,
          student_count: course.student_count,
          review_count: course.review_count,
          learning_objectives: course.learning_objectives,
          instructor_name: instructorName,
          duration_hours: Math.round(course.duration_total_minutes / 60 * 10) / 10,
        }
      })

      console.log('✅ Cursos activos procesados:', courses.length)
      return courses
    } catch (error) {
      console.error('💥 Error in AdminCoursesService.getActiveCourses:', error)
      return []
    }
  }
}
