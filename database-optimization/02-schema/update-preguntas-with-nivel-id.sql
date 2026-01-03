-- ============================================================================
-- SCRIPT: Actualizar preguntas generadas con exclusivo_nivel_id
-- ============================================================================
-- Descripción: Actualiza las preguntas generadas en los archivos SQL
--              para incluir el exclusivo_nivel_id correspondiente
-- ============================================================================
-- NOTA: Este script debe ejecutarse DESPUÉS de insertar las preguntas
--       generadas y DESPUÉS de ejecutar migration-add-nivel-id-field.sql
-- ============================================================================

-- ============================================================================
-- MAPEO DE ROLES A NIVELES
-- ============================================================================
-- Nivel 6 (CEO): Rol 1
-- Nivel 2 (Dirección de Área): Roles 2, 3, 11, 12, 13, 14, 15, 16, 27
-- Nivel 3 (Gerencia): Roles 4, 5, 6, 24
-- Nivel 4 (Miembro/Colaborador): Roles 7, 8, 9, 10, 17, 18, 19, 20, 21, 22, 23, 28
-- NULL: Roles 25, 26 (Freelancer, Consultor)
-- ============================================================================

-- Actualizar preguntas según exclusivo_rol_id
UPDATE public.preguntas
SET exclusivo_nivel_id = CASE
  -- CEO → Nivel 6
  WHEN exclusivo_rol_id = 1 THEN 6
  
  -- Dirección de Área → Nivel 2
  WHEN exclusivo_rol_id IN (2, 3, 11, 12, 13, 14, 15, 16, 27) THEN 2
  
  -- Gerencia → Nivel 3
  WHEN exclusivo_rol_id IN (4, 5, 6, 24) THEN 3
  
  -- Miembros/Colaboradores → Nivel 4
  WHEN exclusivo_rol_id IN (7, 8, 9, 10, 17, 18, 19, 20, 21, 22, 23, 28) THEN 4
  
  -- Sin nivel específico
  WHEN exclusivo_rol_id IN (25, 26) THEN NULL
  
  -- Si no hay exclusivo_rol_id, dejar NULL
  ELSE NULL
END
WHERE exclusivo_rol_id IS NOT NULL;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar distribución de niveles por rol
SELECT 
  exclusivo_rol_id,
  exclusivo_nivel_id,
  COUNT(*) as total_preguntas
FROM public.preguntas
WHERE exclusivo_rol_id IS NOT NULL
GROUP BY exclusivo_rol_id, exclusivo_nivel_id
ORDER BY exclusivo_rol_id, exclusivo_nivel_id;

-- Verificar preguntas sin nivel asignado (deberían ser solo las de roles 25, 26 o sin exclusivo_rol_id)
SELECT 
  exclusivo_rol_id,
  COUNT(*) as preguntas_sin_nivel
FROM public.preguntas
WHERE exclusivo_nivel_id IS NULL 
  AND exclusivo_rol_id IS NOT NULL
GROUP BY exclusivo_rol_id
ORDER BY exclusivo_rol_id;




















