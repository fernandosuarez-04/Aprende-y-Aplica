-- Migración: Crear tabla user_calendar_events
-- Esta tabla almacena eventos de calendario personalizados creados por el usuario

CREATE TABLE IF NOT EXISTS public.user_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  is_all_day BOOLEAN DEFAULT FALSE,
  provider TEXT DEFAULT 'local', -- 'local', 'google', 'microsoft'
  source TEXT DEFAULT 'user_created', -- 'user_created', 'calendar_sync'
  google_event_id TEXT, -- ID del evento en Google Calendar si está sincronizado
  microsoft_event_id TEXT, -- ID del evento en Microsoft Calendar si está sincronizado
  color TEXT, -- Color personalizado del evento (hex code)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_user_id ON public.user_calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_start_time ON public.user_calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_end_time ON public.user_calendar_events(end_time);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_provider ON public.user_calendar_events(provider);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_google_event_id ON public.user_calendar_events(google_event_id) WHERE google_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_microsoft_event_id ON public.user_calendar_events(microsoft_event_id) WHERE microsoft_event_id IS NOT NULL;

-- RLS (Row Level Security)
ALTER TABLE public.user_calendar_events ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propios eventos
CREATE POLICY "Users can view their own calendar events"
  ON public.user_calendar_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden crear sus propios eventos
CREATE POLICY "Users can create their own calendar events"
  ON public.user_calendar_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propios eventos
CREATE POLICY "Users can update their own calendar events"
  ON public.user_calendar_events
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propios eventos
CREATE POLICY "Users can delete their own calendar events"
  ON public.user_calendar_events
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_user_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_calendar_events_updated_at
  BEFORE UPDATE ON public.user_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_user_calendar_events_updated_at();

