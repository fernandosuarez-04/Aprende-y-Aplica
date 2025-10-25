-- AGREGAR PREGUNTAS PARA ROLES 11-19 (PARTE 2)
-- Continuación del script anterior
-- Roles: 16, 17, 18, 19
-- NOTA: La última pregunta del script anterior fue la 244, por lo que comenzamos desde 245

-- ==============================================
-- 5. Dirección de Compras / Supply (ID 16) → exclusivo_rol_id = 16
-- ==============================================


-- ==============================================
-- VERIFICACIÓN FINAL
-- ==============================================

-- Verificar que se agregaron las preguntas correctamente
SELECT 
    exclusivo_rol_id,
    COUNT(*) as total_preguntas,
    MIN(id) as primera_pregunta,
    MAX(id) as ultima_pregunta
FROM "public"."preguntas" 
WHERE section = 'Cuestionario' AND id >= 185
GROUP BY exclusivo_rol_id
ORDER BY exclusivo_rol_id;

-- Verificar el mapeo completo de roles 11-19
SELECT 
    r.id as role_id,
    r.nombre as role_name,
    CASE 
        WHEN r.id = 11 THEN 'Dirección de Ventas (exclusivo_rol_id = 11, preguntas 185-196)'
        WHEN r.id = 12 THEN 'Dirección de Operaciones (exclusivo_rol_id = 12, preguntas 197-208)'
        WHEN r.id = 13 THEN 'Dirección de Finanzas (exclusivo_rol_id = 13, preguntas 209-220)'
        WHEN r.id = 14 THEN 'Dirección de RRHH (exclusivo_rol_id = 14, preguntas 221-232)'
        WHEN r.id = 15 THEN 'Dirección de Contabilidad (exclusivo_rol_id = 15, preguntas 233-244)'
        WHEN r.id = 16 THEN 'Dirección de Compras (exclusivo_rol_id = 16, preguntas 245-256)'
        WHEN r.id = 17 THEN 'Miembros de Ventas (exclusivo_rol_id = 17, preguntas 257-268)'
        WHEN r.id = 18 THEN 'Miembros de Marketing (exclusivo_rol_id = 18, preguntas 269-280)'
        WHEN r.id = 19 THEN 'Miembros de Operaciones (exclusivo_rol_id = 19, preguntas 281-292)'
        ELSE 'SIN PREGUNTAS ESPECÍFICAS'
    END as mapeo_preguntas
FROM "public"."roles" r
WHERE r.id IN (11, 12, 13, 14, 15, 16, 17, 18, 19)
ORDER BY r.id;
