-- ============================================================================
-- MIGRACIÓN: Campos para Estrategias de Estudio Inteligentes
-- Fecha: 2025-01
-- Descripción: Agrega campos para modos de estudio (Pomodoro, balanced, intensive)
--              y configuración de prevención de burnout
-- ============================================================================

-- ============================================================================
-- MODIFICACIONES A study_plans
-- ============================================================================

-- Modo de estudio: define la estrategia de descansos
-- - 'pomodoro': 25 min estudio + 5 min descanso (cada 4 ciclos = 15 min descanso largo)
-- - 'balanced': Descansos proporcionales a la duración (sistema actual)
-- - 'intensive': Mínimos descansos, máximo contenido (para fechas límite urgentes)
ALTER TABLE public.study_plans
ADD COLUMN IF NOT EXISTS study_mode text DEFAULT 'balanced'
CHECK (study_mode IS NULL OR study_mode IN ('pomodoro', 'balanced', 'intensive'));

-- Máximo de horas consecutivas de estudio sin descanso largo (>= 30 min)
-- Valor por defecto: 2 horas (prevención de burnout)
ALTER TABLE public.study_plans
ADD COLUMN IF NOT EXISTS max_consecutive_hours integer DEFAULT 2
CHECK (max_consecutive_hours IS NULL OR (max_consecutive_hours >= 1 AND max_consecutive_hours <= 8));

-- Habilitar espaciado de repetición para mejor retención
-- Cuando está habilitado, el sistema reordena lecciones para repetir conceptos
ALTER TABLE public.study_plans
ADD COLUMN IF NOT EXISTS enable_spaced_repetition boolean DEFAULT false;

-- Configuración de intervalos de descanso personalizados (JSON)
-- Formato: { "shortBreak": 5, "longBreak": 15, "pomodorosBeforeLong": 4 }
ALTER TABLE public.study_plans
ADD COLUMN IF NOT EXISTS break_config jsonb DEFAULT '{
  "shortBreakMinutes": 5,
  "longBreakMinutes": 15,
  "pomodorosBeforeLongBreak": 4,
  "maxStudyBlockMinutes": 25
}'::jsonb;

-- ============================================================================
-- MODIFICACIONES A study_sessions
-- ============================================================================

-- Indica si la sesión incluye descansos integrados (para Pomodoro)
ALTER TABLE public.study_sessions
ADD COLUMN IF NOT EXISTS has_integrated_breaks boolean DEFAULT false;

-- Número de pomodoros en esta sesión (para modo Pomodoro)
ALTER TABLE public.study_sessions
ADD COLUMN IF NOT EXISTS pomodoro_count integer DEFAULT 0;

-- Total de minutos de descanso integrados en la sesión
ALTER TABLE public.study_sessions
ADD COLUMN IF NOT EXISTS integrated_break_minutes integer DEFAULT 0;

-- ============================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================================

COMMENT ON COLUMN public.study_plans.study_mode IS
'Modo de estudio: pomodoro (25+5), balanced (proporcional), intensive (mínimos descansos)';

COMMENT ON COLUMN public.study_plans.max_consecutive_hours IS
'Máximo de horas consecutivas sin descanso largo (>=30 min). Default: 2 horas para prevenir burnout';

COMMENT ON COLUMN public.study_plans.enable_spaced_repetition IS
'Si está habilitado, reordena lecciones para mejor retención usando espaciado de repetición';

COMMENT ON COLUMN public.study_plans.break_config IS
'Configuración JSON de descansos: shortBreakMinutes, longBreakMinutes, pomodorosBeforeLongBreak, maxStudyBlockMinutes';

COMMENT ON COLUMN public.study_sessions.has_integrated_breaks IS
'Indica si la sesión tiene descansos Pomodoro integrados en su duración';

COMMENT ON COLUMN public.study_sessions.pomodoro_count IS
'Número de ciclos Pomodoro en esta sesión (solo aplica si study_mode = pomodoro)';

COMMENT ON COLUMN public.study_sessions.integrated_break_minutes IS
'Total de minutos de descanso incluidos en la duración de la sesión';

-- ============================================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================================

-- Índice para filtrar planes por modo de estudio
CREATE INDEX IF NOT EXISTS idx_study_plans_study_mode
ON public.study_plans(study_mode)
WHERE study_mode IS NOT NULL;

-- ============================================================================
-- VALORES POR DEFECTO PARA REGISTROS EXISTENTES
-- ============================================================================

-- Actualizar planes existentes que no tienen modo de estudio
UPDATE public.study_plans
SET study_mode = 'balanced'
WHERE study_mode IS NULL;

UPDATE public.study_plans
SET max_consecutive_hours = 2
WHERE max_consecutive_hours IS NULL;

UPDATE public.study_plans
SET enable_spaced_repetition = false
WHERE enable_spaced_repetition IS NULL;
