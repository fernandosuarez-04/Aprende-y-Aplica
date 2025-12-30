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
          created_at,
          type_rol
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
        },
        study_planner: {
          users_with_plans: 0,
          total_plans: 0,
          total_sessions: 0,
          completed_sessions: 0,
          missed_sessions: 0,
          pending_sessions: 0,
          in_progress_sessions: 0,
          ai_generated_sessions: 0,
          sessions_by_status: [],
          usage_rate: 0,
          average_session_duration_minutes: 0,
          total_study_hours: 0,
          plan_adherence_rate: 0,
          on_time_completion_rate: 0,
          avg_sessions_per_user: 0,
          user_adherence: []
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
      // 2. Asignaciones de cursos
      supabase
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
        .order('assigned_at', { ascending: false }),

      // 3. Enrollments
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

      // 4. Progreso de lecciones
      supabase
        .from('user_lesson_progress')
        .select(`
          user_id,
          time_spent_minutes,
          is_completed,
          completed_at,
          started_at
        `)
        .in('user_id', userIds),

      // 5. Certificados con información enriquecida
      supabase
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
        .order('issued_at', { ascending: false }),

      // 6. Study Plans (Planificador de Estudios)
      supabase
        .from('study_plans')
        .select(`
          id,
          user_id,
          course_id,
          created_at,
          study_sessions (
            id,
            status,
            scheduled_date,
            start_time,
            completed_at
          )
        `)
        .in('user_id', userIds)
    ])

    // Log de errores (no bloqueantes)
    if (assignmentsError) {
      logger.error('Error fetching assignments for analytics:', assignmentsError)
    }
    if (enrollmentsError) {
      logger.error('Error fetching enrollments for analytics:', enrollmentsError)
    }
    if (lessonProgressError) {
      logger.error('Error fetching lesson progress for analytics:', lessonProgressError)
    }
    if (certificatesError) {
      logger.error('Error fetching certificates for analytics:', certificatesError)
    }

    // Extraer study plans del resultado - consulta mejorada con más datos de sesiones
    const studyPlansResult = await supabase
      .from('study_plans')
      .select(`
        id,
        user_id,
        course_id,
        created_at,
        study_sessions (
          id,
          title,
          status,
          scheduled_date,
          start_time,
          end_time,
          completed_at,
          is_ai_generated
        )
      `)
      .in('user_id', userIds)
    
    const studyPlans = studyPlansResult.data || []

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
        type_rol: user.type_rol || null,
        profile_picture_url: user.profile_picture_url,
        courses_assigned: userAssignments.length,
        courses_completed: userCompleted,
        average_progress: userAverageProgress,
        total_time_hours: userTimeHours,
        certificates_count: userCertificates.length,
        certificates_earned: userCertificates.length,
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

    // Análisis por rol (usando type_rol para roles como Director, Analista, etc.)
    const typeRolDistribution = new Map<string, number>()
    const typeRolProgress = new Map<string, { sum: number; count: number }>()
    const typeRolCompletions = new Map<string, number>()
    const typeRolTime = new Map<string, { sum: number; count: number }>()

    orgUsers?.forEach((ou: any) => {
      // Usar type_rol si existe, si no usar role como fallback
      const typeRol = ou.users?.type_rol || ou.role || 'Sin especificar'
      typeRolDistribution.set(typeRol, (typeRolDistribution.get(typeRol) || 0) + 1)

      const userEnrollments = enrollments?.filter((e: any) => e.user_id === ou.user_id) || []
      const userProgress = lessonProgress?.filter((p: any) => p.user_id === ou.user_id) || []
      const userAssignments = assignments?.filter((a: any) => a.user_id === ou.user_id) || []

      userEnrollments.forEach((e: any) => {
        if (!typeRolProgress.has(typeRol)) {
          typeRolProgress.set(typeRol, { sum: 0, count: 0 })
        }
        const roleData = typeRolProgress.get(typeRol)!
        roleData.sum += Number(e.overall_progress_percentage) || 0
        roleData.count++
      })

      const userCompleted = userAssignments.filter((a: any) => a.status === 'completed' || (a.completion_percentage || 0) >= 100).length
      typeRolCompletions.set(typeRol, (typeRolCompletions.get(typeRol) || 0) + userCompleted)

      userProgress.forEach((p: any) => {
        if (!typeRolTime.has(typeRol)) {
          typeRolTime.set(typeRol, { sum: 0, count: 0 })
        }
        const roleData = typeRolTime.get(typeRol)!
        roleData.sum += p.time_spent_minutes || 0
        roleData.count++
      })
    })

    // Métricas de cursos - usar tanto assignments como enrollments
    const courseDistribution = new Map<string, number>()
    const courseTime = new Map<string, number>()

    // Si hay assignments, usarlos
    if (assignments && assignments.length > 0) {
      assignments.forEach((a: any) => {
        const status = a.status === 'completed' || (a.completion_percentage || 0) >= 100 
          ? 'completed' 
          : a.status === 'in_progress' || (a.completion_percentage || 0) > 0
          ? 'in_progress'
          : 'not_started'
        
        courseDistribution.set(status, (courseDistribution.get(status) || 0) + 1)
      })
    } else if (enrollments && enrollments.length > 0) {
      // Si no hay assignments, usar enrollments
      enrollments.forEach((e: any) => {
        const progress = Number(e.overall_progress_percentage) || 0
        const status = e.enrollment_status === 'completed' || progress >= 100
          ? 'completed'
          : progress > 0 || e.enrollment_status === 'active'
          ? 'in_progress'
          : 'not_started'
        
        courseDistribution.set(status, (courseDistribution.get(status) || 0) + 1)
      })
    }

    // Métricas del planificador de estudios - análisis detallado
    const usersWithPlans = new Set(studyPlans.map((p: any) => p.user_id)).size
    const totalPlans = studyPlans.length
    let totalSessions = 0
    let completedSessions = 0
    let missedSessions = 0
    let pendingSessions = 0
    let inProgressSessions = 0
    let aiGeneratedSessions = 0
    let totalSessionDurationMinutes = 0
    let completedSessionDurationMinutes = 0
    let onTimeCompletions = 0 // Sesiones completadas a tiempo (antes o en la fecha programada)
    let lateCompletions = 0 // Sesiones completadas tarde
    const sessionsByStatus = new Map<string, number>()
    const sessionsPerUser = new Map<string, { total: number; completed: number; missed: number }>()

    const now = new Date()

    studyPlans.forEach((plan: any) => {
      const sessions = plan.study_sessions || []
      const userId = plan.user_id
      
      if (!sessionsPerUser.has(userId)) {
        sessionsPerUser.set(userId, { total: 0, completed: 0, missed: 0 })
      }
      const userStats = sessionsPerUser.get(userId)!
      
      totalSessions += sessions.length
      userStats.total += sessions.length
      
      sessions.forEach((session: any) => {
        const status = session.status || 'pending'
        sessionsByStatus.set(status, (sessionsByStatus.get(status) || 0) + 1)
        
        // Contar por estado
        if (status === 'completed' || session.completed_at) {
          completedSessions++
          userStats.completed++
          
          // Calcular si fue a tiempo o tarde
          if (session.scheduled_date && session.completed_at) {
            const scheduledDate = new Date(session.scheduled_date)
            scheduledDate.setHours(23, 59, 59, 999) // Fin del día programado
            const completedDate = new Date(session.completed_at)
            if (completedDate <= scheduledDate) {
              onTimeCompletions++
            } else {
              lateCompletions++
            }
          }
          
          // Calcular duración de sesiones completadas
          if (session.start_time && session.end_time) {
            const start = new Date(session.start_time)
            const end = new Date(session.end_time)
            const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
            if (durationMinutes > 0 && durationMinutes < 480) { // Máximo 8 horas
              completedSessionDurationMinutes += durationMinutes
            }
          }
        } else if (status === 'missed') {
          missedSessions++
          userStats.missed++
        } else if (status === 'in_progress') {
          inProgressSessions++
        } else {
          // Verificar si ya pasó la fecha y está pendiente (se convierte en missed)
          if (session.scheduled_date) {
            const scheduledDate = new Date(session.scheduled_date)
            scheduledDate.setHours(23, 59, 59, 999)
            if (scheduledDate < now) {
              missedSessions++
              userStats.missed++
            } else {
              pendingSessions++
            }
          } else {
            pendingSessions++
          }
        }
        
        // Contar sesiones generadas por IA
        if (session.is_ai_generated) {
          aiGeneratedSessions++
        }
        
        // Calcular duración total planificada
        if (session.start_time && session.end_time) {
          const start = new Date(session.start_time)
          const end = new Date(session.end_time)
          const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
          if (durationMinutes > 0 && durationMinutes < 480) { // Máximo 8 horas
            totalSessionDurationMinutes += durationMinutes
          }
        }
      })
    })

    // Calcular métricas finales
    const averageSessionDuration = totalSessions > 0 
      ? Math.round(totalSessionDurationMinutes / totalSessions) 
      : 0
    const planAdherenceRate = totalSessions > 0 
      ? Math.round((completedSessions / totalSessions) * 100) 
      : 0
    const onTimeRate = completedSessions > 0 
      ? Math.round((onTimeCompletions / completedSessions) * 100) 
      : 0
    const avgSessionsPerUser = usersWithPlans > 0 
      ? Math.round((totalSessions / usersWithPlans) * 10) / 10 
      : 0
    const totalStudyHours = Math.round((completedSessionDurationMinutes / 60) * 10) / 10

    // Top usuarios por adherencia al plan
    const userAdherence = Array.from(sessionsPerUser.entries())
      .filter(([_, stats]) => stats.total > 0)
      .map(([userId, stats]) => ({
        user_id: userId,
        total: stats.total,
        completed: stats.completed,
        missed: stats.missed,
        adherence_rate: Math.round((stats.completed / stats.total) * 100)
      }))
      .sort((a, b) => b.adherence_rate - a.adherence_rate)

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
        distribution: Array.from(typeRolDistribution.entries()).map(([role, count]) => ({ role, count })),
        progress_comparison: Array.from(typeRolProgress.entries()).map(([role, data]) => ({
          role,
          average_progress: data.count > 0 ? Math.round((data.sum / data.count) * 10) / 10 : 0
        })),
        completions: Array.from(typeRolCompletions.entries()).map(([role, count]) => ({ role, total_completed: count })),
        time_spent: Array.from(typeRolTime.entries()).map(([role, data]) => ({
          role,
          average_hours: data.count > 0 ? Math.round((data.sum / 60 / data.count) * 10) / 10 : 0
        }))
      },
      course_metrics: {
        distribution: Array.from(courseDistribution.entries()).map(([status, count]) => ({ status, count })),
        top_by_time: []
      },
      study_planner: {
        users_with_plans: usersWithPlans,
        total_plans: totalPlans,
        total_sessions: totalSessions,
        completed_sessions: completedSessions,
        missed_sessions: missedSessions,
        pending_sessions: pendingSessions,
        in_progress_sessions: inProgressSessions,
        ai_generated_sessions: aiGeneratedSessions,
        sessions_by_status: Array.from(sessionsByStatus.entries()).map(([status, count]) => ({ status, count })),
        usage_rate: totalUsers > 0 ? Math.round((usersWithPlans / totalUsers) * 100) : 0,
        average_session_duration_minutes: averageSessionDuration,
        total_study_hours: totalStudyHours,
        plan_adherence_rate: planAdherenceRate,
        on_time_completion_rate: onTimeRate,
        avg_sessions_per_user: avgSessionsPerUser,
        user_adherence: userAdherence.slice(0, 10) // Top 10 usuarios
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

