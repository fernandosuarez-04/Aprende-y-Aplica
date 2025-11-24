import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/business/teams/[id]/analytics/detailed
 * Obtiene auditoría detallada por usuario de un equipo
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'No tienes una organización asignada'
      }, { status: 403 })
    }

    const { id: teamId } = await params
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')
    const supabase = await createClient()

    // Verificar que el equipo existe
    const { data: team } = await supabase
      .from('work_teams')
      .select('team_id')
      .eq('team_id', teamId)
      .eq('organization_id', auth.organizationId)
      .single()

    if (!team) {
      return NextResponse.json({
        success: false,
        error: 'Equipo no encontrado'
      }, { status: 404 })
    }

    // Obtener miembros del equipo
    const { data: members, error: membersError } = await supabase
      .from('work_team_members')
      .select('user_id, status')
      .eq('team_id', teamId)
      .eq('status', 'active')

    if (membersError) {
      logger.error('Error fetching team members:', membersError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener miembros'
      }, { status: 500 })
    }

    if (!members || members.length === 0) {
      return NextResponse.json({
        success: true,
        users: []
      })
    }

    const memberUserIds = members.map(m => m.user_id)
    const usersAudit = []

    // Obtener información de usuarios
    const { data: usersData } = await supabase
      .from('users')
      .select('id, display_name, first_name, last_name, email, profile_picture_url')
      .in('id', memberUserIds)

    const usersMap = new Map((usersData || []).map(u => [u.id, u]))

    // Para cada miembro, obtener toda su información de auditoría
    for (const member of members) {
      const userId = member.user_id
      const user = usersMap.get(userId)

      if (!user) continue

      // 1. Tiempo por lección
      let lessonIds: string[] = []
      if (courseId) {
        // Obtener módulos del curso
        const { data: modules } = await supabase
          .from('course_modules')
          .select('module_id')
          .eq('course_id', courseId)

        if (modules && modules.length > 0) {
          const moduleIds = modules.map(m => m.module_id)
          // Obtener lecciones de esos módulos
          const { data: lessons } = await supabase
            .from('course_lessons')
            .select('lesson_id, lesson_title')
            .in('module_id', moduleIds)

          if (lessons) {
            lessonIds = lessons.map(l => l.lesson_id)
          }
        }
      }

      let lessonProgressQuery = supabase
        .from('user_lesson_progress')
        .select('lesson_id, time_spent_minutes, lesson_status, current_time_seconds, started_at, last_accessed_at, completed_at')
        .eq('user_id', userId)

      if (courseId && lessonIds.length > 0) {
        lessonProgressQuery = lessonProgressQuery.in('lesson_id', lessonIds)
      }

      const { data: lessonProgress } = await lessonProgressQuery

      // Obtener títulos de lecciones y información del curso
      const progressLessonIds = (lessonProgress || []).map(lp => lp.lesson_id)
      
      if (progressLessonIds.length === 0) {
        // Si no hay lecciones, retornar array vacío
        usersAudit.push({
          user_id: userId,
          user_name: user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
          user_email: user.email,
          profile_picture_url: user.profile_picture_url,
          lesson_time: [],
          lia_interactions: {
            total_conversations: 0,
            total_messages: 0,
            total_duration_seconds: 0,
            messages: []
          },
          chat_activity: {
            total_messages: 0,
            messages: []
          },
          notes: [],
          quiz_attempts: [],
          quiz_summary: {
            total_attempts: 0,
            best_score: 0,
            average_score: 0,
            passed_count: 0
          }
        })
        continue
      }

      const { data: lessonsData } = await supabase
        .from('course_lessons')
        .select('lesson_id, lesson_title, module_id')
        .in('lesson_id', progressLessonIds)

      const moduleIds = [...new Set((lessonsData || []).map((l: any) => l.module_id))]
      
      const { data: modulesData } = await supabase
        .from('course_modules')
        .select('module_id, course_id')
        .in('module_id', moduleIds.length > 0 ? moduleIds : ['00000000-0000-0000-0000-000000000000'])

      const courseIds = [...new Set((modulesData || []).map((m: any) => m.course_id))]
      
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title')
        .in('id', courseIds.length > 0 ? courseIds : ['00000000-0000-0000-0000-000000000000'])

      // Crear mapas para búsqueda rápida
      const modulesMap = new Map((modulesData || []).map((m: any) => [m.module_id, m.course_id]))
      const coursesMap = new Map((coursesData || []).map((c: any) => [c.id, c.title]))
      const lessonsMap = new Map((lessonsData || []).map((l: any) => [l.lesson_id, {
        lesson_title: l.lesson_title,
        module_id: l.module_id,
        course_id: modulesMap.get(l.module_id),
        course_title: coursesMap.get(modulesMap.get(l.module_id) || '') || 'Curso desconocido'
      }]))

      // Agrupar lecciones por curso
      const lessonsByCourse = new Map<string, any[]>()
      
      ;(lessonProgress || []).forEach((lp: any) => {
        const lessonInfo = lessonsMap.get(lp.lesson_id)
        const courseId = lessonInfo?.course_id || 'unknown'
        const courseTitle = lessonInfo?.course_title || 'Curso desconocido'
        
        // Calcular tiempo: usar time_spent_minutes si está disponible, sino calcular desde current_time_seconds o fechas
        let calculatedMinutes = lp.time_spent_minutes || 0
        
        // Si time_spent_minutes es 0, intentar calcular desde current_time_seconds
        if (calculatedMinutes === 0 && lp.current_time_seconds) {
          calculatedMinutes = Math.round(lp.current_time_seconds / 60)
        }
        
        // Si aún es 0, calcular desde started_at y last_accessed_at
        if (calculatedMinutes === 0 && lp.started_at && lp.last_accessed_at) {
          const startTime = new Date(lp.started_at).getTime()
          const lastAccessTime = new Date(lp.last_accessed_at).getTime()
          const diffMinutes = Math.round((lastAccessTime - startTime) / (1000 * 60))
          if (diffMinutes > 0) {
            calculatedMinutes = diffMinutes
          }
        }
        
        // Si está completada y tiene completed_at, usar ese tiempo
        if (calculatedMinutes === 0 && lp.lesson_status === 'completed' && lp.completed_at && lp.started_at) {
          const startTime = new Date(lp.started_at).getTime()
          const completedTime = new Date(lp.completed_at).getTime()
          const diffMinutes = Math.round((completedTime - startTime) / (1000 * 60))
          if (diffMinutes > 0) {
            calculatedMinutes = diffMinutes
          }
        }
        
        if (!lessonsByCourse.has(courseId)) {
          lessonsByCourse.set(courseId, [])
        }
        
        lessonsByCourse.get(courseId)!.push({
          lesson_id: lp.lesson_id,
          lesson_title: lessonInfo?.lesson_title || 'Lección desconocida',
          time_spent_minutes: calculatedMinutes,
          completion_status: lp.lesson_status || 'not_started',
          course_id: courseId,
          course_title: courseTitle
        })
      })

      // Convertir a array agrupado por curso
      const lessonTime = Array.from(lessonsByCourse.entries()).map(([courseId, lessons]) => ({
        course_id: courseId,
        course_title: lessons[0]?.course_title || 'Curso desconocido',
        lessons: lessons
      }))

      // 2. Interacciones con LIA
      // IMPORTANTE: Solo mostrar conversaciones del chat LIA dentro de cursos (context_type='course')
      // Excluir chat general (context_type='general') y otros tipos como 'workshop', 'community', 'news', etc.
      let liaConversationsQuery = supabase
        .from('lia_conversations')
        .select('conversation_id, duration_seconds, total_user_messages, context_type, started_at, created_at')
        .eq('user_id', userId)
        .eq('context_type', 'course') // Solo chat LIA dentro de cursos, no chat general ni prompts

      if (courseId) {
        liaConversationsQuery = liaConversationsQuery.eq('course_id', courseId)
      }

      const { data: liaConversations } = await liaConversationsQuery
      const conversationIds = (liaConversations || []).map(c => c.conversation_id)

      let totalLiaMessages = 0
      let totalDurationSeconds = 0
      const liaMessages = []

      if (conversationIds.length > 0) {
        totalDurationSeconds = (liaConversations || []).reduce((sum, c) => sum + (c.duration_seconds || 0), 0)
        totalLiaMessages = (liaConversations || []).reduce((sum, c) => sum + (c.total_user_messages || 0), 0)

        // Obtener todos los mensajes (tanto del usuario como de LIA) agrupados por conversación
        const { data: allLiaMessages } = await supabase
          .from('lia_messages')
          .select('message_id, content, created_at, conversation_id, role, message_sequence')
          .in('conversation_id', conversationIds)
          .in('role', ['user', 'assistant']) // Solo mensajes del usuario y de LIA
          .order('created_at', { ascending: true }) // Ordenar por fecha ascendente

        // Agrupar mensajes por conversación
        const messagesByConversation = new Map<string, any[]>()
        
        ;(allLiaMessages || []).forEach((m: any) => {
          const convId = m.conversation_id
          if (!messagesByConversation.has(convId)) {
            messagesByConversation.set(convId, [])
          }
          messagesByConversation.get(convId)!.push({
            message_id: m.message_id,
            content: m.content,
            created_at: m.created_at,
            conversation_id: m.conversation_id,
            role: m.role,
            message_sequence: m.message_sequence
          })
        })

        // Obtener información de las conversaciones para ordenarlas por fecha más reciente
        const conversationsWithInfo = (liaConversations || []).map((conv: any) => ({
          conversation_id: conv.conversation_id,
          started_at: conv.started_at || conv.created_at || new Date().toISOString(),
          duration_seconds: conv.duration_seconds || 0,
          messages: messagesByConversation.get(conv.conversation_id) || []
        }))

        // Ordenar conversaciones por fecha más reciente primero
        conversationsWithInfo.sort((a, b) => 
          new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        )

        // Limitar a las últimas 5 conversaciones
        const recentConversations = conversationsWithInfo.slice(0, 5)

        liaMessages.push(...recentConversations.map((conv: any) => ({
          conversation_id: conv.conversation_id,
          started_at: conv.started_at,
          duration_seconds: conv.duration_seconds,
          messages: conv.messages
        })))
      }

      // 3. Actividad en chat del equipo
      let chatMessagesQuery = supabase
        .from('work_team_messages')
        .select('message_id, content, created_at')
        .eq('team_id', teamId)
        .eq('sender_id', userId)

      if (courseId) {
        chatMessagesQuery = chatMessagesQuery.eq('course_id', courseId)
      }

      const { data: chatMessages } = await chatMessagesQuery.order('created_at', { ascending: false }).limit(10)

      // 4. Notas creadas
      let notesQuery = supabase
        .from('user_lesson_notes')
        .select('note_id, note_title, note_content, created_at, lesson_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (courseId && lessonIds.length > 0) {
        notesQuery = notesQuery.in('lesson_id', lessonIds)
      }

      const { data: notes } = await notesQuery.limit(20)

      // Obtener títulos de lecciones para las notas
      const noteLessonIds = (notes || []).map(n => n.lesson_id)
      const { data: noteLessonsData } = await supabase
        .from('course_lessons')
        .select('lesson_id, lesson_title')
        .in('lesson_id', noteLessonIds.length > 0 ? noteLessonIds : ['00000000-0000-0000-0000-000000000000'])

      const noteLessonsMap = new Map((noteLessonsData || []).map(l => [l.lesson_id, l.lesson_title]))

      // 5. Intentos de quiz - Obtener TODOS los intentos sin límite
      let quizQuery = supabase
        .from('user_quiz_submissions')
        .select('submission_id, score, percentage_score, is_passed, completed_at, lesson_id, created_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })

      if (courseId && lessonIds.length > 0) {
        quizQuery = quizQuery.in('lesson_id', lessonIds)
      }

      // Obtener todos los intentos sin límite
      const { data: quizAttempts } = await quizQuery

      // Obtener títulos de lecciones para los quiz
      const quizLessonIds = (quizAttempts || []).map(q => q.lesson_id)
      const { data: quizLessonsData } = await supabase
        .from('course_lessons')
        .select('lesson_id, lesson_title')
        .in('lesson_id', quizLessonIds.length > 0 ? quizLessonIds : ['00000000-0000-0000-0000-000000000000'])

      const quizLessonsMap = new Map((quizLessonsData || []).map(l => [l.lesson_id, l.lesson_title]))

      // Agrupar intentos por lección para contar intentos por lección
      const attemptsByLesson = new Map<string, any[]>()
      ;(quizAttempts || []).forEach((q: any) => {
        const lessonId = q.lesson_id
        if (!attemptsByLesson.has(lessonId)) {
          attemptsByLesson.set(lessonId, [])
        }
        attemptsByLesson.get(lessonId)!.push(q)
      })

      // Calcular número de intento para cada quiz (1, 2, 3, etc. por lección)
      const quizAttemptsWithNumber = (quizAttempts || []).map((q: any) => {
        const lessonAttempts = attemptsByLesson.get(q.lesson_id) || []
        // Ordenar intentos de esta lección por fecha (más antiguo primero)
        const sortedAttempts = [...lessonAttempts].sort((a, b) => 
          new Date(a.created_at || a.completed_at).getTime() - new Date(b.created_at || b.completed_at).getTime()
        )
        const attemptNumber = sortedAttempts.findIndex(a => a.submission_id === q.submission_id) + 1
        const totalAttemptsForLesson = lessonAttempts.length

        return {
          ...q,
          attempt_number: attemptNumber,
          total_attempts_for_lesson: totalAttemptsForLesson
        }
      })

      // Calcular resumen de quiz
      const quizSummary = {
        total_attempts: quizAttempts?.length || 0,
        best_score: quizAttempts && quizAttempts.length > 0
          ? Math.max(...quizAttempts.map((q: any) => q.percentage_score || 0))
          : 0,
        average_score: quizAttempts && quizAttempts.length > 0
          ? quizAttempts.reduce((sum: number, q: any) => sum + (q.percentage_score || 0), 0) / quizAttempts.length
          : 0,
        passed_count: quizAttempts?.filter((q: any) => q.is_passed).length || 0
      }

      usersAudit.push({
        user_id: userId,
        user_name: user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        user_email: user.email,
        profile_picture_url: user.profile_picture_url,
        lesson_time: lessonTime,
        lia_interactions: {
          total_conversations: liaConversations?.length || 0,
          total_messages: totalLiaMessages,
          total_duration_seconds: totalDurationSeconds,
          conversations: liaMessages || [] // Asegurar que siempre sea un array
        },
        chat_activity: {
          total_messages: chatMessages?.length || 0,
          messages: (chatMessages || []).map((m: any) => ({
            message_id: m.message_id,
            content: m.content,
            created_at: m.created_at
          }))
        },
        notes: (notes || []).map((n: any) => ({
          note_id: n.note_id,
          note_title: n.note_title,
          note_content: n.note_content,
          lesson_title: noteLessonsMap.get(n.lesson_id) || 'Lección desconocida',
          created_at: n.created_at
        })),
        quiz_attempts: quizAttemptsWithNumber.map((q: any) => ({
          submission_id: q.submission_id,
          lesson_title: quizLessonsMap.get(q.lesson_id) || 'Lección desconocida',
          lesson_id: q.lesson_id,
          score: q.score || 0,
          percentage_score: q.percentage_score || 0,
          is_passed: q.is_passed || false,
          completed_at: q.completed_at || q.created_at,
          attempt_number: q.attempt_number || 1,
          total_attempts_for_lesson: q.total_attempts_for_lesson || 1
        })),
        quiz_summary: quizSummary
      })
    }

    return NextResponse.json({
      success: true,
      users: usersAudit
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/teams/[id]/analytics/detailed GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

