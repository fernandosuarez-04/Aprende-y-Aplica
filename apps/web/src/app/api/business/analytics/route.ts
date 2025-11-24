import { NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/business/analytics
 * Obtiene datos de analytics para RRHH con múltiples métricas
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
    const organizationId = auth.organizationId

    // 1. Obtener usuarios activos de la organización
    const { data: orgUsers, error: orgUsersError } = await supabase
      .from('organization_users')
      .select(`
        user_id,
        role,
        status,
        joined_at,
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
      .eq('status', 'active')
      .order('joined_at', { ascending: false })

    if (orgUsersError) {
      logger.error('Error fetching organization users for analytics:', orgUsersError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener usuarios de la organización'
      }, { status: 500 })
    }

    const userIds = orgUsers?.map(ou => ou.user_id) || []

    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        general_metrics: {
          total_users: 0,
          total_courses_assigned: 0,
          completed_courses: 0,
          average_progress: 0,
          total_time_hours: 0,
          total_certificates: 0,
          active_users: 0,
          retention_rate: 0
        },
        user_analytics: [],
        trends: {
          enrollments_by_month: [],
          completions_by_month: [],
          time_by_month: [],
          active_users_by_month: []
        },
        by_role: {
          distribution: [],
          progress_comparison: [],
          completions: [],
          time_spent: []
        },
        course_metrics: {
          distribution: [],
          top_by_time: []
        }
      })
    }

    // 2. Obtener asignaciones de cursos
    const { data: assignments, error: assignmentsError } = await supabase
      .from('organization_course_assignments')
      .select(`
        id,
        user_id,
        course_id,
        status,
        completion_percentage,
        assigned_at,
        completed_at,
        due_date
      `)
      .eq('organization_id', organizationId)
      .in('user_id', userIds)
      .order('assigned_at', { ascending: false })

    if (assignmentsError) {
      logger.error('Error fetching assignments for analytics:', assignmentsError)
    }

    // 3. Obtener enrollments
    const { data: enrollments, error: enrollmentsError } = await supabase
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
      .order('enrolled_at', { ascending: false })

    if (enrollmentsError) {
      logger.error('Error fetching enrollments for analytics:', enrollmentsError)
    }

    // 4. Obtener progreso de lecciones
    const { data: lessonProgress, error: lessonProgressError } = await supabase
      .from('user_lesson_progress')
      .select(`
        user_id,
        time_spent_minutes,
        is_completed,
        completed_at,
        started_at
      `)
      .in('user_id', userIds)

    if (lessonProgressError) {
      logger.error('Error fetching lesson progress for analytics:', lessonProgressError)
    }

    // 5. Obtener certificados con información enriquecida
    const { data: certificates, error: certificatesError } = await supabase
      .from('user_course_certificates')
      .select(`
        user_id,
        course_id,
        issued_at,
        courses (
          id,
          title,
          instructor_id
        )
      `)
      .in('user_id', userIds)
      .order('issued_at', { ascending: false })

    if (certificatesError) {
      logger.error('Error fetching certificates for analytics:', certificatesError)
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
        user_id: cert.user_id,
        course_id: cert.course_id,
        issued_at: cert.issued_at,
        course_title: course.title || 'Curso sin título',
        instructor_name: instructor?.name || 'Instructor',
        instructor_username: instructor?.username || null
      }
    })

    // 6. Obtener información de cursos
    const courseIds = [...new Set([
      ...(assignments || []).map((a: any) => a.course_id),
      ...(enrollments || []).map((e: any) => e.course_id)
    ])]
    
    let coursesMap = new Map()
    if (courseIds.length > 0) {
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, category, level, duration_total_minutes, thumbnail_url')
        .in('id', courseIds)

      if (!coursesError && courses) {
        courses.forEach(course => {
          coursesMap.set(course.id, course)
        })
      }
    }

    // Calcular métricas generales
    const totalUsers = userIds.length
    const totalCoursesAssigned = assignments?.length || 0
    const completedCourses = assignments?.filter((a: any) => a.status === 'completed' || (a.completion_percentage || 0) >= 100).length || 0
    
    const progressSum = enrollments?.reduce((sum: number, e: any) => sum + (Number(e.overall_progress_percentage) || 0), 0) || 0
    const averageProgress = enrollments && enrollments.length > 0 ? progressSum / enrollments.length : 0

    const totalTimeMinutes = lessonProgress?.reduce((sum: number, p: any) => sum + (p.time_spent_minutes || 0), 0) || 0
    const totalTimeHours = Math.round((totalTimeMinutes / 60) * 10) / 10

    const totalCertificates = enrichedCertificates?.length || 0

    // Usuarios activos (con actividad en los últimos 30 días)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const activeUsers = orgUsers?.filter((ou: any) => {
      const lastLogin = ou.users?.last_login_at
      return lastLogin && new Date(lastLogin) >= thirtyDaysAgo
    }).length || 0

    const retentionRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

    // Análisis por usuario
    const userAnalytics = (orgUsers || []).map((ou: any) => {
      const user = ou.users
      if (!user) return null

      const userAssignments = assignments?.filter((a: any) => a.user_id === ou.user_id) || []
      const userEnrollments = enrollments?.filter((e: any) => e.user_id === ou.user_id) || []
      const userProgress = lessonProgress?.filter((p: any) => p.user_id === ou.user_id) || []
      const userCertificates = enrichedCertificates?.filter((c: any) => c.user_id === ou.user_id) || []

      const userCompleted = userAssignments.filter((a: any) => a.status === 'completed' || (a.completion_percentage || 0) >= 100).length
      const userProgressSum = userEnrollments.reduce((sum: number, e: any) => sum + (Number(e.overall_progress_percentage) || 0), 0)
      const userAverageProgress = userEnrollments.length > 0 ? Math.round((userProgressSum / userEnrollments.length) * 10) / 10 : 0

      const userTimeMinutes = userProgress.reduce((sum: number, p: any) => sum + (p.time_spent_minutes || 0), 0)
      const userTimeHours = Math.round((userTimeMinutes / 60) * 10) / 10

      return {
        user_id: ou.user_id,
        display_name: user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
        email: user.email,
        username: user.username,
        role: ou.role,
        profile_picture_url: user.profile_picture_url,
        courses_assigned: userAssignments.length,
        courses_completed: userCompleted,
        average_progress: userAverageProgress,
        total_time_hours: userTimeHours,
        certificates_count: userCertificates.length,
        last_login_at: user.last_login_at,
        joined_at: ou.joined_at
      }
    }).filter(Boolean)

    // Tendencias mensuales
    const enrollmentsByMonth = new Map<string, number>()
    const completionsByMonth = new Map<string, number>()
    const timeByMonth = new Map<string, number>()
    const activeUsersByMonth = new Map<string, Set<string>>()

    enrollments?.forEach((e: any) => {
      if (e.enrolled_at) {
        const date = new Date(e.enrolled_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        enrollmentsByMonth.set(monthKey, (enrollmentsByMonth.get(monthKey) || 0) + 1)
      }
    })

    assignments?.forEach((a: any) => {
      if (a.completed_at) {
        const date = new Date(a.completed_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        completionsByMonth.set(monthKey, (completionsByMonth.get(monthKey) || 0) + 1)
      }
    })

    lessonProgress?.forEach((p: any) => {
      if (p.completed_at || p.started_at) {
        const date = new Date(p.completed_at || p.started_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        timeByMonth.set(monthKey, (timeByMonth.get(monthKey) || 0) + (p.time_spent_minutes || 0))
      }
    })

    orgUsers?.forEach((ou: any) => {
      if (ou.users?.last_login_at) {
        const date = new Date(ou.users.last_login_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!activeUsersByMonth.has(monthKey)) {
          activeUsersByMonth.set(monthKey, new Set())
        }
        activeUsersByMonth.get(monthKey)!.add(ou.user_id)
      }
    })

    // Formatear tendencias
    const formatTrends = (map: Map<string, number | Set<string>>) => {
      return Array.from(map.entries())
        .map(([month, value]) => ({
          month,
          count: value instanceof Set ? value.size : value,
          label: new Date(month + '-01').toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
    }

    // Análisis por rol
    const roleDistribution = new Map<string, number>()
    const roleProgress = new Map<string, { sum: number; count: number }>()
    const roleCompletions = new Map<string, number>()
    const roleTime = new Map<string, { sum: number; count: number }>()

    orgUsers?.forEach((ou: any) => {
      const role = ou.role
      roleDistribution.set(role, (roleDistribution.get(role) || 0) + 1)

      const userEnrollments = enrollments?.filter((e: any) => e.user_id === ou.user_id) || []
      const userProgress = lessonProgress?.filter((p: any) => p.user_id === ou.user_id) || []
      const userAssignments = assignments?.filter((a: any) => a.user_id === ou.user_id) || []

      userEnrollments.forEach((e: any) => {
        if (!roleProgress.has(role)) {
          roleProgress.set(role, { sum: 0, count: 0 })
        }
        const roleData = roleProgress.get(role)!
        roleData.sum += Number(e.overall_progress_percentage) || 0
        roleData.count++
      })

      const userCompleted = userAssignments.filter((a: any) => a.status === 'completed' || (a.completion_percentage || 0) >= 100).length
      roleCompletions.set(role, (roleCompletions.get(role) || 0) + userCompleted)

      userProgress.forEach((p: any) => {
        if (!roleTime.has(role)) {
          roleTime.set(role, { sum: 0, count: 0 })
        }
        const roleData = roleTime.get(role)!
        roleData.sum += p.time_spent_minutes || 0
        roleData.count++
      })
    })

    // Métricas de cursos
    const courseDistribution = new Map<string, number>()
    const courseTime = new Map<string, number>()

    assignments?.forEach((a: any) => {
      const status = a.status === 'completed' || (a.completion_percentage || 0) >= 100 
        ? 'completed' 
        : a.status === 'in_progress' || (a.completion_percentage || 0) > 0
        ? 'in_progress'
        : 'not_started'
      
      courseDistribution.set(status, (courseDistribution.get(status) || 0) + 1)
    })

    lessonProgress?.forEach((p: any) => {
      // Necesitamos mapear lesson a course, esto es una simplificación
      // En producción necesitarías un join apropiado
    })

    return NextResponse.json({
      success: true,
      general_metrics: {
        total_users: totalUsers,
        total_courses_assigned: totalCoursesAssigned,
        completed_courses: completedCourses,
        average_progress: Math.round(averageProgress * 10) / 10,
        total_time_hours: totalTimeHours,
        total_certificates: totalCertificates,
        active_users: activeUsers,
        retention_rate: retentionRate
      },
      user_analytics: userAnalytics,
      trends: {
        enrollments_by_month: formatTrends(enrollmentsByMonth),
        completions_by_month: formatTrends(completionsByMonth),
        time_by_month: formatTrends(timeByMonth).map(t => ({ ...t, count: Math.round((t.count as number) / 60 * 10) / 10 })),
        active_users_by_month: formatTrends(activeUsersByMonth)
      },
      by_role: {
        distribution: Array.from(roleDistribution.entries()).map(([role, count]) => ({ role, count })),
        progress_comparison: Array.from(roleProgress.entries()).map(([role, data]) => ({
          role,
          average_progress: data.count > 0 ? Math.round((data.sum / data.count) * 10) / 10 : 0
        })),
        completions: Array.from(roleCompletions.entries()).map(([role, count]) => ({ role, total_completed: count })),
        time_spent: Array.from(roleTime.entries()).map(([role, data]) => ({
          role,
          average_hours: data.count > 0 ? Math.round((data.sum / 60 / data.count) * 10) / 10 : 0
        }))
      },
      course_metrics: {
        distribution: Array.from(courseDistribution.entries()).map(([status, count]) => ({ status, count })),
        top_by_time: [] // Se puede implementar después con join apropiado
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/analytics:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener datos de analytics'
    }, { status: 500 })
  }
}

