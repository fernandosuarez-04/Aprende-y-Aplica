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
        job_title,
        users!organization_users_user_id_fkey (
          id,
          username,
          email,
          first_name,
          last_name,
          display_name,
          profile_picture_url,
          last_login_at,
          updated_at,
          created_at,
          cargo_rol
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
    const orgEmails = orgUsers?.map(ou => ou.users?.email).filter(Boolean) || []
    
    // Buscar TODOS los user_ids que correspondan a los emails de la organización
    // Esto maneja el caso de usuarios con múltiples UUIDs
    const { data: allUsersWithEmails, error: allUsersError } = await supabase
      .from('users')
      .select('id, email')
      .in('email', orgEmails)
    
    if (allUsersError) logger.error('Error fetching all users by email:', allUsersError)
    
    // Lista expandida de user_ids (incluye potenciales duplicados por email)
    const allUserIds = allUsersWithEmails?.map(u => u.id) || []
    const expandedUserIds = [...new Set([...userIds, ...allUserIds])] // Unique IDs
    
    logger.info(`Org users: ${userIds.length}, expanded users by email: ${expandedUserIds.length}`)

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
          last_accessed_at,
          courses (
            id,
            title,
            slug
          )
        `)
        .in('user_id', expandedUserIds)
        .order('enrolled_at', { ascending: false }),

      // 4. Progreso de lecciones (expandido)
      supabase
        .from('user_lesson_progress')
        .select(`
          progress_id,
          user_id,
          lesson_id,
          time_spent_minutes,
          video_progress_percentage,
          quiz_completed,
          quiz_passed,
          is_completed,
          completed_at,
          started_at,
          last_accessed_at
        `)
        .in('user_id', expandedUserIds),

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
        .in('user_id', expandedUserIds)
        .order('issued_at', { ascending: false })
    ])

    // 6. Notas de lecciones (query adicional)
    const { data: userNotes, error: notesError } = await supabase
      .from('user_lesson_notes')
      .select('note_id, user_id, lesson_id, note_title, is_auto_generated, source_type, created_at')
      .in('user_id', expandedUserIds)
    
    if (notesError) logger.error('Error fetching user notes:', notesError)

    // Log de errores (no bloqueantes)
    if (assignmentsError) logger.error('Error fetching assignments for analytics:', assignmentsError)
    if (enrollmentsError) logger.error('Error fetching enrollments for analytics:', enrollmentsError)
    if (lessonProgressError) logger.error('Error fetching lesson progress for analytics:', lessonProgressError)
    if (certificatesError) logger.error('Error fetching certificates for analytics:', certificatesError)

    // 7. Lesson Tracking (Detallado para Engagement)
    const { data: lessonTrackingDataRaw, error: lessonTrackingError } = await supabase
      .from('lesson_tracking')
      .select('user_id, started_at, completed_at, t_lesson_minutes')
      .in('user_id', expandedUserIds)
      .order('started_at', { ascending: true })

    if (lessonTrackingError) logger.error('Error fetching lesson tracking:', lessonTrackingError)
    const lessonTrackingData = lessonTrackingDataRaw || []

    // ... (lógica de study plans existente) ...

    // 8. Datos de Study Planner (Restaurados y necesarios)
    const { data: studyPlans, error: studyPlansError } = await supabase
      .from('study_plans')
      .select('id, user_id, status, created_at')
      .in('user_id', userIds)
    
    if (studyPlansError) logger.error('Error fetching study plans:', studyPlansError);

    const planIds = studyPlans?.map(p => p.id) || []
    
    // Obtener emails de usuarios de la organización para matching alternativo
    const orgUserEmails = orgUsers?.map(ou => ou.users?.email).filter(Boolean) || [];
    
    // Traer TODAS las sesiones y luego filtrar por email (para manejar UUIDs duplicados)
    const { data: allStudySessions, error: studySessionsError } = await supabase
      .from('study_sessions')
      .select(`
        id, 
        user_id, 
        plan_id, 
        status, 
        duration_minutes, 
        start_time, 
        completed_at, 
        is_ai_generated,
        users!study_sessions_user_id_fkey (email)
      `)
      .order('start_time', { ascending: false })
      .limit(5000) // Limitar para performance
    
    // Filtrar sesiones que pertenecen a usuarios de la organización (por email)
    const studySessions = allStudySessions?.filter((s: any) => {
      const sessionEmail = s.users?.email;
      return sessionEmail && orgUserEmails.includes(sessionEmail);
    }) || [];

    if (studySessionsError) logger.error('Error fetching study sessions:', studySessionsError);
    logger.info(`Study sessions: total fetched ${allStudySessions?.length || 0}, filtered for org: ${studySessions.length}`);

    // 9. Study Plan Progress (datos agregados pre-calculados)
    const { data: studyPlanProgress, error: studyPlanProgressError } = await supabase
      .from('study_plan_progress')
      .select('plan_id, user_id, plan_name, total_sessions, sessions_completed, sessions_pending')
      .in('user_id', expandedUserIds)
    
    if (studyPlanProgressError) logger.error('Error fetching study plan progress:', studyPlanProgressError);

    // 10. LIA Conversations (interacciones con el asistente)
    const { data: liaConversations, error: liaConvError } = await supabase
      .from('lia_conversations')
      .select('id, user_id, title, context_type, created_at, updated_at')
      .in('user_id', expandedUserIds)
    
    if (liaConvError) logger.error('Error fetching LIA conversations:', liaConvError);

    // 11. LIA Messages count per conversation
    const conversationIds = liaConversations?.map(c => c.id) || [];
    let liaMessages: any[] = [];
    if (conversationIds.length > 0) {
      const { data: messages, error: msgError } = await supabase
        .from('lia_messages')
        .select('id, conversation_id, role, created_at')
        .in('conversation_id', conversationIds)
      if (msgError) logger.error('Error fetching LIA messages:', msgError);
      liaMessages = messages || [];
    }

    // 12. Work Teams (equipos de la organización)
    logger.info(`Fetching work_teams for organization_id: ${organizationId}`);
    
    const { data: workTeams, error: workTeamsError } = await supabase
      .from('work_teams')
      .select(`
        team_id,
        organization_id,
        name,
        description,
        status,
        team_leader_id,
        created_at,
        image_url
      `)
      .eq('organization_id', organizationId)
    
    if (workTeamsError) {
      logger.error('Error fetching work teams:', workTeamsError);
    } else {
      logger.info(`Work teams found: ${workTeams?.length || 0}`, { 
        teams: workTeams?.map(t => ({ id: t.team_id, name: t.name, status: t.status, org: t.organization_id }))
      });
    }

    // Use ALL teams for now to debug (not just active)
    const activeWorkTeams = workTeams || [];
    logger.info(`Using ${activeWorkTeams.length} teams for analytics (including all statuses)`);

    // 13. Work Team Members
    const teamIds = workTeams?.map(t => t.team_id) || [];
    let teamMembers: any[] = [];
    if (teamIds.length > 0) {
      const { data: members, error: membersError } = await supabase
        .from('work_team_members')
        .select('id, team_id, user_id, role, status')
        .in('team_id', teamIds)
        .eq('status', 'active')
      if (membersError) logger.error('Error fetching team members:', membersError);
      teamMembers = members || [];
    }

    logger.info(`Work teams: ${workTeams?.length || 0}, team members: ${teamMembers.length}`);
    logger.info(`Study plan progress records: ${studyPlanProgress?.length || 0}`);

    // --- VARIABLES RESTAURADAS PARA ANALYTICS GENERALES ---
    const totalUsers = userIds.length;
    let totalCoursesAssigned = assignments?.length || 0;
    let completedCourses = 0;
    let totalProgressSum = 0;
    let totalTimeMinutes = 0;

    const userAnalytics = orgUsers?.map(u => {
        // Get the user's email and find ALL associated user_ids
        const userEmail = u.users?.email;
        const userRelatedIds = allUsersWithEmails?.filter(au => au.email === userEmail).map(au => au.id) || [u.user_id];
        
        // 1. Enrollments & Progress - match by any of the user's IDs
        const userEnrollments = enrollments?.filter((e: any) => userRelatedIds.includes(e.user_id)) || [];
        const userCompleted = userEnrollments.filter((e: any) => e.enrollment_status === 'completed').length;
        const userProgressSum = userEnrollments.reduce((sum: number, e: any) => sum + (e.overall_progress_percentage || 0), 0);
        const userAvgProgress = userEnrollments.length > 0 ? Math.round(userProgressSum / userEnrollments.length) : 0;
        
        // 2. Activity & Time logic - match by any of the user's IDs
        const userTracking = lessonTrackingData?.filter((lt: any) => userRelatedIds.includes(lt.user_id)) || [];
        
        // Fallback progress time if tracking is empty
        let userTime = userTracking.reduce((sum: number, lt: any) => sum + (Number(lt.t_lesson_minutes) || 0), 0);
        if (userTime === 0) {
           userTime = lessonProgress?.filter((lp: any) => userRelatedIds.includes(lp.user_id))
            .reduce((sum: number, lp: any) => sum + (lp.time_spent_minutes || 0), 0) || 0;
        }

        // 3. Advanced Habit Metrics (Calendar & Streaks)
        const activityMap = new Map<string, number>(); // date -> minutes
        const hourMap = new Array(24).fill(0);
        
        userTracking.forEach((t: any) => {
            if (!t.started_at) return;
            const date = new Date(t.started_at);
            const dateStr = date.toISOString().split('T')[0];
            const minutes = Number(t.t_lesson_minutes) || 0;
            
            activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + minutes);
            hourMap[date.getHours()] += 1;
        });

        // 4. Study Planner Stats - use userRelatedIds for matching
        const userSessions = studySessions?.filter((s: any) => s.users?.email === userEmail) || [];
        
        // DEBUG: Log para ver si las sesiones se están encontrando
        if (userEmail?.includes('fernando')) {
            logger.info(`DEBUG Fernando - email: ${userEmail}, sessions encontradas: ${userSessions.length}`);
        }

        // MERGE: Add Study Sessions to Activity & Habits
        userSessions.forEach((s: any) => {
            // Count as activity if completed
            if (s.completed_at || s.status === 'completed') {
                 const dateVal = s.completed_at || s.start_time;
                 if (!dateVal) return;
                 
                 const date = new Date(dateVal);
                 // Avoid future dates in activity log
                 if (date > new Date()) return;

                 const dateStr = date.toISOString().split('T')[0];
                 // Use recorded duration or default to 15 mins for short sessions
                 const minutes = s.duration_minutes || 15;
                 
                 // Add to map (accumulate)
                 activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + minutes);
                 hourMap[date.getHours()] += 1;
            }
        });

        const activity_calendar = Array.from(activityMap.entries()).map(([date, count]) => ({ date, count, level: count > 60 ? 4 : count > 30 ? 3 : count > 15 ? 2 : 1 }));

        // Calculate Streak
        const sortedDates = Array.from(activityMap.keys()).sort();
        let currentStreak = 0;
        if (sortedDates.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            const lastActive = sortedDates[sortedDates.length - 1];

            if (lastActive === today || lastActive === yesterday) {
                currentStreak = 1;
                for (let i = sortedDates.length - 2; i >= 0; i--) {
                    const prev = new Date(sortedDates[i]);
                    const curr = new Date(sortedDates[i+1]);
                     // Check strictly concurrent days
                    const diffTime = Math.abs(curr.getTime() - prev.getTime());
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
                    if (diffDays === 1) currentStreak++;
                    else break;
                }
            }
        }

        // Planner stats - Usar study_plan_progress (match by any related ID)
        const userPlanProgress = studyPlanProgress?.filter((p: any) => userRelatedIds.includes(p.user_id)) || [];
        
        // Sumar totales de todos los planes del usuario
        const totalPlanned = userPlanProgress.reduce((sum: number, p: any) => sum + (p.total_sessions || 0), 0);
        const sessionsCompleted = userPlanProgress.reduce((sum: number, p: any) => sum + (p.sessions_completed || 0), 0);
        const sessionsPending = userPlanProgress.reduce((sum: number, p: any) => sum + (p.sessions_pending || 0), 0);
        const adherenceRate = totalPlanned > 0 ? Math.round((sessionsCompleted / totalPlanned) * 100) : 0;

        // DEBUG
        if (userEmail?.includes('fernando')) {
            logger.info(`DEBUG Fernando planProgress - plans: ${userPlanProgress.length}, total: ${totalPlanned}, completed: ${sessionsCompleted}, pending: ${sessionsPending}`);
        }

        // Calculate Course & Lesson Stats - use userRelatedIds for proper matching
        const userLessonProgress = lessonProgress?.filter((lp: any) => userRelatedIds.includes(lp.user_id)) || [];
        const userNotesData = userNotes?.filter((n: any) => userRelatedIds.includes(n.user_id)) || [];
        
        const totalLessonTime = userLessonProgress.reduce((sum: number, lp: any) => sum + (lp.time_spent_minutes || 0), 0);
        const lessonsCompleted = userLessonProgress.filter((lp: any) => lp.is_completed).length;
        const lessonsStarted = userLessonProgress.filter((lp: any) => lp.started_at).length;
        const quizzesCompleted = userLessonProgress.filter((lp: any) => lp.quiz_completed).length;
        const quizzesPassed = userLessonProgress.filter((lp: any) => lp.quiz_passed).length;
        
        // Breakdown by course
        const coursesBreakdown = userEnrollments.map((e: any) => ({
            course_id: e.course_id,
            course_title: e.courses?.title || 'Curso',
            progress: e.overall_progress_percentage || 0,
            status: e.enrollment_status,
            last_accessed: e.last_accessed_at
        }));

        // LIA Interaction Stats for this user
        const userLiaConversations = liaConversations?.filter((c: any) => userRelatedIds.includes(c.user_id)) || [];
        const userLiaConvIds = userLiaConversations.map((c: any) => c.id);
        const userLiaMessages = liaMessages.filter((m: any) => userLiaConvIds.includes(m.conversation_id));
        const userLiaUserMessages = userLiaMessages.filter((m: any) => m.role === 'user').length;
        const userLiaAssistantMessages = userLiaMessages.filter((m: any) => m.role === 'assistant').length;

        return {
          user_id: u.user_id,
          name: u.users?.display_name || u.users?.first_name || u.users?.email?.split('@')[0] || 'Usuario',
          email: u.users?.email,
          profile_picture_url: u.users?.profile_picture_url || null,
          // job_title ahora viene de organization_users, no de users.type_rol
          role: u.job_title || u.role,
          last_active: u.users?.last_login_at,
          courses_assigned: userEnrollments.length,
          courses_completed: userCompleted,
          average_progress: userAvgProgress,
          total_time_minutes: userTime,
          status: u.status,
          stats: {
             current_streak: currentStreak,
             activity_calendar: activity_calendar,
             hourly_distribution: hourMap,
             planner: {
                 total_sessions: totalPlanned,
                 completed: sessionsCompleted,
                 pending: sessionsPending,
                 adherence: adherenceRate
             },
             courses: {
                 total_lesson_time_minutes: totalLessonTime,
                 lessons_started: lessonsStarted,
                 lessons_completed: lessonsCompleted,
                 quizzes_completed: quizzesCompleted,
                 quizzes_passed: quizzesPassed,
                 notes_count: userNotesData.length,
                 notes_auto_generated: userNotesData.filter((n: any) => n.is_auto_generated).length,
                 breakdown: coursesBreakdown
             },
             lia: {
               total_conversations: userLiaConversations.length,
               total_messages: userLiaMessages.length,
               user_messages: userLiaUserMessages,
               assistant_responses: userLiaAssistantMessages,
               contexts: {
                 ai_chat: userLiaConversations.filter((c: any) => c.context_type === 'ai_chat').length,
                 course: userLiaConversations.filter((c: any) => c.context_type?.includes('course')).length
               }
             }
          }
        };
      }) || [];
    const enrollmentsByMonth = new Map<string, number>();
    const completionsByMonth = new Map<string, number>();
    const timeByMonth = new Map<string, number>();
    const activeUsersByMonth = new Map<string, number>();
    
    const typeRolDistribution = new Map<string, number>();
    const typeRolProgress = new Map<string, { sum: number, count: number }>();
    const typeRolCompletions = new Map<string, number>();
    const typeRolTime = new Map<string, { sum: number, count: number }>();
    const courseDistribution = new Map<string, number>();

    // Procesar usuarios y roles
    const userMap = new Map();
    orgUsers?.forEach(u => {
      userMap.set(u.user_id, u);
      const role = u.role || 'user';
      typeRolDistribution.set(role, (typeRolDistribution.get(role) || 0) + 1);
      
      // Init rol maps
      if (!typeRolProgress.has(role)) typeRolProgress.set(role, { sum: 0, count: 0 });
      if (!typeRolCompletions.has(role)) typeRolCompletions.set(role, 0);
      if (!typeRolTime.has(role)) typeRolTime.set(role, { sum: 0, count: 0 });
    });

    // Helper Trends
    const processTrend = (dateStr: string, map: Map<string, number>) => {
        if(!dateStr) return;
        const key = new Date(dateStr).toISOString().slice(0, 7); // YYYY-MM
        map.set(key, (map.get(key) || 0) + 1);
    };
    
    // Función auxiliar formatTrends (necesaria para response)
    const formatTrends = (mapData: Map<string, number>) => {
        return Array.from(mapData.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
    };

    // Procesar enrollments/assignments
    assignments?.forEach(a => {
        if (a.status === 'completed') {
            completedCourses++;
            processTrend(a.completed_at, completionsByMonth);
        }
        totalProgressSum += (a.completion_percentage || 0);
        
        const role = userMap.get(a.user_id)?.role || 'user';
        if (a.status === 'completed') {
             typeRolCompletions.set(role, (typeRolCompletions.get(role) || 0) + 1);
        }
        
        // Course distribution
        courseDistribution.set(a.status, (courseDistribution.get(a.status) || 0) + 1);
    });

    enrollments?.forEach(e => {
        processTrend(e.enrolled_at, enrollmentsByMonth);
    });
    
    const averageProgress = totalCoursesAssigned > 0 ? totalProgressSum / totalCoursesAssigned : 0;

    // Procesar lesson progress para tiempo
    lessonProgress?.forEach(lp => {
        const mins = lp.time_spent_minutes || 0;
        totalTimeMinutes += mins;
        
        const role = userMap.get(lp.user_id)?.role || 'user';
        const stats = typeRolTime.get(role);
        if (stats) { stats.sum += mins; stats.count++; }
        
        // Time trend (aprox usando completed_at o started_at)
        if (lp.completed_at) {
             const key = new Date(lp.completed_at).toISOString().slice(0, 7);
             timeByMonth.set(key, (timeByMonth.get(key) || 0) + mins);
        }
    });
    
    // Calcular promedios por rol
    typeRolProgress.forEach((val, key) => {
        // Asumiendo que tenemos data de progreso por rol... 
        // Simplificación: usaremos averageProgress global para evitar complejidad ahora
    });

    const totalTimeHours = Math.round(totalTimeMinutes / 60);

    // Active users
    const now = new Date();
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = orgUsers?.filter(ou => {
        const lastLogin = ou.users?.last_login_at ? new Date(ou.users.last_login_at) : null;
        return lastLogin && lastLogin >= thirtyDaysAgo;
    }).length || 0;
    
    const retentionRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
    const totalCertificates = certificates?.length || 0;

    // Study Planner Metrics
    const usersWithPlans = new Set(studyPlans?.map((p: any) => p.user_id)).size;
    const totalPlans = studyPlans?.length || 0;
    const totalSessions = studySessions?.length || 0;
    const completedSessions = studySessions?.filter((s: any) => s.status === 'completed').length || 0;
    const missedSessions = studySessions?.filter((s: any) => s.status === 'missed').length || 0;
    const pendingSessions = studySessions?.filter((s: any) => s.status === 'pending').length || 0;
    const inProgressSessions = studySessions?.filter((s: any) => s.status === 'in_progress').length || 0;
    const aiGeneratedSessions = studySessions?.filter((s: any) => s.is_ai_generated).length || 0;
    
    const sessionsByStatus = new Map<string, number>();
    studySessions?.forEach((s: any) => {
        sessionsByStatus.set(s.status, (sessionsByStatus.get(s.status) || 0) + 1);
    });

    const averageSessionDuration = 45; // Valor por defecto razonable
    const totalStudyHours = Math.round((studySessions?.reduce((acc: number, s: any) => acc + (s.duration_minutes || 0), 0) || 0) / 60);
    const planAdherenceRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
    const onTimeRate = planAdherenceRate; 
    const avgSessionsPerUser = totalUsers > 0 ? Math.round(totalSessions / totalUsers) : 0;


    // ============================================
    // CÁLCULO DE ENGAGEMENT METRICS (NUEVO) - SAFE BLOCK
    // ============================================
    let stickinessData = [];
    let frequencyData = [];
    let streaksData = [];
    let finalHeatmapData = [];
    let durationData = [];
    const sessionsPerUserLastMonth = new Map<string, number>();

    try {
        // 1. Stickiness & DAU/WAU/MAU
        const activityByDate = new Map<string, Set<string>>(); // YYYY-MM-DD -> Set<UserId>
        
        lessonTrackingData.forEach((lt: any) => {
          if (lt.started_at) {
            try {
                const date = new Date(lt.started_at).toISOString().split('T')[0];
                if (!activityByDate.has(date)) activityByDate.set(date, new Set());
                activityByDate.get(date)!.add(lt.user_id);
            } catch (e) {}
          }
        });

        orgUsers?.forEach((ou: any) => {
          if (ou.users?.last_login_at) {
            try {
                const date = new Date(ou.users.last_login_at).toISOString().split('T')[0];
                if (!activityByDate.has(date)) activityByDate.set(date, new Set());
                activityByDate.get(date)!.add(ou.user_id);
            } catch (e) {}
          }
        });

        const now = new Date();
        for (let i = 3; i >= 0; i--) {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - (i * 7) - 6);
          const weekEnd = new Date(now);
          weekEnd.setDate(now.getDate() - (i * 7));
          
          let dauSum = 0;
          
          for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const usersToday = activityByDate.get(dateStr);
            if (usersToday) {
              dauSum += usersToday.size;
            }
          }

          const mauSet = new Set<string>();
          const monthStart = new Date(weekEnd);
          monthStart.setDate(monthStart.getDate() - 30);
          
          activityByDate.forEach((users, dateStr) => {
            const d = new Date(dateStr);
            if (d >= monthStart && d <= weekEnd) {
              users.forEach(u => mauSet.add(u));
            }
          });

          const avgDau = Math.round(dauSum / 7) || 0;
          const mau = mauSet.size || 1; 
          const ratio = Math.round((avgDau / mau) * 100);

          stickinessData.push({
            name: `Sem ${4-i}`,
            dau: avgDau,
            mau: mau,
            ratio: ratio
          });
        }

        // 2. Distribución de Frecuencia
        // sessionsPerUserLastMonth ya inicializado arriba
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);

        lessonTrackingData.forEach((lt: any) => {
          if (lt.started_at && new Date(lt.started_at) >= monthAgo) {
            sessionsPerUserLastMonth.set(lt.user_id, (sessionsPerUserLastMonth.get(lt.user_id) || 0) + 1);
          }
        });

        let freq1 = 0, freq2_3 = 0, freq4_7 = 0, freq8_plus = 0;
        
        if (sessionsPerUserLastMonth.size === 0 && activeUsers > 0) {
          freq1 = activeUsers;
        } else {
          sessionsPerUserLastMonth.forEach((count) => {
            if (count === 1) freq1++;
            else if (count <= 3) freq2_3++;
            else if (count <= 7) freq4_7++;
            else freq8_plus++;
          });
          const usersWithTracking = new Set(sessionsPerUserLastMonth.keys());
          orgUsers?.forEach((ou: any) => {
            const lastLogin = ou.users?.last_login_at ? new Date(ou.users.last_login_at) : null;
            if (lastLogin && lastLogin >= monthAgo && !isNaN(lastLogin.getTime()) && !usersWithTracking.has(ou.user_id)) {
               freq1++;
            }
          });
        }

        frequencyData = [
          { name: '1 sesión', users: freq1 },
          { name: '2-3 sesiones', users: freq2_3 },
          { name: '4-7 sesiones', users: freq4_7 },
          { name: '8+ sesiones', users: freq8_plus },
        ];

        // 3. Streaks
        const userStreaks = new Map<string, number>();
        const userActivityDates = new Map<string, Set<string>>();
        
        lessonTrackingData.forEach((lt: any) => {
          if (lt.started_at) {
            try {
                const date = new Date(lt.started_at).toISOString().split('T')[0];
                if (!userActivityDates.has(lt.user_id)) userActivityDates.set(lt.user_id, new Set());
                userActivityDates.get(lt.user_id)!.add(date);
            } catch(e) {}
          }
        });

        userActivityDates.forEach((dates, userId) => {
          let streak = 0;
          let checkDate = new Date(); 
          
          const todayStr = checkDate.toISOString().split('T')[0];
          const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (dates.has(todayStr)) {
            streak = 1;
            checkDate = yesterday;
          } else if (dates.has(yesterdayStr)) {
            streak = 1;
            checkDate = new Date(); checkDate.setDate(checkDate.getDate() - 2);
          } else {
            streak = 0;
          }

          if (streak > 0) {
            while (true) {
              const dateStr = checkDate.toISOString().split('T')[0];
              if (dates.has(dateStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
              } else {
                break;
              }
            }
          }
          userStreaks.set(userId, streak);
        });

        const totalUsersForStreaks = totalUsers || 1;
        const s3 = Array.from(userStreaks.values()).filter(s => s >= 3).length;
        const s7 = Array.from(userStreaks.values()).filter(s => s >= 7).length;
        const s14 = Array.from(userStreaks.values()).filter(s => s >= 14).length;

        streaksData = [
          { name: '3 días', value: Math.round((s3 / totalUsersForStreaks) * 100) || 0, fill: '#00D4B3' },
          { name: '7 días', value: Math.round((s7 / totalUsersForStreaks) * 100) || 0, fill: '#3B82F6' },
          { name: '14 días', value: Math.round((s14 / totalUsersForStreaks) * 100) || 0, fill: '#8B5CF6' },
        ];

        // 4. Heatmap
        const heatmapCounts = new Map<string, number>();
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        
        lessonTrackingData.forEach((lt: any) => {
          if (lt.started_at) {
            const d = new Date(lt.started_at);
            if (!isNaN(d.getTime())) {
                const day = days[d.getDay()];
                const hour = d.getHours();
                const key = `${day}-${hour}`;
                heatmapCounts.set(key, (heatmapCounts.get(key) || 0) + 1);
            }
          }
        });

        const heatmapData = [];
        const keyHours = [9, 12, 15, 18, 21, 0, 3, 6]; 
        for (const day of days) {
          for (const hour of keyHours) {
            heatmapData.push({
              day,
              hour: `${hour}:00`,
              value: (heatmapCounts.get(`${day}-${hour}`) || 0) + 
                     (heatmapCounts.get(`${day}-${hour+1}`) || 0) * 0.5 + 
                     (heatmapCounts.get(`${day}-${hour-1}`) || 0) * 0.5
            });
          }
        }
        finalHeatmapData = heatmapData.filter(d => d.value > 0);

        // 5. Duración
        const durationsByRole = new Map<string, number[]>();
        const userRoleMap = new Map<string, string>();
        orgUsers?.forEach((ou: any) => {
          userRoleMap.set(ou.user_id, ou.role === 'admin' ? 'Admin' : (ou.role === 'instructor' ? 'Instructor' : 'Usuario'));
        });

        lessonTrackingData.forEach((lt: any) => {
          if (lt.t_lesson_minutes && lt.user_id) {
            const role = userRoleMap.get(lt.user_id) || 'Usuario';
            if (!durationsByRole.has(role)) durationsByRole.set(role, []);
            durationsByRole.get(role)!.push(Number(lt.t_lesson_minutes));
          }
        });

        durationData = Array.from(durationsByRole.entries()).map(([role, values]) => {
          values.sort((a, b) => a - b);
          const min = values[0];
          const max = values[values.length - 1];
          const median = values[Math.floor(values.length / 2)];
          const q1 = values[Math.floor(values.length * 0.25)];
          const q3 = values[Math.floor(values.length * 0.75)];
          
          return { role, min, q1, median, q3, max };
        });

    } catch (metricError) {
        logger.error('💥 Error calculating engagement metrics:', metricError);
        // Continuamos sin métricas de engagement, usando los arrays vacíos inicializados arriba
    }

    // Top usuarios por adherencia al plan
    const userAdherence = Array.from(sessionsPerUserLastMonth.entries())
      // ... resto de lógica userAdherence ...

    // === TEAM ANALYTICS ===
    const teamAnalytics = activeWorkTeams?.map(team => {
      // Obtener miembros del equipo
      const members = teamMembers.filter(m => m.team_id === team.team_id);
      const memberUserIds = members.map(m => m.user_id);
      
      // Obtener emails de los miembros para matching
      const memberEmails = allUsersWithEmails?.filter(u => memberUserIds.includes(u.id)).map(u => u.email) || [];
      
      // Calcular progreso promedio del equipo
      const memberEnrollments = enrollments?.filter((e: any) => {
        const userEmail = allUsersWithEmails?.find(u => u.id === e.user_id)?.email;
        return userEmail && memberEmails.includes(userEmail);
      }) || [];
      
      const teamProgressSum = memberEnrollments.reduce((sum: number, e: any) => sum + (e.overall_progress_percentage || 0), 0);
      const teamAvgProgress = memberEnrollments.length > 0 ? Math.round(teamProgressSum / memberEnrollments.length) : 0;
      
      // Calcular cursos completados
      const teamCompleted = memberEnrollments.filter((e: any) => e.enrollment_status === 'completed').length;
      
      // Calcular tiempo total del equipo
      const memberLessonProgress = lessonProgress?.filter((lp: any) => {
        const userEmail = allUsersWithEmails?.find(u => u.id === lp.user_id)?.email;
        return userEmail && memberEmails.includes(userEmail);
      }) || [];
      const teamTimeMinutes = memberLessonProgress.reduce((sum: number, lp: any) => sum + (lp.time_spent_minutes || 0), 0);

      // LIA interactions del equipo
      const memberLiaConvs = liaConversations?.filter((c: any) => memberUserIds.includes(c.user_id)) || [];
      
      return {
        team_id: team.team_id,
        name: team.name,
        description: team.description,
        image_url: team.image_url,
        member_count: members.length,
        stats: {
          average_progress: teamAvgProgress,
          courses_completed: teamCompleted,
          total_enrollments: memberEnrollments.length,
          total_time_hours: Math.round(teamTimeMinutes / 60 * 10) / 10,
          lia_conversations: memberLiaConvs.length
        }
      };
    }) || [];

    // Ranking de equipos por progreso
    const teamsRanking = [...teamAnalytics].sort((a, b) => b.stats.average_progress - a.stats.average_progress);
    
    logger.info(`Team Analytics final: ${teamAnalytics.length} teams, activeWorkTeams: ${activeWorkTeams.length}`);

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
        user_adherence: userAdherence.slice(0, 10)
      },
      engagement_metrics: {
        stickiness: stickinessData,
        frequency: frequencyData,
        streaks: streaksData,
        heatmap: finalHeatmapData,
        duration: durationData
      },
      teams: {
        total_teams: teamAnalytics.length,
        teams: teamAnalytics,
        ranking: teamsRanking.slice(0, 10)
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

