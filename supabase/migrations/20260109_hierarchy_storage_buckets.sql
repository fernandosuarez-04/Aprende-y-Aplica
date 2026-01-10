-- =====================================================
-- MIGRACIÓN: Buckets de Storage para Jerarquía
-- Fecha: 2026-01-09
-- Descripción: Crea buckets para imágenes de regiones, zonas y equipos
-- =====================================================

-- =====================================================
-- 1. CREAR BUCKETS
-- =====================================================

-- BUCKET: hierarchy-regions
-- Almacena imágenes de regiones (logos, banners, fotos de ubicación)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hierarchy-regions',
  'hierarchy-regions',
  true,
  10485760, -- 10MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- BUCKET: hierarchy-zones
-- Almacena imágenes de zonas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hierarchy-zones',
  'hierarchy-zones',
  true,
  10485760, -- 10MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- BUCKET: hierarchy-teams
-- Almacena imágenes de equipos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hierarchy-teams',
  'hierarchy-teams',
  true,
  10485760, -- 10MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;


-- =====================================================
-- 2. POLÍTICAS RLS - LECTURA PÚBLICA
-- =====================================================

-- Cualquiera puede ver las imágenes (buckets públicos)
CREATE POLICY "hierarchy_regions_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'hierarchy-regions');

CREATE POLICY "hierarchy_zones_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'hierarchy-zones');

CREATE POLICY "hierarchy_teams_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'hierarchy-teams');


-- =====================================================
-- 3. POLÍTICAS RLS - ESCRITURA (INSERT)
-- Solo usuarios autenticados de la organización
-- =====================================================

-- REGIONES: Solo owner/admin/regional_manager pueden subir
CREATE POLICY "hierarchy_regions_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hierarchy-regions'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM public.organization_users ou
    JOIN public.organization_regions r ON r.organization_id = ou.organization_id
    WHERE ou.user_id = auth.uid()
      AND r.id::text = (storage.foldername(name))[1]
      AND ou.role IN ('owner', 'admin', 'regional_manager')
  )
);

-- ZONAS: owner/admin/regional_manager/zone_manager pueden subir
CREATE POLICY "hierarchy_zones_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hierarchy-zones'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM public.organization_users ou
    JOIN public.organization_zones z ON z.organization_id = ou.organization_id
    WHERE ou.user_id = auth.uid()
      AND z.id::text = (storage.foldername(name))[1]
      AND ou.role IN ('owner', 'admin', 'regional_manager', 'zone_manager')
  )
);

-- EQUIPOS: owner/admin/regional_manager/zone_manager/team_leader pueden subir
CREATE POLICY "hierarchy_teams_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hierarchy-teams'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM public.organization_users ou
    JOIN public.organization_teams t ON t.organization_id = ou.organization_id
    WHERE ou.user_id = auth.uid()
      AND t.id::text = (storage.foldername(name))[1]
      AND ou.role IN ('owner', 'admin', 'regional_manager', 'zone_manager', 'team_leader')
  )
);


-- =====================================================
-- 4. POLÍTICAS RLS - ACTUALIZACIÓN (UPDATE)
-- =====================================================

CREATE POLICY "hierarchy_regions_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'hierarchy-regions'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM public.organization_users ou
    JOIN public.organization_regions r ON r.organization_id = ou.organization_id
    WHERE ou.user_id = auth.uid()
      AND r.id::text = (storage.foldername(name))[1]
      AND ou.role IN ('owner', 'admin', 'regional_manager')
  )
);

CREATE POLICY "hierarchy_zones_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'hierarchy-zones'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM public.organization_users ou
    JOIN public.organization_zones z ON z.organization_id = ou.organization_id
    WHERE ou.user_id = auth.uid()
      AND z.id::text = (storage.foldername(name))[1]
      AND ou.role IN ('owner', 'admin', 'regional_manager', 'zone_manager')
  )
);

CREATE POLICY "hierarchy_teams_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'hierarchy-teams'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM public.organization_users ou
    JOIN public.organization_teams t ON t.organization_id = ou.organization_id
    WHERE ou.user_id = auth.uid()
      AND t.id::text = (storage.foldername(name))[1]
      AND ou.role IN ('owner', 'admin', 'regional_manager', 'zone_manager', 'team_leader')
  )
);


-- =====================================================
-- 5. POLÍTICAS RLS - ELIMINACIÓN (DELETE)
-- =====================================================

CREATE POLICY "hierarchy_regions_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hierarchy-regions'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM public.organization_users ou
    JOIN public.organization_regions r ON r.organization_id = ou.organization_id
    WHERE ou.user_id = auth.uid()
      AND r.id::text = (storage.foldername(name))[1]
      AND ou.role IN ('owner', 'admin', 'regional_manager')
  )
);

CREATE POLICY "hierarchy_zones_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hierarchy-zones'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM public.organization_users ou
    JOIN public.organization_zones z ON z.organization_id = ou.organization_id
    WHERE ou.user_id = auth.uid()
      AND z.id::text = (storage.foldername(name))[1]
      AND ou.role IN ('owner', 'admin', 'regional_manager', 'zone_manager')
  )
);

CREATE POLICY "hierarchy_teams_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hierarchy-teams'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM public.organization_users ou
    JOIN public.organization_teams t ON t.organization_id = ou.organization_id
    WHERE ou.user_id = auth.uid()
      AND t.id::text = (storage.foldername(name))[1]
      AND ou.role IN ('owner', 'admin', 'regional_manager', 'zone_manager', 'team_leader')
  )
);


-- =====================================================
-- NOTAS DE ESTRUCTURA DE CARPETAS
-- =====================================================
-- 
-- Estructura esperada dentro de cada bucket:
--
-- hierarchy-regions/
--   └── {region_uuid}/
--       ├── logo-1234567890.png
--       ├── banner-1234567890.jpg
--       └── photo-1234567890.webp
--
-- hierarchy-zones/
--   └── {zone_uuid}/
--       ├── logo-1234567890.png
--       ├── banner-1234567890.jpg
--       └── photo-1234567890.webp
--
-- hierarchy-teams/
--   └── {team_uuid}/
--       ├── logo-1234567890.png
--       ├── banner-1234567890.jpg
--       └── team-photo-1234567890.webp
--
-- La función storage.foldername(name) extrae el primer segmento del path
-- que corresponde al UUID de la entidad (region_id, zone_id, team_id)
-- =====================================================
