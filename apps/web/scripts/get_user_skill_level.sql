-- Función para calcular el nivel de skill de un usuario basado en cantidad de cursos completados
-- Niveles: green (1 curso) -> bronze (2) -> silver (3) -> gold (4) -> diamond (5+)

CREATE OR REPLACE FUNCTION get_user_skill_level(
  p_user_id UUID,
  p_skill_id UUID
)
RETURNS TABLE(level VARCHAR, course_count INTEGER, next_level_courses_needed INTEGER) AS $$
DECLARE
  course_count INTEGER;
  current_level VARCHAR;
  next_level_courses_needed INTEGER;
BEGIN
  -- Contar cursos completados únicos que tienen esta skill
  SELECT COUNT(DISTINCT uce.course_id) INTO course_count
  FROM user_course_enrollments uce
  INNER JOIN course_skills cs ON cs.course_id = uce.course_id
  WHERE uce.user_id = p_user_id
    AND cs.skill_id = p_skill_id
    AND uce.enrollment_status = 'completed';
  
  -- Determinar nivel basado en cantidad de cursos
  current_level := CASE
    WHEN course_count >= 5 THEN 'diamond'
    WHEN course_count >= 4 THEN 'gold'
    WHEN course_count >= 3 THEN 'silver'
    WHEN course_count >= 2 THEN 'bronze'
    WHEN course_count >= 1 THEN 'green'
    ELSE NULL
  END;
  
  -- Calcular cursos necesarios para el siguiente nivel
  -- Si ya está en diamond, no hay siguiente nivel (0)
  next_level_courses_needed := CASE
    WHEN current_level = 'diamond' THEN 0
    WHEN current_level = 'gold' THEN 5 - course_count
    WHEN current_level = 'silver' THEN 4 - course_count
    WHEN current_level = 'bronze' THEN 3 - course_count
    WHEN current_level = 'green' THEN 2 - course_count
    ELSE 1 - course_count -- Si no tiene nivel, necesita 1 curso para green
  END;
  
  -- Asegurar que no sea negativo
  IF next_level_courses_needed < 0 THEN
    next_level_courses_needed := 0;
  END IF;
  
  RETURN QUERY SELECT 
    current_level AS level,
    course_count,
    next_level_courses_needed;
END;
$$ LANGUAGE plpgsql;

