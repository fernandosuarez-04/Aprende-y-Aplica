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

    // Obtener progreso por lección con información detallada
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
        quiz_progress_percentage,
        quiz_completed,
        quiz_passed,
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

    // Obtener información de lecciones por separado para evitar problemas con relaciones anidadas
    const lessonIds = lessonProgress?.map(p => p.lesson_id).filter(Boolean) || []
    let lessonsData: any[] = []
    if (lessonIds.length > 0) {
      const { data: lessons, error: lessonsError } = await supabase
        .from('course_lessons')
        .select(`
          lesson_id,
          lesson_title,
          module_id,
          course_modules (
            module_id,
            module_title,
            module_order_index
          )
        `)
        .in('lesson_id', lessonIds)

      if (lessonsError) {
        logger.error('Error fetching lessons:', lessonsError)
      } else {
        lessonsData = lessons || []
      }
    }

    // Combinar progreso con información de lecciones
    const enrichedLessonProgress = (lessonProgress || []).map(progress => {
      const lessonInfo = lessonsData.find(l => l.lesson_id === progress.lesson_id)
      return {
        ...progress,
        course_lessons: lessonInfo || null
      }
    })

    // Obtener módulos del curso con progreso
    const enrollmentIds = enrollments?.map(e => e.enrollment_id).filter(Boolean) || []
    const courseIds = enrollments?.map(e => e.course_id).filter(Boolean) || []
    
    // Obtener módulos de los cursos
    const { data: courseModules, error: modulesError } = await supabase
      .from('course_modules')
      .select(`
        module_id,
        module_title,
        module_order_index,
        course_id
      `)
      .in('course_id', courseIds)
      .order('module_order_index', { ascending: true })

    if (modulesError) {
      logger.error('Error fetching course modules:', modulesError)
    }

    // Obtener actividades completadas
    const { data: activityCompletions, error: activityError } = await supabase
      .from('lia_activity_completions')
      .select(`
        completion_id,
        activity_id,
        status,
        completed_steps,
        total_steps,
        completed_at,
        lesson_activities (
          activity_id,
          activity_title,
          activity_type,
          lesson_id,
          course_lessons (
            lesson_id,
            module_id,
            course_modules (
              module_id,
              course_id
            )
          )
        )
      `)
      .eq('user_id', userId)

    if (activityError) {
      logger.error('Error fetching activity completions:', activityError)
    }

    // Obtener materiales/lecturas vistos
    // Nota: No hay una tabla específica para materiales vistos, pero podemos inferir del progreso de lecciones
    // Obtener notas (que indican lectura/interacción)
    const { data: lessonNotes, error: notesError } = await supabase
      .from('user_lesson_notes')
      .select(`
        note_id,
        lesson_id,
        course_lessons (
          lesson_id,
          module_id,
          course_modules (
            module_id,
            course_id
          )
        )
      `)
      .eq('user_id', userId)

    if (notesError) {
      logger.error('Error fetching lesson notes:', notesError)
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

    // Obtener notas (ya obtenidas arriba como lessonNotes, no necesitamos duplicar)

    // Obtener conversaciones con LIA
    const { data: liaConversations, error: liaConversationsError } = await supabase
      .from('lia_conversations')
      .select(`
        conversation_id,
        course_id,
        lesson_id,
        started_at,
        ended_at,
        total_messages,
        conversation_completed
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false })

    if (liaConversationsError) {
      logger.error('Error fetching LIA conversations:', liaConversationsError)
    }

    // Obtener mensajes de LIA (solo si hay conversaciones)
    let liaMessages: any[] = []
    if (liaConversations && liaConversations.length > 0) {
      const conversationIds = liaConversations.map(c => c.conversation_id).filter(Boolean)
      if (conversationIds.length > 0) {
        const { data: messages, error: liaMessagesError } = await supabase
          .from('lia_messages')
          .select('message_id, conversation_id, role, created_at')
          .in('conversation_id', conversationIds)

        if (liaMessagesError) {
          logger.error('Error fetching LIA messages:', liaMessagesError)
        } else {
          liaMessages = messages || []
        }
      }
    }

    // Obtener quiz submissions
    const { data: quizSubmissions, error: quizSubmissionsError } = await supabase
      .from('user_quiz_submissions')
      .select(`
        submission_id,
        score,
        total_points,
        percentage_score,
        is_passed,
        completed_at,
        created_at,
        lesson_id,
        enrollment_id,
        user_course_enrollments!inner(course_id)
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })

    if (quizSubmissionsError) {
      logger.error('Error fetching quiz submissions:', quizSubmissionsError)
    }

    // Obtener actividades completadas con LIA
    const { data: liaActivityCompletions, error: liaActivityCompletionsError } = await supabase
      .from('lia_activity_completions')
      .select(`
        completion_id,
        activity_id,
        status,
        completed_steps,
        total_steps,
        time_to_complete_seconds,
        attempts_to_complete,
        completed_at,
        lesson_activities(lesson_id, course_lessons(module_id, course_modules(course_id)))
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })

    if (liaActivityCompletionsError) {
      logger.error('Error fetching LIA activity completions:', liaActivityCompletionsError)
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
    const totalTimeSpent = enrichedLessonProgress?.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0) || 0

    // Calcular lecciones completadas
    const completedLessons = enrichedLessonProgress?.filter(p => p.is_completed).length || 0
    const totalLessons = enrichedLessonProgress?.length || 0

    // Calcular estadísticas por curso
    const courseStatsMap = new Map()
    
    // Inicializar mapa con enrollments
    ;(enrollments || []).forEach(e => {
      courseStatsMap.set(e.course_id, {
        course_id: e.course_id,
        course_title: e.courses?.title || 'Curso desconocido',
        progress: Number(e.overall_progress_percentage) || 0,
        status: e.enrollment_status,
        enrolled_at: e.enrolled_at,
        completed_at: e.completed_at,
        has_certificate: enrichedCertificates?.some(c => c.course_id === e.course_id) || false,
        lia_conversations_count: 0,
        lia_messages_count: 0,
        lia_avg_duration_minutes: 0,
        lia_last_conversation: null,
        quiz_total: 0,
        quiz_passed: 0,
        quiz_failed: 0,
        quiz_average_score: 0,
        quiz_best_score: 0,
        quiz_total_attempts: 0,
        lia_activities_completed: 0,
        notes_count: 0,
        time_spent_minutes: 0,
        // Nuevos campos para información detallada
        modules_total: 0,
        modules_completed: 0,
        lessons_total: 0,
        lessons_completed: 0,
        lessons_in_progress: 0,
        activities_completed: 0,
        activities_total: 0,
        readings_viewed: 0,
        quiz_lessons_completed: 0
      })
    })

    // Agregar estadísticas de LIA por curso
    const liaByCourse = new Map()
    ;(liaConversations || []).forEach(conv => {
      if (conv.course_id && courseStatsMap.has(conv.course_id)) {
        const stats = courseStatsMap.get(conv.course_id)
        stats.lia_conversations_count++
        stats.lia_messages_count += conv.total_messages || 0
        
        // Calcular duración promedio
        if (!liaByCourse.has(conv.course_id)) {
          liaByCourse.set(conv.course_id, { durations: [], lastDate: null })
        }
        const liaStats = liaByCourse.get(conv.course_id)
        
        if (conv.started_at && conv.ended_at) {
          const start = new Date(conv.started_at)
          const end = new Date(conv.ended_at)
          const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
          liaStats.durations.push(durationMinutes)
        }
        
        // Última conversación
        if (conv.started_at) {
          const convDate = new Date(conv.started_at)
          if (!liaStats.lastDate || convDate > liaStats.lastDate) {
            liaStats.lastDate = convDate
            stats.lia_last_conversation = conv.started_at
          }
        }
      }
    })

    // Calcular promedio de duración de LIA por curso
    liaByCourse.forEach((stats, courseId) => {
      if (courseStatsMap.has(courseId) && stats.durations.length > 0) {
        const avgDuration = stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length
        courseStatsMap.get(courseId).lia_avg_duration_minutes = Math.round(avgDuration * 10) / 10
      }
    })

    // Agregar estadísticas de quiz por curso
    const quizByCourse = new Map()
    ;(quizSubmissions || []).forEach(quiz => {
      const courseId = quiz.user_course_enrollments?.course_id
      if (courseId && courseStatsMap.has(courseId)) {
        if (!quizByCourse.has(courseId)) {
          quizByCourse.set(courseId, { total: 0, passed: 0, failed: 0, scores: [], attempts: 0 })
        }
        const quizStats = quizByCourse.get(courseId)
        quizStats.total++
        quizStats.attempts++
        if (quiz.is_passed) {
          quizStats.passed++
        } else {
          quizStats.failed++
        }
        if (quiz.percentage_score) {
          quizStats.scores.push(Number(quiz.percentage_score))
        }
      }
    })

    quizByCourse.forEach((stats, courseId) => {
      if (courseStatsMap.has(courseId)) {
        const courseStats = courseStatsMap.get(courseId)
        courseStats.quiz_total = stats.total
        courseStats.quiz_passed = stats.passed
        courseStats.quiz_failed = stats.failed
        courseStats.quiz_total_attempts = stats.attempts
        if (stats.scores.length > 0) {
          courseStats.quiz_average_score = Math.round((stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length) * 10) / 10
          courseStats.quiz_best_score = Math.max(...stats.scores)
        }
      }
    })

    // Agregar estadísticas de actividades LIA por curso
    ;(liaActivityCompletions || []).forEach(activity => {
      const courseId = activity.lesson_activities?.course_lessons?.course_modules?.course_id
      if (courseId && courseStatsMap.has(courseId)) {
        const stats = courseStatsMap.get(courseId)
        if (activity.status === 'completed') {
          stats.lia_activities_completed++
        }
      }
    })

    // Agregar notas por curso (usando lessonNotes obtenido arriba)
    ;(lessonNotes || []).forEach(note => {
      const courseId = note.course_lessons?.course_modules?.course_id
      if (courseId && courseStatsMap.has(courseId)) {
        const stats = courseStatsMap.get(courseId)
        stats.notes_count++
      } else if (note.lesson_id) {
        // Si no tenemos el course_id directamente, buscar a través de lesson_id
        const lessonProgressItem = enrichedLessonProgress?.find(lp => lp.lesson_id === note.lesson_id)
        if (lessonProgressItem) {
          const courseId = lessonProgressItem.user_course_enrollments?.course_id
          if (courseId && courseStatsMap.has(courseId)) {
            const stats = courseStatsMap.get(courseId)
            stats.notes_count++
          }
        }
      }
    })

    // Agregar tiempo y estadísticas de lecciones por curso
    const lessonsByCourse = new Map()
    ;(enrichedLessonProgress || []).forEach(progress => {
      const courseId = progress.user_course_enrollments?.course_id
      if (courseId && courseStatsMap.has(courseId)) {
        const stats = courseStatsMap.get(courseId)
        stats.time_spent_minutes += progress.time_spent_minutes || 0
        
        // Contar lecciones
        if (!lessonsByCourse.has(courseId)) {
          lessonsByCourse.set(courseId, { total: 0, completed: 0, in_progress: 0, quiz_completed: 0 })
        }
        const lessonStats = lessonsByCourse.get(courseId)
        lessonStats.total++
        if (progress.is_completed) {
          lessonStats.completed++
        } else if (progress.lesson_status === 'in_progress' || progress.started_at) {
          lessonStats.in_progress++
        }
        if (progress.quiz_completed && progress.quiz_passed) {
          lessonStats.quiz_completed++
        }
      }
    })

    // Actualizar estadísticas de lecciones
    lessonsByCourse.forEach((stats, courseId) => {
      if (courseStatsMap.has(courseId)) {
        const courseStats = courseStatsMap.get(courseId)
        courseStats.lessons_total = stats.total
        courseStats.lessons_completed = stats.completed
        courseStats.lessons_in_progress = stats.in_progress
        courseStats.quiz_lessons_completed = stats.quiz_completed
      }
    })

    // Agregar estadísticas de módulos por curso
    const modulesByCourse = new Map()
    ;(courseModules || []).forEach(module => {
      if (module.course_id && courseStatsMap.has(module.course_id)) {
        if (!modulesByCourse.has(module.course_id)) {
          modulesByCourse.set(module.course_id, { total: 0, completedModules: new Set() })
        }
        modulesByCourse.get(module.course_id).total++
      }
    })

    // Calcular módulos completados basado en lecciones completadas
    ;(enrichedLessonProgress || []).forEach(progress => {
      const courseId = progress.user_course_enrollments?.course_id
      const moduleId = progress.course_lessons?.module_id
      if (courseId && moduleId && courseStatsMap.has(courseId)) {
        if (!modulesByCourse.has(courseId)) {
          modulesByCourse.set(courseId, { total: 0, completedModules: new Set() })
        }
        const moduleStats = modulesByCourse.get(courseId)
        if (progress.is_completed) {
          moduleStats.completedModules.add(moduleId)
        }
      }
    })

    modulesByCourse.forEach((stats, courseId) => {
      if (courseStatsMap.has(courseId)) {
        const courseStats = courseStatsMap.get(courseId)
        courseStats.modules_total = stats.total
        courseStats.modules_completed = stats.completedModules.size
      }
    })

    // Agregar estadísticas de actividades por curso
    ;(activityCompletions || []).forEach(activity => {
      const courseId = activity.lesson_activities?.course_lessons?.course_modules?.course_id
      if (courseId && courseStatsMap.has(courseId)) {
        const stats = courseStatsMap.get(courseId)
        stats.activities_total++
        if (activity.status === 'completed') {
          stats.activities_completed++
        }
      }
    })

    // Agregar lecturas/materiales vistos (basado en notas)
    ;(lessonNotes || []).forEach(note => {
      const courseId = note.course_lessons?.course_modules?.course_id
      if (courseId && courseStatsMap.has(courseId)) {
        const stats = courseStatsMap.get(courseId)
        stats.readings_viewed++
      }
    })

    // Preparar datos para gráficas
    const coursesData = Array.from(courseStatsMap.values())

    // Calcular tiempo por curso
    const timeByCourse = (enrichedLessonProgress || []).reduce((acc: any, p: any) => {
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
        notes_count: lessonNotes?.length || 0,
        
        // Asignaciones
        total_assignments: assignments?.length || 0,
        completed_assignments: assignments?.filter(a => a.status === 'completed').length || 0,
        
        // LIA
        lia_conversations_total: liaConversations?.length || 0,
        lia_messages_total: liaMessages.length || 0,
        
        // Quiz
        quiz_total: quizSubmissions?.length || 0,
        quiz_passed: quizSubmissions?.filter(q => q.is_passed).length || 0,
        quiz_failed: quizSubmissions?.filter(q => !q.is_passed).length || 0,
        quiz_average_score: quizSubmissions && quizSubmissions.length > 0
          ? Math.round((quizSubmissions.reduce((sum, q) => sum + (Number(q.percentage_score) || 0), 0) / quizSubmissions.length) * 10) / 10
          : 0,
        
        // Actividades LIA
        lia_activities_completed: liaActivityCompletions?.filter(a => a.status === 'completed').length || 0,
        lia_activities_total: liaActivityCompletions?.length || 0,
        
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
  } catch (error: any) {
    logger.error('💥 Error in /api/business/users/[userId]/stats:', error)
    
    // Asegurar que siempre devolvemos JSON, nunca HTML
    const errorMessage = error?.message || 'Error al obtener estadísticas del usuario'
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

