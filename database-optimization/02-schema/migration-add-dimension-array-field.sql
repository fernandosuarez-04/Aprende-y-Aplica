-- ============================================================================
-- MIGRACIÓN: Agregar campo 'dimension' como JSONB Array (Soporta múltiples dimensiones)
-- ============================================================================
-- Descripción: Agrega un campo JSONB array para mapear preguntas a una o más
--              dimensiones del radar de competencias. Soporta preguntas que
--              cuentan para múltiples dimensiones simultáneamente.
--
-- Fecha: Diciembre 2024
-- Autor: Sistema de migración
-- ============================================================================

-- ============================================================================
-- OPCIÓN RECOMENDADA: Campo dimension como JSONB Array
-- ============================================================================
-- Esta migración permite que una pregunta pertenezca a múltiples dimensiones
-- Ejemplo: ["Productividad", "Aplicación"] significa que cuenta para ambas
-- ============================================================================

-- Paso 1: Agregar columna 'dimension' como JSONB (nullable inicialmente)
ALTER TABLE public.preguntas 
ADD COLUMN IF NOT EXISTS dimension jsonb;

-- Paso 2: Agregar índice GIN para búsquedas rápidas en arrays JSONB
CREATE INDEX IF NOT EXISTS idx_preguntas_dimension_gin 
ON public.preguntas USING GIN (dimension)
WHERE dimension IS NOT NULL;

-- Paso 3: Agregar índice adicional para búsquedas específicas
CREATE INDEX IF NOT EXISTS idx_preguntas_dimension_btree 
ON public.preguntas (dimension)
WHERE dimension IS NOT NULL;

-- Paso 4: Agregar comentario descriptivo
COMMENT ON COLUMN public.preguntas.dimension IS 
'Array JSONB de dimensiones del radar de competencias a las que pertenece esta pregunta.
Valores válidos: "Conocimiento", "Aplicación", "Productividad", "Estrategia", "Inversión".
Ejemplos:
  - Una dimensión: ["Conocimiento"]
  - Dos dimensiones: ["Productividad", "Aplicación"]
  - Tres dimensiones: ["Estrategia", "Inversión", "Aplicación"]
Este campo permite que una pregunta cuente para múltiples dimensiones simultáneamente.';

-- ============================================================================
-- FUNCIÓN DE VALIDACIÓN (Opcional pero recomendado)
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_dimension_array()
RETURNS TRIGGER AS $$
DECLARE
  valid_dimensions text[] := ARRAY['Conocimiento', 'Aplicación', 'Productividad', 'Estrategia', 'Inversión'];
  elem text;
BEGIN
  -- Si dimension es NULL, está bien (nullable)
  IF NEW.dimension IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Verificar que es un array
  IF jsonb_typeof(NEW.dimension) != 'array' THEN
    RAISE EXCEPTION 'dimension debe ser un array JSON. Ejemplo: ["Conocimiento"] o ["Productividad", "Aplicación"]';
  END IF;
  
  -- Verificar que el array no está vacío
  IF jsonb_array_length(NEW.dimension) = 0 THEN
    RAISE EXCEPTION 'dimension no puede ser un array vacío. Use NULL si no hay dimensión.';
  END IF;
  
  -- Verificar que todos los valores son válidos
  FOR elem IN SELECT jsonb_array_elements_text(NEW.dimension)
  LOOP
    IF NOT (elem = ANY(valid_dimensions)) THEN
      RAISE EXCEPTION 'dimension contiene valor inválido: %. Valores válidos: %', elem, array_to_string(valid_dimensions, ', ');
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para validación automática
DROP TRIGGER IF EXISTS validate_dimension_before_insert ON public.preguntas;
CREATE TRIGGER validate_dimension_before_insert
BEFORE INSERT OR UPDATE OF dimension ON public.preguntas
FOR EACH ROW 
EXECUTE FUNCTION validate_dimension_array();

-- ============================================================================
-- MIGRACIÓN DE DATOS EXISTENTES (Si ya tienes campo dimension como text)
-- ============================================================================
-- NOTA: Solo ejecutar si ya tienes el campo dimension como text
-- Si es la primera vez que agregas el campo, salta esta sección

-- Convertir valores text existentes a arrays JSONB
-- UPDATE public.preguntas 
-- SET dimension = jsonb_build_array(dimension::text)
-- WHERE dimension IS NOT NULL 
--   AND jsonb_typeof(dimension) = 'string';

-- ============================================================================
-- SCRIPT DE MIGRACIÓN BASADO EN MAPEO ACTUAL
-- ============================================================================
-- Este script mapea preguntas existentes a arrays JSONB basándose en la lógica actual

-- Bloque "Productividad" → ["Productividad"]
UPDATE public.preguntas 
SET dimension = '["Productividad"]'::jsonb
WHERE bloque = 'Productividad' 
  AND dimension IS NULL;

-- Bloque "Estrategia" → ["Estrategia"]
UPDATE public.preguntas 
SET dimension = '["Estrategia"]'::jsonb
WHERE bloque = 'Estrategia' 
  AND dimension IS NULL;

-- Bloque "Inversión" → ["Inversión"]
UPDATE public.preguntas 
SET dimension = '["Inversión"]'::jsonb
WHERE bloque IN ('Inversión', 'Inversion', 'inversión', 'inversion')
  AND dimension IS NULL;

-- Bloque "Adopción" - Mapeo por ID (IDs 7-12)
UPDATE public.preguntas 
SET dimension = '["Aplicación"]'::jsonb
WHERE bloque = 'Adopción' 
  AND id >= 7 AND id <= 8
  AND dimension IS NULL;

UPDATE public.preguntas 
SET dimension = '["Productividad"]'::jsonb
WHERE bloque = 'Adopción' 
  AND id >= 9 AND id <= 10
  AND dimension IS NULL;

UPDATE public.preguntas 
SET dimension = '["Estrategia"]'::jsonb
WHERE bloque = 'Adopción' 
  AND id >= 11 AND id <= 12
  AND dimension IS NULL;

-- Bloque "Adopción" - Fallback por texto
UPDATE public.preguntas 
SET dimension = '["Aplicación"]'::jsonb
WHERE bloque = 'Adopción' 
  AND dimension IS NULL
  AND (
    texto ILIKE '%frecuencia%' 
    OR texto ILIKE '%uso%' 
    OR texto ILIKE '%aplicación%' 
    OR texto ILIKE '%aplicar%'
  );

UPDATE public.preguntas 
SET dimension = '["Productividad"]'::jsonb
WHERE bloque = 'Adopción' 
  AND dimension IS NULL
  AND (
    texto ILIKE '%productividad%' 
    OR texto ILIKE '%eficiencia%' 
    OR texto ILIKE '%optimizar%'
  );

UPDATE public.preguntas 
SET dimension = '["Estrategia"]'::jsonb
WHERE bloque = 'Adopción' 
  AND dimension IS NULL
  AND (
    texto ILIKE '%estrategia%' 
    OR texto ILIKE '%planificación%' 
    OR texto ILIKE '%plan%'
  );

-- Default para "Adopción"
UPDATE public.preguntas 
SET dimension = '["Aplicación"]'::jsonb
WHERE bloque = 'Adopción' 
  AND dimension IS NULL;

-- Bloque "Conocimiento" - Mapeo por ID (IDs 13-18)
UPDATE public.preguntas 
SET dimension = '["Conocimiento"]'::jsonb
WHERE bloque = 'Conocimiento' 
  AND id >= 13 AND id <= 15
  AND dimension IS NULL;

UPDATE public.preguntas 
SET dimension = '["Inversión"]'::jsonb
WHERE bloque = 'Conocimiento' 
  AND id >= 16 AND id <= 17
  AND dimension IS NULL;

UPDATE public.preguntas 
SET dimension = '["Estrategia"]'::jsonb
WHERE bloque = 'Conocimiento' 
  AND id = 18
  AND dimension IS NULL;

-- Bloque "Conocimiento" - Fallback por texto
UPDATE public.preguntas 
SET dimension = '["Inversión"]'::jsonb
WHERE bloque = 'Conocimiento' 
  AND dimension IS NULL
  AND (
    texto ILIKE '%inversión%' 
    OR texto ILIKE '%presupuesto%' 
    OR texto ILIKE '%capacitación%' 
    OR texto ILIKE '%formación%'
  );

-- Default para "Conocimiento"
UPDATE public.preguntas 
SET dimension = '["Conocimiento"]'::jsonb
WHERE bloque = 'Conocimiento' 
  AND dimension IS NULL;

-- Fallback general
UPDATE public.preguntas 
SET dimension = '["Productividad"]'::jsonb
WHERE dimension IS NULL
  AND (
    texto ILIKE '%productividad%' 
    OR texto ILIKE '%eficiencia%'
  );

UPDATE public.preguntas 
SET dimension = '["Estrategia"]'::jsonb
WHERE dimension IS NULL
  AND (
    texto ILIKE '%estrategia%' 
    OR texto ILIKE '%planificación%'
  );

UPDATE public.preguntas 
SET dimension = '["Inversión"]'::jsonb
WHERE dimension IS NULL
  AND (
    texto ILIKE '%inversión%' 
    OR texto ILIKE '%presupuesto%'
  );

UPDATE public.preguntas 
SET dimension = '["Conocimiento"]'::jsonb
WHERE dimension IS NULL
  AND (
    texto ILIKE '%conocimiento%' 
    OR texto ILIKE '%conceptos%'
  );

-- Default final
UPDATE public.preguntas 
SET dimension = '["Aplicación"]'::jsonb
WHERE dimension IS NULL;

-- ============================================================================
-- EJEMPLOS: Agregar preguntas con múltiples dimensiones
-- ============================================================================

-- Ejemplo 1: Pregunta que cuenta para Productividad Y Aplicación
-- UPDATE public.preguntas 
-- SET dimension = '["Productividad", "Aplicación"]'::jsonb
-- WHERE id = 43;  -- Ejemplo: pregunta sobre uso frecuente para optimizar

-- Ejemplo 2: Pregunta que cuenta para Estrategia Y Inversión
-- UPDATE public.preguntas 
-- SET dimension = '["Estrategia", "Inversión"]'::jsonb
-- WHERE id = 44;  -- Ejemplo: pregunta sobre planificación de presupuesto

-- Ejemplo 3: Pregunta que cuenta para tres dimensiones (caso raro)
-- UPDATE public.preguntas 
-- SET dimension = '["Estrategia", "Inversión", "Aplicación"]'::jsonb
-- WHERE id = 45;

-- ============================================================================
-- VALIDACIÓN POST-MIGRACIÓN
-- ============================================================================

-- Verificar que todas las preguntas tienen dimension asignada
SELECT 
  COUNT(*) as total_preguntas,
  COUNT(dimension) as preguntas_con_dimension,
  COUNT(*) - COUNT(dimension) as preguntas_sin_dimension
FROM public.preguntas;

-- Ver distribución por dimensión (contando arrays)
SELECT 
  dimension,
  COUNT(*) as cantidad_preguntas,
  AVG(jsonb_array_length(dimension)) as promedio_dimensiones_por_pregunta
FROM public.preguntas
WHERE dimension IS NOT NULL
GROUP BY dimension
ORDER BY dimension;

-- Ver preguntas con múltiples dimensiones
SELECT 
  id,
  codigo,
  bloque,
  dimension,
  jsonb_array_length(dimension) as num_dimensiones
FROM public.preguntas
WHERE dimension IS NOT NULL
  AND jsonb_array_length(dimension) > 1
ORDER BY jsonb_array_length(dimension) DESC;

-- Verificar que no hay valores inválidos
SELECT 
  id,
  codigo,
  dimension
FROM public.preguntas
WHERE dimension IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(dimension) AS elem
    WHERE elem NOT IN ('Conocimiento', 'Aplicación', 'Productividad', 'Estrategia', 'Inversión')
  );

-- ============================================================================
-- CONSULTAS ÚTILES PARA USO FUTURO
-- ============================================================================

-- Buscar preguntas de una dimensión específica
-- SELECT * FROM preguntas 
-- WHERE dimension @> '["Conocimiento"]'::jsonb;

-- Buscar preguntas que tengan Productividad Y Aplicación
-- SELECT * FROM preguntas 
-- WHERE dimension @> '["Productividad", "Aplicación"]'::jsonb;

-- Buscar preguntas que tengan al menos una de varias dimensiones
-- SELECT * FROM preguntas 
-- WHERE dimension ?| ARRAY['Productividad', 'Aplicación'];

-- ============================================================================
-- ROLLBACK (Solo ejecutar si necesitas revertir la migración)
-- ============================================================================

-- DROP TRIGGER IF EXISTS validate_dimension_before_insert ON public.preguntas;
-- DROP FUNCTION IF EXISTS validate_dimension_array();
-- DROP INDEX IF EXISTS idx_preguntas_dimension_gin;
-- DROP INDEX IF EXISTS idx_preguntas_dimension_btree;
-- ALTER TABLE public.preguntas DROP COLUMN IF EXISTS dimension;

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================

