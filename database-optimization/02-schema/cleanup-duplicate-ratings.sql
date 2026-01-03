-- ============================================================================
-- Script para limpiar ratings duplicados
-- ============================================================================
-- Este script elimina ratings duplicados, manteniendo solo el más reciente
-- basado en updated_at (o created_at si updated_at es NULL).
--
-- ⚠️ ADVERTENCIA: Este script ELIMINA datos. Ejecuta primero check-duplicate-ratings.sql
-- para ver qué se va a eliminar. Hacer un backup antes de ejecutar.
--
-- Fecha: Diciembre 2024
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Limpiar duplicados en app_ratings (Herramientas de IA)
-- ============================================================================
-- Mantiene el rating más reciente (basado en updated_at o created_at)
-- y elimina los más antiguos

DELETE FROM public.app_ratings
WHERE rating_id IN (
    SELECT rating_id
    FROM (
        SELECT 
            rating_id,
            ROW_NUMBER() OVER (
                PARTITION BY app_id, user_id 
                ORDER BY 
                    COALESCE(updated_at, created_at) DESC,
                    rating_id DESC
            ) AS rn
        FROM public.app_ratings
    ) AS ranked
    WHERE rn > 1
);

-- ============================================================================
-- 2. Limpiar duplicados en prompt_ratings (Prompts)
-- ============================================================================
-- Mantiene el rating más reciente (basado en updated_at o created_at)
-- y elimina los más antiguos

DELETE FROM public.prompt_ratings
WHERE rating_id IN (
    SELECT rating_id
    FROM (
        SELECT 
            rating_id,
            ROW_NUMBER() OVER (
                PARTITION BY prompt_id, user_id 
                ORDER BY 
                    COALESCE(updated_at, created_at) DESC,
                    rating_id DESC
            ) AS rn
        FROM public.prompt_ratings
    ) AS ranked
    WHERE rn > 1
);

-- ============================================================================
-- 3. Limpiar duplicados en course_reviews (Cursos/Talleres)
-- ============================================================================
-- Mantiene el review más reciente (basado en updated_at o created_at)
-- y elimina los más antiguos

DELETE FROM public.course_reviews
WHERE review_id IN (
    SELECT review_id
    FROM (
        SELECT 
            review_id,
            ROW_NUMBER() OVER (
                PARTITION BY course_id, user_id 
                ORDER BY 
                    COALESCE(updated_at, created_at) DESC,
                    review_id DESC
            ) AS rn
        FROM public.course_reviews
    ) AS ranked
    WHERE rn > 1
);

-- ============================================================================
-- Verificación: Contar cuántos registros se eliminaron
-- ============================================================================
-- Esta consulta mostrará cuántos duplicados quedan (debería ser 0)

SELECT 
    'app_ratings' AS tabla,
    COUNT(*) AS duplicados_restantes
FROM (
    SELECT app_id, user_id
    FROM public.app_ratings
    GROUP BY app_id, user_id
    HAVING COUNT(*) > 1
) AS duplicados_app

UNION ALL

SELECT 
    'prompt_ratings' AS tabla,
    COUNT(*) AS duplicados_restantes
FROM (
    SELECT prompt_id, user_id
    FROM public.prompt_ratings
    GROUP BY prompt_id, user_id
    HAVING COUNT(*) > 1
) AS duplicados_prompt

UNION ALL

SELECT 
    'course_reviews' AS tabla,
    COUNT(*) AS duplicados_restantes
FROM (
    SELECT course_id, user_id
    FROM public.course_reviews
    GROUP BY course_id, user_id
    HAVING COUNT(*) > 1
) AS duplicados_course;

-- ============================================================================
-- IMPORTANTE: Revisa los resultados antes de hacer COMMIT
-- ============================================================================
-- Si estás satisfecho con los resultados, ejecuta:
-- COMMIT;
--
-- Si quieres revertir los cambios, ejecuta:
-- ROLLBACK;
-- ============================================================================

-- Descomenta la siguiente línea para confirmar los cambios:
-- COMMIT;

-- O ejecuta ROLLBACK para revertir:
-- ROLLBACK;




































