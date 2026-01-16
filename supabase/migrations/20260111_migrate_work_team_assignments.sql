-- =====================================================
-- MIGRACIÓN: Migrar datos de work_team_course_assignments
-- Fecha: 2026-01-11
-- Descripción: Migra asignaciones de equipos antiguos (work_teams) 
--              a la nueva estructura jerárquica (organization_teams)
-- =====================================================

-- =====================================================
-- NOTA IMPORTANTE: Este script debe ejecutarse con cuidado
-- =====================================================
-- 1. Hacer backup de work_team_course_assignments antes de ejecutar
-- 2. Verificar que existan organization_teams equivalentes
-- 3. Revisar los resultados de la migración antes de confirmar

-- =====================================================
-- 1. ANÁLISIS PRE-MIGRACIÓN
-- =====================================================

-- Crear tabla temporal para análisis
CREATE TEMP TABLE IF NOT EXISTS migration_analysis AS
SELECT 
  wtca.id as old_assignment_id,
  wtca.team_id as old_team_id,
  wt.name as old_team_name,
  wt.organization_id,
  ot.id as new_team_id,
  ot.name as new_team_name,
  CASE 
    WHEN ot.id IS NOT NULL THEN 'mapped'
    ELSE 'unmapped'
  END as mapping_status
FROM public.work_team_course_assignments wtca
INNER JOIN public.work_teams wt ON wt.team_id = wtca.team_id
LEFT JOIN public.organization_teams ot 
  ON ot.organization_id = wt.organization_id 
  AND LOWER(TRIM(ot.name)) = LOWER(TRIM(wt.name))
WHERE wtca.status != 'completed' OR wtca.status IS NULL;

-- Mostrar estadísticas de mapeo
DO $$
DECLARE
  total_count INTEGER;
  mapped_count INTEGER;
  unmapped_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM migration_analysis;
  SELECT COUNT(*) INTO mapped_count FROM migration_analysis WHERE mapping_status = 'mapped';
  SELECT COUNT(*) INTO unmapped_count FROM migration_analysis WHERE mapping_status = 'unmapped';
  
  RAISE NOTICE 'Total de asignaciones a migrar: %', total_count;
  RAISE NOTICE 'Asignaciones mapeadas: %', mapped_count;
  RAISE NOTICE 'Asignaciones sin mapear: %', unmapped_count;
  
  IF unmapped_count > 0 THEN
    RAISE WARNING 'Hay % asignaciones que no se pueden migrar automáticamente. Revisar manualmente.', unmapped_count;
  END IF;
END $$;

-- =====================================================
-- 2. MIGRACIÓN DE DATOS
-- =====================================================

-- Migrar solo las asignaciones que tienen equipo equivalente
INSERT INTO public.hierarchy_course_assignments (
  organization_id,
  course_id,
  assigned_by,
  assigned_at,
  due_date,
  start_date,
  approach,
  message,
  status,
  total_users,
  assigned_users_count,
  completed_users_count,
  created_at,
  updated_at
)
SELECT 
  ma.organization_id,
  wtca.course_id,
  wtca.assigned_by,
  wtca.assigned_at,
  wtca.due_date,
  NULL as start_date, -- work_team_course_assignments no tenía este campo
  NULL as approach,   -- work_team_course_assignments no tenía este campo
  wtca.message,
  CASE 
    WHEN wtca.status = 'completed' THEN 'completed'
    WHEN wtca.status = 'in_progress' THEN 'active'
    ELSE 'active'
  END as status,
  0 as total_users, -- Se calculará después
  0 as assigned_users_count, -- Se calculará después
  0 as completed_users_count, -- Se calculará después
  wtca.created_at,
  wtca.updated_at
FROM public.work_team_course_assignments wtca
INNER JOIN migration_analysis ma ON ma.old_assignment_id = wtca.id
WHERE ma.mapping_status = 'mapped'
  AND ma.new_team_id IS NOT NULL;

-- Crear registros en team_course_assignments
INSERT INTO public.team_course_assignments (
  hierarchy_assignment_id,
  team_id,
  created_at
)
SELECT 
  hca.id,
  ma.new_team_id,
  hca.created_at
FROM public.hierarchy_course_assignments hca
INNER JOIN migration_analysis ma ON 
  ma.organization_id = hca.organization_id
  AND ma.course_id = hca.course_id
  AND ma.old_assignment_id IN (
    SELECT id FROM public.work_team_course_assignments 
    WHERE assigned_by = hca.assigned_by
      AND assigned_at = hca.assigned_at
  )
WHERE ma.mapping_status = 'mapped'
  AND ma.new_team_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.team_course_assignments tca
    WHERE tca.hierarchy_assignment_id = hca.id
  );

-- Actualizar estadísticas de las asignaciones migradas
DO $$
DECLARE
  assignment_record RECORD;
BEGIN
  FOR assignment_record IN 
    SELECT hca.id
    FROM public.hierarchy_course_assignments hca
    INNER JOIN public.team_course_assignments tca ON tca.hierarchy_assignment_id = hca.id
    WHERE hca.total_users = 0
  LOOP
    PERFORM public.update_assignment_stats(assignment_record.id);
  END LOOP;
END $$;

-- =====================================================
-- 3. VALIDACIÓN POST-MIGRACIÓN
-- =====================================================

-- Crear tabla de reporte de migración
CREATE TEMP TABLE IF NOT EXISTS migration_report AS
SELECT 
  'Migración completada' as status,
  COUNT(DISTINCT hca.id) as assignments_migrated,
  COUNT(DISTINCT tca.team_id) as teams_covered,
  COUNT(DISTINCT hca.course_id) as courses_migrated
FROM public.hierarchy_course_assignments hca
INNER JOIN public.team_course_assignments tca ON tca.hierarchy_assignment_id = hca.id
WHERE hca.created_at >= (SELECT MIN(created_at) FROM migration_analysis);

-- Mostrar reporte
DO $$
DECLARE
  assignments_migrated INTEGER;
  teams_covered INTEGER;
  courses_migrated INTEGER;
BEGIN
  SELECT 
    assignments_migrated,
    teams_covered,
    courses_migrated
  INTO 
    assignments_migrated,
    teams_covered,
    courses_migrated
  FROM migration_report
  LIMIT 1;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'REPORTE DE MIGRACIÓN';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Asignaciones migradas: %', assignments_migrated;
  RAISE NOTICE 'Equipos cubiertos: %', teams_covered;
  RAISE NOTICE 'Cursos migrados: %', courses_migrated;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- 4. LIMPIEZA
-- =====================================================

-- Las tablas temporales se eliminan automáticamente al finalizar la sesión
-- No es necesario hacer DROP explícito

-- =====================================================
-- NOTAS POST-MIGRACIÓN
-- =====================================================
-- 1. Revisar las asignaciones que no se pudieron migrar (mapping_status = 'unmapped')
-- 2. Verificar que las estadísticas se calcularon correctamente
-- 3. Validar que no hay duplicados
-- 4. Considerar marcar work_team_course_assignments como deprecated después de validar

