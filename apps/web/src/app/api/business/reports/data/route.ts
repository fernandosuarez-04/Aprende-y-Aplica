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
        created_at
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

  const users = (orgUsers || [])
    .filter((ou: any) => ou.users)
    .map((ou: any) => ({
      user_id: ou.users.id,
      username: ou.users.username,
      email: ou.users.email,
      display_name: ou.users.display_name || `${ou.users.first_name || ''} ${ou.users.last_name || ''}`.trim() || ou.users.username,
      first_name: ou.users.first_name,
      last_name: ou.users.last_name,
      role: ou.role,
      status: ou.status,
      joined_at: ou.joined_at,
      last_login_at: ou.users.last_login_at,
      created_at: ou.users.created_at
    }))

  return {
    total_users: users.length,
    users: users,
    summary: {
      by_role: users.reduce((acc: any, u: any) => {
        acc[u.role] = (acc[u.role] || 0) + 1
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
  // Esta función reutiliza la lógica del endpoint de progreso
  // Por ahora, retornamos un resumen básico
  const { data: orgUsers } = await supabase
    .from('organization_users')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  const userIds = orgUsers?.map((ou: any) => ou.user_id) || []

  if (filters.user_ids?.length) {
    userIds.splice(0, userIds.length, ...filters.user_ids.filter(id => userIds.includes(id)))
  }

  const { data: assignments } = await supabase
    .from('organization_course_assignments')
    .select('user_id, course_id, status, completion_percentage, assigned_at, completed_at')
    .eq('organization_id', organizationId)
    .in('user_id', userIds)

  if (filters.start_date) {
    // Filtrar por fecha de asignación
  }

  return {
    total_users: userIds.length,
    total_assignments: assignments?.length || 0,
    progress_data: assignments || []
  }
}

/**
 * Genera reporte de actividad
 */
async function generateActivityReport(supabase: any, organizationId: string, filters: ReportFilters) {
  const { data: orgUsers } = await supabase
    .from('organization_users')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  const userIds = orgUsers?.map((ou: any) => ou.user_id) || []

  if (filters.user_ids?.length) {
    userIds.splice(0, userIds.length, ...filters.user_ids.filter(id => userIds.includes(id)))
  }

  const { data: enrollments } = await supabase
    .from('user_course_enrollments')
    .select('user_id, course_id, enrolled_at, last_accessed_at, enrollment_status')
    .in('user_id', userIds)
    .order('last_accessed_at', { ascending: false })
    .limit(100)

  return {
    total_activities: enrollments?.length || 0,
    activities: enrollments || []
  }
}

/**
 * Genera reporte de completación
 */
async function generateCompletionReport(supabase: any, organizationId: string, filters: ReportFilters) {
  const { data: assignments } = await supabase
    .from('organization_course_assignments')
    .select('course_id, status, completion_percentage, completed_at')
    .eq('organization_id', organizationId)

  if (filters.start_date) {
    // Filtrar por fecha de completación
  }

  return {
    total_assignments: assignments?.length || 0,
    completed: assignments?.filter((a: any) => a.status === 'completed').length || 0,
    completion_data: assignments || []
  }
}

/**
 * Genera reporte de tiempo dedicado
 */
async function generateTimeSpentReport(supabase: any, organizationId: string, filters: ReportFilters) {
  const { data: orgUsers } = await supabase
    .from('organization_users')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  const userIds = orgUsers?.map((ou: any) => ou.user_id) || []

  if (filters.user_ids?.length) {
    userIds.splice(0, userIds.length, ...filters.user_ids.filter(id => userIds.includes(id)))
  }

  const { data: lessonProgress } = await supabase
    .from('user_lesson_progress')
    .select('user_id, time_spent_minutes, completed_at, started_at')
    .in('user_id', userIds)

  const totalMinutes = lessonProgress?.reduce((sum: number, p: any) => sum + (p.time_spent_minutes || 0), 0) || 0

  return {
    total_users: userIds.length,
    total_minutes: totalMinutes,
    total_hours: Math.round((totalMinutes / 60) * 10) / 10,
    time_data: lessonProgress || []
  }
}

/**
 * Genera reporte de certificados
 */
async function generateCertificatesReport(supabase: any, organizationId: string, filters: ReportFilters) {
  const { data: orgUsers } = await supabase
    .from('organization_users')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  const userIds = orgUsers?.map((ou: any) => ou.user_id) || []

  if (filters.user_ids?.length) {
    userIds.splice(0, userIds.length, ...filters.user_ids.filter(id => userIds.includes(id)))
  }

  const { data: certificates } = await supabase
    .from('user_course_certificates')
    .select('user_id, course_id, issued_at')
    .in('user_id', userIds)
    .order('issued_at', { ascending: false })

  return {
    total_certificates: certificates?.length || 0,
    certificates: certificates || []
  }
}
