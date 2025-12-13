-- Actualizar la función para asignar TODAS las skills del curso, no solo las requeridas
-- Esto asegura que cuando un usuario complete un curso, obtenga todas las skills asociadas

CREATE OR REPLACE FUNCTION public.assign_skills_on_course_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.enrollment_status = 'completed' AND 
     (OLD.enrollment_status IS NULL OR OLD.enrollment_status != 'completed') AND
     NEW.completed_at IS NOT NULL THEN
    
    -- Insertar TODAS las skills del curso (no solo las requeridas)
    INSERT INTO public.user_skills (
      user_id,
      skill_id,
      course_id,
      enrollment_id,
      proficiency_level,
      verified,
      verified_by,
      obtained_at,
      is_displayed
    )
    SELECT 
      NEW.user_id,
      cs.skill_id,
      NEW.course_id,
      NEW.enrollment_id,
      cs.proficiency_level,
      true,
      NULL,
      NEW.completed_at,
      true  -- Por defecto, mostrar la skill en el perfil
    FROM public.course_skills cs
    WHERE cs.course_id = NEW.course_id
      AND NOT EXISTS (
        SELECT 1 
        FROM public.user_skills us
        WHERE us.user_id = NEW.user_id
          AND us.skill_id = cs.skill_id
          AND us.course_id = NEW.course_id
      );
    
    -- Actualizar proficiency_level si el usuario ya tiene la skill de otro curso
    UPDATE public.user_skills us
    SET 
      proficiency_level = GREATEST(
        us.proficiency_level::text,
        cs.proficiency_level::text
      )::character varying,
      updated_at = now()
    FROM public.course_skills cs
    WHERE us.user_id = NEW.user_id
      AND us.skill_id = cs.skill_id
      AND cs.course_id = NEW.course_id
      AND cs.proficiency_level::text > us.proficiency_level::text
      AND us.course_id != NEW.course_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


