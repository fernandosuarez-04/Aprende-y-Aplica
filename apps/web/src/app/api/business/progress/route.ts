import { NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/business/progress
 * Obtiene estadísticas de progreso del equipo de la organización
 * Validación de seguridad: solo datos de la organización del usuario autenticado
 */
export async function GET() {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'No tienes una organización asignada'
      }, { status: 403 })
    }

    const supabase = await createClient()

    // 1. Obtener usuarios activos de la organización
    const { data: orgUsers, error: orgUsersError } = await supabase
      .from('organization_users')
      .select(`
        user_id,
        role,
        status,
        users!organization_users_user_id_fkey (
          id,
          username,
          email,
          first_name,
          last_name,
          display_name,
          profile_picture_url,
          last_login_at
        )
      `)
      .eq('organization_id', auth.organizationId)
      .eq('status', 'active')
      .order('joined_at', { ascending: false })

    if (orgUsersError) {
      logger.error('Error fetching organization users:', orgUsersError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener usuarios de la organización'
      }, { status: 500 })
    }

    const userIds = orgUsers?.map(ou => ou.user_id) || []

    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          total_users: 0,
          total_courses_assigned: 0,
          completed_courses: 0,
          average_progress: 0,
          total_time_spent_hours: 0,
          completion_rate: 0
        },
        courses: [],
        users: [],
        charts: {
          distribution: [],
          progress_by_course: [],
          progress_by_user: [],
          completion_trends: [],
          time_by_course: []
        }
      })
    }

    // 2-5. Obtener TODAS las consultas en paralelo para máximo rendimiento
    const [
      { data: assignments, error: assignmentsError },
      { data: enrollments, error: enrollmentsError },
      { data: lessonProgress, error: lessonProgressError },
      { data: certificates, error: certificatesError }
    ] = await Promise.all([
      // 2. Asignaciones de cursos de la organización
      supabase
        .from('organization_course_assignments')
        .select(`
          id,
          user_id,
          course_id,
          status,
          completion_percentage,
          assigned_at,
          due_date,
          completed_at
        `)
        .eq('organization_id', auth.organizationId)
        .in('user_id', userIds)
        .order('assigned_at', { ascending: false }),

      // 3. Enrollments de los usuarios
      supabase
        .from('user_course_enrollments')
        .select(`
          enrollment_id,
          user_id,
          course_id,
          enrollment_status,
          overall_progress_percentage,
          enrolled_at,
          completed_at,
          last_accessed_at
        `)
        .in('user_id', userIds)
        .order('enrolled_at', { ascending: false }),

      // 4. Progreso detallado de lecciones
      supabase
        .from('user_lesson_progress')
        .select(`
          progress_id,
          user_id,
          lesson_id,
          is_completed,
          time_spent_minutes,
          completed_at,
          started_at,
          enrollment_id,
          user_course_enrollments!inner (
            course_id
          )
        `)
        .in('user_id', userIds),

      // 5. Certificados
      supabase
        .from('user_course_certificates')
        .select(`
          certificate_id,
          user_id,
          course_id,
          issued_at
        `)
        .in('user_id', userIds)
    ])

    // Log de errores y estadísticas
    if (assignmentsError) {
      logger.error('Error fetching assignments:', assignmentsError)
    } else {
      logger.log('✅ Asignaciones obtenidas:', assignments?.length || 0)
      if (assignments && assignments.length > 0) {
        logger.log('📊 Primeras asignaciones:', JSON.stringify(assignments.slice(0, 3), null, 2))
      }
    }
    if (enrollmentsError) {
      logger.error('Error fetching enrollments:', enrollmentsError)
    }
    if (lessonProgressError) {
      logger.error('Error fetching lesson progress:', lessonProgressError)
    }
    if (certificatesError) {
      logger.error('Error fetching certificates:', certificatesError)
    }

    // Obtener información de cursos en paralelo (ya no depende de assignments)
    let courseInfoMap = new Map<string, { id: string; title: string; slug: string | null; thumbnail_url: string | null }>()
    if (assignments && assignments.length > 0) {
      const courseIds = [...new Set(assignments.map(a => a.course_id))]
      logger.log('📚 IDs de cursos a buscar:', courseIds)

      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, slug, thumbnail_url')
        .in('id', courseIds)

      if (coursesError) {
        logger.error('Error fetching courses:', coursesError)
      } else {
        logger.log('✅ Cursos obtenidos:', coursesData?.length || 0)
        if (coursesData) {
          coursesData.forEach(course => {
            courseInfoMap.set(course.id, {
              id: course.id,
              title: course.title,
              slug: course.slug || null,
              thumbnail_url: course.thumbnail_url || null
            })
          })
          logger.log('📊 Map de cursos creado con', courseInfoMap.size, 'entradas')
        }
      }
    }

    // Calcular métricas generales
    const totalUsers = userIds.length
    const totalCoursesAssigned = assignments?.length || 0
    const completedAssignments = assignments?.filter(a => a.status === 'completed').length || 0
    const completedEnrollments = enrollments?.filter(e => e.enrollment_status === 'completed').length || 0

    // Calcular progreso promedio
    const progressSum = enrollments?.reduce((sum, e) => sum + (Number(e.overall_progress_percentage) || 0), 0) || 0
    const averageProgress = enrollments && enrollments.length > 0
      ? progressSum / enrollments.length
      : 0

    // Calcular tiempo total dedicado
    const totalTimeSpentMinutes = lessonProgress?.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0) || 0
    const totalTimeSpentHours = Math.round((totalTimeSpentMinutes / 60) * 10) / 10

    // Calcular tasa de completación
    const completionRate = totalCoursesAssigned > 0
      ? Math.round((completedAssignments / totalCoursesAssigned) * 100 * 10) / 10
      : 0

    // Preparar datos por curso
    const courseMap = new Map<string, {
      course_id: string
      course_title: string
      thumbnail_url: string | null
      total_assigned: number
      completed: number
      in_progress: number
      not_started: number
      average_progress: number
      total_time_minutes: number
      total_time_hours: number
    }>()

    assignments?.forEach(assignment => {
      const courseId = assignment.course_id
      const courseInfo = courseInfoMap.get(courseId)
      const courseTitle = courseInfo?.title || 'Curso desconocido'
      const thumbnailUrl = courseInfo?.thumbnail_url || null

      if (!courseInfo) {
        logger.warn('⚠️ Curso no encontrado en courseInfoMap:', courseId)
      }

      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, {
          course_id: courseId,
          course_title: courseTitle,
          thumbnail_url: thumbnailUrl,
          total_assigned: 0,
          completed: 0,
          in_progress: 0,
          not_started: 0,
          average_progress: 0,
          total_time_minutes: 0,
          total_time_hours: 0
        })
      }

      const course = courseMap.get(courseId)!
      course.total_assigned++

      if (assignment.status === 'completed') {
        course.completed++
      } else if (assignment.status === 'in_progress') {
        course.in_progress++
      } else if (assignment.status === 'assigned') {
        course.not_started++
      }
    })

    logger.log('📊 Cursos procesados en courseMap:', courseMap.size)
    if (courseMap.size > 0) {
      logger.log('📊 Primer curso en map:', JSON.stringify(Array.from(courseMap.values())[0], null, 2))
    }

    // Agregar progreso y tiempo por curso
    enrollments?.forEach(enrollment => {
      const courseId = enrollment.course_id
      if (courseMap.has(courseId)) {
        const course = courseMap.get(courseId)!
        // Calcular progreso promedio del curso
        const courseEnrollments = enrollments.filter(e => e.course_id === courseId)
        const courseProgressSum = courseEnrollments.reduce((sum, e) => sum + (Number(e.overall_progress_percentage) || 0), 0)
        course.average_progress = courseEnrollments.length > 0
          ? Math.round((courseProgressSum / courseEnrollments.length) * 10) / 10
          : 0
      }
    })

    // Agregar tiempo por curso
    // Crear un map de enrollment_id a course_id
    const enrollmentToCourseMap = new Map<string, string>()
    enrollments?.forEach(enrollment => {
      enrollmentToCourseMap.set(enrollment.enrollment_id, enrollment.course_id)
    })

    lessonProgress?.forEach(progress => {
      const courseId = progress.enrollment_id 
        ? enrollmentToCourseMap.get(progress.enrollment_id)
        : progress.user_course_enrollments?.course_id
      
      if (courseId && courseMap.has(courseId)) {
        const course = courseMap.get(courseId)!
        course.total_time_minutes += progress.time_spent_minutes || 0
        course.total_time_hours = Math.round((course.total_time_minutes / 60) * 10) / 10
      }
    })

    const coursesData = Array.from(courseMap.values())

    // Preparar datos por usuario
    const usersData = orgUsers?.map(ou => {
      const user = ou.users
      if (!user) return null

      const userAssignments = assignments?.filter(a => a.user_id === ou.user_id) || []
      const userEnrollments = enrollments?.filter(e => e.user_id === ou.user_id) || []
      const userProgress = lessonProgress?.filter(p => p.user_id === ou.user_id) || []
      const userCertificates = certificates?.filter(c => c.user_id === ou.user_id) || []

      const userCompleted = userAssignments.filter(a => a.status === 'completed').length
      const userProgressSum = userEnrollments.reduce((sum, e) => sum + (Number(e.overall_progress_percentage) || 0), 0)
      const userAverageProgress = userEnrollments.length > 0
        ? Math.round((userProgressSum / userEnrollments.length) * 10) / 10
        : 0

      const userTimeSpentMinutes = userProgress.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0)
      const userTimeSpentHours = Math.round((userTimeSpentMinutes / 60) * 10) / 10

      const lastActivity = userEnrollments.reduce((latest, e) => {
        const lastAccess = e.last_accessed_at ? new Date(e.last_accessed_at) : null
        if (!latest) return lastAccess
        if (!lastAccess) return latest
        return lastAccess > latest ? lastAccess : latest
      }, null as Date | null)

      return {
        user_id: ou.user_id,
        username: user.username,
        email: user.email,
        display_name: user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        profile_picture_url: user.profile_picture_url,
        role: ou.role,
        last_login_at: user.last_login_at,
        courses_assigned: userAssignments.length,
        courses_completed: userCompleted,
        courses_in_progress: userAssignments.filter(a => a.status === 'in_progress').length,
        average_progress: userAverageProgress,
        time_spent_hours: userTimeSpentHours,
        certificates_count: userCertificates.length,
        last_activity: lastActivity?.toISOString() || null
      }
    }).filter(u => u !== null)

    // Distribución de estados
    const distribution = [
      { name: 'Completados', value: completedAssignments, color: '#10b981' },
      { name: 'En Progreso', value: assignments?.filter(a => a.status === 'in_progress').length || 0, color: '#f59e0b' },
      { name: 'No Iniciados', value: assignments?.filter(a => a.status === 'assigned').length || 0, color: '#6b7280' }
    ]

    // Progreso por curso (para gráfica de barras)
    const progressByCourse = coursesData.map(course => ({
      course_id: course.course_id,
      course_title: course.course_title,
      progress: course.average_progress,
      total_assigned: course.total_assigned,
      completed: course.completed
    })).sort((a, b) => b.progress - a.progress)

    // Progreso por usuario (top 10)
    const progressByUser = usersData
      .sort((a, b) => (b?.average_progress || 0) - (a?.average_progress || 0))
      .slice(0, 10)
      .map(user => ({
        user_id: user!.user_id,
        display_name: user!.display_name,
        progress: user!.average_progress
      }))

    // Tendencias de completación (por mes)
    const completionTrends = assignments
      ?.filter(a => a.completed_at)
      .reduce((acc: Record<string, number>, a) => {
        const date = new Date(a.completed_at!)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        acc[monthKey] = (acc[monthKey] || 0) + 1
        return acc
      }, {}) || {}

    const completionTrendsArray = Object.entries(completionTrends)
      .map(([month, count]) => ({
        month,
        count: count as number
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // Tiempo dedicado por curso
    const timeByCourse = coursesData
      .filter(c => c.total_time_hours > 0)
      .sort((a, b) => b.total_time_hours - a.total_time_hours)
      .map(course => ({
        course_id: course.course_id,
        course_title: course.course_title,
        total_hours: course.total_time_hours
      }))

    return NextResponse.json({
      success: true,
      stats: {
        total_users: totalUsers,
        total_courses_assigned: totalCoursesAssigned,
        completed_courses: completedAssignments,
        average_progress: Math.round(averageProgress * 10) / 10,
        total_time_spent_hours: totalTimeSpentHours,
        completion_rate: completionRate
      },
      courses: coursesData,
      users: usersData,
      charts: {
        distribution,
        progress_by_course: progressByCourse,
        progress_by_user: progressByUser,
        completion_trends: completionTrendsArray,
        time_by_course: timeByCourse
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/progress:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener estadísticas de progreso del equipo'
    }, { status: 500 })
  }
}

