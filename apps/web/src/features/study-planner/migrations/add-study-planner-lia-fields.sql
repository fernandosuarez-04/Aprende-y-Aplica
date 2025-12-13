-- ============================================================================
-- MIGRACIÓN: Campos adicionales para el Planificador de Estudios con LIA
-- Fecha: 2024-12
-- Descripción: Agrega campos necesarios para almacenar análisis de LIA y metadata
-- ============================================================================

-- ============================================================================
-- MODIFICACIONES A study_plans
-- ============================================================================

-- Campos para tiempos de sesión
ALTER TABLE public.study_plans
ADD COLUMN IF NOT EXISTS min_session_minutes integer;

ALTER TABLE public.study_plans
ADD COLUMN IF NOT EXISTS max_session_minutes integer;

ALTER TABLE public.study_plans
ADD COLUMN IF NOT EXISTS break_duration_minutes integer;

-- Campos para análisis de calendario
ALTER TABLE public.study_plans
ADD COLUMN IF NOT EXISTS calendar_analyzed boolean DEFAULT false;

ALTER TABLE public.study_plans
ADD COLUMN IF NOT EXISTS calendar_provider text;

-- Campos para análisis de LIA
ALTER TABLE public.study_plans
ADD COLUMN IF NOT EXISTS lia_availability_analysis jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.study_plans
ADD COLUMN IF NOT EXISTS lia_time_analysis jsonb DEFAULT '{}'::jsonb;

-- Tipo de usuario y organización
ALTER TABLE public.study_plans
ADD COLUMN IF NOT EXISTS user_type text CHECK (user_type IS NULL OR user_type IN ('b2b', 'b2c'));

ALTER TABLE public.study_plans
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- IDs de cursos incluidos en el plan
ALTER TABLE public.study_plans
ADD COLUMN IF NOT EXISTS course_ids uuid[] DEFAULT '{}'::uuid[];

-- Comentarios para documentación
COMMENT ON COLUMN public.study_plans.min_session_minutes IS 'Tiempo mínimo de sesión en minutos (debe ser >= duración de lección más corta)';
COMMENT ON COLUMN public.study_plans.max_session_minutes IS 'Tiempo máximo de sesión en minutos';
COMMENT ON COLUMN public.study_plans.break_duration_minutes IS 'Tiempo de descanso entre sesiones en minutos';
COMMENT ON COLUMN public.study_plans.calendar_analyzed IS 'Si se analizó el calendario del usuario';
COMMENT ON COLUMN public.study_plans.calendar_provider IS 'Proveedor de calendario usado (google o microsoft)';
COMMENT ON COLUMN public.study_plans.lia_availability_analysis IS 'Análisis de disponibilidad generado por LIA';
COMMENT ON COLUMN public.study_plans.lia_time_analysis IS 'Análisis de tiempos generado por LIA';
COMMENT ON COLUMN public.study_plans.user_type IS 'Tipo de usuario (b2b o b2c)';
COMMENT ON COLUMN public.study_plans.organization_id IS 'ID de la organización (solo para B2B)';
COMMENT ON COLUMN public.study_plans.course_ids IS 'Array de IDs de cursos incluidos en el plan';

-- ============================================================================
-- MODIFICACIONES A study_sessions
-- ============================================================================

-- Campos para descansos
ALTER TABLE public.study_sessions
ADD COLUMN IF NOT EXISTS break_duration_minutes integer;

-- Verificación de conflictos con calendario
ALTER TABLE public.study_sessions
ADD COLUMN IF NOT EXISTS calendar_conflict_checked boolean DEFAULT false;

-- Si la sesión fue sugerida por LIA
ALTER TABLE public.study_sessions
ADD COLUMN IF NOT EXISTS lia_suggested boolean DEFAULT false;

-- Fecha límite del curso (para B2B)
ALTER TABLE public.study_sessions
ADD COLUMN IF NOT EXISTS due_date timestamp with time zone;

-- Comentarios para documentación
COMMENT ON COLUMN public.study_sessions.break_duration_minutes IS 'Tiempo de descanso después de esta sesión';
COMMENT ON COLUMN public.study_sessions.calendar_conflict_checked IS 'Si se verificó que no hay conflictos con el calendario';
COMMENT ON COLUMN public.study_sessions.lia_suggested IS 'Si esta sesión fue sugerida por LIA';
COMMENT ON COLUMN public.study_sessions.due_date IS 'Fecha límite del curso asociado (para usuarios B2B)';

-- ============================================================================
-- MODIFICACIONES A study_preferences
-- ============================================================================

-- Tiempos de sesión preferidos
ALTER TABLE public.study_preferences
ADD COLUMN IF NOT EXISTS min_session_minutes integer;

ALTER TABLE public.study_preferences
ADD COLUMN IF NOT EXISTS max_session_minutes integer;

ALTER TABLE public.study_preferences
ADD COLUMN IF NOT EXISTS break_duration_minutes integer;

-- Estado de conexión del calendario
ALTER TABLE public.study_preferences
ADD COLUMN IF NOT EXISTS calendar_connected boolean DEFAULT false;

ALTER TABLE public.study_preferences
ADD COLUMN IF NOT EXISTS calendar_provider text;

-- Comentarios para documentación
COMMENT ON COLUMN public.study_preferences.min_session_minutes IS 'Tiempo mínimo preferido de sesión';
COMMENT ON COLUMN public.study_preferences.max_session_minutes IS 'Tiempo máximo preferido de sesión';
COMMENT ON COLUMN public.study_preferences.break_duration_minutes IS 'Tiempo de descanso preferido';
COMMENT ON COLUMN public.study_preferences.calendar_connected IS 'Si el usuario tiene calendario conectado';
COMMENT ON COLUMN public.study_preferences.calendar_provider IS 'Proveedor de calendario conectado';

-- ============================================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================================

-- Índice para buscar planes por tipo de usuario
CREATE INDEX IF NOT EXISTS idx_study_plans_user_type 
ON public.study_plans(user_type);

-- Índice para buscar planes por organización
CREATE INDEX IF NOT EXISTS idx_study_plans_organization_id 
ON public.study_plans(organization_id);

-- Índice para buscar sesiones con plazos
CREATE INDEX IF NOT EXISTS idx_study_sessions_due_date 
ON public.study_sessions(due_date) 
WHERE due_date IS NOT NULL;

-- Índice para buscar sesiones generadas por LIA
CREATE INDEX IF NOT EXISTS idx_study_sessions_lia_suggested 
ON public.study_sessions(lia_suggested) 
WHERE lia_suggested = true;

-- ============================================================================
-- FUNCIONES ÚTILES
-- ============================================================================

-- Función para calcular el tiempo total de una lección
CREATE OR REPLACE FUNCTION calculate_lesson_total_time(p_lesson_id uuid)
RETURNS numeric AS $$
DECLARE
  v_video_minutes numeric;
  v_activities_minutes numeric;
  v_materials_minutes numeric;
  v_interactions_minutes numeric := 3; -- Tiempo fijo de interacciones
  v_total_minutes numeric;
BEGIN
  -- Obtener duración del video
  SELECT COALESCE(duration_seconds / 60.0, 0)
  INTO v_video_minutes
  FROM public.course_lessons
  WHERE lesson_id = p_lesson_id;
  
  -- Obtener tiempo de actividades
  SELECT COALESCE(SUM(COALESCE(estimated_time_minutes, 5)), 0)
  INTO v_activities_minutes
  FROM public.lesson_activities
  WHERE lesson_id = p_lesson_id;
  
  -- Obtener tiempo de materiales
  SELECT COALESCE(SUM(COALESCE(estimated_time_minutes, 5)), 0)
  INTO v_materials_minutes
  FROM public.lesson_materials
  WHERE lesson_id = p_lesson_id;
  
  -- Calcular total
  v_total_minutes := v_video_minutes + v_activities_minutes + v_materials_minutes + v_interactions_minutes;
  
  RETURN ROUND(v_total_minutes, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_lesson_total_time(uuid) IS 'Calcula el tiempo total estimado para completar una lección (video + actividades + materiales + interacciones)';

-- Función para validar tiempos de sesiones contra lecciones
CREATE OR REPLACE FUNCTION validate_session_times(p_plan_id uuid)
RETURNS TABLE(
  is_valid boolean,
  min_lesson_time numeric,
  plan_min_session numeric,
  error_message text
) AS $$
DECLARE
  v_min_lesson_time numeric;
  v_plan_min_session numeric;
  v_course_ids uuid[];
BEGIN
  -- Obtener IDs de cursos del plan
  SELECT course_ids INTO v_course_ids
  FROM public.study_plans
  WHERE id = p_plan_id;
  
  -- Obtener tiempo mínimo de sesión del plan
  SELECT min_session_minutes INTO v_plan_min_session
  FROM public.study_plans
  WHERE id = p_plan_id;
  
  -- Calcular tiempo mínimo de lección entre todos los cursos
  SELECT MIN(calculate_lesson_total_time(cl.lesson_id))
  INTO v_min_lesson_time
  FROM public.course_lessons cl
  JOIN public.course_modules cm ON cl.module_id = cm.module_id
  WHERE cm.course_id = ANY(v_course_ids)
    AND cl.is_published = true;
  
  -- Validar
  IF v_plan_min_session < v_min_lesson_time THEN
    RETURN QUERY SELECT 
      false,
      v_min_lesson_time,
      v_plan_min_session,
      'El tiempo mínimo de sesión es menor que la lección más corta';
  ELSE
    RETURN QUERY SELECT 
      true,
      v_min_lesson_time,
      v_plan_min_session,
      NULL::text;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_session_times(uuid) IS 'Valida que el tiempo mínimo de sesión del plan permita completar al menos una lección';

-- Función para verificar si un usuario B2B puede cumplir con los plazos
CREATE OR REPLACE FUNCTION check_b2b_deadlines(
  p_user_id uuid,
  p_weekly_study_minutes integer
)
RETURNS TABLE(
  course_id uuid,
  course_title text,
  due_date timestamp with time zone,
  remaining_minutes integer,
  weeks_needed numeric,
  can_complete boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oca.course_id,
    c.title,
    oca.due_date,
    COALESCE(c.duration_total_minutes * (100 - oca.completion_percentage) / 100, 0)::integer as remaining_minutes,
    ROUND(
      COALESCE(c.duration_total_minutes * (100 - oca.completion_percentage) / 100, 0)::numeric / 
      NULLIF(p_weekly_study_minutes, 0),
      1
    ) as weeks_needed,
    CASE 
      WHEN oca.due_date IS NULL THEN true
      WHEN (
        NOW() + (
          INTERVAL '1 week' * 
          ROUND(
            COALESCE(c.duration_total_minutes * (100 - oca.completion_percentage) / 100, 0)::numeric / 
            NULLIF(p_weekly_study_minutes, 0),
            1
          )
        )
      ) <= oca.due_date THEN true
      ELSE false
    END as can_complete
  FROM public.organization_course_assignments oca
  JOIN public.courses c ON oca.course_id = c.id
  WHERE oca.user_id = p_user_id
    AND oca.status NOT IN ('completed', 'cancelled')
  ORDER BY oca.due_date ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_b2b_deadlines(uuid, integer) IS 'Verifica si un usuario B2B puede cumplir con los plazos de sus cursos asignados dado un tiempo de estudio semanal';

-- ============================================================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================================================

-- Asegurar que las políticas RLS estén habilitadas
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_preferences ENABLE ROW LEVEL SECURITY;

-- Política para study_plans
DROP POLICY IF EXISTS study_plans_user_access ON public.study_plans;
CREATE POLICY study_plans_user_access ON public.study_plans
  FOR ALL
  USING (auth.uid() = user_id OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (auth.uid() = user_id OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Política para study_sessions
DROP POLICY IF EXISTS study_sessions_user_access ON public.study_sessions;
CREATE POLICY study_sessions_user_access ON public.study_sessions
  FOR ALL
  USING (auth.uid() = user_id OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (auth.uid() = user_id OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Política para study_preferences
DROP POLICY IF EXISTS study_preferences_user_access ON public.study_preferences;
CREATE POLICY study_preferences_user_access ON public.study_preferences
  FOR ALL
  USING (auth.uid() = user_id OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (auth.uid() = user_id OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================



