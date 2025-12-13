-- Migración: Agregar campos de tiempos y intervalos de descanso a study_plans
-- Fecha: 2024-12
-- Descripción: Agrega campos para almacenar configuración de tiempos de estudio y descanso,
-- así como los intervalos de descanso calculados automáticamente

ALTER TABLE study_plans
ADD COLUMN IF NOT EXISTS min_study_minutes INTEGER,
ADD COLUMN IF NOT EXISTS min_rest_minutes INTEGER,
ADD COLUMN IF NOT EXISTS max_study_session_minutes INTEGER,
ADD COLUMN IF NOT EXISTS break_intervals JSONB DEFAULT '[]'::jsonb;

-- Comentarios para documentación
COMMENT ON COLUMN study_plans.min_study_minutes IS 'Tiempo mínimo de estudio por sesión en minutos';
COMMENT ON COLUMN study_plans.min_rest_minutes IS 'Tiempo mínimo de descanso entre sesiones en minutos';
COMMENT ON COLUMN study_plans.max_study_session_minutes IS 'Tiempo máximo de sesión continua en minutos';
COMMENT ON COLUMN study_plans.break_intervals IS 'Intervalos de descanso calculados automáticamente. Formato: [{"interval_minutes": 25, "break_duration_minutes": 5, "break_type": "short"}]';



