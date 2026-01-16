-- ============================================
-- MIGRACIÓN: Métricas de Jerarquía Mejoradas
-- Fecha: 2026-01-11
-- Descripción: Expansión de get_hierarchy_analytics para incluir
--              todas las estadísticas propuestas en el análisis
-- ============================================

-- Función principal mejorada para obtener analíticas de jerarquía
CREATE OR REPLACE FUNCTION public.get_hierarchy_analytics(
  p_entity_type text, -- 'region', 'zone', 'team'
  p_entity_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_users_count integer;
  v_active_learners integer;
  v_inactive_users integer;
  v_total_hours numeric(10, 2);
  v_avg_hours_per_member numeric(10, 2);
  v_avg_completion numeric(5, 2);
  v_courses_completed integer;
  v_courses_in_progress integer;
  v_courses_not_started integer;
  v_lessons_completed integer;
  v_avg_session_duration numeric(10, 2);
  v_courses_assigned integer;
  v_assignment_completion_rate numeric(5, 2);
  v_assignments_overdue integer;
  v_assignments_due_soon integer;
  v_participation_rate numeric(5, 2);
  v_avg_active_days numeric(5, 2);
  v_avg_streak numeric(5, 2);
  v_longest_streak integer;
  v_sessions_completed integer;
  v_sessions_missed integer;
  v_last_activity timestamp with time zone;
  v_top_performer jsonb;
  
  -- Para Zona y Región
  v_total_teams integer;
  v_active_teams integer;
  v_inactive_teams integer;
  v_avg_hours_per_team numeric(10, 2);
  v_team_ranking jsonb;
  
  -- Para Región
  v_total_zones integer;
  v_active_zones integer;
  v_inactive_zones integer;
  v_avg_hours_per_zone numeric(10, 2);
  v_zone_ranking jsonb;
BEGIN
  -- 1. Identificar usuarios base
  CREATE TEMP TABLE temp_hierarchy_users AS
  SELECT u.id
  FROM organization_users ou
  JOIN users u ON ou.user_id = u.id
  WHERE ou.status = 'active'
  AND (
    (p_entity_type = 'region' AND ou.region_id = p_entity_id) OR
    (p_entity_type = 'zone' AND ou.zone_id = p_entity_id) OR
    (p_entity_type = 'team' AND ou.team_id = p_entity_id)
  );

  SELECT count(*) INTO v_users_count FROM temp_hierarchy_users;

  IF v_users_count = 0 THEN
    DROP TABLE temp_hierarchy_users;
    RETURN jsonb_build_object(
      'users_count', 0,
      'active_learners', 0,
      'total_hours', 0,
      'avg_completion', 0,
      'top_performer', null
    );
  END IF;

  -- 2. Calcular usuarios activos (con al menos 1 lección iniciada en últimos 30 días)
  SELECT count(DISTINCT user_id) INTO v_active_learners
  FROM lesson_tracking
  WHERE user_id IN (SELECT id FROM temp_hierarchy_users)
  AND started_at >= NOW() - INTERVAL '30 days';
  
  v_inactive_users := v_users_count - v_active_learners;

  -- 3. Calcular horas totales aprendidas
  SELECT COALESCE(SUM(lt.t_lesson_minutes), 0) / 60.0 INTO v_total_hours
  FROM lesson_tracking lt
  WHERE lt.user_id IN (SELECT id FROM temp_hierarchy_users)
  AND lt.status = 'completed';
  
  -- Horas promedio por miembro
  IF v_active_learners > 0 THEN
    v_avg_hours_per_member := v_total_hours / v_active_learners;
  ELSE
    v_avg_hours_per_member := 0;
  END IF;

  -- 4. Calcular % completado promedio
  WITH user_courses AS (
    SELECT DISTINCT lt.user_id, cl.course_id
    FROM lesson_tracking lt
    JOIN course_lessons cl ON lt.lesson_id = cl.lesson_id
    WHERE lt.user_id IN (SELECT id FROM temp_hierarchy_users)
  )
  SELECT COALESCE(AVG(public.calculate_user_course_progress(user_id, course_id)), 0)
  INTO v_avg_completion
  FROM user_courses;

  -- 5. Cursos completados, en progreso y no iniciados
  SELECT 
    count(*) FILTER (WHERE e.enrollment_status = 'completed'),
    count(*) FILTER (WHERE e.enrollment_status = 'active' AND e.overall_progress_percentage > 0 AND e.overall_progress_percentage < 100),
    count(*) FILTER (WHERE e.enrollment_status = 'active' AND (e.overall_progress_percentage IS NULL OR e.overall_progress_percentage = 0))
  INTO v_courses_completed, v_courses_in_progress, v_courses_not_started
  FROM user_course_enrollments e
  WHERE e.user_id IN (SELECT id FROM temp_hierarchy_users)
  AND e.organization_id = (SELECT organization_id FROM organization_users WHERE user_id IN (SELECT id FROM temp_hierarchy_users LIMIT 1));

  -- 6. Lecciones completadas
  SELECT count(*) INTO v_lessons_completed
  FROM user_lesson_progress ulp
  WHERE ulp.user_id IN (SELECT id FROM temp_hierarchy_users)
  AND ulp.is_completed = true;

  -- 7. Tiempo promedio por sesión
  SELECT COALESCE(AVG(actual_duration_minutes), 0) INTO v_avg_session_duration
  FROM study_sessions
  WHERE user_id IN (SELECT id FROM temp_hierarchy_users)
  AND status = 'completed';

  -- 8. Métricas de asignaciones (solo para equipos directamente)
  IF p_entity_type = 'team' THEN
    SELECT 
      count(*),
      count(*) FILTER (WHERE hca.status = 'completed'),
      count(*) FILTER (WHERE hca.due_date < NOW() AND hca.status != 'completed'),
      count(*) FILTER (WHERE hca.due_date BETWEEN NOW() AND NOW() + INTERVAL '7 days' AND hca.status != 'completed')
    INTO v_courses_assigned, v_assignment_completion_rate, v_assignments_overdue, v_assignments_due_soon
    FROM hierarchy_course_assignments hca
    JOIN team_course_assignments tca ON hca.id = tca.hierarchy_assignment_id
    WHERE tca.team_id = p_entity_id
    AND hca.status != 'cancelled';
    
    IF v_courses_assigned > 0 THEN
      v_assignment_completion_rate := (v_assignment_completion_rate::numeric / v_courses_assigned::numeric) * 100;
    ELSE
      v_assignment_completion_rate := 0;
    END IF;
  END IF;

  -- 9. Tasa de participación
  IF v_users_count > 0 THEN
    v_participation_rate := (v_active_learners::numeric / v_users_count::numeric) * 100;
  ELSE
    v_participation_rate := 0;
  END IF;

  -- 10. Días activos promedio (últimos 30 días)
  SELECT COALESCE(AVG(days_count), 0) INTO v_avg_active_days
  FROM (
    SELECT count(DISTINCT DATE(progress_date)) as days_count
    FROM daily_progress
    WHERE user_id IN (SELECT id FROM temp_hierarchy_users)
    AND progress_date >= CURRENT_DATE - INTERVAL '30 days'
    AND had_activity = true
    GROUP BY user_id
  ) sub;

  -- 11. Racha de estudio promedio y más larga
  SELECT 
    COALESCE(AVG(current_streak), 0),
    COALESCE(MAX(longest_streak), 0)
  INTO v_avg_streak, v_longest_streak
  FROM user_streaks
  WHERE user_id IN (SELECT id FROM temp_hierarchy_users);

  -- 12. Sesiones completadas y perdidas
  SELECT 
    count(*) FILTER (WHERE status = 'completed'),
    COALESCE(SUM(sessions_missed), 0)
  INTO v_sessions_completed, v_sessions_missed
  FROM study_sessions ss
  LEFT JOIN daily_progress dp ON DATE(ss.start_time) = dp.progress_date AND ss.user_id = dp.user_id
  WHERE ss.user_id IN (SELECT id FROM temp_hierarchy_users)
  AND ss.start_time >= NOW() - INTERVAL '30 days';

  -- 13. Última actividad
  SELECT MAX(action_timestamp) INTO v_last_activity
  FROM user_activity_log
  WHERE user_id IN (SELECT id FROM temp_hierarchy_users);

  -- 14. Top Performer
  IF p_entity_type = 'team' THEN
    SELECT jsonb_build_object(
      'id', u.id,
      'name', COALESCE(u.display_name, u.email),
      'avatar', u.profile_picture_url,
      'value', ROUND(SUM(lt.t_lesson_minutes)::numeric / 60.0, 1),
      'label', 'Horas',
      'courses_completed', (
        SELECT count(*) 
        FROM user_course_enrollments 
        WHERE user_id = u.id 
        AND enrollment_status = 'completed'
      ),
      'completion_rate', COALESCE(
        (SELECT AVG(overall_progress_percentage) 
         FROM user_course_enrollments 
         WHERE user_id = u.id 
         AND enrollment_status = 'active'), 0
      )
    ) INTO v_top_performer
    FROM lesson_tracking lt
    JOIN users u ON lt.user_id = u.id
    WHERE lt.user_id IN (SELECT id FROM temp_hierarchy_users)
    AND lt.status = 'completed'
    GROUP BY u.id, u.display_name, u.email, u.profile_picture_url
    ORDER BY SUM(lt.t_lesson_minutes) DESC
    LIMIT 1;

  ELSIF p_entity_type = 'region' THEN
    -- Para región: mejor zona
    SELECT jsonb_build_object(
      'id', z.id,
      'name', z.name,
      'value', ROUND(SUM(lt.t_lesson_minutes)::numeric / 60.0, 1),
      'label', 'Horas'
    ) INTO v_top_performer
    FROM lesson_tracking lt
    JOIN organization_users ou ON lt.user_id = ou.user_id
    JOIN organization_zones z ON ou.zone_id = z.id
    WHERE z.region_id = p_entity_id
    AND lt.status = 'completed'
    GROUP BY z.id, z.name
    ORDER BY SUM(lt.t_lesson_minutes) DESC
    LIMIT 1;
    
    -- Ranking de zonas
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', zone_data.id,
        'name', zone_data.name,
        'hours', zone_data.hours,
        'completion_rate', zone_data.completion_rate,
        'participation_rate', zone_data.participation_rate
      ) ORDER BY zone_data.hours DESC
    ) INTO v_zone_ranking
    FROM (
      SELECT 
        z.id,
        z.name,
        ROUND(SUM(lt.t_lesson_minutes)::numeric / 60.0, 1) as hours,
        COALESCE(AVG(public.calculate_user_course_progress(ou.user_id, cl.course_id)), 0) as completion_rate,
        (count(DISTINCT ou.user_id)::numeric / NULLIF(count(DISTINCT ou_all.user_id), 0)::numeric) * 100 as participation_rate
      FROM organization_zones z
      LEFT JOIN organization_users ou ON ou.zone_id = z.id AND ou.status = 'active'
      LEFT JOIN organization_users ou_all ON ou_all.zone_id = z.id
      LEFT JOIN lesson_tracking lt ON lt.user_id = ou.user_id AND lt.status = 'completed'
      LEFT JOIN course_lessons cl ON cl.lesson_id = lt.lesson_id
      WHERE z.region_id = p_entity_id
      GROUP BY z.id, z.name
    ) zone_data
    LIMIT 5;
    
    -- Estadísticas de zonas
    SELECT 
      count(*),
      count(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM organization_users ou 
        JOIN lesson_tracking lt ON ou.user_id = lt.user_id 
        WHERE ou.zone_id = z.id 
        AND lt.started_at >= NOW() - INTERVAL '30 days'
      )),
      count(*) FILTER (WHERE NOT EXISTS (
        SELECT 1 FROM organization_users ou 
        JOIN lesson_tracking lt ON ou.user_id = lt.user_id 
        WHERE ou.zone_id = z.id 
        AND lt.started_at >= NOW() - INTERVAL '30 days'
      ))
    INTO v_total_zones, v_active_zones, v_inactive_zones
    FROM organization_zones z
    WHERE z.region_id = p_entity_id;
    
    IF v_total_zones > 0 THEN
      v_avg_hours_per_zone := v_total_hours / v_total_zones;
    END IF;
    
  ELSIF p_entity_type = 'zone' THEN
    -- Para zona: mejor equipo
    SELECT jsonb_build_object(
      'id', t.id,
      'name', t.name,
      'value', ROUND(SUM(lt.t_lesson_minutes)::numeric / 60.0, 1),
      'label', 'Horas'
    ) INTO v_top_performer
    FROM lesson_tracking lt
    JOIN organization_users ou ON lt.user_id = ou.user_id
    JOIN organization_teams t ON ou.team_id = t.id
    WHERE t.zone_id = p_entity_id
    AND lt.status = 'completed'
    GROUP BY t.id, t.name
    ORDER BY SUM(lt.t_lesson_minutes) DESC
    LIMIT 1;
    
    -- Ranking de equipos
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', team_data.id,
        'name', team_data.name,
        'hours', team_data.hours,
        'completion_rate', team_data.completion_rate,
        'participation_rate', team_data.participation_rate
      ) ORDER BY team_data.hours DESC
    ) INTO v_team_ranking
    FROM (
      SELECT 
        t.id,
        t.name,
        ROUND(SUM(lt.t_lesson_minutes)::numeric / 60.0, 1) as hours,
        COALESCE(AVG(public.calculate_user_course_progress(ou.user_id, cl.course_id)), 0) as completion_rate,
        (count(DISTINCT ou.user_id)::numeric / NULLIF(count(DISTINCT ou_all.user_id), 0)::numeric) * 100 as participation_rate
      FROM organization_teams t
      LEFT JOIN organization_users ou ON ou.team_id = t.id AND ou.status = 'active'
      LEFT JOIN organization_users ou_all ON ou_all.team_id = t.id
      LEFT JOIN lesson_tracking lt ON lt.user_id = ou.user_id AND lt.status = 'completed'
      LEFT JOIN course_lessons cl ON cl.lesson_id = lt.lesson_id
      WHERE t.zone_id = p_entity_id
      GROUP BY t.id, t.name
    ) team_data
    LIMIT 5;
    
    -- Estadísticas de equipos
    SELECT 
      count(*),
      count(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM organization_users ou 
        JOIN lesson_tracking lt ON ou.user_id = lt.user_id 
        WHERE ou.team_id = t.id 
        AND lt.started_at >= NOW() - INTERVAL '30 days'
      )),
      count(*) FILTER (WHERE NOT EXISTS (
        SELECT 1 FROM organization_users ou 
        JOIN lesson_tracking lt ON ou.user_id = lt.user_id 
        WHERE ou.team_id = t.id 
        AND lt.started_at >= NOW() - INTERVAL '30 days'
      ))
    INTO v_total_teams, v_active_teams, v_inactive_teams
    FROM organization_teams t
    WHERE t.zone_id = p_entity_id;
    
    IF v_total_teams > 0 THEN
      v_avg_hours_per_team := v_total_hours / v_total_teams;
    END IF;
  END IF;

  DROP TABLE temp_hierarchy_users;

  -- Construir respuesta JSON
  RETURN jsonb_build_object(
    -- Estadísticas básicas
    'users_count', v_users_count,
    'active_learners', v_active_learners,
    'inactive_users', v_inactive_users,
    
    -- Métricas de aprendizaje
    'total_hours', ROUND(v_total_hours, 1),
    'avg_hours_per_member', ROUND(v_avg_hours_per_member, 1),
    'avg_completion', ROUND(v_avg_completion, 1),
    'courses_completed', v_courses_completed,
    'courses_in_progress', v_courses_in_progress,
    'courses_not_started', v_courses_not_started,
    'lessons_completed', v_lessons_completed,
    'avg_session_duration', ROUND(v_avg_session_duration, 1),
    
    -- Métricas de asignaciones
    'courses_assigned', v_courses_assigned,
    'assignment_completion_rate', ROUND(v_assignment_completion_rate, 1),
    'assignments_overdue', v_assignments_overdue,
    'assignments_due_soon', v_assignments_due_soon,
    
    -- Métricas de engagement
    'participation_rate', ROUND(v_participation_rate, 1),
    'avg_active_days', ROUND(v_avg_active_days, 1),
    'avg_streak', ROUND(v_avg_streak, 1),
    'longest_streak', v_longest_streak,
    'sessions_completed', v_sessions_completed,
    'sessions_missed', v_sessions_missed,
    'last_activity', v_last_activity,
    
    -- Top Performer
    'top_performer', v_top_performer,
    
    -- Para Zona y Región
    'total_teams', v_total_teams,
    'active_teams', v_active_teams,
    'inactive_teams', v_inactive_teams,
    'avg_hours_per_team', ROUND(COALESCE(v_avg_hours_per_team, 0), 1),
    'team_ranking', v_team_ranking,
    
    -- Para Región
    'total_zones', v_total_zones,
    'active_zones', v_active_zones,
    'inactive_zones', v_inactive_zones,
    'avg_hours_per_zone', ROUND(COALESCE(v_avg_hours_per_zone, 0), 1),
    'zone_ranking', v_zone_ranking
  );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_hierarchy_analytics IS 'Calcula métricas completas de aprendizaje por región, zona o equipo según el análisis de estadísticas jerárquicas';

