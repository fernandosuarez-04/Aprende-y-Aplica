-- =====================================================
-- MIGRACIÓN: Funciones Helper para Asignaciones Jerárquicas
-- Fecha: 2026-01-11
-- Descripción: Funciones SQL helper para gestionar asignaciones jerárquicas
-- =====================================================

-- =====================================================
-- 1. FUNCIONES PARA OBTENER USUARIOS DE ENTIDADES
-- =====================================================

-- Obtener usuarios de una región
CREATE OR REPLACE FUNCTION public.get_region_users(p_region_id UUID)
RETURNS TABLE(user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT ou.user_id
  FROM public.organization_users ou
  WHERE ou.region_id = p_region_id
    AND ou.status = 'active';
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_region_users(UUID) IS 
  'Retorna los IDs de usuarios activos que pertenecen a una región específica.';

-- Obtener usuarios de una zona
CREATE OR REPLACE FUNCTION public.get_zone_users(p_zone_id UUID)
RETURNS TABLE(user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT ou.user_id
  FROM public.organization_users ou
  WHERE ou.zone_id = p_zone_id
    AND ou.status = 'active';
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_zone_users(UUID) IS 
  'Retorna los IDs de usuarios activos que pertenecen a una zona específica.';

-- Obtener usuarios de un equipo
CREATE OR REPLACE FUNCTION public.get_team_users(p_team_id UUID)
RETURNS TABLE(user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT ou.user_id
  FROM public.organization_users ou
  WHERE ou.team_id = p_team_id
    AND ou.status = 'active';
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_team_users(UUID) IS 
  'Retorna los IDs de usuarios activos que pertenecen a un equipo específico.';

-- =====================================================
-- 2. FUNCIÓN PARA DETERMINAR TIPO DE ENTIDAD
-- =====================================================

-- Determinar el tipo de entidad de una asignación
CREATE OR REPLACE FUNCTION public.get_assignment_entity_type(p_assignment_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
  v_entity_type VARCHAR(20);
BEGIN
  -- Verificar en cada tabla auxiliar
  IF EXISTS (SELECT 1 FROM public.region_course_assignments WHERE hierarchy_assignment_id = p_assignment_id) THEN
    RETURN 'region';
  ELSIF EXISTS (SELECT 1 FROM public.zone_course_assignments WHERE hierarchy_assignment_id = p_assignment_id) THEN
    RETURN 'zone';
  ELSIF EXISTS (SELECT 1 FROM public.team_course_assignments WHERE hierarchy_assignment_id = p_assignment_id) THEN
    RETURN 'team';
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_assignment_entity_type(UUID) IS 
  'Determina el tipo de entidad jerárquica (region, zone, team) asociada a una asignación.';

-- =====================================================
-- 3. FUNCIÓN PARA ACTUALIZAR ESTADÍSTICAS
-- =====================================================

-- Actualizar estadísticas de una asignación
CREATE OR REPLACE FUNCTION public.update_assignment_stats(p_assignment_id UUID)
RETURNS VOID AS $$
DECLARE
  v_entity_type VARCHAR(20);
  v_entity_id UUID;
  v_total_users INTEGER;
  v_assigned_count INTEGER;
  v_completed_count INTEGER;
BEGIN
  -- Obtener tipo de entidad
  v_entity_type := public.get_assignment_entity_type(p_assignment_id);
  
  IF v_entity_type IS NULL THEN
    RAISE EXCEPTION 'Asignación % no tiene entidad asociada', p_assignment_id;
  END IF;
  
  -- Obtener entity_id según el tipo
  IF v_entity_type = 'region' THEN
    SELECT region_id INTO v_entity_id 
    FROM public.region_course_assignments 
    WHERE hierarchy_assignment_id = p_assignment_id;
    
    SELECT COUNT(*) INTO v_total_users 
    FROM public.get_region_users(v_entity_id);
    
  ELSIF v_entity_type = 'zone' THEN
    SELECT zone_id INTO v_entity_id 
    FROM public.zone_course_assignments 
    WHERE hierarchy_assignment_id = p_assignment_id;
    
    SELECT COUNT(*) INTO v_total_users 
    FROM public.get_zone_users(v_entity_id);
    
  ELSIF v_entity_type = 'team' THEN
    SELECT team_id INTO v_entity_id 
    FROM public.team_course_assignments 
    WHERE hierarchy_assignment_id = p_assignment_id;
    
    SELECT COUNT(*) INTO v_total_users 
    FROM public.get_team_users(v_entity_id);
  END IF;
  
  -- Obtener curso de la asignación
  DECLARE
    v_course_id UUID;
  BEGIN
    SELECT course_id INTO v_course_id 
    FROM public.hierarchy_course_assignments 
    WHERE id = p_assignment_id;
    
    -- Contar asignaciones individuales creadas
    SELECT COUNT(*) INTO v_assigned_count
    FROM public.organization_course_assignments
    WHERE hierarchy_assignment_id = p_assignment_id
      AND status IN ('assigned', 'in_progress', 'completed');
    
    -- Contar completados
    SELECT COUNT(*) INTO v_completed_count
    FROM public.organization_course_assignments
    WHERE hierarchy_assignment_id = p_assignment_id
      AND status = 'completed';
    
    -- Actualizar estadísticas
    UPDATE public.hierarchy_course_assignments
    SET 
      total_users = v_total_users,
      assigned_users_count = v_assigned_count,
      completed_users_count = v_completed_count,
      updated_at = NOW()
    WHERE id = p_assignment_id;
  END;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_assignment_stats(UUID) IS 
  'Actualiza las estadísticas (total_users, assigned_users_count, completed_users_count) de una asignación jerárquica.';

