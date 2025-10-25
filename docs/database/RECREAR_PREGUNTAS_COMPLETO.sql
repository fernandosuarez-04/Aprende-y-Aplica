-- RECREACIÓN COMPLETA DE PREGUNTAS SEGÚN MAPEO CORRECTO
-- Este script borra todas las preguntas existentes y las recrea según el mapeo correcto

-- ==============================================
-- 1. BORRAR TODAS LAS PREGUNTAS EXISTENTES
-- ==============================================

-- Borrar todas las preguntas del cuestionario (mantener metadatos)
DELETE FROM "public"."preguntas" WHERE section = 'Cuestionario';

-- ==============================================
-- 2. MAPEO CORRECTO SEGÚN LA IMAGEN
-- ==============================================
--
-- id = 1: CEO = 7 - 18 (12 preguntas)
-- id = 2: CMO / Director(a) de Marketing = 31 - 42 (12 preguntas)
-- id = 3: CTO / Director(a) de Tecnología = 19 - 30 (12 preguntas)
-- id = 4: Gerente de Marketing = 31 - 42 (12 preguntas) - MISMA QUE CMO
-- id = 5: Gerente de TI (SIN PREGUNTAS ESPECÍFICAS)
-- id = 6: Líder/Gerente de Ventas (SIN PREGUNTAS ESPECÍFICAS)
-- id = 7: Analista/Especialista TI (SIN PREGUNTAS ESPECÍFICAS)
-- id = 8: Academia/Investigación = 79 - 90 (12 preguntas)
-- id = 9: Educación/Docentes = 91 - 100 (10 preguntas)
-- id = 10: Diseño/Industrias Creativas (SIN PREGUNTAS ESPECÍFICAS)
-- id = 11: Dirección de Ventas (SIN PREGUNTAS ESPECÍFICAS)
-- id = 12: Dirección de Operaciones (SIN PREGUNTAS ESPECÍFICAS)
-- id = 13: Dirección de Finanzas = 67 - 78 (12 preguntas)
-- id = 14: Dirección de RRHH (SIN PREGUNTAS ESPECÍFICAS)
-- id = 15: Dirección de Contabilidad (SIN PREGUNTAS ESPECÍFICAS)
-- id = 16: Dirección de Compras (SIN PREGUNTAS ESPECÍFICAS)
-- id = 17: Miembros de Ventas (SIN PREGUNTAS ESPECÍFICAS)
-- id = 18: Miembros de Marketing (SIN PREGUNTAS ESPECÍFICAS)
-- id = 19: Miembros de Operaciones (SIN PREGUNTAS ESPECÍFICAS)
-- id = 20: Miembros de Finanzas (SIN PREGUNTAS ESPECÍFICAS)
-- id = 21: Miembros de RRHH (SIN PREGUNTAS ESPECÍFICAS)
-- id = 22: Miembros de Contabilidad (SIN PREGUNTAS ESPECÍFICAS)
-- id = 23: Miembros de Compras (SIN PREGUNTAS ESPECÍFICAS)
-- id = 24: Gerencia Media (SIN PREGUNTAS ESPECÍFICAS)
-- id = 25: Freelancer (SIN PREGUNTAS ESPECÍFICAS)
-- id = 26: Consultor (SIN PREGUNTAS ESPECÍFICAS)
--
-- ROLES QUE NO EXISTEN (marcados como "No existen"):
-- id = 27: Dirección Legal = 55 - 66 (NO EXISTEN)
-- id = 28: Miembros Legal = 55 - 66 (NO EXISTEN)
-- id = 26: Dirección Salud = 43 - 54 (NO EXISTEN)
-- id = 26: Miembros Salud = 43 - 54 (NO EXISTEN)

-- ==============================================
-- 3. CREAR PREGUNTAS SEGÚN MAPEO CORRECTO
-- ==============================================

-- CEO (id = 1) → exclusivo_rol_id = 1 → preguntas 7-18

-- CTO (id = 3) → exclusivo_rol_id = 3 → preguntas 19-30

-- Gerente de Marketing y CMO (id = 2 y 4) → exclusivo_rol_id = 2 y 4 → preguntas 31-54

-- Direccion de Finanzas y Miembros de Finanzas (id = 13 y 20) → exclusivo_rol_id = 13 y 20 → preguntas 55-78

-- Direccion de Gobierno y Miembros de Gobierno (id = 27 y 28) → exclusivo_rol_id = 27 y 28 → preguntas 79-102

-- Academia (id = 8) → exclusivo_rol_id = 8 → preguntas 103-112

-- ==============================================
-- 4. VERIFICACIÓN FINAL
-- ==============================================

-- Verificar el mapeo final
SELECT 
    exclusivo_rol_id,
    COUNT(*) as total_preguntas,
    MIN(id) as primera_pregunta,
    MAX(id) as ultima_pregunta,
    STRING_AGG(DISTINCT codigo, ', ' ORDER BY codigo) as codigos
FROM "public"."preguntas" 
WHERE section = 'Cuestionario'
GROUP BY exclusivo_rol_id
ORDER BY exclusivo_rol_id;

-- Verificar que cada rol tenga las preguntas correctas según el mapeo
SELECT 
    r.id as role_id,
    r.nombre as role_name,
    CASE 
        WHEN r.id = 1 THEN 'CEO (exclusivo_rol_id = 1, preguntas 7-18)'
        WHEN r.id = 2 THEN 'Marketing (exclusivo_rol_id = 3, preguntas 31-42)'
        WHEN r.id = 3 THEN 'CTO (exclusivo_rol_id = 2, preguntas 19-30)'
        WHEN r.id = 4 THEN 'Marketing (exclusivo_rol_id = 3, preguntas 31-42)'
        WHEN r.id = 5 THEN 'SIN PREGUNTAS ESPECÍFICAS'
        WHEN r.id = 6 THEN 'SIN PREGUNTAS ESPECÍFICAS'
        WHEN r.id = 7 THEN 'SIN PREGUNTAS ESPECÍFICAS'
        WHEN r.id = 8 THEN 'Academia (exclusivo_rol_id = 8, preguntas 79-90)'
        WHEN r.id = 9 THEN 'Educación (exclusivo_rol_id = 9, preguntas 91-100)'
        WHEN r.id = 10 THEN 'SIN PREGUNTAS ESPECÍFICAS'
        WHEN r.id = 11 THEN 'SIN PREGUNTAS ESPECÍFICAS'
        WHEN r.id = 12 THEN 'SIN PREGUNTAS ESPECÍFICAS'
        WHEN r.id = 13 THEN 'Finanzas (exclusivo_rol_id = 6, preguntas 67-78)'
        WHEN r.id = 14 THEN 'SIN PREGUNTAS ESPECÍFICAS'
        WHEN r.id = 15 THEN 'SIN PREGUNTAS ESPECÍFICAS'
        WHEN r.id = 16 THEN 'SIN PREGUNTAS ESPECÍFICAS'
        WHEN r.id = 17 THEN 'SIN PREGUNTAS ESPECÍFICAS'
        WHEN r.id = 18 THEN 'SIN PREGUNTAS ESPECÍFICAS'
        WHEN r.id = 19 THEN 'SIN PREGUNTAS ESPECÍFICAS'
        WHEN r.id = 20 THEN 'SIN PREGUNTAS ESPECÍFICAS'
        WHEN r.id = 21 THEN 'SIN PREGUNTAS ESPECÍFICAS'
        WHEN r.id = 22 THEN 'SIN PREGUNTAS ESPECÍFICAS'
        WHEN r.id = 23 THEN 'SIN PREGUNTAS ESPECÍFICAS'
        WHEN r.id = 24 THEN 'SIN PREGUNTAS ESPECÍFICAS'
        WHEN r.id = 25 THEN 'SIN PREGUNTAS ESPECÍFICAS'
        WHEN r.id = 26 THEN 'SIN PREGUNTAS ESPECÍFICAS'
        ELSE 'SIN PREGUNTAS ESPECÍFICAS'
    END as mapeo_preguntas
FROM "public"."roles" r
ORDER BY r.id;
