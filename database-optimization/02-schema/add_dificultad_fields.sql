-- ============================================================================
-- Script para agregar campos de dificultad al sistema de cuestionarios
-- ============================================================================
-- Este script agrega:
-- 1. Campo 'dificultad' a la tabla preguntas (integer, valores 1-5)
-- 2. Campo 'dificultad_id' a la tabla user_perfil (integer, valores 1-5)
-- 3. Campo 'uso_ia_respuesta' a la tabla user_perfil (text, para almacenar la respuesta sobre uso de IA)
-- ============================================================================

-- Agregar campo dificultad a la tabla preguntas
ALTER TABLE public.preguntas 
ADD COLUMN IF NOT EXISTS dificultad integer CHECK (dificultad IS NULL OR (dificultad >= 1 AND dificultad <= 5));

-- Agregar comentario al campo
COMMENT ON COLUMN public.preguntas.dificultad IS 'Nivel de dificultad de la pregunta (1=muy básico, 5=muy avanzado). Se usa para asignar cuestionarios personalizados.';

-- Agregar campo dificultad_id a la tabla user_perfil
ALTER TABLE public.user_perfil 
ADD COLUMN IF NOT EXISTS dificultad_id integer CHECK (dificultad_id IS NULL OR (dificultad_id >= 1 AND dificultad_id <= 5));

-- Agregar campo uso_ia_respuesta para almacenar la respuesta sobre uso de IA
ALTER TABLE public.user_perfil 
ADD COLUMN IF NOT EXISTS uso_ia_respuesta text;

-- Agregar comentarios
COMMENT ON COLUMN public.user_perfil.dificultad_id IS 'Nivel de dificultad asignado al usuario basado en su cargo, área, nivel y uso de IA (1=muy básico, 5=muy avanzado)';
COMMENT ON COLUMN public.user_perfil.uso_ia_respuesta IS 'Respuesta del usuario a la pregunta sobre uso de IA en su ámbito laboral';

-- Crear índice para mejorar consultas por dificultad
CREATE INDEX IF NOT EXISTS idx_preguntas_dificultad ON public.preguntas(dificultad);
CREATE INDEX IF NOT EXISTS idx_preguntas_rol_dificultad ON public.preguntas(exclusivo_rol_id, dificultad);
CREATE INDEX IF NOT EXISTS idx_user_perfil_dificultad ON public.user_perfil(dificultad_id);


















