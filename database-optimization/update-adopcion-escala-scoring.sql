-- ============================================================================
-- ACTUALIZACIÓN DE ESCALA Y SCORING PARA PREGUNTAS DE ADOPCIÓN
-- ============================================================================
-- Este script actualiza los campos 'escala' y 'scoring' de las preguntas
-- de adopción para que usen el contenido de las opciones como claves
-- en lugar de las letras A-E (que fueron removidas).
-- ============================================================================

-- Función auxiliar para construir el JSON de escala/scoring desde opciones
-- Mapea: índice 0 -> 0, índice 1 -> 25, índice 2 -> 50, índice 3 -> 75, índice 4 -> 100
DO $$
DECLARE
    pregunta_record RECORD;
    opciones_array jsonb;
    nueva_escala jsonb := '{}'::jsonb;
    nuevo_scoring jsonb := '{}'::jsonb;
    opcion_texto text;
    valores_scoring integer[] := ARRAY[0, 25, 50, 75, 100];
    i integer;
    total_actualizadas integer := 0;
BEGIN
    -- Iterar sobre todas las preguntas de adopción
    FOR pregunta_record IN 
        SELECT id, codigo, opciones, escala, scoring
        FROM preguntas
        WHERE bloque = 'Adopción'
        ORDER BY codigo
    LOOP
        -- Verificar que opciones sea un array JSON válido
        IF pregunta_record.opciones IS NOT NULL AND jsonb_typeof(pregunta_record.opciones) = 'array' THEN
            opciones_array := pregunta_record.opciones;
            nueva_escala := '{}'::jsonb;
            nuevo_scoring := '{}'::jsonb;
            
            -- Construir los objetos JSON usando el contenido de las opciones como claves
            -- Procesar hasta 5 opciones (índices 0-4) o el número de opciones disponibles
            FOR i IN 0..LEAST(jsonb_array_length(opciones_array) - 1, array_length(valores_scoring, 1) - 1) LOOP
                opcion_texto := opciones_array->>i;
                
                -- Solo procesar si hay texto y si el índice está en el rango de valores_scoring
                IF opcion_texto IS NOT NULL AND i < array_length(valores_scoring, 1) THEN
                    -- Agregar al JSON usando el texto de la opción como clave
                    nueva_escala := nueva_escala || jsonb_build_object(opcion_texto, valores_scoring[i + 1]);
                    nuevo_scoring := nuevo_scoring || jsonb_build_object(opcion_texto, valores_scoring[i + 1]);
                END IF;
            END LOOP;
            
            -- Actualizar la pregunta con los nuevos valores
            UPDATE preguntas
            SET 
                escala = nueva_escala,
                scoring = nuevo_scoring
            WHERE id = pregunta_record.id;
            
            total_actualizadas := total_actualizadas + 1;
            RAISE NOTICE 'Actualizada pregunta % (ID: %). Escala: %', 
                pregunta_record.codigo,
                pregunta_record.id, 
                nueva_escala;
        ELSE
            RAISE NOTICE 'Pregunta % (ID: %) no tiene opciones válidas o no es un array', 
                COALESCE(pregunta_record.codigo, 'SIN_CODIGO'),
                pregunta_record.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Proceso completado. Total de preguntas actualizadas: %', total_actualizadas;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- VERIFICACIÓN: Consulta para verificar los cambios
-- ============================================================================
-- Descomenta las siguientes líneas para verificar los resultados:
/*
SELECT 
    id,
    codigo,
    bloque,
    opciones,
    escala,
    scoring
FROM preguntas
WHERE bloque = 'Adopción'
ORDER BY codigo
LIMIT 10;
*/

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- 1. Este script actualiza TODAS las preguntas donde bloque = 'Adopción'
-- 2. Las opciones deben ser un array JSON válido
-- 3. El mapeo de valores es:
--    - Primera opción (índice 0) -> 0 puntos
--    - Segunda opción (índice 1) -> 25 puntos
--    - Tercera opción (índice 2) -> 50 puntos
--    - Cuarta opción (índice 3) -> 75 puntos
--    - Quinta opción (índice 4) -> 100 puntos
-- 4. Si una pregunta tiene menos de 5 opciones, solo se mapearán las disponibles
-- 5. Si una pregunta tiene más de 5 opciones, solo se mapearán las primeras 5
-- ============================================================================

