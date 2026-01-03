-- ============================================================================
-- Script de ROLLBACK para eliminar restricciones UNIQUE de las tablas de ratings
-- ============================================================================
-- Este script revierte los cambios realizados por add-unique-rating-constraints.sql
-- Úsalo solo si necesitas eliminar las restricciones de unicidad.
--
-- Fecha: Diciembre 2024
-- ============================================================================

-- ============================================================================
-- 1. Eliminar restricción de app_ratings
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'app_ratings_user_app_unique'
    ) THEN
        ALTER TABLE public.app_ratings
        DROP CONSTRAINT app_ratings_user_app_unique;
        
        RAISE NOTICE 'Restricción app_ratings_user_app_unique eliminada exitosamente';
    ELSE
        RAISE NOTICE 'La restricción app_ratings_user_app_unique no existe';
    END IF;
END $$;

-- ============================================================================
-- 2. Eliminar restricción de prompt_ratings
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'prompt_ratings_user_prompt_unique'
    ) THEN
        ALTER TABLE public.prompt_ratings
        DROP CONSTRAINT prompt_ratings_user_prompt_unique;
        
        RAISE NOTICE 'Restricción prompt_ratings_user_prompt_unique eliminada exitosamente';
    ELSE
        RAISE NOTICE 'La restricción prompt_ratings_user_prompt_unique no existe';
    END IF;
END $$;

-- ============================================================================
-- 3. Eliminar restricción de course_reviews
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'course_reviews_user_course_unique'
    ) THEN
        ALTER TABLE public.course_reviews
        DROP CONSTRAINT course_reviews_user_course_unique;
        
        RAISE NOTICE 'Restricción course_reviews_user_course_unique eliminada exitosamente';
    ELSE
        RAISE NOTICE 'La restricción course_reviews_user_course_unique no existe';
    END IF;
END $$;

-- ============================================================================
-- Verificación de restricciones eliminadas
-- ============================================================================
-- Esta consulta debería devolver 0 filas si todas las restricciones fueron eliminadas

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
-- NOTAS:
-- ============================================================================
-- 1. Este script es idempotente: puede ejecutarse múltiples veces sin errores
-- 2. Después de eliminar las restricciones, los usuarios podrán crear múltiples
--    ratings para el mismo item nuevamente
-- 3. Asegúrate de tener un backup antes de ejecutar este script
-- ============================================================================




































