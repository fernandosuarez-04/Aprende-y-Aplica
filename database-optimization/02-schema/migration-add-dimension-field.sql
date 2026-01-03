-- ============================================================================
-- MIGRACIÓN: Agregar campo 'dimension' a la tabla 'preguntas'
-- ============================================================================
-- Descripción: Agrega un campo explícito para mapear preguntas a dimensiones
--              del radar de competencias, mejorando la robustez del sistema
--              de estadísticas.
--
-- Fecha: Diciembre 2024
-- Autor: Sistema de migración
-- ============================================================================

-- Paso 1: Agregar columna 'dimension' (nullable inicialmente para migración gradual)
ALTER TABLE public.preguntas 
ADD COLUMN IF NOT EXISTS dimension text;

-- Paso 2: Agregar constraint para validar valores válidos
ALTER TABLE public.preguntas
DROP CONSTRAINT IF EXISTS preguntas_dimension_check;

ALTER TABLE public.preguntas
ADD CONSTRAINT preguntas_dimension_check 
CHECK (dimension IS NULL OR dimension IN (
  'Conocimiento', 
  'Aplicación', 
  'Productividad', 
  'Estrategia', 
  'Inversión'
));

-- Paso 3: Agregar índice para mejorar performance en consultas
CREATE INDEX IF NOT EXISTS idx_preguntas_dimension 
ON public.preguntas(dimension) 
WHERE dimension IS NOT NULL;

-- Paso 4: Agregar comentario descriptivo
COMMENT ON COLUMN public.preguntas.dimension IS 
'Dimensión del radar de competencias a la que pertenece esta pregunta. 
Valores válidos: Conocimiento, Aplicación, Productividad, Estrategia, Inversión.
Este campo permite un mapeo explícito y robusto, independiente de IDs o análisis de texto.';

-- ============================================================================
-- MIGRACIÓN DE DATOS EXISTENTES (Opcional - Ejecutar después de validar)
-- ============================================================================
-- NOTA: Estos UPDATEs son ejemplos basados en el mapeo actual.
--       Debes revisar y ajustar según tus necesidades específicas.

-- Ejemplo: Actualizar preguntas de ejemplo mencionadas
-- UPDATE public.preguntas 
-- SET dimension = 'Conocimiento' 
-- WHERE id = 42;

-- UPDATE public.preguntas 
-- SET dimension = 'Aplicación'  -- o 'Productividad' según interpretación
-- WHERE id = 43;

-- ============================================================================
-- SCRIPT DE MIGRACIÓN BASADO EN MAPEO ACTUAL
-- ============================================================================
-- Este script intenta mapear preguntas existentes basándose en la lógica actual
-- IMPORTANTE: Revisar y validar cada mapeo antes de ejecutar en producción

-- Bloque "Productividad" → Productividad
UPDATE public.preguntas 
SET dimension = 'Productividad'
WHERE bloque = 'Productividad' 
  AND dimension IS NULL;

-- Bloque "Estrategia" → Estrategia
UPDATE public.preguntas 
SET dimension = 'Estrategia'
WHERE bloque = 'Estrategia' 
  AND dimension IS NULL;

-- Bloque "Inversión" → Inversión
UPDATE public.preguntas 
SET dimension = 'Inversión'
WHERE bloque IN ('Inversión', 'Inversion', 'inversión', 'inversion')
  AND dimension IS NULL;

-- Bloque "Adopción" - Mapeo por ID (IDs 7-12)
UPDATE public.preguntas 
SET dimension = 'Aplicación'
WHERE bloque = 'Adopción' 
  AND id >= 7 AND id <= 8
  AND dimension IS NULL;

UPDATE public.preguntas 
SET dimension = 'Productividad'
WHERE bloque = 'Adopción' 
  AND id >= 9 AND id <= 10
  AND dimension IS NULL;

UPDATE public.preguntas 
SET dimension = 'Estrategia'
WHERE bloque = 'Adopción' 
  AND id >= 11 AND id <= 12
  AND dimension IS NULL;

-- Bloque "Adopción" - Fallback por texto para IDs fuera de rango
UPDATE public.preguntas 
SET dimension = 'Aplicación'
WHERE bloque = 'Adopción' 
  AND dimension IS NULL
  AND (
    texto ILIKE '%frecuencia%' 
    OR texto ILIKE '%uso%' 
    OR texto ILIKE '%aplicación%' 
    OR texto ILIKE '%aplicar%'
  );

UPDATE public.preguntas 
SET dimension = 'Productividad'
WHERE bloque = 'Adopción' 
  AND dimension IS NULL
  AND (
    texto ILIKE '%productividad%' 
    OR texto ILIKE '%eficiencia%' 
    OR texto ILIKE '%optimizar%'
  );

UPDATE public.preguntas 
SET dimension = 'Estrategia'
WHERE bloque = 'Adopción' 
  AND dimension IS NULL
  AND (
    texto ILIKE '%estrategia%' 
    OR texto ILIKE '%planificación%' 
    OR texto ILIKE '%plan%'
  );

-- Default para "Adopción" sin match
UPDATE public.preguntas 
SET dimension = 'Aplicación'
WHERE bloque = 'Adopción' 
  AND dimension IS NULL;

-- Bloque "Conocimiento" - Mapeo por ID (IDs 13-18)
UPDATE public.preguntas 
SET dimension = 'Conocimiento'
WHERE bloque = 'Conocimiento' 
  AND id >= 13 AND id <= 15
  AND dimension IS NULL;

UPDATE public.preguntas 
SET dimension = 'Inversión'
WHERE bloque = 'Conocimiento' 
  AND id >= 16 AND id <= 17
  AND dimension IS NULL;

UPDATE public.preguntas 
SET dimension = 'Estrategia'
WHERE bloque = 'Conocimiento' 
  AND id = 18
  AND dimension IS NULL;

-- Bloque "Conocimiento" - Fallback por texto para IDs fuera de rango
UPDATE public.preguntas 
SET dimension = 'Inversión'
WHERE bloque = 'Conocimiento' 
  AND dimension IS NULL
  AND (
    texto ILIKE '%inversión%' 
    OR texto ILIKE '%presupuesto%' 
    OR texto ILIKE '%capacitación%' 
    OR texto ILIKE '%formación%'
  );

-- Default para "Conocimiento" sin match
UPDATE public.preguntas 
SET dimension = 'Conocimiento'
WHERE bloque = 'Conocimiento' 
  AND dimension IS NULL;

-- Fallback general para otras secciones/bloques
UPDATE public.preguntas 
SET dimension = 'Productividad'
WHERE dimension IS NULL
  AND (
    texto ILIKE '%productividad%' 
    OR texto ILIKE '%eficiencia%'
  );

UPDATE public.preguntas 
SET dimension = 'Estrategia'
WHERE dimension IS NULL
  AND (
    texto ILIKE '%estrategia%' 
    OR texto ILIKE '%planificación%'
  );

UPDATE public.preguntas 
SET dimension = 'Inversión'
WHERE dimension IS NULL
  AND (
    texto ILIKE '%inversión%' 
    OR texto ILIKE '%presupuesto%'
  );

UPDATE public.preguntas 
SET dimension = 'Conocimiento'
WHERE dimension IS NULL
  AND (
    texto ILIKE '%conocimiento%' 
    OR texto ILIKE '%conceptos%'
  );

-- Default final
UPDATE public.preguntas 
SET dimension = 'Aplicación'
WHERE dimension IS NULL;

-- ============================================================================
-- VALIDACIÓN POST-MIGRACIÓN
-- ============================================================================

-- Verificar que todas las preguntas tienen dimension asignada
SELECT 
  COUNT(*) as total_preguntas,
  COUNT(dimension) as preguntas_con_dimension,
  COUNT(*) - COUNT(dimension) as preguntas_sin_dimension
FROM public.preguntas;

-- Ver distribución por dimensión
SELECT 
  dimension,
  COUNT(*) as cantidad
FROM public.preguntas
GROUP BY dimension
ORDER BY dimension;

-- Ver preguntas sin dimension (si las hay)
SELECT 
  id,
  codigo,
  section,
  bloque,
  texto
FROM public.preguntas
WHERE dimension IS NULL;

-- ============================================================================
-- ROLLBACK (Solo ejecutar si necesitas revertir la migración)
-- ============================================================================
-- NOTA: Esto eliminará la columna y todos sus datos

-- DROP INDEX IF EXISTS idx_preguntas_dimension;
-- ALTER TABLE public.preguntas DROP CONSTRAINT IF EXISTS preguntas_dimension_check;
-- ALTER TABLE public.preguntas DROP COLUMN IF EXISTS dimension;

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================




















