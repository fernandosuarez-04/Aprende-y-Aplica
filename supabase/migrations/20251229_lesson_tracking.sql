-- Migration: Create lesson_tracking table for study session tracking
-- Date: 2025-12-29
-- Description: Nueva tabla para registro en tiempo real del estado de cada lección
--              durante el proceso de estudio en /courses/[slug]/learn

-- ============================================================================
-- TABLA: lesson_tracking
-- ============================================================================
-- Registra el estado y progreso de cada lección mientras el usuario estudia.
-- Esta tabla es el corazón del tracking de sesiones de estudio.

CREATE TABLE IF NOT EXISTS public.lesson_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(lesson_id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.study_sessions(id) ON DELETE SET NULL,
  plan_id uuid REFERENCES public.study_plans(id) ON DELETE SET NULL,
  
  -- Estado del tracking
  status text NOT NULL DEFAULT 'not_started' 
    CHECK (status IN ('not_started', 'in_progress', 'completed')),
  
  -- Timestamps de inicio
  started_at timestamp with time zone,
  start_trigger text CHECK (start_trigger IN ('video_play', 'page_load', 'manual')),
  
  -- Video tracking
  video_started_at timestamp with time zone,
  video_ended_at timestamp with time zone,
  
  -- LIA tracking (Flujo B - Lecciones con actividad LIA)
  lia_first_message_at timestamp with time zone,  -- Primer mensaje del usuario a LIA
  lia_last_message_at timestamp with time zone,   -- Último mensaje del usuario a LIA
  
  -- Activity tracking (Flujo C - Lecciones sin quiz ni LIA)
  post_content_start_at timestamp with time zone, -- Cuando terminó contenido esencial
  last_activity_at timestamp with time zone,       -- Última actividad detectada
  
  -- Programación del cron para análisis de inactividad
  next_analysis_at timestamp with time zone,
  
  -- Información de completado
  completed_at timestamp with time zone,
  end_trigger text CHECK (end_trigger IN (
    'quiz_submitted',        -- Flujo A: Completó quiz
    'lia_inactivity_5m',     -- Flujo B: 5min sin mensajes a LIA
    'activity_inactivity_5m', -- Flujo C: 5min sin actividad general
    'context_changed',       -- Navegó a otra lección
    'manual'                 -- Cierre manual/forzado
  )),
  
  -- Tiempos calculados de la lección (en minutos)
  t_lesson_minutes numeric,    -- Tiempo total estimado de la lección
  t_video_minutes numeric,     -- Duración del video
  t_materials_minutes numeric, -- Tiempo estimado de materiales
  t_restante_minutes numeric,  -- T_lección - T_video - T_materiales
  
  -- Metadatos
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT lesson_tracking_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_tracking_unique UNIQUE (user_id, lesson_id, session_id)
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

-- Índice principal para el cron job: buscar trackings pendientes de análisis
CREATE INDEX IF NOT EXISTS idx_lesson_tracking_next_analysis 
  ON public.lesson_tracking (next_analysis_at) 
  WHERE status = 'in_progress' AND next_analysis_at IS NOT NULL;

-- Índice para consultas por usuario y estado
CREATE INDEX IF NOT EXISTS idx_lesson_tracking_user_status 
  ON public.lesson_tracking (user_id, status);

-- Índice para consultas por sesión de estudio
CREATE INDEX IF NOT EXISTS idx_lesson_tracking_session 
  ON public.lesson_tracking (session_id) 
  WHERE session_id IS NOT NULL;

-- ============================================================================
-- MODIFICACIONES A study_sessions
-- ============================================================================

-- Agregar campo para registro del momento exacto de inicio (distinto de start_time planificado)
ALTER TABLE public.study_sessions
  ADD COLUMN IF NOT EXISTS started_at timestamp with time zone;

-- Agregar campo para método de completado
ALTER TABLE public.study_sessions
  ADD COLUMN IF NOT EXISTS completion_method text 
    CHECK (completion_method IS NULL OR completion_method IN (
      'quiz',              -- Completó por quiz
      'lia_inactivity',    -- Completó por inactividad LIA
      'activity_inactivity', -- Completó por inactividad general
      'context_changed',   -- Completó por cambio de contexto
      'manual'             -- Completado manualmente
    ));

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON TABLE public.lesson_tracking IS 
  'Tracking en tiempo real del estado de cada lección durante el estudio';

COMMENT ON COLUMN public.lesson_tracking.next_analysis_at IS 
  'Próxima vez que el cron debe evaluar esta lección para cierre por inactividad';

COMMENT ON COLUMN public.lesson_tracking.end_trigger IS 
  'Qué evento disparó el cierre de la lección';

COMMENT ON COLUMN public.lesson_tracking.t_restante_minutes IS 
  'Tiempo restante después del video y materiales, usado para programar primer análisis LIA';
