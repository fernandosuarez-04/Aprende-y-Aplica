import { NextRequest, NextResponse } from 'next/server'
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
  source?: 'direct'
}

interface RouteContext {
  params: Promise<{ orgSlug: string }>
}

/**
 * GET /api/[orgSlug]/business-user/dashboard
 *
 * Organization-scoped dashboard API.
 * This endpoint uses the orgSlug from the URL to ensure proper data isolation.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Get organization slug from URL params
    const { orgSlug } = await context.params

    if (!orgSlug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Organization slug is required'
        },
        { status: 400 }
      )
    }

    // CRITICAL: Pass organizationSlug to requireBusinessUser for proper data isolation
    const auth = await requireBusinessUser({ organizationSlug: orgSlug })
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
    const { userId, organizationId } = auth

    if (!organizationId) {
      logger.error('No organizationId in auth object for user:', userId)
      return NextResponse.json(
        {
          success: false,
          error: 'Error de contexto de organización'
        },
        { status: 400 }
      )
    }

    logger.log('📊 Fetching dashboard data for user:', userId, 'org:', organizationId, 'slug:', orgSlug)

    // =====================================================
    // 🚀 OPTIMIZACIÓN: FASE 1 - Consultas paralelas iniciales
    // =====================================================
    const [
      { data: directAssignments, error: directAssignmentsError },
      { data: certificates, error: certificatesError }
    ] = await Promise.all([
      // PASO 1: Obtener asignaciones directas al usuario (límite 100)
      // 🔒 SEGURIDAD: Filtrar por organization_id
      supabase
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
        .eq('organization_id', organizationId) // ✅ FILTRO CRÍTICO
        .in('status', ['assigned', 'in_progress', 'completed'])
        .order('assigned_at', { ascending: false })
        .limit(100),

      // PASO 2: Obtener certificados (en paralelo, límite 100)
      supabase
        .from('user_course_certificates')
        .select('certificate_id, course_id')
        .eq('user_id', userId)
        .limit(100)
    ])

    if (directAssignmentsError) {
      logger.error('❌ Error fetching direct assignments:', directAssignmentsError)
    }
    if (certificatesError) {
      logger.error('❌ Error fetching certificates:', certificatesError)
    }

    let enrollmentsMap = new Map<string, any>()
    const instructorMap = new Map()

    // Preparar IDs de cursos de asignaciones directas
    const directCourseIds = new Set<string>()
    const combinedAssignments: any[] = []

    for (const assignment of (directAssignments || [])) {
      if (assignment.courses) {
        directCourseIds.add(assignment.course_id)
        combinedAssignments.push({
          ...assignment,
          source: 'direct'
        })
      }
    }

    const courseIds = Array.from(directCourseIds)

    // =====================================================
    // 🚀 OPTIMIZACIÓN: FASE 3 - Enrollments e instructores en paralelo
    // =====================================================
    const instructorIds = [...new Set(combinedAssignments
      .map((a: any) => a.courses?.instructor_id)
      .filter(Boolean))]

    const [
      { data: enrollments, error: enrollmentsError },
      { data: instructors }
    ] = await Promise.all([
      // Enrollments (límite 100)
      courseIds.length > 0
        ? supabase
            .from('user_course_enrollments')
            .select('enrollment_id, course_id, overall_progress_percentage, enrollment_status, completed_at')
            .eq('user_id', userId)
            .in('course_id', courseIds)
            .limit(100)
        : Promise.resolve({ data: [], error: null }),

      // Instructores
      instructorIds.length > 0
        ? supabase
            .from('users')
            .select('id, first_name, last_name, username')
            .in('id', instructorIds)
        : Promise.resolve({ data: [] })
    ])

    if (!enrollmentsError && enrollments) {
      enrollments.forEach((enrollment: any) => {
        enrollmentsMap.set(enrollment.course_id, enrollment)
      })
    } else if (enrollmentsError) {
      logger.error('❌ Error fetching enrollments:', enrollmentsError)
    }

    if (instructors) {
      instructors.forEach((instructor: any) => {
        const fullName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim()
        instructorMap.set(instructor.id, {
          name: fullName || instructor.username || 'Instructor'
        })
      })
    }

    // Crear mapa de certificados
    const certificatesMap = new Map<string, boolean>()
    certificates?.forEach((cert: any) => {
      certificatesMap.set(cert.course_id, true)
    })

    // =====================================================
    // Calcular estadísticas y transformar datos
    // =====================================================
    const totalAssigned = combinedAssignments.length

    const inProgress = combinedAssignments.filter(a => {
      const enrollment = enrollmentsMap.get(a.course_id)
      const progress = enrollment?.overall_progress_percentage || a.completion_percentage || 0
      return progress > 0 && progress < 100
    }).length

    const completed = combinedAssignments.filter(a => {
      const enrollment = enrollmentsMap.get(a.course_id)
      const progress = enrollment?.overall_progress_percentage || a.completion_percentage || 0
      return progress >= 100 || a.status === 'completed' || enrollment?.enrollment_status === 'completed'
    }).length

    const certificatesCount = certificates?.length || 0

    const stats: DashboardStats = {
      total_assigned: totalAssigned,
      in_progress: inProgress,
      completed: completed,
      certificates: certificatesCount
    }

    // Transformar asignaciones a formato de cursos
    const courses: AssignedCourse[] = combinedAssignments
      .filter((assignment: any) => assignment.courses)
      .map((assignment: any) => {
        const course = assignment.courses
        const instructor = course?.instructor_id ? instructorMap.get(course.instructor_id) : null
        const enrollment = enrollmentsMap.get(assignment.course_id)

        const actualProgress = enrollment?.overall_progress_percentage !== null && enrollment?.overall_progress_percentage !== undefined
          ? Number(enrollment.overall_progress_percentage)
          : (assignment.completion_percentage ? Number(assignment.completion_percentage) : 0)

        const actualCompletedAt = enrollment?.completed_at || assignment.completed_at
        const instructorName = instructor?.name || 'Instructor'

        let status: 'Asignado' | 'En progreso' | 'Completado' = 'Asignado'
        if (actualProgress >= 100 || assignment.status === 'completed' || enrollment?.enrollment_status === 'completed') {
          status = 'Completado'
        } else if (actualProgress > 0 || assignment.status === 'in_progress' || enrollment?.enrollment_status === 'active') {
          status = 'En progreso'
        }

        let thumbnail = course?.thumbnail_url || '📚'
        if (!course?.thumbnail_url) {
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
          progress: Math.round(actualProgress * 100) / 100,
          status: status,
          thumbnail: thumbnail,
          slug: course?.slug || '',
          assigned_at: assignment.assigned_at,
          due_date: assignment.due_date || undefined,
          completed_at: actualCompletedAt || undefined,
          has_certificate: certificatesMap.has(assignment.course_id) || false,
          source: assignment.source
        }
      })

    logger.log('✅ Dashboard data prepared:', {
      stats,
      coursesCount: courses.length,
      orgSlug
    })

    return NextResponse.json({
      success: true,
      stats: stats,
      courses: courses
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60'
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/[orgSlug]/business-user/dashboard:', error)
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

