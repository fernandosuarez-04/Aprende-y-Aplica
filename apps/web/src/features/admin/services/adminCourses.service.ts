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
          learning_objectives
        `)
        .order('title', { ascending: true })

      if (error) {
        console.error('❌ Error fetching courses:', error)
        return []
      }

      console.log('✅ Cursos cargados:', data?.length || 0)

      // Obtener información de instructores
      const coursesWithInstructors = await Promise.all(
        (data || []).map(async (course) => {
          let instructorName = 'Instructor no encontrado'
          
          if (course.instructor_id) {
            const { data: instructor } = await supabase
              .from('users')
              .select('first_name, last_name, display_name')
              .eq('id', course.instructor_id)
              .single()
            
            if (instructor) {
              instructorName = instructor.display_name || 
                `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
                'Instructor'
            }
          }

          return {
            ...course,
            instructor_name: instructorName,
            duration_hours: Math.round(course.duration_total_minutes / 60 * 10) / 10 // Redondear a 1 decimal
          }
        })
      )

      console.log('✅ Cursos con instructores procesados:', coursesWithInstructors.length)
      return coursesWithInstructors
    } catch (error) {
      console.error('💥 Error in AdminCoursesService.getAllCourses:', error)
      return []
    }
  }

  static async getActiveCourses(): Promise<AdminCourse[]> {
    const supabase = await createClient()

    try {
      console.log('🔄 Cargando cursos activos...')
      
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
          learning_objectives
        `)
        .eq('is_active', true)
        .order('title', { ascending: true })

      if (error) {
        console.error('❌ Error fetching active courses:', error)
        return []
      }

      console.log('✅ Cursos activos cargados:', data?.length || 0)

      // Obtener información de instructores
      const coursesWithInstructors = await Promise.all(
        (data || []).map(async (course) => {
          let instructorName = 'Instructor no encontrado'
          
          if (course.instructor_id) {
            const { data: instructor } = await supabase
              .from('users')
              .select('first_name, last_name, display_name')
              .eq('id', course.instructor_id)
              .single()
            
            if (instructor) {
              instructorName = instructor.display_name || 
                `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
                'Instructor'
            }
          }

          return {
            ...course,
            instructor_name: instructorName,
            duration_hours: Math.round(course.duration_total_minutes / 60 * 10) / 10
          }
        })
      )

      console.log('✅ Cursos activos con instructores procesados:', coursesWithInstructors.length)
      return coursesWithInstructors
    } catch (error) {
      console.error('💥 Error in AdminCoursesService.getActiveCourses:', error)
      return []
    }
  }
}
