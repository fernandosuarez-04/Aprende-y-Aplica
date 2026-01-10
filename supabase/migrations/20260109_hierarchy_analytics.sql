-- ============================================
-- MIGRACIÓN: Métricas de Jerarquía Realistas
-- Fecha: 2026-01-09
-- Descripción: Funciones para calcular KPIs reales de aprendizaje
--              por región, zona y equipo.
-- ============================================

-- Función auxiliar para calcular progreso de un usuario en un curso
CREATE OR REPLACE FUNCTION public.calculate_user_course_progress(p_user_id uuid, p_course_id uuid)
RETURNS numeric AS $$
DECLARE
  v_total_lessons integer;
  v_completed_lessons integer;
BEGIN
  -- Contar total de lecciones del curso
  SELECT count(*) INTO v_total_lessons
  FROM course_lessons
  WHERE course_id = p_course_id;

  IF v_total_lessons = 0 THEN
    RETURN 0;
  END IF;

  -- Contar lecciones completadas por el usuario en este curso
  SELECT count(*) INTO v_completed_lessons
  FROM lesson_tracking lt
  JOIN course_lessons cl ON lt.lesson_id = cl.lesson_id
  WHERE lt.user_id = p_user_id
  AND cl.course_id = p_course_id
  AND lt.status = 'completed';

  RETURN ROUND((v_completed_lessons::numeric / v_total_lessons::numeric) * 100, 2);
EXCEPTION WHEN OTHERS THEN
  RETURN 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- Función principal para obtener analíticas de jerarquía
CREATE OR REPLACE FUNCTION public.get_hierarchy_analytics(
  p_entity_type text, -- 'region', 'zone', 'team'
  p_entity_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_users_count integer;
  v_active_learners integer;
  v_total_hours numeric(10, 2);
  v_avg_completion numeric(5, 2);
  v_top_performer jsonb;
  v_child_entity_stats jsonb;
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

  -- 2. Calcular usuarios activos (con al menos 1 lección iniciada)
  SELECT count(DISTINCT user_id) INTO v_active_learners
  FROM lesson_tracking
  WHERE user_id IN (SELECT id FROM temp_hierarchy_users);

  -- 3. Calcular horas totales aprendidas (sumando t_lesson_minutes de lecciones completadas)
  SELECT COALESCE(SUM(lt.t_lesson_minutes), 0) / 60.0 INTO v_total_hours
  FROM lesson_tracking lt
  WHERE lt.user_id IN (SELECT id FROM temp_hierarchy_users)
  AND lt.status = 'completed';

  -- 4. Calcular % completado promedio (de todos los cursos iniciados)
  -- Esto es una aproximación: (lecciones completadas totales / total lecciones esperadas "estimado")
  -- Para hacerlo más real, tomamos el promedio de progreso de enrollments activos
  
  -- Nota: Como no tenemos tabla enrollments clara, usaremos lesson_tracking para inferir cursos activos
  WITH user_courses AS (
    SELECT DISTINCT lt.user_id, cl.course_id
    FROM lesson_tracking lt
    JOIN course_lessons cl ON lt.lesson_id = cl.lesson_id
    WHERE lt.user_id IN (SELECT id FROM temp_hierarchy_users)
  )
  SELECT COALESCE(AVG(public.calculate_user_course_progress(user_id, course_id)), 0)
  INTO v_avg_completion
  FROM user_courses;

  -- 5. Identificar "Top Performer" (Usuario o Sub-entidad con más horas)
  -- Si es Team -> Usuario Top
  IF p_entity_type = 'team' THEN
    SELECT jsonb_build_object(
      'id', u.id,
      'name', u.display_name,
      'avatar', u.profile_picture_url,
      'value', ROUND(SUM(lt.t_lesson_minutes)::numeric / 60.0, 1),
      'label', 'Horas'
    ) INTO v_top_performer
    FROM lesson_tracking lt
    JOIN users u ON lt.user_id = u.id
    WHERE lt.user_id IN (SELECT id FROM temp_hierarchy_users)
    AND lt.status = 'completed'
    GROUP BY u.id, u.display_name, u.profile_picture_url
    ORDER BY SUM(lt.t_lesson_minutes) DESC
    LIMIT 1;

  -- Si es Region -> Zona Top
  ELSIF p_entity_type = 'region' THEN
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
    
  -- Si es Zone -> Team Top
  ELSIF p_entity_type = 'zone' THEN
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
  END IF;

  DROP TABLE temp_hierarchy_users;

  RETURN jsonb_build_object(
    'users_count', v_users_count,
    'active_learners', v_active_learners,
    'total_hours', ROUND(v_total_hours, 1),
    'avg_completion', ROUND(v_avg_completion, 1),
    'top_performer', v_top_performer
  );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_hierarchy_analytics IS 'Calcula métricas de aprendizaje verídicas basándose en lesson_tracking';
