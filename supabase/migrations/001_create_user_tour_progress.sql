-- Tabla para rastrear el progreso de tours por usuario
-- Esta tabla permite saber si es la primera vez que el usuario entra a una página

CREATE TABLE public.user_tour_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tour_id text NOT NULL,                -- Ej: 'dashboard', 'study-planner', 'courses'
  completed_at timestamp with time zone,
  skipped_at timestamp with time zone,  -- Si el usuario omitió el tour
  step_reached integer DEFAULT 0,       -- Último paso alcanzado
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_tour_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_tour_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT user_tour_progress_unique UNIQUE (user_id, tour_id)
);

-- Índice para búsquedas rápidas por usuario
CREATE INDEX idx_user_tour_progress_user_id ON public.user_tour_progress(user_id);

-- Índice para búsquedas por combinación usuario-tour
CREATE INDEX idx_user_tour_progress_user_tour ON public.user_tour_progress(user_id, tour_id);

-- Comentarios de documentación
COMMENT ON TABLE public.user_tour_progress IS 'Rastrea qué tours ha visto cada usuario en la plataforma';
COMMENT ON COLUMN public.user_tour_progress.tour_id IS 'Identificador único del tour: dashboard, study-planner, courses, etc.';
COMMENT ON COLUMN public.user_tour_progress.completed_at IS 'Timestamp cuando el usuario completó todo el tour';
COMMENT ON COLUMN public.user_tour_progress.skipped_at IS 'Timestamp cuando el usuario saltó el tour';
COMMENT ON COLUMN public.user_tour_progress.step_reached IS 'Último paso del tour que el usuario alcanzó';
