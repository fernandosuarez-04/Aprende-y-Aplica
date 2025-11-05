import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/business/users/[userId]/stats
 * Obtiene estadísticas completas de un usuario de la organización
 * Validación de seguridad: solo usuarios de la misma organización
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    const { userId } = await params

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'No tienes una organización asignada'
      }, { status: 403 })
    }

    const supabase = await createClient()

    // Validar que el usuario pertenezca a la organización del usuario autenticado
    const { data: orgUser, error: orgUserError } = await supabase
      .from('organization_users')
      .select('user_id, organization_id')
      .eq('organization_id', auth.organizationId)
      .eq('user_id', userId)
      .single()

    if (orgUserError || !orgUser) {
      logger.error('🚨 ERROR DE SEGURIDAD: Usuario no pertenece a la organización', {
        userId,
        organizationId: auth.organizationId,
        error: orgUserError
      })
      return NextResponse.json({
        success: false,
        error: 'Usuario no encontrado o no pertenece a tu organización'
      }, { status: 403 })
    }

    // Obtener información básica del usuario
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, email, first_name, last_name, display_name, profile_picture_url')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no encontrado'
      }, { status: 404 })
    }

    // Obtener enrollments (cursos del usuario)
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('user_course_enrollments')
      .select(`
        enrollment_id,
        enrollment_status,
        overall_progress_percentage,
        enrolled_at,
        started_at,
        completed_at,
        last_accessed_at,
        course_id,
        courses (
          id,
          title,
          slug,
          thumbnail_url,
          category,
          level
        )
      `)
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false })

    if (enrollmentsError) {
      logger.error('Error fetching enrollments:', enrollmentsError)
    }

    // Obtener progreso por lección
    const { data: lessonProgress, error: progressError } = await supabase
      .from('user_lesson_progress')
      .select(`
        progress_id,
        lesson_status,
        is_completed,
        time_spent_minutes,
        completed_at,
        started_at,
        enrollment_id,
        lesson_id,
        user_course_enrollments!inner (
          course_id,
          courses (
            id,
            title
          )
        )
      `)
      .eq('user_id', userId)

    if (progressError) {
      logger.error('Error fetching lesson progress:', progressError)
    }

    // Obtener certificados con información enriquecida
    const { data: certificates, error: certificatesError } = await supabase
      .from('user_course_certificates')
      .select(`
        certificate_id,
        certificate_url,
        certificate_hash,
        course_id,
        issued_at,
        expires_at,
        courses (
          id,
          title,
          slug,
          thumbnail_url,
          instructor_id
        )
      `)
      .eq('user_id', userId)
      .order('issued_at', { ascending: false })

    if (certificatesError) {
      logger.error('Error fetching certificates:', certificatesError)
    }

    // Obtener IDs de instructores únicos
    const instructorIds = [...new Set((certificates || [])
      .map((cert: any) => cert.courses?.instructor_id)
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
            name: fullName || instructor.username || 'Instructor',
            username: instructor.username
          })
        })
      }
    }

    // Enriquecer certificados con datos del instructor
    const enrichedCertificates = (certificates || []).map((cert: any) => {
      const course = cert.courses || {}
      const instructor = course.instructor_id ? instructorMap.get(course.instructor_id) : null
      
      return {
        certificate_id: cert.certificate_id,
        certificate_url: cert.certificate_url,
        certificate_hash: cert.certificate_hash,
        course_id: cert.course_id,
        issued_at: cert.issued_at,
        expires_at: cert.expires_at,
        course_title: course.title || 'Curso sin título',
        course_slug: course.slug || '',
        course_thumbnail: course.thumbnail_url || null,
        instructor_name: instructor?.name || 'Instructor',
        instructor_username: instructor?.username || null
      }
    })

    // Obtener notas
    const { data: notes, error: notesError } = await supabase
      .from('user_lesson_notes')
      .select('note_id')
      .eq('user_id', userId)

    if (notesError) {
      logger.error('Error fetching notes:', notesError)
    }

    // Obtener cursos asignados por la organización
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
          title
        )
      `)
      .eq('organization_id', auth.organizationId)
      .eq('user_id', userId)
      .order('assigned_at', { ascending: false })

    if (assignmentsError) {
      logger.error('Error fetching assignments:', assignmentsError)
    }

    // Calcular métricas
    const totalEnrollments = enrollments?.length || 0
    const completedEnrollments = enrollments?.filter(e => e.enrollment_status === 'completed').length || 0
    const inProgressEnrollments = enrollments?.filter(e => 
      e.enrollment_status === 'active' && (e.overall_progress_percentage || 0) > 0 && (e.overall_progress_percentage || 0) < 100
    ).length || 0
    const notStartedEnrollments = enrollments?.filter(e => 
      e.enrollment_status === 'active' && (e.overall_progress_percentage || 0) === 0
    ).length || 0

    // Calcular progreso promedio
    const avgProgress = enrollments && enrollments.length > 0
      ? enrollments.reduce((sum, e) => sum + (Number(e.overall_progress_percentage) || 0), 0) / enrollments.length
      : 0

    // Calcular tiempo total dedicado
    const totalTimeSpent = lessonProgress?.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0) || 0

    // Calcular lecciones completadas
    const completedLessons = lessonProgress?.filter(p => p.is_completed).length || 0
    const totalLessons = lessonProgress?.length || 0

    // Preparar datos para gráficas
    const coursesData = (enrollments || []).map(e => ({
      course_id: e.course_id,
      course_title: e.courses?.title || 'Curso desconocido',
      progress: Number(e.overall_progress_percentage) || 0,
      status: e.enrollment_status,
      enrolled_at: e.enrolled_at,
      completed_at: e.completed_at,
      has_certificate: enrichedCertificates?.some(c => c.course_id === e.course_id) || false
    }))

    // Calcular tiempo por curso
    const timeByCourse = (lessonProgress || []).reduce((acc: any, p: any) => {
      const courseId = p.user_course_enrollments?.course_id
      const courseTitle = p.user_course_enrollments?.courses?.title || 'Curso desconocido'
      if (!acc[courseId]) {
        acc[courseId] = { course_id: courseId, course_title: courseTitle, total_minutes: 0 }
      }
      acc[courseId].total_minutes += p.time_spent_minutes || 0
      return acc
    }, {})

    const timeByCourseArray = Object.values(timeByCourse).map((item: any) => ({
      course_id: item.course_id,
      course_title: item.course_title,
      total_minutes: item.total_minutes,
      total_hours: Math.round((item.total_minutes / 60) * 10) / 10
    }))

    // Cursos completados por mes
    const completedByMonth = (enrollments || [])
      .filter(e => e.completed_at)
      .reduce((acc: any, e: any) => {
        const date = new Date(e.completed_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        acc[monthKey] = (acc[monthKey] || 0) + 1
        return acc
      }, {})

    const completedByMonthArray = Object.entries(completedByMonth)
      .map(([month, count]) => ({
        month,
        count: count as number
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
        profile_picture_url: user.profile_picture_url
      },
      stats: {
        // Métricas generales
        total_courses: totalEnrollments,
        completed_courses: completedEnrollments,
        in_progress_courses: inProgressEnrollments,
        not_started_courses: notStartedEnrollments,
        average_progress: Math.round(avgProgress * 10) / 10,
        
        // Tiempo y actividad
        total_time_spent_minutes: totalTimeSpent,
        total_time_spent_hours: Math.round((totalTimeSpent / 60) * 10) / 10,
        
        // Lecciones
        completed_lessons: completedLessons,
        total_lessons: totalLessons,
        
        // Certificados y notas
        certificates_count: enrichedCertificates?.length || 0,
        notes_count: notes?.length || 0,
        
        // Asignaciones
        total_assignments: assignments?.length || 0,
        completed_assignments: assignments?.filter(a => a.status === 'completed').length || 0,
        
        // Datos para gráficas
        courses_data: coursesData,
        time_by_course: timeByCourseArray,
        completed_by_month: completedByMonthArray,
        distribution: {
          completed: completedEnrollments,
          in_progress: inProgressEnrollments,
          not_started: notStartedEnrollments
        }
      },
      courses: coursesData,
      certificates: enrichedCertificates || [],
      assignments: (assignments || []).map(a => ({
        assignment_id: a.id,
        course_id: a.course_id,
        course_title: a.courses?.title || 'Curso desconocido',
        status: a.status,
        completion_percentage: a.completion_percentage || 0,
        assigned_at: a.assigned_at,
        due_date: a.due_date,
        completed_at: a.completed_at
      }))
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/users/[userId]/stats:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener estadísticas del usuario'
    }, { status: 500 })
  }
}

