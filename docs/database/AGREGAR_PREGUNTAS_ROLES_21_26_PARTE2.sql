-- AGREGAR PREGUNTAS PARA ROLES 21-26 (PARTE 2)
-- Continuación del script anterior
-- Roles: 23, 24, 25, 26


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
WHERE section = 'Cuestionario' AND id >= 293
GROUP BY exclusivo_rol_id
ORDER BY exclusivo_rol_id;

-- Verificar el mapeo completo de roles 21-26
SELECT 
    r.id as role_id,
    r.nombre as role_name,
    CASE 
        WHEN r.id = 21 THEN 'Miembros de RRHH (exclusivo_rol_id = 21, preguntas 293-304)'
        WHEN r.id = 22 THEN 'Miembros de Contabilidad (exclusivo_rol_id = 22, preguntas 305-316)'
        WHEN r.id = 23 THEN 'Miembros de Compras (exclusivo_rol_id = 23, preguntas 317-328)'
        WHEN r.id = 24 THEN 'Gerencia Media (exclusivo_rol_id = 24, preguntas 329-340)'
        WHEN r.id = 25 THEN 'Freelancer (exclusivo_rol_id = 25, preguntas 341-352)'
        WHEN r.id = 26 THEN 'Consultor (exclusivo_rol_id = 26, preguntas 353-364)'
        ELSE 'SIN PREGUNTAS ESPECÍFICAS'
    END as mapeo_preguntas
FROM "public"."roles" r
WHERE r.id IN (21, 22, 23, 24, 25, 26)
ORDER BY r.id;

