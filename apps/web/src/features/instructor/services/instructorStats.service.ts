import { createClient } from '@/lib/supabase/server'

export interface InstructorStats {
  totalCourses: number
  totalStudents: number
  totalReels: number
  averageRating: number
  totalHours: number
  coursesThisMonth: number
  studentsThisMonth: number
  reelsThisMonth: number
}

export class InstructorStatsService {
  /**
   * Obtiene las estadísticas del instructor basándose en su instructor_id
   */
  static async getInstructorStats(instructorId: string): Promise<InstructorStats> {
    const supabase = await createClient()

    try {
      // Obtener todos los cursos del instructor
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, student_count, average_rating, duration_total_minutes, created_at')
        .eq('instructor_id', instructorId)

      if (coursesError) {
        console.error('Error fetching courses for instructor:', coursesError)
        throw new Error(`Error al obtener cursos: ${coursesError.message}`)
      }

      // Obtener todos los reels del instructor
      const { data: reels, error: reelsError } = await supabase
        .from('reels')
        .select('id, created_at')
        .eq('created_by', instructorId)

      if (reelsError) {
        console.error('Error fetching reels for instructor:', reelsError)
        throw new Error(`Error al obtener reels: ${reelsError.message}`)
      }

      // Calcular totales
      const totalCourses = courses?.length || 0
      const totalReels = reels?.length || 0

      // Sumar estudiantes (suma de student_count de todos los cursos)
      const totalStudents = courses?.reduce((sum, course) => sum + (course.student_count || 0), 0) || 0

      // Calcular calificación promedio (promedio de average_rating de los cursos que tienen rating)
      const coursesWithRating = courses?.filter(c => c.average_rating && c.average_rating > 0) || []
      const averageRating = coursesWithRating.length > 0
        ? coursesWithRating.reduce((sum, course) => sum + (course.average_rating || 0), 0) / coursesWithRating.length
        : 0

      // Sumar horas totales (suma de duration_total_minutes convertido a horas)
      const totalMinutes = courses?.reduce((sum, course) => sum + (course.duration_total_minutes || 0), 0) || 0
      const totalHours = Math.round(totalMinutes / 60)

      // Calcular crecimiento este mes
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const coursesThisMonth = courses?.filter(
        course => new Date(course.created_at) >= startOfMonth
      ).length || 0

      const reelsThisMonth = reels?.filter(
        reel => new Date(reel.created_at) >= startOfMonth
      ).length || 0

      // Para estudiantes este mes, necesitamos obtener los cursos creados este mes y sumar sus estudiantes
      const newCoursesThisMonth = courses?.filter(
        course => new Date(course.created_at) >= startOfMonth
      ) || []
      const studentsThisMonth = newCoursesThisMonth.reduce(
        (sum, course) => sum + (course.student_count || 0), 0
      )

      return {
        totalCourses,
        totalStudents,
        totalReels,
        averageRating: Math.round(averageRating * 10) / 10, // Redondear a 1 decimal
        totalHours,
        coursesThisMonth,
        studentsThisMonth,
        reelsThisMonth
      }
    } catch (error) {
      console.error('Error in InstructorStatsService.getInstructorStats:', error)
      throw error
    }
  }
}

