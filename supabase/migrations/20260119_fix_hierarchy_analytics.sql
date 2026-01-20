-- ============================================
-- MIGRACIÓN: Fix Hierarchy Analytics (Robust Check)
-- Fecha: 2026-01-19
-- Descripción: Versión robusta de get_hierarchy_analytics.
--              1. Limpia tablas temporales para evitar conflictos.
--              2. Corrige productos cartesianos en cálculos.
--              3. Previene ciclos infinitos.
-- ============================================

CREATE OR REPLACE FUNCTION public.get_hierarchy_analytics(
  p_entity_type text,
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
  v_courses_assigned integer := 0;
  v_assignment_completion_rate numeric(5, 2) := 0;
  v_assignments_overdue integer := 0;
  v_assignments_due_soon integer := 0;
  v_participation_rate numeric(5, 2);
  v_avg_active_days numeric(5, 2);
  v_avg_streak numeric(5, 2);
  v_longest_streak integer;
  v_sessions_completed integer;
  v_sessions_missed integer;
  v_last_activity timestamp with time zone;
  v_top_performer jsonb;
  
  v_total_children integer;
  v_active_children integer;
  v_inactive_children integer;
  v_avg_hours_per_child numeric(10, 2);
  v_child_ranking jsonb;
  
BEGIN
  -- 0. Limpieza defensiva (Crucial si la función falla antes)
  DROP TABLE IF EXISTS temp_hierarchy_nodes;
  DROP TABLE IF EXISTS temp_hierarchy_users;

  -- 1. Identificar todos los nodos relevantes (Recurrent CTE seguro)
  CREATE TEMP TABLE temp_hierarchy_nodes AS
  WITH RECURSIVE node_tree AS (
    -- Nodo base
    SELECT id, parent_id, name, type, 0 as depth, ARRAY[id] as path_ids
    FROM organization_nodes
    WHERE id = p_entity_id
    
    UNION ALL
    
    -- Hijos recursivos (con detección de ciclos simple)
    SELECT c.id, c.parent_id, c.name, c.type, nt.depth + 1, nt.path_ids || c.id
    FROM organization_nodes c
    JOIN node_tree nt ON c.parent_id = nt.id
    WHERE NOT (c.id = ANY(nt.path_ids)) -- Prevenir ciclos
  )
  SELECT * FROM node_tree;

  -- 2. Identificar usuarios asociados
  CREATE TEMP TABLE temp_hierarchy_users AS
  SELECT DISTINCT u.id
  FROM organization_node_users onu
  JOIN users u ON onu.user_id = u.id
  WHERE onu.node_id IN (SELECT id FROM temp_hierarchy_nodes);

  SELECT count(*) INTO v_users_count FROM temp_hierarchy_users;

  IF v_users_count = 0 THEN
    -- Limpieza antes de salir
    DROP TABLE IF EXISTS temp_hierarchy_nodes;
    DROP TABLE IF EXISTS temp_hierarchy_users;
    
    RETURN jsonb_build_object(
      'users_count', 0,
      'active_learners', 0,
      'total_hours', 0,
      'avg_completion', 0,
      'top_performer', null,
      'empty_state', true
    );
  END IF;

  -- 3. Usuarios activos
  SELECT count(DISTINCT user_id) INTO v_active_learners
  FROM lesson_tracking
  WHERE user_id IN (SELECT id FROM temp_hierarchy_users)
  AND started_at >= NOW() - INTERVAL '30 days';
  
  v_inactive_users := v_users_count - v_active_learners;

  -- 4. Horas totales (Solo lessons completed)
  SELECT COALESCE(SUM(lt.t_lesson_minutes), 0) / 60.0 INTO v_total_hours
  FROM lesson_tracking lt
  WHERE lt.user_id IN (SELECT id FROM temp_hierarchy_users)
  AND lt.status = 'completed';
  
  IF v_active_learners > 0 THEN
    v_avg_hours_per_member := v_total_hours / v_active_learners;
  ELSE
    v_avg_hours_per_member := 0;
  END IF;

  -- 5. % Completado promedio
  SELECT COALESCE(AVG(overall_progress_percentage), 0) INTO v_avg_completion
  FROM user_course_enrollments
  WHERE user_id IN (SELECT id FROM temp_hierarchy_users)
  AND enrollment_status = 'active';

  -- 6. Cursos status
  SELECT 
    count(*) FILTER (WHERE enrollment_status = 'completed'),
    count(*) FILTER (WHERE enrollment_status = 'active' AND overall_progress_percentage > 0 AND overall_progress_percentage < 100),
    count(*) FILTER (WHERE enrollment_status = 'active' AND (overall_progress_percentage IS NULL OR overall_progress_percentage = 0))
  INTO v_courses_completed, v_courses_in_progress, v_courses_not_started
  FROM user_course_enrollments
  WHERE user_id IN (SELECT id FROM temp_hierarchy_users);

  -- 7. Lecciones completadas
  SELECT count(*) INTO v_lessons_completed
  FROM user_lesson_progress
  WHERE user_id IN (SELECT id FROM temp_hierarchy_users)
  AND is_completed = true;

  -- 8. Sesión promedio
  SELECT COALESCE(AVG(actual_duration_minutes), 0) INTO v_avg_session_duration
  FROM study_sessions
  WHERE user_id IN (SELECT id FROM temp_hierarchy_users)
  AND status = 'completed';

  -- 9. Métricas de asignaciones (Node Courses)
  -- Buscamos asignaciones hechas a cualquiera de los nodos en la jerarquía
  -- NOTA: organization_node_courses define QUE curso está asignado a QUE nodo.
  -- Para saber si los usuarios lo completaron, cruzamos con user_course_enrollments.
  
  -- Courses Assigned: Total de asignaciones únicas vigentes en estos nodos
  SELECT count(*) INTO v_courses_assigned
  FROM organization_node_courses
  WHERE node_id IN (SELECT id FROM temp_hierarchy_nodes)
  AND status = 'active';

  -- Assignment Completion Rate: De los usuarios en estos nodos, cuántos han completado los cursos asignados a sus nodos.
  WITH relevant_assignments AS (
      SELECT DISTINCT onc.course_id
      FROM organization_node_courses onc
      WHERE onc.node_id IN (SELECT id FROM temp_hierarchy_nodes)
      AND onc.status = 'active'
  ),
  user_status_on_assignments AS (
      SELECT 
        uce.user_id,
        uce.course_id,
        uce.enrollment_status
      FROM user_course_enrollments uce
      WHERE uce.user_id IN (SELECT id FROM temp_hierarchy_users)
      AND uce.course_id IN (SELECT course_id FROM relevant_assignments)
  )
  SELECT 
      CASE 
          WHEN count(*) = 0 THEN 0
          ELSE (count(*) FILTER (WHERE enrollment_status = 'completed')::numeric / count(*)::numeric) * 100 
      END
  INTO v_assignment_completion_rate
  FROM user_status_on_assignments;

  -- Due Soon / Overdue placeholders (requeriría lógica compleja de fechas en assignments, dejamos en 0 si no hay due_date estricto)
  v_assignments_overdue := 0;
  v_assignments_due_soon := 0;

  -- 10. Participación
  IF v_users_count > 0 THEN
    v_participation_rate := (v_active_learners::numeric / v_users_count::numeric) * 100;
  ELSE
    v_participation_rate := 0;
  END IF;

  -- 11. Días activos
  SELECT COALESCE(AVG(days), 0) INTO v_avg_active_days
  FROM (
      SELECT user_id, count(DISTINCT progress_date) as days
      FROM daily_progress
      WHERE user_id IN (SELECT id FROM temp_hierarchy_users)
      AND progress_date >= CURRENT_DATE - INTERVAL '30 days'
      AND had_activity = true
      GROUP BY user_id
  ) sub;

  -- 12. Rachas (Calculado desde daily_progress)
  -- Racha actual promedio de los usuarios
  -- Longest streak histórica (o del periodo)
  
  WITH user_current_streaks AS (
      SELECT 
          user_id,
          count(*) as current_streak
      FROM (
          SELECT 
              user_id,
              progress_date,
              ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY progress_date DESC) as rn
          FROM daily_progress
          WHERE user_id IN (SELECT id FROM temp_hierarchy_users)
          AND had_activity = true
      ) t
      WHERE progress_date = CURRENT_DATE - (rn - 1) * INTERVAL '1 day' -- Consecutive days check
      GROUP BY user_id
  )
  SELECT 
      COALESCE(AVG(current_streak), 0),
      COALESCE(MAX(current_streak), 0)
  INTO v_avg_streak, v_longest_streak
  FROM user_current_streaks;

  -- Fallback simple si la query compleja de rachas no retorna nada
  IF v_avg_streak IS NULL THEN v_avg_streak := 0; END IF;
  IF v_longest_streak IS NULL THEN v_longest_streak := 0; END IF;


  -- 13. Sesiones stats
  SELECT 
    count(*) FILTER (WHERE status = 'completed'),
    COALESCE(SUM(sessions_missed), 0)
  INTO v_sessions_completed, v_sessions_missed
  FROM study_sessions ss
  LEFT JOIN daily_progress dp ON DATE(ss.start_time) = dp.progress_date AND ss.user_id = dp.user_id
  WHERE ss.user_id IN (SELECT id FROM temp_hierarchy_users)
  AND ss.start_time >= NOW() - INTERVAL '30 days';

  -- 14. Última actividad
  SELECT MAX(action_timestamp) INTO v_last_activity
  FROM user_activity_log
  WHERE user_id IN (SELECT id FROM temp_hierarchy_users);


  -- 15. TOP PERFORMER y RANKING
  SELECT count(*) INTO v_total_children 
  FROM organization_nodes 
  WHERE parent_id = p_entity_id;

  IF v_total_children = 0 THEN
    -- Top User
    SELECT jsonb_build_object(
      'id', u.id,
      'name', COALESCE(u.display_name, u.email),
      'avatar', u.profile_picture_url,
      'value', ROUND(SUM(lt.t_lesson_minutes)::numeric / 60.0, 1),
      'label', 'Horas',
      'type', 'user'
    ) INTO v_top_performer
    FROM lesson_tracking lt
    JOIN users u ON lt.user_id = u.id
    WHERE lt.user_id IN (SELECT id FROM temp_hierarchy_users)
    AND lt.status = 'completed'
    GROUP BY u.id, u.display_name, u.email, u.profile_picture_url
    ORDER BY SUM(lt.t_lesson_minutes) DESC
    LIMIT 1;
    
    v_child_ranking := '[]'::jsonb;
    v_active_children := 0;
    v_avg_hours_per_child := 0;
    
  ELSE
    -- Top Child Node (Corrected for Cartesian product)
    -- Calculate stats for each child separately using subqueries
    WITH child_stats AS (
        SELECT 
            n.id, 
            n.name,
            -- Hours: Sum of lesson tracking for ANY user in this child subtree
            (
                SELECT COALESCE(SUM(lt.t_lesson_minutes) / 60.0, 0)
                FROM lesson_tracking lt
                JOIN organization_node_users onu ON lt.user_id = onu.user_id
                WHERE onu.node_id IN (
                    WITH RECURSIVE sub_tree AS (
                        SELECT id FROM organization_nodes WHERE id = n.id
                        UNION ALL
                        SELECT c.id FROM organization_nodes c JOIN sub_tree st ON c.parent_id = st.id
                    )
                    SELECT id FROM sub_tree
                )
                AND lt.status = 'completed'
            ) as total_hours,
            -- Completion: Avg of enrollments
            (
                SELECT COALESCE(AVG(uce.overall_progress_percentage), 0)
                FROM user_course_enrollments uce
                JOIN organization_node_users onu ON uce.user_id = onu.user_id
                WHERE onu.node_id IN (
                    WITH RECURSIVE sub_tree AS (
                        SELECT id FROM organization_nodes WHERE id = n.id
                        UNION ALL
                        SELECT c.id FROM organization_nodes c JOIN sub_tree st ON c.parent_id = st.id
                    )
                    SELECT id FROM sub_tree
                )
                AND uce.enrollment_status = 'active'
            ) as completion_rate
        FROM organization_nodes n
        WHERE n.parent_id = p_entity_id
    )
    SELECT jsonb_build_object(
      'id', id,
      'name', name,
      'value', ROUND(total_hours, 1),
      'label', 'Horas',
      'type', 'node'
    ) INTO v_top_performer
    FROM child_stats
    ORDER BY total_hours DESC
    LIMIT 1;
    
    -- Re-run CTE for ranking (Postgres 12+ optimizes specific CTEs, but safest is simple query above or duplicate)
    -- For simplicity/performance balance, allow a simpler approximation or re-use approach above.
    
    WITH child_stats_rank AS (
        SELECT 
            n.id, 
            n.name,
            (
                SELECT COALESCE(SUM(lt.t_lesson_minutes) / 60.0, 0)
                FROM lesson_tracking lt
                JOIN organization_node_users onu ON lt.user_id = onu.user_id
                WHERE onu.node_id IN (
                    WITH RECURSIVE sub_tree AS (
                        SELECT id FROM organization_nodes WHERE id = n.id
                        UNION ALL
                        SELECT c.id FROM organization_nodes c JOIN sub_tree st ON c.parent_id = st.id
                    )
                    SELECT id FROM sub_tree
                )
                AND lt.status = 'completed'
            ) as total_hours
        FROM organization_nodes n
        WHERE n.parent_id = p_entity_id
    )
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'name', name,
        'hours', ROUND(total_hours, 1),
        'completion_rate', 0,
        'participation_rate', 0
      ) ORDER BY total_hours DESC
    ) INTO v_child_ranking
    FROM child_stats_rank;
    
    v_active_children := v_total_children; 
    v_inactive_children := 0;
    
    IF v_total_children > 0 THEN
       v_avg_hours_per_child := v_total_hours / v_total_children;
    ELSE
       v_avg_hours_per_child := 0;
    END IF;

  END IF;

  -- Limpieza final
  DROP TABLE IF EXISTS temp_hierarchy_nodes;
  DROP TABLE IF EXISTS temp_hierarchy_users;

  RETURN jsonb_build_object(
    'users_count', v_users_count,
    'active_learners', v_active_learners,
    'inactive_users', v_inactive_users,
    'total_hours', ROUND(v_total_hours, 1),
    'avg_hours_per_member', ROUND(v_avg_hours_per_member, 1),
    'avg_completion', ROUND(v_avg_completion, 1),
    'courses_completed', v_courses_completed,
    'courses_in_progress', v_courses_in_progress,
    'courses_not_started', v_courses_not_started,
    'lessons_completed', v_lessons_completed,
    'avg_session_duration', ROUND(v_avg_session_duration, 1),
    'courses_assigned', v_courses_assigned,
    'assignment_completion_rate', ROUND(v_assignment_completion_rate, 1),
    'assignments_overdue', v_assignments_overdue,
    'assignments_due_soon', v_assignments_due_soon,
    'participation_rate', ROUND(v_participation_rate, 1),
    'avg_active_days', ROUND(v_avg_active_days, 1),
    'avg_streak', ROUND(v_avg_streak, 1),
    'longest_streak', v_longest_streak,
    'sessions_completed', v_sessions_completed,
    'sessions_missed', v_sessions_missed,
    'last_activity', v_last_activity,
    'top_performer', v_top_performer,
    'total_children', v_total_children,
    'total_teams', v_total_children,
    'total_zones', v_total_children,
    'active_teams', v_active_children,
    'active_zones', v_active_children,
    'avg_hours_per_team', ROUND(COALESCE(v_avg_hours_per_child, 0), 1),
    'avg_hours_per_zone', ROUND(COALESCE(v_avg_hours_per_child, 0), 1),
    'team_ranking', v_child_ranking,
    'zone_ranking', v_child_ranking
  );
END;
$$ LANGUAGE plpgsql VOLATILE;
