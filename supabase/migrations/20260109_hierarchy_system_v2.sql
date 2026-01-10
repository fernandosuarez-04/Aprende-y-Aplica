-- ============================================
-- MIGRACIÓN: Sistema de Jerarquía v2 - Campos Adicionales
-- Fecha: 2026-01-09
-- Descripción: Agrega campos de ubicación, contacto y
--              gerente/líder a regiones, zonas y equipos
-- ============================================

-- ===========================================
-- PARTE 1: CAMPOS ADICIONALES PARA REGIONES
-- ===========================================

-- Campos de ubicación
ALTER TABLE public.organization_regions
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS city character varying(100),
ADD COLUMN IF NOT EXISTS state character varying(100),
ADD COLUMN IF NOT EXISTS country character varying(100) DEFAULT 'México',
ADD COLUMN IF NOT EXISTS postal_code character varying(20),
ADD COLUMN IF NOT EXISTS latitude numeric(10, 8),
ADD COLUMN IF NOT EXISTS longitude numeric(11, 8);

-- Campos de contacto
ALTER TABLE public.organization_regions
ADD COLUMN IF NOT EXISTS phone character varying(30),
ADD COLUMN IF NOT EXISTS email character varying(255);

-- Campo de gerente regional asignado
ALTER TABLE public.organization_regions
ADD COLUMN IF NOT EXISTS manager_id uuid;

-- Foreign key para manager_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'organization_regions_manager_id_fkey'
  ) THEN
    ALTER TABLE public.organization_regions
    ADD CONSTRAINT organization_regions_manager_id_fkey
      FOREIGN KEY (manager_id)
      REFERENCES public.users(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Índice para manager_id
CREATE INDEX IF NOT EXISTS idx_organization_regions_manager_id
ON public.organization_regions(manager_id)
WHERE manager_id IS NOT NULL;

-- Comentarios
COMMENT ON COLUMN public.organization_regions.address IS 'Dirección física de la región (oficina principal)';
COMMENT ON COLUMN public.organization_regions.city IS 'Ciudad donde se ubica la región';
COMMENT ON COLUMN public.organization_regions.state IS 'Estado o provincia';
COMMENT ON COLUMN public.organization_regions.country IS 'País';
COMMENT ON COLUMN public.organization_regions.postal_code IS 'Código postal';
COMMENT ON COLUMN public.organization_regions.latitude IS 'Latitud para mapa';
COMMENT ON COLUMN public.organization_regions.longitude IS 'Longitud para mapa';
COMMENT ON COLUMN public.organization_regions.phone IS 'Teléfono de contacto de la región';
COMMENT ON COLUMN public.organization_regions.email IS 'Email de contacto de la región';
COMMENT ON COLUMN public.organization_regions.manager_id IS 'Usuario asignado como Gerente Regional';

-- ===========================================
-- PARTE 2: CAMPOS ADICIONALES PARA ZONAS
-- ===========================================

-- Campos de ubicación
ALTER TABLE public.organization_zones
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS city character varying(100),
ADD COLUMN IF NOT EXISTS state character varying(100),
ADD COLUMN IF NOT EXISTS country character varying(100) DEFAULT 'México',
ADD COLUMN IF NOT EXISTS postal_code character varying(20),
ADD COLUMN IF NOT EXISTS latitude numeric(10, 8),
ADD COLUMN IF NOT EXISTS longitude numeric(11, 8);

-- Campos de contacto
ALTER TABLE public.organization_zones
ADD COLUMN IF NOT EXISTS phone character varying(30),
ADD COLUMN IF NOT EXISTS email character varying(255);

-- Campo de gerente de zona asignado
ALTER TABLE public.organization_zones
ADD COLUMN IF NOT EXISTS manager_id uuid;

-- Foreign key para manager_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'organization_zones_manager_id_fkey'
  ) THEN
    ALTER TABLE public.organization_zones
    ADD CONSTRAINT organization_zones_manager_id_fkey
      FOREIGN KEY (manager_id)
      REFERENCES public.users(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Índice para manager_id
CREATE INDEX IF NOT EXISTS idx_organization_zones_manager_id
ON public.organization_zones(manager_id)
WHERE manager_id IS NOT NULL;

-- Comentarios
COMMENT ON COLUMN public.organization_zones.address IS 'Dirección física de la zona (oficina principal)';
COMMENT ON COLUMN public.organization_zones.city IS 'Ciudad donde se ubica la zona';
COMMENT ON COLUMN public.organization_zones.state IS 'Estado o provincia';
COMMENT ON COLUMN public.organization_zones.country IS 'País';
COMMENT ON COLUMN public.organization_zones.postal_code IS 'Código postal';
COMMENT ON COLUMN public.organization_zones.latitude IS 'Latitud para mapa';
COMMENT ON COLUMN public.organization_zones.longitude IS 'Longitud para mapa';
COMMENT ON COLUMN public.organization_zones.phone IS 'Teléfono de contacto de la zona';
COMMENT ON COLUMN public.organization_zones.email IS 'Email de contacto de la zona';
COMMENT ON COLUMN public.organization_zones.manager_id IS 'Usuario asignado como Gerente de Zona';

-- ===========================================
-- PARTE 3: CAMPOS ADICIONALES PARA EQUIPOS
-- ===========================================

-- Campos de ubicación
ALTER TABLE public.organization_teams
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS city character varying(100),
ADD COLUMN IF NOT EXISTS state character varying(100),
ADD COLUMN IF NOT EXISTS country character varying(100) DEFAULT 'México',
ADD COLUMN IF NOT EXISTS postal_code character varying(20),
ADD COLUMN IF NOT EXISTS latitude numeric(10, 8),
ADD COLUMN IF NOT EXISTS longitude numeric(11, 8);

-- Campos de contacto
ALTER TABLE public.organization_teams
ADD COLUMN IF NOT EXISTS phone character varying(30),
ADD COLUMN IF NOT EXISTS email character varying(255);

-- Campo de líder de equipo asignado
ALTER TABLE public.organization_teams
ADD COLUMN IF NOT EXISTS leader_id uuid;

-- Campo de objetivo/meta del equipo
ALTER TABLE public.organization_teams
ADD COLUMN IF NOT EXISTS target_goal text,
ADD COLUMN IF NOT EXISTS monthly_target numeric(12, 2);

-- Foreign key para leader_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'organization_teams_leader_id_fkey'
  ) THEN
    ALTER TABLE public.organization_teams
    ADD CONSTRAINT organization_teams_leader_id_fkey
      FOREIGN KEY (leader_id)
      REFERENCES public.users(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Índice para leader_id
CREATE INDEX IF NOT EXISTS idx_organization_teams_leader_id
ON public.organization_teams(leader_id)
WHERE leader_id IS NOT NULL;

-- Comentarios
COMMENT ON COLUMN public.organization_teams.address IS 'Dirección física del equipo (oficina/sucursal)';
COMMENT ON COLUMN public.organization_teams.city IS 'Ciudad donde se ubica el equipo';
COMMENT ON COLUMN public.organization_teams.state IS 'Estado o provincia';
COMMENT ON COLUMN public.organization_teams.country IS 'País';
COMMENT ON COLUMN public.organization_teams.postal_code IS 'Código postal';
COMMENT ON COLUMN public.organization_teams.latitude IS 'Latitud para mapa';
COMMENT ON COLUMN public.organization_teams.longitude IS 'Longitud para mapa';
COMMENT ON COLUMN public.organization_teams.phone IS 'Teléfono de contacto del equipo';
COMMENT ON COLUMN public.organization_teams.email IS 'Email de contacto del equipo';
COMMENT ON COLUMN public.organization_teams.leader_id IS 'Usuario asignado como Líder de Equipo';
COMMENT ON COLUMN public.organization_teams.target_goal IS 'Descripción del objetivo/meta del equipo';
COMMENT ON COLUMN public.organization_teams.monthly_target IS 'Meta mensual numérica (ventas, leads, etc.)';

-- ===========================================
-- PARTE 4: ACTUALIZAR VISTAS CON DATOS DE GERENTES/LÍDERES
-- ===========================================

-- Vista actualizada de jerarquía completa con info de gerentes
CREATE OR REPLACE VIEW public.v_organization_hierarchy_full AS
SELECT
  -- Datos del equipo
  t.id as team_id,
  t.name as team_name,
  t.code as team_code,
  t.description as team_description,
  t.organization_id,
  t.max_members,
  t.target_goal as team_target_goal,
  t.monthly_target as team_monthly_target,
  t.address as team_address,
  t.city as team_city,
  t.state as team_state,
  t.country as team_country,
  t.phone as team_phone,
  t.email as team_email,
  t.leader_id,
  t.is_active as team_active,

  -- Datos del líder del equipo
  tl.id as team_leader_user_id,
  tl.display_name as team_leader_name,
  tl.email as team_leader_email,
  tl.profile_picture_url as team_leader_avatar,

  -- Datos de la zona
  t.zone_id,
  z.name as zone_name,
  z.code as zone_code,
  z.description as zone_description,
  z.address as zone_address,
  z.city as zone_city,
  z.state as zone_state,
  z.country as zone_country,
  z.phone as zone_phone,
  z.email as zone_email,
  z.manager_id as zone_manager_id,
  z.is_active as zone_active,

  -- Datos del gerente de zona
  zm.id as zone_manager_user_id,
  zm.display_name as zone_manager_name,
  zm.email as zone_manager_email,
  zm.profile_picture_url as zone_manager_avatar,

  -- Datos de la región
  z.region_id,
  r.name as region_name,
  r.code as region_code,
  r.description as region_description,
  r.address as region_address,
  r.city as region_city,
  r.state as region_state,
  r.country as region_country,
  r.phone as region_phone,
  r.email as region_email,
  r.manager_id as region_manager_id,
  r.is_active as region_active,

  -- Datos del gerente regional
  rm.id as region_manager_user_id,
  rm.display_name as region_manager_name,
  rm.email as region_manager_email,
  rm.profile_picture_url as region_manager_avatar,

  -- Bandera de activo completo
  (t.is_active AND z.is_active AND r.is_active) as fully_active

FROM public.organization_teams t
INNER JOIN public.organization_zones z ON t.zone_id = z.id
INNER JOIN public.organization_regions r ON z.region_id = r.id
LEFT JOIN public.users tl ON t.leader_id = tl.id
LEFT JOIN public.users zm ON z.manager_id = zm.id
LEFT JOIN public.users rm ON r.manager_id = rm.id;

COMMENT ON VIEW public.v_organization_hierarchy_full IS
  'Vista completa de jerarquía con información de ubicación y gerentes/líderes';

-- ===========================================
-- PARTE 5: FUNCIÓN PARA OBTENER JERARQUÍA CON DETALLES
-- ===========================================

CREATE OR REPLACE FUNCTION public.get_region_details(
  p_region_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'region', jsonb_build_object(
      'id', r.id,
      'name', r.name,
      'code', r.code,
      'description', r.description,
      'is_active', r.is_active,
      'address', r.address,
      'city', r.city,
      'state', r.state,
      'country', r.country,
      'postal_code', r.postal_code,
      'phone', r.phone,
      'email', r.email,
      'latitude', r.latitude,
      'longitude', r.longitude,
      'created_at', r.created_at,
      'updated_at', r.updated_at
    ),
    'manager', CASE WHEN m.id IS NOT NULL THEN jsonb_build_object(
      'id', m.id,
      'display_name', m.display_name,
      'first_name', m.first_name,
      'last_name', m.last_name,
      'email', m.email,
      'profile_picture_url', m.profile_picture_url
    ) ELSE NULL END,
    'stats', jsonb_build_object(
      'zones_count', (SELECT COUNT(*) FROM organization_zones WHERE region_id = r.id AND is_active = true),
      'teams_count', (SELECT COUNT(*) FROM organization_teams t
                      INNER JOIN organization_zones z ON t.zone_id = z.id
                      WHERE z.region_id = r.id AND t.is_active = true),
      'users_count', (SELECT COUNT(*) FROM organization_users
                      WHERE region_id = r.id AND status = 'active')
    )
  ) INTO v_result
  FROM organization_regions r
  LEFT JOIN users m ON r.manager_id = m.id
  WHERE r.id = p_region_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.get_zone_details(
  p_zone_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'zone', jsonb_build_object(
      'id', z.id,
      'name', z.name,
      'code', z.code,
      'description', z.description,
      'is_active', z.is_active,
      'address', z.address,
      'city', z.city,
      'state', z.state,
      'country', z.country,
      'postal_code', z.postal_code,
      'phone', z.phone,
      'email', z.email,
      'latitude', z.latitude,
      'longitude', z.longitude,
      'region_id', z.region_id,
      'created_at', z.created_at,
      'updated_at', z.updated_at
    ),
    'region', jsonb_build_object(
      'id', r.id,
      'name', r.name,
      'code', r.code
    ),
    'manager', CASE WHEN m.id IS NOT NULL THEN jsonb_build_object(
      'id', m.id,
      'display_name', m.display_name,
      'first_name', m.first_name,
      'last_name', m.last_name,
      'email', m.email,
      'profile_picture_url', m.profile_picture_url
    ) ELSE NULL END,
    'stats', jsonb_build_object(
      'teams_count', (SELECT COUNT(*) FROM organization_teams WHERE zone_id = z.id AND is_active = true),
      'users_count', (SELECT COUNT(*) FROM organization_users
                      WHERE zone_id = z.id AND status = 'active')
    )
  ) INTO v_result
  FROM organization_zones z
  INNER JOIN organization_regions r ON z.region_id = r.id
  LEFT JOIN users m ON z.manager_id = m.id
  WHERE z.id = p_zone_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.get_team_details(
  p_team_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'team', jsonb_build_object(
      'id', t.id,
      'name', t.name,
      'code', t.code,
      'description', t.description,
      'is_active', t.is_active,
      'max_members', t.max_members,
      'target_goal', t.target_goal,
      'monthly_target', t.monthly_target,
      'address', t.address,
      'city', t.city,
      'state', t.state,
      'country', t.country,
      'postal_code', t.postal_code,
      'phone', t.phone,
      'email', t.email,
      'latitude', t.latitude,
      'longitude', t.longitude,
      'zone_id', t.zone_id,
      'created_at', t.created_at,
      'updated_at', t.updated_at
    ),
    'zone', jsonb_build_object(
      'id', z.id,
      'name', z.name,
      'code', z.code
    ),
    'region', jsonb_build_object(
      'id', r.id,
      'name', r.name,
      'code', r.code
    ),
    'leader', CASE WHEN l.id IS NOT NULL THEN jsonb_build_object(
      'id', l.id,
      'display_name', l.display_name,
      'first_name', l.first_name,
      'last_name', l.last_name,
      'email', l.email,
      'profile_picture_url', l.profile_picture_url
    ) ELSE NULL END,
    'stats', jsonb_build_object(
      'members_count', (SELECT COUNT(*) FROM organization_users
                        WHERE team_id = t.id AND status = 'active'),
      'capacity_percentage', CASE
        WHEN t.max_members IS NOT NULL AND t.max_members > 0 THEN
          ROUND(((SELECT COUNT(*)::numeric FROM organization_users WHERE team_id = t.id AND status = 'active') / t.max_members) * 100, 1)
        ELSE NULL
      END
    )
  ) INTO v_result
  FROM organization_teams t
  INNER JOIN organization_zones z ON t.zone_id = z.id
  INNER JOIN organization_regions r ON z.region_id = r.id
  LEFT JOIN users l ON t.leader_id = l.id
  WHERE t.id = p_team_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_region_details IS 'Obtiene detalles completos de una región incluyendo gerente y estadísticas';
COMMENT ON FUNCTION public.get_zone_details IS 'Obtiene detalles completos de una zona incluyendo gerente y estadísticas';
COMMENT ON FUNCTION public.get_team_details IS 'Obtiene detalles completos de un equipo incluyendo líder y estadísticas';

-- ===========================================
-- FIN DE LA MIGRACIÓN V2
-- ===========================================
