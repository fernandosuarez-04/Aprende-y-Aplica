-- ==========================================
-- 1. VERIFICACIÓN (Ejecuta esto para ver el estado actual)
-- ==========================================
SELECT count(*) as lecciones_pendientes 
FROM course_lessons 
WHERE duration_seconds IS NULL OR duration_seconds = 0;

-- ==========================================
-- 2. RECALCULAR TODO (Forzar actualización)
-- Usa esto si quieres SOBREESCRIBIR los valores existentes
-- ==========================================

-- Estrategia 1: Actualizar desde total_duration_minutes (prioridad alta)
UPDATE public.course_lessons
SET duration_seconds = CAST(total_duration_minutes * 60 AS INTEGER)
WHERE total_duration_minutes IS NOT NULL 
  AND total_duration_minutes > 0;

-- Estrategia 2: Estimar desde el transcript (donde no haya minutes o sea 0)
-- 150 palabras por minuto
UPDATE public.course_lessons
SET duration_seconds = CAST(
  (array_length(regexp_split_to_array(TRIM(transcript_content), '\s+'), 1) * 60) / 150 
  AS INTEGER)
WHERE (total_duration_minutes IS NULL OR total_duration_minutes = 0)
  AND transcript_content IS NOT NULL 
  AND TRIM(transcript_content) <> '';

-- ==========================================
-- 3. VER RESULTADOS
-- ==========================================
SELECT lesson_title, duration_seconds, total_duration_minutes, substring(transcript_content, 1, 50) as transcript_preview
FROM course_lessons
ORDER BY updated_at DESC
LIMIT 20;
