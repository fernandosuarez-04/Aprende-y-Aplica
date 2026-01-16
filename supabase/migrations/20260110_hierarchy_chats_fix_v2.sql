-- ============================================
-- MIGRACIÓN: Corrección v2 - Funciones de Chats Jerárquicos
-- Fecha: 2026-01-13
-- Descripción: Reescribe las funciones para usar manager_id/leader_id
--              en lugar de roles que pueden no existir
-- ============================================

-- ===========================================
-- CORRECCIÓN: Función get_horizontal_chat_participants
-- Ahora usa manager_id/leader_id de las tablas de jerarquía
-- ===========================================

CREATE OR REPLACE FUNCTION get_horizontal_chat_participants(
  p_entity_type VARCHAR,
  p_entity_id UUID,
  p_organization_id UUID
)
RETURNS TABLE (
  user_id UUID,
  role VARCHAR,
  display_name VARCHAR,
  email VARCHAR,
  profile_picture_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    u.id as user_id,
    COALESCE(ou.role, 'member')::VARCHAR as role,
    COALESCE(u.display_name, u.first_name || ' ' || u.last_name, u.username)::VARCHAR as display_name,
    u.email::VARCHAR,
    u.profile_picture_url::TEXT
  FROM public.users u
  INNER JOIN public.organization_users ou ON ou.user_id = u.id
  WHERE ou.organization_id = p_organization_id
    AND ou.status = 'active'
    AND (
      -- Para regiones: todos los manager_id de regiones de la misma organización
      (p_entity_type = 'region' AND u.id IN (
        SELECT manager_id FROM public.organization_regions
        WHERE organization_id = p_organization_id
          AND is_active = true
          AND manager_id IS NOT NULL
      ))
      OR
      -- Para zonas: todos los manager_id de zonas de la misma región
      (p_entity_type = 'zone' AND u.id IN (
        SELECT manager_id FROM public.organization_zones
        WHERE region_id = (
          SELECT region_id FROM public.organization_zones WHERE id = p_entity_id
        )
          AND is_active = true
          AND manager_id IS NOT NULL
      ))
      OR
      -- Para equipos: todos los leader_id de equipos de la misma zona
      (p_entity_type = 'team' AND u.id IN (
        SELECT leader_id FROM public.organization_teams
        WHERE zone_id = (
          SELECT zone_id FROM public.organization_teams WHERE id = p_entity_id
        )
          AND is_active = true
          AND leader_id IS NOT NULL
      ))
    );
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- CORRECCIÓN: Función get_vertical_chat_participants
-- Ahora usa manager_id/leader_id de las tablas de jerarquía
-- ===========================================

CREATE OR REPLACE FUNCTION get_vertical_chat_participants(
  p_entity_type VARCHAR,
  p_entity_id UUID,
  p_organization_id UUID
)
RETURNS TABLE (
  user_id UUID,
  role VARCHAR,
  display_name VARCHAR,
  email VARCHAR,
  profile_picture_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    u.id as user_id,
    COALESCE(ou.role, 'member')::VARCHAR as role,
    COALESCE(u.display_name, u.first_name || ' ' || u.last_name, u.username)::VARCHAR as display_name,
    u.email::VARCHAR,
    u.profile_picture_url::TEXT
  FROM public.users u
  INNER JOIN public.organization_users ou ON ou.user_id = u.id
  WHERE ou.organization_id = p_organization_id
    AND ou.status = 'active'
    AND (
      -- Para regiones: manager de la región + todos los manager_id de zonas de esa región
      (p_entity_type = 'region' AND (
        -- Manager de la región
        u.id IN (
          SELECT manager_id FROM public.organization_regions
          WHERE id = p_entity_id AND manager_id IS NOT NULL
        )
        OR
        -- Managers de zonas de la región
        u.id IN (
          SELECT manager_id FROM public.organization_zones
          WHERE region_id = p_entity_id
            AND is_active = true
            AND manager_id IS NOT NULL
        )
      ))
      OR
      -- Para zonas: manager de la zona + todos los leader_id de equipos de esa zona
      (p_entity_type = 'zone' AND (
        -- Manager de la zona
        u.id IN (
          SELECT manager_id FROM public.organization_zones
          WHERE id = p_entity_id AND manager_id IS NOT NULL
        )
        OR
        -- Leaders de equipos de la zona
        u.id IN (
          SELECT leader_id FROM public.organization_teams
          WHERE zone_id = p_entity_id
            AND is_active = true
            AND leader_id IS NOT NULL
        )
      ))
      OR
      -- Para equipos: leader del equipo + todos los miembros (member) del equipo
      (p_entity_type = 'team' AND (
        -- Leader del equipo
        u.id IN (
          SELECT leader_id FROM public.organization_teams
          WHERE id = p_entity_id AND leader_id IS NOT NULL
        )
        OR
        -- Miembros del equipo (usuarios con team_id = p_entity_id)
        (ou.team_id = p_entity_id AND ou.role = 'member')
      ))
    );
END;
$$ LANGUAGE plpgsql;

-- Comentarios actualizados
COMMENT ON FUNCTION get_horizontal_chat_participants IS
  'Obtiene los participantes para un chat horizontal (mismo nivel jerárquico).
   Usa manager_id/leader_id de las tablas de jerarquía en lugar de roles.
   Para regiones: todos los managers de regiones.
   Para zonas: todos los managers de zonas de la misma región.
   Para equipos: todos los leaders de equipos de la misma zona.';

COMMENT ON FUNCTION get_vertical_chat_participants IS
  'Obtiene los participantes para un chat vertical (líder con subordinados).
   Usa manager_id/leader_id de las tablas de jerarquía en lugar de roles.
   Para regiones: manager regional + managers de zonas.
   Para zonas: manager de zona + leaders de equipos.
   Para equipos: leader de equipo + miembros del equipo.';



