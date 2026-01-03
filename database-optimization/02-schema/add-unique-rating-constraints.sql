-- ============================================================================
-- Script para agregar restricciones UNIQUE a las tablas de ratings
-- ============================================================================
-- Este script agrega restricciones de unicidad para evitar que un usuario
-- califique el mismo item (curso, prompt o herramienta de IA) múltiples veces.
--
-- Fecha: Diciembre 2024
-- ============================================================================

-- ============================================================================
-- 1. Restricción para app_ratings (Herramientas de IA)
-- ============================================================================
-- Evita que un usuario califique la misma herramienta de IA más de una vez
-- Si ya existe un rating, el usuario solo puede actualizarlo, no crear uno nuevo

DO $$
BEGIN
    -- Verificar si la restricción ya existe antes de crearla
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'app_ratings_user_app_unique'
    ) THEN
        ALTER TABLE public.app_ratings
        ADD CONSTRAINT app_ratings_user_app_unique 
        UNIQUE (app_id, user_id);
        
        RAISE NOTICE 'Restricción app_ratings_user_app_unique agregada exitosamente';
    ELSE
        RAISE NOTICE 'La restricción app_ratings_user_app_unique ya existe';
    END IF;
END $$;

-- ============================================================================
-- 2. Restricción para prompt_ratings (Prompts)
-- ============================================================================
-- Evita que un usuario califique el mismo prompt más de una vez
-- Si ya existe un rating, el usuario solo puede actualizarlo, no crear uno nuevo

DO $$
BEGIN
    -- Verificar si la restricción ya existe antes de crearla
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'prompt_ratings_user_prompt_unique'
    ) THEN
        ALTER TABLE public.prompt_ratings
        ADD CONSTRAINT prompt_ratings_user_prompt_unique 
        UNIQUE (prompt_id, user_id);
        
        RAISE NOTICE 'Restricción prompt_ratings_user_prompt_unique agregada exitosamente';
    ELSE
        RAISE NOTICE 'La restricción prompt_ratings_user_prompt_unique ya existe';
    END IF;
END $$;

-- ============================================================================
-- 3. Restricción para course_reviews (Cursos/Talleres)
-- ============================================================================
-- Evita que un usuario califique el mismo curso más de una vez
-- Si ya existe un review, el usuario solo puede actualizarlo, no crear uno nuevo

DO $$
BEGIN
    -- Verificar si la restricción ya existe antes de crearla
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'course_reviews_user_course_unique'
    ) THEN
        ALTER TABLE public.course_reviews
        ADD CONSTRAINT course_reviews_user_course_unique 
        UNIQUE (course_id, user_id);
        
        RAISE NOTICE 'Restricción course_reviews_user_course_unique agregada exitosamente';
    ELSE
        RAISE NOTICE 'La restricción course_reviews_user_course_unique ya existe';
    END IF;
END $$;

-- ============================================================================
-- Verificación de restricciones agregadas
-- ============================================================================
-- Consulta para verificar que las restricciones se hayan creado correctamente

SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname IN (
    'app_ratings_user_app_unique',
    'prompt_ratings_user_prompt_unique',
    'course_reviews_user_course_unique'
)
ORDER BY conname;

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. Este script es idempotente: puede ejecutarse múltiples veces sin errores
-- 2. Si existen datos duplicados en la BD, este script fallará
-- 3. Antes de ejecutar, verifica si hay ratings duplicados con:
--
--    -- Para app_ratings:
--    SELECT app_id, user_id, COUNT(*) 
--    FROM app_ratings 
--    GROUP BY app_id, user_id 
--    HAVING COUNT(*) > 1;
--
--    -- Para prompt_ratings:
--    SELECT prompt_id, user_id, COUNT(*) 
--    FROM prompt_ratings 
--    GROUP BY prompt_id, user_id 
--    HAVING COUNT(*) > 1;
--
--    -- Para course_reviews:
--    SELECT course_id, user_id, COUNT(*) 
--    FROM course_reviews 
--    GROUP BY course_id, user_id 
--    HAVING COUNT(*) > 1;
--
-- 4. Si hay duplicados, deberás limpiarlos antes de ejecutar este script
-- ============================================================================




































