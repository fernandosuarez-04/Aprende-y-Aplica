-- ANÁLISIS DE PREGUNTAS EXISTENTES Y MAPEO CORRECTO
-- Este script analiza las preguntas actuales y propone el mapeo correcto

-- ==============================================
-- 1. ANÁLISIS DE PREGUNTAS POR EXCLUSIVO_ROL_ID
-- ==============================================

-- Ver todas las preguntas agrupadas por exclusivo_rol_id
SELECT 
    exclusivo_rol_id,
    COUNT(*) as total_preguntas,
    STRING_AGG(DISTINCT codigo, ', ' ORDER BY codigo) as codigos,
    STRING_AGG(DISTINCT section, ', ') as secciones
FROM "public"."preguntas" 
WHERE section = 'Cuestionario'
GROUP BY exclusivo_rol_id
ORDER BY exclusivo_rol_id;

-- ==============================================
-- 2. ANÁLISIS DETALLADO POR ROL
-- ==============================================

-- Preguntas de CEO (exclusivo_rol_id = 1)
SELECT 
    'CEO (exclusivo_rol_id = 1)' as rol,
    codigo,
    section,
    bloque,
    LEFT(texto, 80) || '...' as pregunta_preview
FROM "public"."preguntas" 
WHERE exclusivo_rol_id = 1 AND section = 'Cuestionario'
ORDER BY codigo;

-- Preguntas de CTO (exclusivo_rol_id = 2) 
SELECT 
    'CTO (exclusivo_rol_id = 2)' as rol,
    codigo,
    section,
    bloque,
    LEFT(texto, 80) || '...' as pregunta_preview
FROM "public"."preguntas" 
WHERE exclusivo_rol_id = 2 AND section = 'Cuestionario'
ORDER BY codigo;

-- Preguntas de Marketing (exclusivo_rol_id = 3)
SELECT 
    'Marketing (exclusivo_rol_id = 3)' as rol,
    codigo,
    section,
    bloque,
    LEFT(texto, 80) || '...' as pregunta_preview
FROM "public"."preguntas" 
WHERE exclusivo_rol_id = 3 AND section = 'Cuestionario'
ORDER BY codigo;

-- Preguntas de Salud (exclusivo_rol_id = 4)
SELECT 
    'Salud (exclusivo_rol_id = 4)' as rol,
    codigo,
    section,
    bloque,
    LEFT(texto, 80) || '...' as pregunta_preview
FROM "public"."preguntas" 
WHERE exclusivo_rol_id = 4 AND section = 'Cuestionario'
ORDER BY codigo;

-- Preguntas de Derecho (exclusivo_rol_id = 5)
SELECT 
    'Derecho (exclusivo_rol_id = 5)' as rol,
    codigo,
    section,
    bloque,
    LEFT(texto, 80) || '...' as pregunta_preview
FROM "public"."preguntas" 
WHERE exclusivo_rol_id = 5 AND section = 'Cuestionario'
ORDER BY codigo;

-- Preguntas de Finanzas (exclusivo_rol_id = 6)
SELECT 
    'Finanzas (exclusivo_rol_id = 6)' as rol,
    codigo,
    section,
    bloque,
    LEFT(texto, 80) || '...' as pregunta_preview
FROM "public"."preguntas" 
WHERE exclusivo_rol_id = 6 AND section = 'Cuestionario'
ORDER BY codigo;

-- Preguntas de Administración Pública (exclusivo_rol_id = 7)
SELECT 
    'Admin Pública (exclusivo_rol_id = 7)' as rol,
    codigo,
    section,
    bloque,
    LEFT(texto, 80) || '...' as pregunta_preview
FROM "public"."preguntas" 
WHERE exclusivo_rol_id = 7 AND section = 'Cuestionario'
ORDER BY codigo;

-- Preguntas de Academia (exclusivo_rol_id = 8)
SELECT 
    'Academia (exclusivo_rol_id = 8)' as rol,
    codigo,
    section,
    bloque,
    LEFT(texto, 80) || '...' as pregunta_preview
FROM "public"."preguntas" 
WHERE exclusivo_rol_id = 8 AND section = 'Cuestionario'
ORDER BY codigo;

-- ==============================================
-- 3. VERIFICAR ROLES EN LA TABLA ROLES
-- ==============================================

-- Ver todos los roles disponibles
SELECT 
    id,
    slug,
    nombre,
    area_id
FROM "public"."roles"
ORDER BY id;
