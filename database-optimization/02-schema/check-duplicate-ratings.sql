-- ============================================================================
-- Script para verificar ratings duplicados antes de agregar restricciones UNIQUE
-- ============================================================================
-- Ejecuta este script ANTES de ejecutar add-unique-rating-constraints.sql
-- para identificar y limpiar cualquier rating duplicado existente.
--
-- Fecha: Diciembre 2024
-- ============================================================================

-- ============================================================================
-- 1. Verificar duplicados en app_ratings (Herramientas de IA)
-- ============================================================================
SELECT 
    'app_ratings' AS tabla,
    app_id,
    user_id,
    COUNT(*) AS cantidad_duplicados,
    STRING_AGG(rating_id::text, ', ') AS rating_ids
FROM public.app_ratings
GROUP BY app_id, user_id
HAVING COUNT(*) > 1
ORDER BY cantidad_duplicados DESC;

-- ============================================================================
-- 2. Verificar duplicados en prompt_ratings (Prompts)
-- ============================================================================
SELECT 
    'prompt_ratings' AS tabla,
    prompt_id,
    user_id,
    COUNT(*) AS cantidad_duplicados,
    STRING_AGG(rating_id::text, ', ') AS rating_ids
FROM public.prompt_ratings
GROUP BY prompt_id, user_id
HAVING COUNT(*) > 1
ORDER BY cantidad_duplicados DESC;

-- ============================================================================
-- 3. Verificar duplicados en course_reviews (Cursos/Talleres)
-- ============================================================================
SELECT 
    'course_reviews' AS tabla,
    course_id,
    user_id,
    COUNT(*) AS cantidad_duplicados,
    STRING_AGG(review_id::text, ', ') AS review_ids
FROM public.course_reviews
GROUP BY course_id, user_id
HAVING COUNT(*) > 1
ORDER BY cantidad_duplicados DESC;

-- ============================================================================
-- Resumen de duplicados encontrados
-- ============================================================================
SELECT 
    'RESUMEN' AS tipo,
    'app_ratings' AS tabla,
    COUNT(*) AS total_duplicados
FROM (
    SELECT app_id, user_id
    FROM public.app_ratings
    GROUP BY app_id, user_id
    HAVING COUNT(*) > 1
) AS duplicados_app

UNION ALL

SELECT 
    'RESUMEN' AS tipo,
    'prompt_ratings' AS tabla,
    COUNT(*) AS total_duplicados
FROM (
    SELECT prompt_id, user_id
    FROM public.prompt_ratings
    GROUP BY prompt_id, user_id
    HAVING COUNT(*) > 1
) AS duplicados_prompt

UNION ALL

SELECT 
    'RESUMEN' AS tipo,
    'course_reviews' AS tabla,
    COUNT(*) AS total_duplicados
FROM (
    SELECT course_id, user_id
    FROM public.course_reviews
    GROUP BY course_id, user_id
    HAVING COUNT(*) > 1
) AS duplicados_course;

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- Si este script devuelve resultados, significa que hay ratings duplicados.
-- Deberás limpiarlos antes de ejecutar add-unique-rating-constraints.sql
--
-- Estrategia recomendada para limpiar duplicados:
-- 1. Mantener el rating más reciente (basado en updated_at o created_at)
-- 2. Eliminar los ratings más antiguos
-- 3. O combinar los ratings duplicados en uno solo
-- ============================================================================




































