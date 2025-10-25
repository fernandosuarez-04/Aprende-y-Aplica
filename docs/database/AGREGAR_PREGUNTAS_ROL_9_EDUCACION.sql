-- AGREGAR PREGUNTAS PARA ROL 9: EDUCACIÓN/DOCENTES
-- Este script agrega las preguntas faltantes para el rol de Educación/Docentes
-- Preguntas: 249-260 (12 preguntas: 6 Adopción + 6 Conocimiento)

-- ==============================================
-- ROL 9: Educación/Docentes (area_id: 10) → exclusivo_rol_id = 9
-- ==============================================


-- ==============================================
-- VERIFICACIÓN
-- ==============================================

-- Verificar que se agregaron las preguntas correctamente
SELECT 
    exclusivo_rol_id,
    COUNT(*) as total_preguntas,
    MIN(id) as primera_pregunta,
    MAX(id) as ultima_pregunta
FROM "public"."preguntas" 
WHERE exclusivo_rol_id = 9 AND section = 'Cuestionario'
GROUP BY exclusivo_rol_id;

-- Verificar el contenido de las preguntas
SELECT 
    id,
    codigo,
    bloque,
    texto
FROM "public"."preguntas" 
WHERE exclusivo_rol_id = 9 AND section = 'Cuestionario'
ORDER BY id;

