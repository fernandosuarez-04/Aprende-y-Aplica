-- =====================================================
-- MIGRACIÓN: Corrección de políticas RLS para Storage de Jerarquía
-- Fecha: 2026-01-09
-- Descripción: Simplifica las políticas RLS para evitar errores de violacion de política
--              al subir imágenes. Permite a usuarios autenticados gestionar archivos.
-- =====================================================

-- 1. REGIONES
DROP POLICY IF EXISTS "hierarchy_regions_insert" ON storage.objects;
CREATE POLICY "hierarchy_regions_insert" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'hierarchy-regions' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "hierarchy_regions_update" ON storage.objects;
CREATE POLICY "hierarchy_regions_update" ON storage.objects FOR UPDATE
USING (bucket_id = 'hierarchy-regions' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "hierarchy_regions_delete" ON storage.objects;
CREATE POLICY "hierarchy_regions_delete" ON storage.objects FOR DELETE
USING (bucket_id = 'hierarchy-regions' AND auth.role() = 'authenticated');

-- 2. ZONAS
DROP POLICY IF EXISTS "hierarchy_zones_insert" ON storage.objects;
CREATE POLICY "hierarchy_zones_insert" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'hierarchy-zones' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "hierarchy_zones_update" ON storage.objects;
CREATE POLICY "hierarchy_zones_update" ON storage.objects FOR UPDATE
USING (bucket_id = 'hierarchy-zones' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "hierarchy_zones_delete" ON storage.objects;
CREATE POLICY "hierarchy_zones_delete" ON storage.objects FOR DELETE
USING (bucket_id = 'hierarchy-zones' AND auth.role() = 'authenticated');

-- 3. EQUIPOS
DROP POLICY IF EXISTS "hierarchy_teams_insert" ON storage.objects;
CREATE POLICY "hierarchy_teams_insert" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'hierarchy-teams' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "hierarchy_teams_update" ON storage.objects;
CREATE POLICY "hierarchy_teams_update" ON storage.objects FOR UPDATE
USING (bucket_id = 'hierarchy-teams' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "hierarchy_teams_delete" ON storage.objects;
CREATE POLICY "hierarchy_teams_delete" ON storage.objects FOR DELETE
USING (bucket_id = 'hierarchy-teams' AND auth.role() = 'authenticated');
