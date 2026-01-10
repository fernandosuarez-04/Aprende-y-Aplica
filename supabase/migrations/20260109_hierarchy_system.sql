-- ============================================
-- MIGRACIÓN: Sistema de Permisos Jerárquicos
-- Fecha: 2026-01-09
-- Descripción: Implementa el modelo jerárquico opcional
--              basado en Región > Zona > Equipo
-- ============================================

-- ===========================================
-- PARTE 1: MODIFICAR TABLA ORGANIZATIONS
-- ===========================================

-- Agregar campo para activar/desactivar jerarquía
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS hierarchy_enabled boolean DEFAULT false;

-- Agregar campo para configuración de jerarquía (labels personalizados, etc.)
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS hierarchy_config jsonb DEFAULT '{}'::jsonb;

-- Índice para consultas por jerarquía activa
CREATE INDEX IF NOT EXISTS idx_organizations_hierarchy_enabled
ON public.organizations(hierarchy_enabled) WHERE hierarchy_enabled = true;

-- Comentarios descriptivos
COMMENT ON COLUMN public.organizations.hierarchy_enabled IS
  'Indica si la organización tiene activada la jerarquía por Región/Zona/Equipo. Default: false (modo plano)';
COMMENT ON COLUMN public.organizations.hierarchy_config IS
  'Configuración adicional de jerarquía: labels personalizados (región→sucursal, etc.), reglas, opciones';

-- ===========================================
-- PARTE 2: CREAR TABLA ORGANIZATION_REGIONS
-- ===========================================

CREATE TABLE IF NOT EXISTS public.organization_regions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name character varying(100) NOT NULL,
  description text,
  code character varying(20),
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- Primary Key
  CONSTRAINT organization_regions_pkey PRIMARY KEY (id),

  -- Foreign Keys
  CONSTRAINT organization_regions_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES public.organizations(id)
    ON DELETE CASCADE,
  CONSTRAINT organization_regions_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES public.users(id)
    ON DELETE SET NULL,

  -- Unique constraint: nombre único por organización
  CONSTRAINT organization_regions_unique_name
    UNIQUE (organization_id, name)
);

-- Índices para organization_regions
CREATE INDEX IF NOT EXISTS idx_organization_regions_org_id
ON public.organization_regions(organization_id);

CREATE INDEX IF NOT EXISTS idx_organization_regions_active
ON public.organization_regions(organization_id, is_active)
WHERE is_active = true;

-- Comentarios
COMMENT ON TABLE public.organization_regions IS
  'Regiones de una organización. Nivel más alto de la jerarquía (ej: Región Norte, Región Sur)';
COMMENT ON COLUMN public.organization_regions.code IS
  'Código corto opcional para identificación rápida (ej: REG-N, REG-S)';
COMMENT ON COLUMN public.organization_regions.metadata IS
  'Datos adicionales flexibles: configuración específica de la región, estadísticas, etc.';

-- ===========================================
-- PARTE 3: CREAR TABLA ORGANIZATION_ZONES
-- ===========================================

CREATE TABLE IF NOT EXISTS public.organization_zones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  region_id uuid NOT NULL,
  name character varying(100) NOT NULL,
  description text,
  code character varying(20),
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- Primary Key
  CONSTRAINT organization_zones_pkey PRIMARY KEY (id),

  -- Foreign Keys
  CONSTRAINT organization_zones_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES public.organizations(id)
    ON DELETE CASCADE,
  CONSTRAINT organization_zones_region_id_fkey
    FOREIGN KEY (region_id)
    REFERENCES public.organization_regions(id)
    ON DELETE CASCADE,
  CONSTRAINT organization_zones_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES public.users(id)
    ON DELETE SET NULL,

  -- Unique constraint: nombre único por región
  CONSTRAINT organization_zones_unique_name
    UNIQUE (organization_id, region_id, name)
);

-- Índices para organization_zones
CREATE INDEX IF NOT EXISTS idx_organization_zones_org_id
ON public.organization_zones(organization_id);

CREATE INDEX IF NOT EXISTS idx_organization_zones_region_id
ON public.organization_zones(region_id);

CREATE INDEX IF NOT EXISTS idx_organization_zones_active
ON public.organization_zones(organization_id, is_active)
WHERE is_active = true;

-- Comentarios
COMMENT ON TABLE public.organization_zones IS
  'Zonas de una organización. Nivel intermedio de la jerarquía, pertenece a una Región';
COMMENT ON COLUMN public.organization_zones.region_id IS
  'Región padre a la que pertenece esta zona';

-- ===========================================
-- PARTE 4: CREAR TABLA ORGANIZATION_TEAMS
-- ===========================================

CREATE TABLE IF NOT EXISTS public.organization_teams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  zone_id uuid NOT NULL,
  name character varying(100) NOT NULL,
  description text,
  code character varying(20),
  max_members integer,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- Primary Key
  CONSTRAINT organization_teams_pkey PRIMARY KEY (id),

  -- Foreign Keys
  CONSTRAINT organization_teams_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES public.organizations(id)
    ON DELETE CASCADE,
  CONSTRAINT organization_teams_zone_id_fkey
    FOREIGN KEY (zone_id)
    REFERENCES public.organization_zones(id)
    ON DELETE CASCADE,
  CONSTRAINT organization_teams_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES public.users(id)
    ON DELETE SET NULL,

  -- Unique constraint: nombre único por zona
  CONSTRAINT organization_teams_unique_name
    UNIQUE (organization_id, zone_id, name),

  -- Check constraint: max_members debe ser positivo si se especifica
  CONSTRAINT organization_teams_max_members_positive
    CHECK (max_members IS NULL OR max_members > 0)
);

-- Índices para organization_teams
CREATE INDEX IF NOT EXISTS idx_organization_teams_org_id
ON public.organization_teams(organization_id);

CREATE INDEX IF NOT EXISTS idx_organization_teams_zone_id
ON public.organization_teams(zone_id);

CREATE INDEX IF NOT EXISTS idx_organization_teams_active
ON public.organization_teams(organization_id, is_active)
WHERE is_active = true;

-- Comentarios
COMMENT ON TABLE public.organization_teams IS
  'Equipos de una organización. Nivel más bajo de la jerarquía, pertenece a una Zona';
COMMENT ON COLUMN public.organization_teams.zone_id IS
  'Zona padre a la que pertenece este equipo';
COMMENT ON COLUMN public.organization_teams.max_members IS
  'Límite opcional de miembros en el equipo. NULL = sin límite';

-- ===========================================
-- PARTE 5: MODIFICAR TABLA ORGANIZATION_USERS
-- ===========================================

-- 5.1 Actualizar constraint de roles para incluir nuevos roles jerárquicos
ALTER TABLE public.organization_users
DROP CONSTRAINT IF EXISTS organization_users_role_check;

ALTER TABLE public.organization_users
ADD CONSTRAINT organization_users_role_check
CHECK (role::text = ANY (ARRAY[
  'owner'::text,            -- Propietario (control total, sin restricciones)
  'admin'::text,            -- Administrador genérico (ámbito según asignación)
  'regional_manager'::text, -- Gerente Regional (acceso a toda una región)
  'zone_manager'::text,     -- Gerente de Zona (acceso a toda una zona)
  'team_leader'::text,      -- Líder de Equipo (acceso a su equipo)
  'member'::text            -- Miembro básico (acceso solo a su equipo)
]));

-- 5.2 Agregar campos de asignación jerárquica
ALTER TABLE public.organization_users
ADD COLUMN IF NOT EXISTS team_id uuid,
ADD COLUMN IF NOT EXISTS zone_id uuid,
ADD COLUMN IF NOT EXISTS region_id uuid,
ADD COLUMN IF NOT EXISTS hierarchy_scope character varying(20) DEFAULT NULL;

-- 5.3 Agregar foreign keys para campos jerárquicos
-- Nota: Usamos DO block para evitar errores si ya existen
DO $$
BEGIN
  -- FK para team_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'organization_users_team_id_fkey'
  ) THEN
    ALTER TABLE public.organization_users
    ADD CONSTRAINT organization_users_team_id_fkey
      FOREIGN KEY (team_id)
      REFERENCES public.organization_teams(id)
      ON DELETE SET NULL;
  END IF;

  -- FK para zone_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'organization_users_zone_id_fkey'
  ) THEN
    ALTER TABLE public.organization_users
    ADD CONSTRAINT organization_users_zone_id_fkey
      FOREIGN KEY (zone_id)
      REFERENCES public.organization_zones(id)
      ON DELETE SET NULL;
  END IF;

  -- FK para region_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'organization_users_region_id_fkey'
  ) THEN
    ALTER TABLE public.organization_users
    ADD CONSTRAINT organization_users_region_id_fkey
      FOREIGN KEY (region_id)
      REFERENCES public.organization_regions(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 5.4 Constraint para hierarchy_scope
ALTER TABLE public.organization_users
DROP CONSTRAINT IF EXISTS organization_users_hierarchy_scope_check;

ALTER TABLE public.organization_users
ADD CONSTRAINT organization_users_hierarchy_scope_check
CHECK (hierarchy_scope IS NULL OR hierarchy_scope = ANY (ARRAY[
  'organization'::text,  -- Acceso a toda la organización
  'region'::text,        -- Acceso solo a una región
  'zone'::text,          -- Acceso solo a una zona
  'team'::text           -- Acceso solo a un equipo
]));

-- 5.5 Índices para consultas jerárquicas
CREATE INDEX IF NOT EXISTS idx_org_users_team_id
ON public.organization_users(team_id)
WHERE team_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_org_users_zone_id
ON public.organization_users(zone_id)
WHERE zone_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_org_users_region_id
ON public.organization_users(region_id)
WHERE region_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_org_users_hierarchy_scope
ON public.organization_users(organization_id, hierarchy_scope);

-- Índice compuesto para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_org_users_org_team_active
ON public.organization_users(organization_id, team_id)
WHERE status = 'active';

-- Comentarios
COMMENT ON COLUMN public.organization_users.team_id IS
  'Equipo asignado al usuario (nivel más bajo de la jerarquía)';
COMMENT ON COLUMN public.organization_users.zone_id IS
  'Zona asignada directamente (para zone_managers). Si el usuario tiene team_id, se deriva del equipo';
COMMENT ON COLUMN public.organization_users.region_id IS
  'Región asignada directamente (para regional_managers). Si el usuario tiene team_id o zone_id, se deriva';
COMMENT ON COLUMN public.organization_users.hierarchy_scope IS
  'Nivel de alcance del usuario: organization (todo), region (su región), zone (su zona), team (su equipo)';

-- ===========================================
-- PARTE 6: CREAR VISTAS AUXILIARES
-- ===========================================

-- 6.1 Vista de jerarquía completa (región > zona > equipo)
CREATE OR REPLACE VIEW public.v_organization_hierarchy AS
SELECT
  t.id as team_id,
  t.name as team_name,
  t.code as team_code,
  t.organization_id,
  t.zone_id,
  z.name as zone_name,
  z.code as zone_code,
  z.region_id,
  r.name as region_name,
  r.code as region_code,
  t.is_active as team_active,
  z.is_active as zone_active,
  r.is_active as region_active,
  -- Solo incluir si toda la cadena está activa
  (t.is_active AND z.is_active AND r.is_active) as fully_active
FROM public.organization_teams t
INNER JOIN public.organization_zones z ON t.zone_id = z.id
INNER JOIN public.organization_regions r ON z.region_id = r.id;

COMMENT ON VIEW public.v_organization_hierarchy IS
  'Vista que une equipos con sus zonas y regiones para consultas eficientes';

-- 6.2 Vista de usuarios con su jerarquía completa
CREATE OR REPLACE VIEW public.v_user_hierarchy AS
SELECT
  ou.id as org_user_id,
  ou.user_id,
  ou.organization_id,
  ou.role,
  ou.status,
  ou.job_title,
  ou.team_id,
  ou.zone_id as direct_zone_id,
  ou.region_id as direct_region_id,
  ou.hierarchy_scope,
  -- Datos del equipo
  t.name as team_name,
  t.code as team_code,
  -- Zona (directa o derivada del equipo)
  COALESCE(ou.zone_id, t.zone_id) as effective_zone_id,
  z.name as zone_name,
  z.code as zone_code,
  -- Región (directa, derivada de zona, o derivada del equipo)
  COALESCE(ou.region_id, z.region_id) as effective_region_id,
  r.name as region_name,
  r.code as region_code,
  -- Info de la organización
  o.name as organization_name,
  o.hierarchy_enabled
FROM public.organization_users ou
LEFT JOIN public.organization_teams t ON ou.team_id = t.id
LEFT JOIN public.organization_zones z ON COALESCE(ou.zone_id, t.zone_id) = z.id
LEFT JOIN public.organization_regions r ON COALESCE(ou.region_id, z.region_id) = r.id
LEFT JOIN public.organizations o ON ou.organization_id = o.id;

COMMENT ON VIEW public.v_user_hierarchy IS
  'Vista de usuarios con toda su información jerárquica resuelta (directa y derivada)';

-- ===========================================
-- PARTE 7: CREAR FUNCIONES HELPER
-- ===========================================

-- 7.1 Función para obtener IDs de equipos accesibles por un usuario
CREATE OR REPLACE FUNCTION public.get_user_accessible_team_ids(
  p_user_id uuid,
  p_organization_id uuid
) RETURNS uuid[] AS $$
DECLARE
  v_user_info record;
  v_team_ids uuid[];
BEGIN
  -- Obtener información del usuario en la organización
  SELECT
    ou.role,
    ou.team_id,
    ou.zone_id,
    ou.region_id,
    ou.hierarchy_scope,
    o.hierarchy_enabled
  INTO v_user_info
  FROM organization_users ou
  JOIN organizations o ON ou.organization_id = o.id
  WHERE ou.user_id = p_user_id
    AND ou.organization_id = p_organization_id
    AND ou.status = 'active';

  -- Si no se encuentra el usuario, retornar array vacío
  IF v_user_info IS NULL THEN
    RETURN ARRAY[]::uuid[];
  END IF;

  -- Si la jerarquía está desactivada, retornar NULL (significa sin filtro)
  IF v_user_info.hierarchy_enabled = false THEN
    RETURN NULL;
  END IF;

  -- Owner siempre tiene acceso total
  IF v_user_info.role = 'owner' THEN
    RETURN NULL;
  END IF;

  -- Según el scope del usuario, obtener equipos accesibles
  CASE v_user_info.hierarchy_scope
    WHEN 'organization' THEN
      -- Acceso a toda la organización
      RETURN NULL;

    WHEN 'region' THEN
      -- Acceso a todos los equipos de su región
      SELECT array_agg(t.id) INTO v_team_ids
      FROM organization_teams t
      INNER JOIN organization_zones z ON t.zone_id = z.id
      WHERE z.region_id = v_user_info.region_id
        AND t.is_active = true
        AND z.is_active = true;
      RETURN COALESCE(v_team_ids, ARRAY[]::uuid[]);

    WHEN 'zone' THEN
      -- Acceso a todos los equipos de su zona
      SELECT array_agg(t.id) INTO v_team_ids
      FROM organization_teams t
      WHERE t.zone_id = v_user_info.zone_id
        AND t.is_active = true;
      RETURN COALESCE(v_team_ids, ARRAY[]::uuid[]);

    WHEN 'team' THEN
      -- Acceso solo a su equipo
      IF v_user_info.team_id IS NOT NULL THEN
        RETURN ARRAY[v_user_info.team_id];
      ELSE
        RETURN ARRAY[]::uuid[];
      END IF;

    ELSE
      -- Por defecto, basarse en el rol
      CASE v_user_info.role
        WHEN 'admin' THEN
          RETURN NULL; -- Admin sin scope específico = acceso total
        WHEN 'regional_manager' THEN
          IF v_user_info.region_id IS NOT NULL THEN
            SELECT array_agg(t.id) INTO v_team_ids
            FROM organization_teams t
            INNER JOIN organization_zones z ON t.zone_id = z.id
            WHERE z.region_id = v_user_info.region_id AND t.is_active = true;
            RETURN COALESCE(v_team_ids, ARRAY[]::uuid[]);
          END IF;
        WHEN 'zone_manager' THEN
          IF v_user_info.zone_id IS NOT NULL THEN
            SELECT array_agg(t.id) INTO v_team_ids
            FROM organization_teams t
            WHERE t.zone_id = v_user_info.zone_id AND t.is_active = true;
            RETURN COALESCE(v_team_ids, ARRAY[]::uuid[]);
          END IF;
        ELSE
          -- team_leader, member: solo su equipo
          IF v_user_info.team_id IS NOT NULL THEN
            RETURN ARRAY[v_user_info.team_id];
          END IF;
      END CASE;
      RETURN ARRAY[]::uuid[];
  END CASE;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_user_accessible_team_ids IS
  'Retorna los IDs de equipos a los que un usuario tiene acceso. NULL significa sin restricción (acceso total).';

-- 7.2 Función para verificar si un usuario puede acceder a un equipo específico
CREATE OR REPLACE FUNCTION public.user_can_access_team(
  p_user_id uuid,
  p_organization_id uuid,
  p_team_id uuid
) RETURNS boolean AS $$
DECLARE
  v_accessible_teams uuid[];
BEGIN
  -- Obtener equipos accesibles
  v_accessible_teams := public.get_user_accessible_team_ids(p_user_id, p_organization_id);

  -- NULL significa sin restricción = acceso total
  IF v_accessible_teams IS NULL THEN
    RETURN true;
  END IF;

  -- Verificar si el equipo está en la lista
  RETURN p_team_id = ANY(v_accessible_teams);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.user_can_access_team IS
  'Verifica si un usuario tiene acceso a un equipo específico basado en su jerarquía';

-- 7.3 Función para obtener estadísticas de jerarquía de una organización
CREATE OR REPLACE FUNCTION public.get_hierarchy_stats(
  p_organization_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'regions_count', (
      SELECT COUNT(*) FROM organization_regions
      WHERE organization_id = p_organization_id AND is_active = true
    ),
    'zones_count', (
      SELECT COUNT(*) FROM organization_zones
      WHERE organization_id = p_organization_id AND is_active = true
    ),
    'teams_count', (
      SELECT COUNT(*) FROM organization_teams
      WHERE organization_id = p_organization_id AND is_active = true
    ),
    'users_assigned', (
      SELECT COUNT(*) FROM organization_users
      WHERE organization_id = p_organization_id
        AND status = 'active'
        AND team_id IS NOT NULL
    ),
    'users_unassigned', (
      SELECT COUNT(*) FROM organization_users
      WHERE organization_id = p_organization_id
        AND status = 'active'
        AND team_id IS NULL
        AND role != 'owner'
    ),
    'hierarchy_enabled', (
      SELECT hierarchy_enabled FROM organizations WHERE id = p_organization_id
    )
  ) INTO v_stats;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_hierarchy_stats IS
  'Retorna estadísticas de la jerarquía de una organización';

-- ===========================================
-- PARTE 8: TRIGGERS PARA UPDATED_AT
-- ===========================================

-- Función genérica para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para organization_regions
DROP TRIGGER IF EXISTS update_organization_regions_updated_at ON public.organization_regions;
CREATE TRIGGER update_organization_regions_updated_at
  BEFORE UPDATE ON public.organization_regions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para organization_zones
DROP TRIGGER IF EXISTS update_organization_zones_updated_at ON public.organization_zones;
CREATE TRIGGER update_organization_zones_updated_at
  BEFORE UPDATE ON public.organization_zones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para organization_teams
DROP TRIGGER IF EXISTS update_organization_teams_updated_at ON public.organization_teams;
CREATE TRIGGER update_organization_teams_updated_at
  BEFORE UPDATE ON public.organization_teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- FIN DE LA MIGRACIÓN
-- ===========================================
