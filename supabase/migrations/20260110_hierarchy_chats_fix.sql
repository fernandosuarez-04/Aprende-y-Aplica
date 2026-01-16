-- ============================================
-- MIGRACIÓN: Correcciones al Sistema de Chats Jerárquicos
-- Fecha: 2026-01-13
-- Descripción: Corrige la función get_horizontal_chat_participants
--              para que busque correctamente los zone_manager de la misma región
-- ============================================

-- ===========================================
-- CORRECCIÓN: Función get_horizontal_chat_participants
-- ===========================================

-- Reemplazar la función para corregir la lógica de zonas
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
    ou.user_id,
    ou.role::VARCHAR,
    COALESCE(u.display_name, u.first_name || ' ' || u.last_name, u.username)::VARCHAR as display_name,
    u.email::VARCHAR,
    u.profile_picture_url::TEXT
  FROM public.organization_users ou
  INNER JOIN public.users u ON u.id = ou.user_id
  WHERE ou.organization_id = p_organization_id
    AND ou.status = 'active'
    AND (
      -- Para regiones: todos los regional_manager de la misma organización con la misma región asignada
      (p_entity_type = 'region' AND ou.role = 'regional_manager' AND ou.region_id = p_entity_id)
      OR
      -- Para zonas: todos los zone_manager de la misma región (corregido: obtener región de la zona)
      (p_entity_type = 'zone' AND ou.role = 'zone_manager' AND ou.zone_id IN (
        SELECT id FROM public.organization_zones WHERE region_id = (
          SELECT region_id FROM public.organization_zones WHERE id = p_entity_id
        )
      ))
      OR
      -- Para equipos: todos los team_leader de la misma zona (obtener la zona del equipo)
      (p_entity_type = 'team' AND ou.role = 'team_leader' AND ou.team_id IN (
        SELECT id FROM public.organization_teams WHERE zone_id = (
          SELECT zone_id FROM public.organization_teams WHERE id = p_entity_id
        )
      ))
    );
END;
$$ LANGUAGE plpgsql;

-- Comentario actualizado
COMMENT ON FUNCTION get_horizontal_chat_participants IS
  'Obtiene los participantes para un chat horizontal (mismo nivel jerárquico). 
   Para regiones: todos los regional_manager de la misma región.
   Para zonas: todos los zone_manager de la misma región.
   Para equipos: todos los team_leader de la misma zona.';



