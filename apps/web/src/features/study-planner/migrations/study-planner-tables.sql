-- =====================================================
-- STUDY PLANNER DATABASE MIGRATIONS
-- Planificador de Estudios con LIA - Sistema Conversacional
-- =====================================================

-- 1. Modificar tabla study_plans existente
-- =====================================================

-- Agregar columnas para configuración de sesiones
ALTER TABLE study_plans
ADD COLUMN IF NOT EXISTS min_session_minutes integer,
ADD COLUMN IF NOT EXISTS max_session_minutes integer,
ADD COLUMN IF NOT EXISTS break_duration_minutes integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS user_type text CHECK (user_type IN ('b2b', 'b2c')),
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS work_team_id uuid REFERENCES work_teams(team_id);

-- Agregar columnas adicionales si no existen
ALTER TABLE study_plans
ADD COLUMN IF NOT EXISTS generation_mode text DEFAULT 'manual' CHECK (generation_mode IN ('manual', 'ai_generated')),
ADD COLUMN IF NOT EXISTS ai_generation_metadata jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS preferred_session_type text DEFAULT 'medium' CHECK (preferred_session_type IN ('short', 'medium', 'long'));

-- Comentarios descriptivos
COMMENT ON COLUMN study_plans.min_session_minutes IS 'Duración mínima de sesión en minutos';
COMMENT ON COLUMN study_plans.max_session_minutes IS 'Duración máxima de sesión en minutos';
COMMENT ON COLUMN study_plans.break_duration_minutes IS 'Duración predeterminada de descansos en minutos';
COMMENT ON COLUMN study_plans.user_type IS 'Tipo de usuario: b2b (empresarial) o b2c (independiente)';
COMMENT ON COLUMN study_plans.organization_id IS 'ID de la organización para usuarios B2B';
COMMENT ON COLUMN study_plans.work_team_id IS 'ID del equipo de trabajo para usuarios B2B';
COMMENT ON COLUMN study_plans.generation_mode IS 'Modo de generación: manual o ai_generated';
COMMENT ON COLUMN study_plans.preferred_session_type IS 'Tipo de sesión preferida: short, medium, long';

-- 2. Crear tabla study_plan_courses
-- =====================================================
-- Almacena los cursos incluidos en cada plan con su orden y configuración

CREATE TABLE IF NOT EXISTS study_plan_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id),
  course_order integer NOT NULL DEFAULT 0,
  is_required boolean DEFAULT true,
  suggested_by_ai boolean DEFAULT false,
  added_at timestamp with time zone DEFAULT now(),
  UNIQUE(plan_id, course_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_study_plan_courses_plan_id ON study_plan_courses(plan_id);
CREATE INDEX IF NOT EXISTS idx_study_plan_courses_course_id ON study_plan_courses(course_id);

-- Comentarios descriptivos
COMMENT ON TABLE study_plan_courses IS 'Cursos incluidos en cada plan de estudio con su orden y configuración';
COMMENT ON COLUMN study_plan_courses.course_order IS 'Orden del curso dentro del plan (0 = primero)';
COMMENT ON COLUMN study_plan_courses.is_required IS 'Indica si el curso es obligatorio o complementario';
COMMENT ON COLUMN study_plan_courses.suggested_by_ai IS 'Indica si el curso fue sugerido por LIA';

-- 3. Crear tabla study_plan_break_schedule
-- =====================================================
-- Almacena la configuración de descansos según duración de sesión

CREATE TABLE IF NOT EXISTS study_plan_break_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  session_duration_minutes integer NOT NULL,
  break_after_minutes integer NOT NULL,
  break_duration_minutes integer NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Índice para búsquedas por plan
CREATE INDEX IF NOT EXISTS idx_study_plan_break_schedule_plan_id ON study_plan_break_schedule(plan_id);

-- Comentarios descriptivos
COMMENT ON TABLE study_plan_break_schedule IS 'Configuración de descansos automáticos según duración de sesión';
COMMENT ON COLUMN study_plan_break_schedule.session_duration_minutes IS 'Duración de la sesión a la que aplica este descanso';
COMMENT ON COLUMN study_plan_break_schedule.break_after_minutes IS 'Minutos después de los cuales tomar el descanso';
COMMENT ON COLUMN study_plan_break_schedule.break_duration_minutes IS 'Duración del descanso en minutos';

-- 4. Modificar tabla study_sessions si es necesario
-- =====================================================

ALTER TABLE study_sessions
ADD COLUMN IF NOT EXISTS lesson_id uuid REFERENCES course_lessons(lesson_id),
ADD COLUMN IF NOT EXISTS is_ai_generated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS streak_day integer,
ADD COLUMN IF NOT EXISTS lesson_min_time_minutes integer,
ADD COLUMN IF NOT EXISTS session_type text DEFAULT 'medium' CHECK (session_type IN ('short', 'medium', 'long')),
ADD COLUMN IF NOT EXISTS course_complexity jsonb DEFAULT '{}'::jsonb;

-- Comentarios
COMMENT ON COLUMN study_sessions.lesson_id IS 'ID de la lección específica asignada a esta sesión';
COMMENT ON COLUMN study_sessions.is_ai_generated IS 'Indica si la sesión fue generada automáticamente por LIA';
COMMENT ON COLUMN study_sessions.streak_day IS 'Día de racha consecutiva del usuario';
COMMENT ON COLUMN study_sessions.lesson_min_time_minutes IS 'Tiempo mínimo de la lección asignada';
COMMENT ON COLUMN study_sessions.session_type IS 'Tipo de sesión aplicado';
COMMENT ON COLUMN study_sessions.course_complexity IS 'Información de complejidad del curso (level, category, multiplier)';

-- 5. Crear tabla lesson_time_estimates si no existe
-- =====================================================
-- Almacena tiempos pre-calculados de lecciones para mejor rendimiento

CREATE TABLE IF NOT EXISTS lesson_time_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES course_lessons(lesson_id),
  video_duration_seconds integer NOT NULL DEFAULT 0,
  video_minutes numeric GENERATED ALWAYS AS ((video_duration_seconds / 60.0)) STORED,
  activities_time_minutes numeric DEFAULT 0,
  reading_time_minutes numeric DEFAULT 0,
  interactions_time_minutes numeric DEFAULT 3,
  quiz_time_minutes numeric DEFAULT 0,
  total_time_minutes numeric GENERATED ALWAYS AS (
    (video_duration_seconds / 60.0) + 
    activities_time_minutes + 
    reading_time_minutes + 
    interactions_time_minutes + 
    quiz_time_minutes
  ) STORED,
  calculated_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lesson_time_estimates_lesson_id_unique UNIQUE (lesson_id)
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_lesson_time_estimates_lesson_id ON lesson_time_estimates(lesson_id);

-- Comentarios
COMMENT ON TABLE lesson_time_estimates IS 'Tiempos pre-calculados de lecciones para el planificador';
COMMENT ON COLUMN lesson_time_estimates.activities_time_minutes IS 'Suma de tiempos de actividades (proporcionados por instructor)';
COMMENT ON COLUMN lesson_time_estimates.reading_time_minutes IS 'Suma de tiempos de lecturas (proporcionados por instructor)';
COMMENT ON COLUMN lesson_time_estimates.interactions_time_minutes IS 'Tiempo fijo de interacciones (3 minutos)';
COMMENT ON COLUMN lesson_time_estimates.quiz_time_minutes IS 'Suma de tiempos de quizzes';

-- 6. Modificar tablas de actividades y materiales
-- =====================================================

-- Agregar campo de tiempo estimado a lesson_activities si no existe
ALTER TABLE lesson_activities
ADD COLUMN IF NOT EXISTS estimated_time_minutes integer CHECK (estimated_time_minutes >= 1);

COMMENT ON COLUMN lesson_activities.estimated_time_minutes IS 'Tiempo estimado en minutos (proporcionado por instructor)';

-- Agregar campo de tiempo estimado a lesson_materials si no existe
ALTER TABLE lesson_materials
ADD COLUMN IF NOT EXISTS estimated_time_minutes integer CHECK (estimated_time_minutes >= 1);

COMMENT ON COLUMN lesson_materials.estimated_time_minutes IS 'Tiempo estimado en minutos (proporcionado por instructor)';

-- 7. Modificar study_preferences si es necesario
-- =====================================================

ALTER TABLE study_preferences
ADD COLUMN IF NOT EXISTS preferred_session_type text DEFAULT 'medium' CHECK (preferred_session_type IN ('short', 'medium', 'long'));

COMMENT ON COLUMN study_preferences.preferred_session_type IS 'Tipo de sesión preferido por el usuario';

-- 8. Función para calcular tiempo de lección en tiempo real
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_lesson_total_time(p_lesson_id uuid)
RETURNS numeric AS $$
DECLARE
  v_video_minutes numeric;
  v_activities_minutes numeric := 0;
  v_materials_minutes numeric := 0;
  v_interactions_minutes numeric := 3; -- Fijo
  v_total_minutes numeric;
BEGIN
  -- Obtener duración del video
  SELECT (duration_seconds / 60.0) INTO v_video_minutes
  FROM course_lessons
  WHERE lesson_id = p_lesson_id;
  
  IF v_video_minutes IS NULL THEN
    v_video_minutes := 0;
  END IF;
  
  -- Sumar tiempos de actividades
  SELECT COALESCE(SUM(estimated_time_minutes), 0) INTO v_activities_minutes
  FROM lesson_activities
  WHERE lesson_id = p_lesson_id
    AND estimated_time_minutes IS NOT NULL;
  
  -- Sumar tiempos de materiales
  SELECT COALESCE(SUM(estimated_time_minutes), 0) INTO v_materials_minutes
  FROM lesson_materials
  WHERE lesson_id = p_lesson_id
    AND estimated_time_minutes IS NOT NULL;
  
  -- Calcular total
  v_total_minutes := v_video_minutes + v_activities_minutes + v_materials_minutes + v_interactions_minutes;
  
  RETURN CEIL(v_total_minutes);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_lesson_total_time IS 'Calcula el tiempo total de una lección incluyendo video, actividades, materiales e interacciones';

-- 9. Función trigger para actualizar lesson_time_estimates
-- =====================================================

CREATE OR REPLACE FUNCTION update_lesson_time_estimate()
RETURNS TRIGGER AS $$
DECLARE
  v_lesson_id uuid;
  v_video_seconds integer;
  v_activities_minutes numeric;
  v_materials_minutes numeric;
BEGIN
  -- Determinar lesson_id según la tabla
  IF TG_TABLE_NAME = 'course_lessons' THEN
    v_lesson_id := COALESCE(NEW.lesson_id, OLD.lesson_id);
  ELSIF TG_TABLE_NAME = 'lesson_activities' THEN
    v_lesson_id := COALESCE(NEW.lesson_id, OLD.lesson_id);
  ELSIF TG_TABLE_NAME = 'lesson_materials' THEN
    v_lesson_id := COALESCE(NEW.lesson_id, OLD.lesson_id);
  END IF;
  
  IF v_lesson_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Obtener datos actuales
  SELECT duration_seconds INTO v_video_seconds
  FROM course_lessons WHERE lesson_id = v_lesson_id;
  
  SELECT COALESCE(SUM(estimated_time_minutes), 0) INTO v_activities_minutes
  FROM lesson_activities WHERE lesson_id = v_lesson_id;
  
  SELECT COALESCE(SUM(estimated_time_minutes), 0) INTO v_materials_minutes
  FROM lesson_materials WHERE lesson_id = v_lesson_id;
  
  -- Insertar o actualizar estimación
  INSERT INTO lesson_time_estimates (
    lesson_id,
    video_duration_seconds,
    activities_time_minutes,
    reading_time_minutes,
    updated_at
  ) VALUES (
    v_lesson_id,
    COALESCE(v_video_seconds, 0),
    v_activities_minutes,
    v_materials_minutes,
    now()
  )
  ON CONFLICT (lesson_id) DO UPDATE SET
    video_duration_seconds = COALESCE(v_video_seconds, 0),
    activities_time_minutes = v_activities_minutes,
    reading_time_minutes = v_materials_minutes,
    updated_at = now();
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Crear triggers (drop primero si existen)
DROP TRIGGER IF EXISTS trg_update_lesson_time_on_lesson ON course_lessons;
DROP TRIGGER IF EXISTS trg_update_lesson_time_on_activity ON lesson_activities;
DROP TRIGGER IF EXISTS trg_update_lesson_time_on_material ON lesson_materials;

CREATE TRIGGER trg_update_lesson_time_on_lesson
  AFTER INSERT OR UPDATE OF duration_seconds ON course_lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_time_estimate();

CREATE TRIGGER trg_update_lesson_time_on_activity
  AFTER INSERT OR UPDATE OR DELETE ON lesson_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_time_estimate();

CREATE TRIGGER trg_update_lesson_time_on_material
  AFTER INSERT OR UPDATE OR DELETE ON lesson_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_time_estimate();

-- 10. Políticas RLS para las nuevas tablas
-- =====================================================

-- RLS para study_plan_courses
ALTER TABLE study_plan_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plan courses"
  ON study_plan_courses FOR SELECT
  USING (
    plan_id IN (
      SELECT id FROM study_plans WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own plan courses"
  ON study_plan_courses FOR INSERT
  WITH CHECK (
    plan_id IN (
      SELECT id FROM study_plans WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own plan courses"
  ON study_plan_courses FOR DELETE
  USING (
    plan_id IN (
      SELECT id FROM study_plans WHERE user_id = auth.uid()
    )
  );

-- RLS para study_plan_break_schedule
ALTER TABLE study_plan_break_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own break schedules"
  ON study_plan_break_schedule FOR SELECT
  USING (
    plan_id IN (
      SELECT id FROM study_plans WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own break schedules"
  ON study_plan_break_schedule FOR INSERT
  WITH CHECK (
    plan_id IN (
      SELECT id FROM study_plans WHERE user_id = auth.uid()
    )
  );

-- RLS para lesson_time_estimates (lectura pública)
ALTER TABLE lesson_time_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lesson time estimates"
  ON lesson_time_estimates FOR SELECT
  USING (true);

-- =====================================================
-- FIN DE MIGRACIONES
-- =====================================================



