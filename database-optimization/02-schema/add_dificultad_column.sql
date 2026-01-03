-- ============================================================================
-- MIGRACIÓN: Agregar columna 'dificultad' a la tabla 'preguntas'
-- ============================================================================
-- Descripción: Agrega un campo para identificar el nivel de dificultad
--              del cuestionario (1-5, donde 1 es más fácil y 5 es más difícil)
-- ============================================================================

-- Agregar columna dificultad
ALTER TABLE "public"."preguntas" 
ADD COLUMN IF NOT EXISTS "dificultad" integer 
CHECK (dificultad IS NULL OR (dificultad >= 1 AND dificultad <= 5));

-- Comentario para documentar el campo
COMMENT ON COLUMN "public"."preguntas"."dificultad" IS 'Nivel de dificultad del cuestionario: 1 (más fácil) a 5 (más difícil). NULL para preguntas sin dificultad asignada.';

-- ============================================================================
-- NOTAS:
-- - Las preguntas están organizadas en 5 niveles de dificultad
-- - Cada nivel tiene 12 preguntas (6 Conocimiento + 6 Adopción)
-- - La dificultad es independiente del exclusivo_nivel_id (que se refiere al nivel jerárquico)
-- ============================================================================


