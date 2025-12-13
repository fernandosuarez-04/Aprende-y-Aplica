-- ============================================================================
-- FIX: Convertir duration_minutes de GENERATED a columna normal con trigger
-- Fecha: 2024-12
-- Descripción: Convierte duration_minutes de columna GENERATED a columna normal
-- y usa un trigger para calcular automáticamente cuando no se proporciona valor
-- ============================================================================

-- Paso 1: Eliminar la expresión GENERATED para convertirla en columna normal
-- Esto convierte la columna GENERATED en una columna normal que puede aceptar valores explícitos
ALTER TABLE public.study_sessions
ALTER COLUMN duration_minutes DROP EXPRESSION;

-- Paso 2: Hacer la columna nullable temporalmente para permitir inserción sin valor
ALTER TABLE public.study_sessions
ALTER COLUMN duration_minutes DROP NOT NULL;

-- Paso 3: Crear función trigger que calcula duration_minutes automáticamente
CREATE OR REPLACE FUNCTION calculate_duration_minutes()
RETURNS TRIGGER AS $$
BEGIN
  -- Si duration_minutes no fue proporcionado o es NULL, calcularlo
  IF NEW.duration_minutes IS NULL AND NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
    NEW.duration_minutes := GREATEST(1, EXTRACT(epoch FROM (NEW.end_time - NEW.start_time)) / 60)::integer;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Paso 4: Crear trigger que ejecuta la función antes de INSERT o UPDATE
DROP TRIGGER IF EXISTS trg_calculate_duration_minutes ON public.study_sessions;
CREATE TRIGGER trg_calculate_duration_minutes
  BEFORE INSERT OR UPDATE OF start_time, end_time, duration_minutes ON public.study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_duration_minutes();

-- Paso 5: Actualizar registros existentes que puedan tener NULL
UPDATE public.study_sessions
SET duration_minutes = GREATEST(1, EXTRACT(epoch FROM (end_time - start_time)) / 60)::integer
WHERE duration_minutes IS NULL;

-- Paso 6: Hacer la columna NOT NULL nuevamente (opcional, pero recomendado)
-- ALTER TABLE public.study_sessions
-- ALTER COLUMN duration_minutes SET NOT NULL;

-- Comentario para documentación
COMMENT ON COLUMN public.study_sessions.duration_minutes IS 
'Duración de la sesión en minutos. Se calcula automáticamente si no se proporciona, pero permite valores explícitos.';
COMMENT ON FUNCTION calculate_duration_minutes() IS 
'Función trigger que calcula duration_minutes automáticamente cuando no se proporciona un valor explícito.';

