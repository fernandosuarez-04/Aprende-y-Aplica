-- =====================================================
-- MIGRACIÓN: Campos de imagen para Jerarquía
-- Fecha: 2026-01-09
-- Descripción: Añade campos logo_url y banner_url a regiones, zonas y equipos
-- =====================================================

-- =====================================================
-- 1. CAMPOS PARA REGIONES
-- =====================================================
ALTER TABLE public.organization_regions
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT;

COMMENT ON COLUMN public.organization_regions.logo_url IS 'URL del logo de la región (almacenado en hierarchy-regions bucket)';
COMMENT ON COLUMN public.organization_regions.banner_url IS 'URL del banner/cover de la región (almacenado en hierarchy-regions bucket)';


-- =====================================================
-- 2. CAMPOS PARA ZONAS
-- =====================================================
ALTER TABLE public.organization_zones
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT;

COMMENT ON COLUMN public.organization_zones.logo_url IS 'URL del logo de la zona (almacenado en hierarchy-zones bucket)';
COMMENT ON COLUMN public.organization_zones.banner_url IS 'URL del banner/cover de la zona (almacenado en hierarchy-zones bucket)';


-- =====================================================
-- 3. CAMPOS PARA EQUIPOS
-- =====================================================
ALTER TABLE public.organization_teams
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT;

COMMENT ON COLUMN public.organization_teams.logo_url IS 'URL del logo del equipo (almacenado en hierarchy-teams bucket)';
COMMENT ON COLUMN public.organization_teams.banner_url IS 'URL del banner/cover del equipo (almacenado en hierarchy-teams bucket)';


-- =====================================================
-- NOTAS
-- =====================================================
-- 
-- Los URLs tendrán el formato:
-- https://{project}.supabase.co/storage/v1/object/public/hierarchy-{type}/{entity_id}/{filename}
--
-- Ejemplo:
-- https://xyz.supabase.co/storage/v1/object/public/hierarchy-teams/abc123-uuid/logo-1704821234567.png
--
-- Estos campos se actualizan desde el frontend usando el servicio hierarchyUpload.service.ts
-- después de subir exitosamente una imagen al bucket correspondiente.
-- =====================================================
