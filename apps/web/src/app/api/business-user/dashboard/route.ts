import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { requireBusinessUser } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'

interface DashboardStats {
  total_assigned: number
  in_progress: number
  completed: number
  certificates: number
}

interface AssignedCourse {
  id: string
  course_id: string
  title: string
  instructor: string
  progress: number
  status: 'Asignado' | 'En progreso' | 'Completado'
  thumbnail: string
  slug: string
  assigned_at: string
  due_date?: string
  completed_at?: string
  has_certificate?: boolean
}

export async function GET() {
  try {
    const auth = await requireBusinessUser()
    if (auth instanceof NextResponse) {
      logger.error('Auth failed in business-user/dashboard:', auth.status)
      return auth
    }
    
    if (!auth.userId) {
      logger.error('No userId in auth object')
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario no autenticado'
        },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    const userId = auth.userId

    logger.log('📊 Fetching dashboard data for user:', userId)

    // Obtener todos los cursos asignados al usuario con información del curso
    // Usar left join en lugar de inner para manejar casos donde el curso no existe
    const { data: assignments, error: assignmentsError } = await supabase
      .from('organization_course_assignments')
      .select(`
        id,
        course_id,
        status,
        completion_percentage,
        assigned_at,
        due_date,
        completed_at,
        courses (
          id,
          title,
          slug,
          thumbnail_url,
          instructor_id
        )
      `)
      .eq('user_id', userId)
      .in('status', ['assigned', 'in_progress', 'completed'])
      .order('assigned_at', { ascending: false })

    if (assignmentsError) {
      logger.error('❌ Error fetching assigned courses:', assignmentsError)
      // Aún así retornar datos vacíos pero con éxito para que el frontend maneje el estado vacío
      return NextResponse.json({
        success: true,
        error: assignmentsError.message,
        stats: {
          total_assigned: 0,
          in_progress: 0,
          completed: 0,
          certificates: 0
        },
        courses: []
      })
    }

    logger.log('✅ Assignments fetched:', assignments?.length || 0)

    // Obtener los course_ids de las asignaciones
    const courseIds = (assignments || [])
      .map((a: any) => a.course_id)
      .filter(Boolean)

    // Obtener los enrollments del usuario para estos cursos
    // Esto nos dará el progreso real actualizado
    let enrollmentsMap = new Map<string, any>()
    if (courseIds.length > 0) {
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('user_course_enrollments')
        .select('enrollment_id, course_id, overall_progress_percentage, enrollment_status, completed_at')
        .eq('user_id', userId)
        .in('course_id', courseIds)

      if (!enrollmentsError && enrollments) {
        enrollments.forEach((enrollment: any) => {
          enrollmentsMap.set(enrollment.course_id, enrollment)
        })
        logger.log('✅ Enrollments fetched:', enrollments.length)
      } else if (enrollmentsError) {
        logger.error('❌ Error fetching enrollments:', enrollmentsError)
      }
    }

    // Obtener IDs de instructores únicos
    const instructorIds = [...new Set((assignments || [])
      .map((a: any) => a.courses?.instructor_id)
      .filter(Boolean))]

    // Obtener información de instructores
    const instructorMap = new Map()
    if (instructorIds.length > 0) {
      const { data: instructors } = await supabase
        .from('users')
        .select('id, first_name, last_name, username')
        .in('id', instructorIds)

      if (instructors) {
        instructors.forEach(instructor => {
          const fullName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim()
          instructorMap.set(instructor.id, {
            name: fullName || instructor.username || 'Instructor'
          })
        })
      }
    }

    // Obtener certificados reales del usuario
    const { data: certificates, error: certificatesError } = await supabase
      .from('user_course_certificates')
      .select('certificate_id, course_id')
      .eq('user_id', userId)

    if (certificatesError) {
      logger.error('❌ Error fetching certificates:', certificatesError)
    }

    // Crear mapa de certificados por curso_id para búsqueda rápida
    const certificatesMap = new Map<string, boolean>()
    certificates?.forEach((cert: any) => {
      certificatesMap.set(cert.course_id, true)
    })

    // Calcular estadísticas usando el progreso real de enrollments
    const totalAssigned = assignments?.length || 0
    
    // Para calcular en_progress y completed, usar el progreso del enrollment si existe
    const inProgress = assignments?.filter(a => {
      const enrollment = enrollmentsMap.get(a.course_id)
      const progress = enrollment?.overall_progress_percentage || a.completion_percentage || 0
      return progress > 0 && progress < 100
    }).length || 0
    
    const completed = assignments?.filter(a => {
      const enrollment = enrollmentsMap.get(a.course_id)
      const progress = enrollment?.overall_progress_percentage || a.completion_percentage || 0
      return progress >= 100 || a.status === 'completed' || enrollment?.enrollment_status === 'completed'
    }).length || 0
    
    const certificatesCount = certificates?.length || 0

    const stats: DashboardStats = {
      total_assigned: totalAssigned,
      in_progress: inProgress,
      completed: completed,
      certificates: certificatesCount
    }

    // Transformar asignaciones a formato de cursos
    // Filtrar asignaciones que no tienen curso asociado (en caso de que el curso haya sido eliminado)
    const courses: AssignedCourse[] = (assignments || [])
      .filter((assignment: any) => assignment.courses) // Solo incluir asignaciones con curso válido
      .map((assignment: any) => {
        const course = assignment.courses
        const instructor = course?.instructor_id ? instructorMap.get(course.instructor_id) : null
        
        // Obtener el enrollment correspondiente para obtener el progreso real
        const enrollment = enrollmentsMap.get(assignment.course_id)
        
        // Usar el progreso del enrollment si existe, sino usar el del assignment
        const actualProgress = enrollment?.overall_progress_percentage !== null && enrollment?.overall_progress_percentage !== undefined
          ? Number(enrollment.overall_progress_percentage)
          : (assignment.completion_percentage ? Number(assignment.completion_percentage) : 0)
        
        // Usar el completed_at del enrollment si existe
        const actualCompletedAt = enrollment?.completed_at || assignment.completed_at
        
        // Formatear nombre del instructor
        const instructorName = instructor?.name || 'Instructor'

        // Determinar estado en español basado en el progreso real
        let status: 'Asignado' | 'En progreso' | 'Completado' = 'Asignado'
        if (actualProgress >= 100 || assignment.status === 'completed' || enrollment?.enrollment_status === 'completed') {
          status = 'Completado'
        } else if (actualProgress > 0 || assignment.status === 'in_progress' || enrollment?.enrollment_status === 'active') {
          status = 'En progreso'
        }

        // Usar thumbnail del curso o un emoji por defecto basado en la categoría
        let thumbnail = course?.thumbnail_url || '📚'
        if (!course?.thumbnail_url) {
          // Intentar inferir emoji basado en el título
          const title = course?.title?.toLowerCase() || ''
          if (title.includes('python')) thumbnail = '🐍'
          else if (title.includes('ia') || title.includes('ai') || title.includes('generativa')) thumbnail = '🤖'
          else if (title.includes('diseño') || title.includes('ux') || title.includes('ui')) thumbnail = '🎨'
          else if (title.includes('machine learning') || title.includes('ml')) thumbnail = '🧠'
          else if (title.includes('datos') || title.includes('data')) thumbnail = '📊'
          else thumbnail = '📚'
        }

        return {
          id: assignment.id,
          course_id: assignment.course_id,
          title: course?.title || 'Curso sin título',
          instructor: instructorName,
          progress: Math.round(actualProgress * 100) / 100, // Redondear a 2 decimales
          status: status,
          thumbnail: thumbnail,
          slug: course?.slug || '',
          assigned_at: assignment.assigned_at,
          due_date: assignment.due_date || undefined,
          completed_at: actualCompletedAt || undefined,
          has_certificate: certificatesMap.has(assignment.course_id) || false
        }
      })

    logger.log('✅ Dashboard data prepared:', { 
      stats, 
      coursesCount: courses.length 
    })

    return NextResponse.json({
      success: true,
      stats: stats,
      courses: courses
    })
  } catch (error) {
    logger.error('💥 Error in /api/business-user/dashboard:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener datos del dashboard',
        stats: {
          total_assigned: 0,
          in_progress: 0,
          completed: 0,
          certificates: 0
        },
        courses: []
      },
      { status: 500 }
    )
  }
}

