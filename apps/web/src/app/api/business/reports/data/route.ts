import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export type ReportType = 
  | 'users' 
  | 'courses' 
  | 'progress' 
  | 'activity' 
  | 'completion'
  | 'time_spent'
  | 'certificates'

export interface ReportFilters {
  report_type: ReportType
  start_date?: string
  end_date?: string
  user_ids?: string[]
  course_ids?: string[]
  role?: 'owner' | 'admin' | 'member' | 'all'
  status?: 'active' | 'invited' | 'suspended' | 'all'
}

/**
 * GET /api/business/reports/data
 * Obtiene datos para generar reportes según tipo y filtros
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'No tienes una organización asignada'
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') as ReportType || 'users'
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const userIds = searchParams.get('user_ids')?.split(',').filter(Boolean)
    const courseIds = searchParams.get('course_ids')?.split(',').filter(Boolean)
    const role = searchParams.get('role') || 'all'
    const status = searchParams.get('status') || 'all'

    const filters: ReportFilters = {
      report_type: reportType,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      user_ids: userIds?.length ? userIds : undefined,
      course_ids: courseIds?.length ? courseIds : undefined,
      role: role !== 'all' ? role as any : 'all',
      status: status !== 'all' ? status as any : 'all'
    }

    const supabase = await createClient()
    const organizationId = auth.organizationId

    let reportData: any = {}

    switch (reportType) {
      case 'users':
        reportData = await generateUsersReport(supabase, organizationId, filters)
        break
      case 'courses':
        reportData = await generateCoursesReport(supabase, organizationId, filters)
        break
      case 'progress':
        reportData = await generateProgressReport(supabase, organizationId, filters)
        break
      case 'activity':
        reportData = await generateActivityReport(supabase, organizationId, filters)
        break
      case 'completion':
        reportData = await generateCompletionReport(supabase, organizationId, filters)
        break
      case 'time_spent':
        reportData = await generateTimeSpentReport(supabase, organizationId, filters)
        break
      case 'certificates':
        reportData = await generateCertificatesReport(supabase, organizationId, filters)
        break
      default:
        return NextResponse.json({
          success: false,
          error: 'Tipo de reporte no válido'
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      report_type: reportType,
      filters,
      data: reportData,
      generated_at: new Date().toISOString()
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/reports/data:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al generar el reporte'
    }, { status: 500 })
  }
}

/**
 * Genera reporte de usuarios
 */
async function generateUsersReport(supabase: any, organizationId: string, filters: ReportFilters) {
  let query = supabase
    .from('organization_users')
    .select(`
      role,
      status,
      joined_at,
      user_id,
      users!organization_users_user_id_fkey (
        id,
        username,
        email,
        first_name,
        last_name,
        display_name,
        profile_picture_url,
        last_login_at,
        created_at,
        updated_at,
        type_rol
      )
    `)
    .eq('organization_id', organizationId)

  if (filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters.role !== 'all') {
    query = query.eq('role', filters.role)
  }

  if (filters.user_ids?.length) {
    query = query.in('user_id', filters.user_ids)
  }

  if (filters.start_date) {
    query = query.gte('joined_at', filters.start_date)
  }

  if (filters.end_date) {
    query = query.lte('joined_at', filters.end_date)
  }

  const { data: orgUsers, error } = await query.order('joined_at', { ascending: false })

  if (error) {
    logger.error('Error fetching users for report:', error)
    throw error
  }

  const userIds = (orgUsers || []).filter((ou: any) => ou.users).map((ou: any) => ou.users.id)

  // Obtener información de cursos asignados
  const { data: assignments } = await supabase
    .from('organization_course_assignments')
    .select('user_id, course_id, status, completion_percentage, courses!organization_course_assignments_course_id_fkey (id, title)')
    .eq('organization_id', organizationId)
    .in('user_id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000'])

  // Obtener información de certificados
  const { data: certificates } = await supabase
    .from('user_course_certificates')
    .select('user_id, course_id, issued_at, courses!user_course_certificates_course_id_fkey (id, title)')
    .in('user_id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000'])

  // Agrupar datos por usuario
  const coursesByUser = new Map()
  const certificatesByUser = new Map()
  const progressByUser = new Map()

  assignments?.forEach((a: any) => {
    if (!coursesByUser.has(a.user_id)) {
      coursesByUser.set(a.user_id, [])
    }
    if (!progressByUser.has(a.user_id)) {
      progressByUser.set(a.user_id, {
        total_courses: 0,
        completed_courses: 0,
        in_progress_courses: 0,
        average_progress: 0,
        total_progress: 0,
        progress_count: 0
      })
    }
    
    const course = a.courses
    if (course) {
      coursesByUser.get(a.user_id).push({
        course_id: course.id,
        course_title: course.title,
        status: a.status,
        completion_percentage: a.completion_percentage || 0
      })
    }

    const progress = progressByUser.get(a.user_id)
    progress.total_courses++
    if (a.status === 'completed') progress.completed_courses++
    else if (a.status === 'in_progress') progress.in_progress_courses++
    progress.total_progress += a.completion_percentage || 0
    progress.progress_count++
  })

  // Calcular promedio de progreso
  progressByUser.forEach((progress: any) => {
    progress.average_progress = progress.progress_count > 0
      ? Math.round((progress.total_progress / progress.progress_count) * 10) / 10
      : 0
  })

  certificates?.forEach((c: any) => {
    if (!certificatesByUser.has(c.user_id)) {
      certificatesByUser.set(c.user_id, [])
    }
    const course = c.courses
    if (course) {
      certificatesByUser.get(c.user_id).push({
        course_id: course.id,
        course_title: course.title,
        issued_at: c.issued_at
      })
    }
  })

  const users = (orgUsers || [])
    .filter((ou: any) => ou.users)
    .map((ou: any) => {
      const userId = ou.users.id
      const userCourses = coursesByUser.get(userId) || []
      const userCertificates = certificatesByUser.get(userId) || []
      const userProgress = progressByUser.get(userId) || {
        total_courses: 0,
        completed_courses: 0,
        in_progress_courses: 0,
        average_progress: 0
      }

      return {
        user_id: userId,
        username: ou.users.username,
        email: ou.users.email,
        display_name: ou.users.display_name || `${ou.users.first_name || ''} ${ou.users.last_name || ''}`.trim() || ou.users.username,
        first_name: ou.users.first_name,
        last_name: ou.users.last_name,
        role: ou.role, // Rol en la organización
        type_rol: ou.users.type_rol || 'No especificado', // type_rol del usuario
        status: ou.status,
        joined_at: ou.joined_at,
        last_login_at: ou.users.updated_at || ou.users.last_login_at, // Usar updated_at como última conexión
        created_at: ou.users.created_at,
        courses: userCourses,
        certificates: userCertificates,
        progress: userProgress
      }
    })

  return {
    total_users: users.length,
    users: users,
    summary: {
      by_type_rol: users.reduce((acc: any, u: any) => {
        const typeRol = u.type_rol || 'No especificado'
        acc[typeRol] = (acc[typeRol] || 0) + 1
        return acc
      }, {}),
      by_status: users.reduce((acc: any, u: any) => {
        acc[u.status] = (acc[u.status] || 0) + 1
        return acc
      }, {})
    }
  }
}

/**
 * Genera reporte de cursos
 */
async function generateCoursesReport(supabase: any, organizationId: string, filters: ReportFilters) {
  // Obtener asignaciones de cursos
  let assignmentsQuery = supabase
    .from('organization_course_assignments')
    .select(`
      id,
      course_id,
      user_id,
      status,
      completion_percentage,
      assigned_at,
      completed_at,
      due_date
    `)
    .eq('organization_id', organizationId)

  if (filters.start_date) {
    assignmentsQuery = assignmentsQuery.gte('assigned_at', filters.start_date)
  }

  if (filters.end_date) {
    assignmentsQuery = assignmentsQuery.lte('assigned_at', filters.end_date)
  }

  if (filters.user_ids?.length) {
    assignmentsQuery = assignmentsQuery.in('user_id', filters.user_ids)
  }

  if (filters.course_ids?.length) {
    assignmentsQuery = assignmentsQuery.in('course_id', filters.course_ids)
  }

  const { data: assignments, error: assignmentsError } = await assignmentsQuery.order('assigned_at', { ascending: false })

  if (assignmentsError) {
    logger.error('Error fetching course assignments:', assignmentsError)
  }

  // Obtener información de cursos
  const courseIds = [...new Set((assignments || []).map((a: any) => a.course_id))]
  let coursesData: any[] = []

  if (courseIds.length > 0) {
    let coursesQuery = supabase
      .from('courses')
      .select('id, title, category, level, duration_total_minutes, thumbnail_url')
      .in('id', courseIds)

    if (filters.course_ids?.length) {
      coursesQuery = coursesQuery.in('id', filters.course_ids)
    }

    const { data: courses, error: coursesError } = await coursesQuery

    if (!coursesError && courses) {
      coursesData = courses
    }
  }

  // Procesar datos
  const courseMap = new Map()
  
  coursesData.forEach(course => {
    courseMap.set(course.id, {
      course_id: course.id,
      course_title: course.title,
      category: course.category,
      level: course.level,
      duration_minutes: course.duration_total_minutes,
      total_assigned: 0,
      completed: 0,
      in_progress: 0,
      not_started: 0,
      average_progress: 0,
      total_users: 0
    })
  })

  assignments?.forEach((assignment: any) => {
    const course = courseMap.get(assignment.course_id)
    if (course) {
      course.total_assigned++
      course.total_users = new Set([...((course.users || []) as any[]), assignment.user_id]).size

      if (assignment.status === 'completed') {
        course.completed++
      } else if (assignment.status === 'in_progress') {
        course.in_progress++
      } else {
        course.not_started++
      }

      course.average_progress = ((course.average_progress * (course.total_assigned - 1)) + (assignment.completion_percentage || 0)) / course.total_assigned
    }
  })

  const courses = Array.from(courseMap.values())

  return {
    total_courses: courses.length,
    total_assignments: assignments?.length || 0,
    courses: courses,
    summary: {
      total_completed: courses.reduce((sum, c) => sum + c.completed, 0),
      total_in_progress: courses.reduce((sum, c) => sum + c.in_progress, 0),
      total_not_started: courses.reduce((sum, c) => sum + c.not_started, 0),
      average_completion_rate: courses.length > 0 
        ? courses.reduce((sum, c) => sum + c.average_progress, 0) / courses.length 
        : 0
    }
  }
}

/**
 * Genera reporte de progreso
 */
async function generateProgressReport(supabase: any, organizationId: string, filters: ReportFilters) {
  const { data: orgUsers } = await supabase
    .from('organization_users')
    .select(`
      user_id,
      users!organization_users_user_id_fkey (
        id,
        username,
        email,
        display_name,
        first_name,
        last_name
      )
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  const userIds = orgUsers?.map((ou: any) => ou.user_id) || []

  if (filters.user_ids?.length) {
    userIds.splice(0, userIds.length, ...filters.user_ids.filter(id => userIds.includes(id)))
  }

  let assignmentsQuery = supabase
    .from('organization_course_assignments')
    .select('user_id, course_id, status, completion_percentage, assigned_at, completed_at, due_date')
    .eq('organization_id', organizationId)
    .in('user_id', userIds)

  if (filters.start_date) {
    assignmentsQuery = assignmentsQuery.gte('assigned_at', filters.start_date)
  }
  if (filters.end_date) {
    assignmentsQuery = assignmentsQuery.lte('assigned_at', filters.end_date)
  }

  const { data: assignments } = await assignmentsQuery

  // Obtener información de cursos
  const courseIds = [...new Set((assignments || []).map((a: any) => a.course_id))]
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, category, level')
    .in('id', courseIds.length > 0 ? courseIds : ['00000000-0000-0000-0000-000000000000'])

  const courseMap = new Map((courses || []).map((c: any) => [c.id, c]))
  const userMap = new Map((orgUsers || []).map((ou: any) => [ou.user_id, ou.users]))

  // Enriquecer datos de progreso
  const progressData = (assignments || []).map((a: any) => {
    const course = courseMap.get(a.course_id)
    const user = userMap.get(a.user_id)
    return {
      ...a,
      user_name: user?.display_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || user?.email || 'Usuario desconocido',
      user_email: user?.email || '',
      course_title: course?.title || 'Curso desconocido',
      course_category: course?.category || '',
      course_level: course?.level || ''
    }
  })

  // Calcular estadísticas
  const completedCount = progressData.filter((p: any) => p.status === 'completed').length
  const inProgressCount = progressData.filter((p: any) => p.status === 'in_progress').length
  const notStartedCount = progressData.filter((p: any) => p.status === 'not_started').length
  const averageProgress = progressData.length > 0
    ? progressData.reduce((sum: number, p: any) => sum + (p.completion_percentage || 0), 0) / progressData.length
    : 0

  // Progreso por curso
  const progressByCourse = new Map()
  progressData.forEach((p: any) => {
    if (!progressByCourse.has(p.course_id)) {
      progressByCourse.set(p.course_id, {
        course_id: p.course_id,
        course_title: p.course_title,
        total: 0,
        completed: 0,
        in_progress: 0,
        not_started: 0,
        average_progress: 0
      })
    }
    const course = progressByCourse.get(p.course_id)
    course.total++
    if (p.status === 'completed') course.completed++
    else if (p.status === 'in_progress') course.in_progress++
    else course.not_started++
    course.average_progress = ((course.average_progress * (course.total - 1)) + (p.completion_percentage || 0)) / course.total
  })

  return {
    total_users: userIds.length,
    total_assignments: assignments?.length || 0,
    completed_count: completedCount,
    in_progress_count: inProgressCount,
    not_started_count: notStartedCount,
    average_progress: averageProgress,
    progress_data: progressData,
    progress_by_course: Array.from(progressByCourse.values())
  }
}

/**
 * Genera reporte de actividad
 */
async function generateActivityReport(supabase: any, organizationId: string, filters: ReportFilters) {
  const { data: orgUsers } = await supabase
    .from('organization_users')
    .select(`
      user_id,
      users!organization_users_user_id_fkey (
        id,
        username,
        email,
        display_name,
        first_name,
        last_name
      )
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  const userIds = orgUsers?.map((ou: any) => ou.user_id) || []

  if (filters.user_ids?.length) {
    userIds.splice(0, userIds.length, ...filters.user_ids.filter(id => userIds.includes(id)))
  }

  let enrollmentsQuery = supabase
    .from('user_course_enrollments')
    .select('user_id, course_id, enrolled_at, last_accessed_at, enrollment_status')
    .in('user_id', userIds)
    .order('last_accessed_at', { ascending: false })

  if (filters.start_date) {
    enrollmentsQuery = enrollmentsQuery.gte('enrolled_at', filters.start_date)
  }
  if (filters.end_date) {
    enrollmentsQuery = enrollmentsQuery.lte('enrolled_at', filters.end_date)
  }

  const { data: enrollments } = await enrollmentsQuery.limit(500)

  // Obtener información de cursos
  const courseIds = [...new Set((enrollments || []).map((e: any) => e.course_id))]
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, category')
    .in('id', courseIds.length > 0 ? courseIds : ['00000000-0000-0000-0000-000000000000'])

  const courseMap = new Map((courses || []).map((c: any) => [c.id, c]))
  const userMap = new Map((orgUsers || []).map((ou: any) => [ou.user_id, ou.users]))

  // Enriquecer datos de actividad
  const activities = (enrollments || []).map((e: any) => {
    const course = courseMap.get(e.course_id)
    const user = userMap.get(e.user_id)
    return {
      ...e,
      user_name: user?.display_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || user?.email || 'Usuario desconocido',
      user_email: user?.email || '',
      course_title: course?.title || 'Curso desconocido',
      course_category: course?.category || ''
    }
  })

  // Calcular estadísticas
  const activeCount = activities.filter((a: any) => a.enrollment_status === 'active').length
  const completedCount = activities.filter((a: any) => a.enrollment_status === 'completed').length
  const inactiveCount = activities.filter((a: any) => a.enrollment_status === 'inactive').length

  // Actividad por curso
  const activityByCourse = new Map()
  activities.forEach((a: any) => {
    if (!activityByCourse.has(a.course_id)) {
      activityByCourse.set(a.course_id, {
        course_id: a.course_id,
        course_title: a.course_title,
        total_enrollments: 0,
        active: 0,
        completed: 0,
        inactive: 0
      })
    }
    const course = activityByCourse.get(a.course_id)
    course.total_enrollments++
    if (a.enrollment_status === 'active') course.active++
    else if (a.enrollment_status === 'completed') course.completed++
    else course.inactive++
  })

  return {
    total_activities: activities.length,
    total_users: userIds.length,
    active_count: activeCount,
    completed_count: completedCount,
    inactive_count: inactiveCount,
    activities: activities,
    activity_by_course: Array.from(activityByCourse.values())
  }
}

/**
 * Genera reporte de completación
 */
async function generateCompletionReport(supabase: any, organizationId: string, filters: ReportFilters) {
  let assignmentsQuery = supabase
    .from('organization_course_assignments')
    .select('course_id, user_id, status, completion_percentage, completed_at, assigned_at, due_date')
    .eq('organization_id', organizationId)

  if (filters.start_date) {
    assignmentsQuery = assignmentsQuery.gte('completed_at', filters.start_date)
  }
  if (filters.end_date) {
    assignmentsQuery = assignmentsQuery.lte('completed_at', filters.end_date)
  }

  const { data: assignments } = await assignmentsQuery

  // Obtener información de cursos
  const courseIds = [...new Set((assignments || []).map((a: any) => a.course_id))]
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, category, level')
    .in('id', courseIds.length > 0 ? courseIds : ['00000000-0000-0000-0000-000000000000'])

  const courseMap = new Map((courses || []).map((c: any) => [c.id, c]))

  // Enriquecer datos
  const completionData = (assignments || []).map((a: any) => {
    const course = courseMap.get(a.course_id)
    return {
      ...a,
      course_title: course?.title || 'Curso desconocido',
      course_category: course?.category || '',
      course_level: course?.level || ''
    }
  })

  const completed = completionData.filter((a: any) => a.status === 'completed')
  const inProgress = completionData.filter((a: any) => a.status === 'in_progress')
  const notStarted = completionData.filter((a: any) => a.status === 'not_started')

  // Completación por curso
  const completionByCourse = new Map()
  completionData.forEach((c: any) => {
    if (!completionByCourse.has(c.course_id)) {
      completionByCourse.set(c.course_id, {
        course_id: c.course_id,
        course_title: c.course_title,
        total: 0,
        completed: 0,
        in_progress: 0,
        not_started: 0,
        average_completion: 0
      })
    }
    const course = completionByCourse.get(c.course_id)
    course.total++
    if (c.status === 'completed') course.completed++
    else if (c.status === 'in_progress') course.in_progress++
    else course.not_started++
    course.average_completion = ((course.average_completion * (course.total - 1)) + (c.completion_percentage || 0)) / course.total
  })

  // Tasa de completación
  const completionRate = completionData.length > 0
    ? (completed.length / completionData.length) * 100
    : 0

  return {
    total_assignments: completionData.length,
    completed: completed.length,
    in_progress: inProgress.length,
    not_started: notStarted.length,
    completion_rate: completionRate,
    average_completion_percentage: completionData.length > 0
      ? completionData.reduce((sum: number, c: any) => sum + (c.completion_percentage || 0), 0) / completionData.length
      : 0,
    completion_data: completionData,
    completion_by_course: Array.from(completionByCourse.values())
  }
}

/**
 * Genera reporte de tiempo dedicado
 */
async function generateTimeSpentReport(supabase: any, organizationId: string, filters: ReportFilters) {
  const { data: orgUsers } = await supabase
    .from('organization_users')
    .select(`
      user_id,
      users!organization_users_user_id_fkey (
        id,
        username,
        email,
        display_name,
        first_name,
        last_name
      )
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  const userIds = orgUsers?.map((ou: any) => ou.user_id) || []

  if (filters.user_ids?.length) {
    userIds.splice(0, userIds.length, ...filters.user_ids.filter(id => userIds.includes(id)))
  }

  let lessonProgressQuery = supabase
    .from('user_lesson_progress')
    .select('user_id, lesson_id, time_spent_minutes, completed_at, started_at, last_accessed_at, completion_status')
    .in('user_id', userIds)

  if (filters.start_date) {
    lessonProgressQuery = lessonProgressQuery.gte('started_at', filters.start_date)
  }
  if (filters.end_date) {
    lessonProgressQuery = lessonProgressQuery.lte('last_accessed_at', filters.end_date)
  }

  const { data: lessonProgress } = await lessonProgressQuery

  // Obtener información de lecciones y cursos
  const lessonIds = [...new Set((lessonProgress || []).map((p: any) => p.lesson_id))]
  const { data: lessons } = await supabase
    .from('course_lessons')
    .select('lesson_id, lesson_title, module_id, course_modules!course_lessons_module_id_fkey (course_id, courses!course_modules_course_id_fkey (id, title))')
    .in('lesson_id', lessonIds.length > 0 ? lessonIds : ['00000000-0000-0000-0000-000000000000'])

  const lessonMap = new Map()
  lessons?.forEach((l: any) => {
    lessonMap.set(l.lesson_id, {
      lesson_title: l.lesson_title,
      course_id: l.course_modules?.courses?.id,
      course_title: l.course_modules?.courses?.title || 'Curso desconocido'
    })
  })

  const userMap = new Map((orgUsers || []).map((ou: any) => [ou.user_id, ou.users]))

  // Agrupar por usuario
  const timeByUser = new Map()
  lessonProgress?.forEach((p: any) => {
    if (!timeByUser.has(p.user_id)) {
      const user = userMap.get(p.user_id)
      timeByUser.set(p.user_id, {
        user_id: p.user_id,
        user_name: user?.display_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || user?.email || 'Usuario desconocido',
        user_email: user?.email || '',
        total_minutes: 0,
        total_hours: 0,
        lessons_completed: 0,
        lessons_in_progress: 0,
        lessons_not_started: 0
      })
    }
    const user = timeByUser.get(p.user_id)
    user.total_minutes += p.time_spent_minutes || 0
    if (p.completion_status === 'completed') user.lessons_completed++
    else if (p.completion_status === 'in_progress') user.lessons_in_progress++
    else user.lessons_not_started++
  })

  // Calcular horas para cada usuario
  timeByUser.forEach((user: any) => {
    user.total_hours = Math.round((user.total_minutes / 60) * 10) / 10
  })

  const totalMinutes = lessonProgress?.reduce((sum: number, p: any) => sum + (p.time_spent_minutes || 0), 0) || 0

  // Tiempo por curso
  const timeByCourse = new Map()
  lessonProgress?.forEach((p: any) => {
    const lesson = lessonMap.get(p.lesson_id)
    if (lesson?.course_id) {
      if (!timeByCourse.has(lesson.course_id)) {
        timeByCourse.set(lesson.course_id, {
          course_id: lesson.course_id,
          course_title: lesson.course_title,
          total_minutes: 0,
          total_hours: 0
        })
      }
      const course = timeByCourse.get(lesson.course_id)
      course.total_minutes += p.time_spent_minutes || 0
    }
  })
  timeByCourse.forEach((course: any) => {
    course.total_hours = Math.round((course.total_minutes / 60) * 10) / 10
  })

  return {
    total_users: userIds.length,
    total_minutes: totalMinutes,
    total_hours: Math.round((totalMinutes / 60) * 10) / 10,
    average_minutes_per_user: userIds.length > 0 ? Math.round((totalMinutes / userIds.length) * 10) / 10 : 0,
    average_hours_per_user: userIds.length > 0 ? Math.round((totalMinutes / 60 / userIds.length) * 10) / 10 : 0,
    time_data: Array.from(timeByUser.values()),
    time_by_course: Array.from(timeByCourse.values())
  }
}

/**
 * Genera reporte de certificados
 */
async function generateCertificatesReport(supabase: any, organizationId: string, filters: ReportFilters) {
  const { data: orgUsers } = await supabase
    .from('organization_users')
    .select(`
      user_id,
      users!organization_users_user_id_fkey (
        id,
        username,
        email,
        display_name,
        first_name,
        last_name
      )
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  const userIds = orgUsers?.map((ou: any) => ou.user_id) || []

  if (filters.user_ids?.length) {
    userIds.splice(0, userIds.length, ...filters.user_ids.filter(id => userIds.includes(id)))
  }

  let certificatesQuery = supabase
    .from('user_course_certificates')
    .select('user_id, course_id, issued_at, certificate_url')
    .in('user_id', userIds)
    .order('issued_at', { ascending: false })

  if (filters.start_date) {
    certificatesQuery = certificatesQuery.gte('issued_at', filters.start_date)
  }
  if (filters.end_date) {
    certificatesQuery = certificatesQuery.lte('issued_at', filters.end_date)
  }

  const { data: certificates } = await certificatesQuery

  // Obtener información de cursos
  const courseIds = [...new Set((certificates || []).map((c: any) => c.course_id))]
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, category, level')
    .in('id', courseIds.length > 0 ? courseIds : ['00000000-0000-0000-0000-000000000000'])

  const courseMap = new Map((courses || []).map((c: any) => [c.id, c]))
  const userMap = new Map((orgUsers || []).map((ou: any) => [ou.user_id, ou.users]))

  // Enriquecer datos
  const enrichedCertificates = (certificates || []).map((c: any) => {
    const course = courseMap.get(c.course_id)
    const user = userMap.get(c.user_id)
    return {
      ...c,
      user_name: user?.display_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || user?.email || 'Usuario desconocido',
      user_email: user?.email || '',
      course_title: course?.title || 'Curso desconocido',
      course_category: course?.category || '',
      course_level: course?.level || ''
    }
  })

  // Certificados por curso
  const certificatesByCourse = new Map()
  enrichedCertificates.forEach((c: any) => {
    if (!certificatesByCourse.has(c.course_id)) {
      certificatesByCourse.set(c.course_id, {
        course_id: c.course_id,
        course_title: c.course_title,
        count: 0
      })
    }
    certificatesByCourse.get(c.course_id).count++
  })

  // Certificados por usuario
  const certificatesByUser = new Map()
  enrichedCertificates.forEach((c: any) => {
    if (!certificatesByUser.has(c.user_id)) {
      certificatesByUser.set(c.user_id, {
        user_id: c.user_id,
        user_name: c.user_name,
        user_email: c.user_email,
        count: 0
      })
    }
    certificatesByUser.get(c.user_id).count++
  })

  return {
    total_certificates: enrichedCertificates.length,
    total_users_with_certificates: certificatesByUser.size,
    certificates: enrichedCertificates,
    certificates_by_course: Array.from(certificatesByCourse.values()),
    certificates_by_user: Array.from(certificatesByUser.values())
  }
}
