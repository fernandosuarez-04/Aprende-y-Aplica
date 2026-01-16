-- =====================================================
-- MIGRACIÓN: Sistema de Asignaciones Jerárquicas de Cursos
-- Fecha: 2026-01-11
-- Descripción: Crea estructura de tablas para asignaciones de cursos a nivel jerárquico
--              (Región, Zona, Equipo) usando enfoque de tabla base + tablas auxiliares
-- =====================================================

-- =====================================================
-- 1. TABLA BASE: hierarchy_course_assignments
-- =====================================================
-- Tabla base que contiene todos los datos comunes de las asignaciones
-- Las relaciones específicas con entidades jerárquicas están en tablas auxiliares

CREATE TABLE IF NOT EXISTS public.hierarchy_course_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.users(id),
  
  -- Fechas y configuración
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  approach VARCHAR(20) CHECK (approach IN ('fast', 'balanced', 'long', 'custom')),
  
  -- Metadatos
  message TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  
  -- Estadísticas calculadas
  total_users INTEGER DEFAULT 0, -- Usuarios en la entidad al momento de asignar
  assigned_users_count INTEGER DEFAULT 0, -- Usuarios que recibieron la asignación
  completed_users_count INTEGER DEFAULT 0, -- Usuarios que completaron
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para tabla base
CREATE INDEX IF NOT EXISTS idx_hierarchy_course_assignments_org 
  ON public.hierarchy_course_assignments(organization_id);

CREATE INDEX IF NOT EXISTS idx_hierarchy_course_assignments_course 
  ON public.hierarchy_course_assignments(course_id);

CREATE INDEX IF NOT EXISTS idx_hierarchy_course_assignments_status 
  ON public.hierarchy_course_assignments(status);

CREATE INDEX IF NOT EXISTS idx_hierarchy_course_assignments_assigned_by 
  ON public.hierarchy_course_assignments(assigned_by);

CREATE INDEX IF NOT EXISTS idx_hierarchy_course_assignments_created_at 
  ON public.hierarchy_course_assignments(created_at DESC);

-- Comentarios
COMMENT ON TABLE public.hierarchy_course_assignments IS 
  'Tabla base para asignaciones de cursos a entidades jerárquicas (región, zona, equipo). Contiene datos comunes de las asignaciones.';

COMMENT ON COLUMN public.hierarchy_course_assignments.total_users IS 
  'Número total de usuarios en la entidad jerárquica al momento de crear la asignación';

COMMENT ON COLUMN public.hierarchy_course_assignments.assigned_users_count IS 
  'Número de usuarios que efectivamente recibieron la asignación (puede ser menor que total_users si algunos ya tenían el curso)';

COMMENT ON COLUMN public.hierarchy_course_assignments.completed_users_count IS 
  'Número de usuarios que completaron el curso asignado';

-- =====================================================
-- 2. TABLAS AUXILIARES
-- =====================================================

-- 2.1 Tabla auxiliar para asignaciones a regiones
CREATE TABLE IF NOT EXISTS public.region_course_assignments (
  hierarchy_assignment_id UUID PRIMARY KEY REFERENCES public.hierarchy_course_assignments(id) ON DELETE CASCADE,
  region_id UUID NOT NULL REFERENCES public.organization_regions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_region_assignment UNIQUE (hierarchy_assignment_id, region_id)
);

-- Índices para region_course_assignments
CREATE INDEX IF NOT EXISTS idx_region_course_assignments_region 
  ON public.region_course_assignments(region_id);

CREATE INDEX IF NOT EXISTS idx_region_course_assignments_assignment 
  ON public.region_course_assignments(hierarchy_assignment_id);

COMMENT ON TABLE public.region_course_assignments IS 
  'Tabla auxiliar que vincula asignaciones de cursos con regiones. Cada registro debe tener un correspondiente en hierarchy_course_assignments.';

-- 2.2 Tabla auxiliar para asignaciones a zonas
CREATE TABLE IF NOT EXISTS public.zone_course_assignments (
  hierarchy_assignment_id UUID PRIMARY KEY REFERENCES public.hierarchy_course_assignments(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES public.organization_zones(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_zone_assignment UNIQUE (hierarchy_assignment_id, zone_id)
);

-- Índices para zone_course_assignments
CREATE INDEX IF NOT EXISTS idx_zone_course_assignments_zone 
  ON public.zone_course_assignments(zone_id);

CREATE INDEX IF NOT EXISTS idx_zone_course_assignments_assignment 
  ON public.zone_course_assignments(hierarchy_assignment_id);

COMMENT ON TABLE public.zone_course_assignments IS 
  'Tabla auxiliar que vincula asignaciones de cursos con zonas. Cada registro debe tener un correspondiente en hierarchy_course_assignments.';

-- 2.3 Tabla auxiliar para asignaciones a equipos
CREATE TABLE IF NOT EXISTS public.team_course_assignments (
  hierarchy_assignment_id UUID PRIMARY KEY REFERENCES public.hierarchy_course_assignments(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.organization_teams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_team_assignment UNIQUE (hierarchy_assignment_id, team_id)
);

-- Índices para team_course_assignments
CREATE INDEX IF NOT EXISTS idx_team_course_assignments_team 
  ON public.team_course_assignments(team_id);

CREATE INDEX IF NOT EXISTS idx_team_course_assignments_assignment 
  ON public.team_course_assignments(hierarchy_assignment_id);

COMMENT ON TABLE public.team_course_assignments IS 
  'Tabla auxiliar que vincula asignaciones de cursos con equipos. Cada registro debe tener un correspondiente en hierarchy_course_assignments.';

-- =====================================================
-- 3. TRIGGER DE VALIDACIÓN
-- =====================================================
-- Asegura que cada asignación existe en exactamente una tabla auxiliar

CREATE OR REPLACE FUNCTION public.validate_single_entity_assignment()
RETURNS TRIGGER AS $$
DECLARE
  count_regions INTEGER;
  count_zones INTEGER;
  count_teams INTEGER;
  total_count INTEGER;
BEGIN
  -- Contar en cada tabla auxiliar
  SELECT COUNT(*) INTO count_regions 
  FROM public.region_course_assignments 
  WHERE hierarchy_assignment_id = NEW.hierarchy_assignment_id;
  
  SELECT COUNT(*) INTO count_zones 
  FROM public.zone_course_assignments 
  WHERE hierarchy_assignment_id = NEW.hierarchy_assignment_id;
  
  SELECT COUNT(*) INTO count_teams 
  FROM public.team_course_assignments 
  WHERE hierarchy_assignment_id = NEW.hierarchy_assignment_id;
  
  total_count := count_regions + count_zones + count_teams;
  
  IF total_count > 1 THEN
    RAISE EXCEPTION 'Una asignación no puede estar asociada a múltiples entidades jerárquicas (región, zona o equipo)';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.validate_single_entity_assignment() IS 
  'Valida que cada asignación jerárquica existe en exactamente una tabla auxiliar (región, zona o equipo, pero no múltiples).';

-- Aplicar trigger a las tres tablas auxiliares
DROP TRIGGER IF EXISTS trigger_validate_region_assignment ON public.region_course_assignments;
CREATE TRIGGER trigger_validate_region_assignment
  AFTER INSERT OR UPDATE ON public.region_course_assignments
  FOR EACH ROW EXECUTE FUNCTION public.validate_single_entity_assignment();

DROP TRIGGER IF EXISTS trigger_validate_zone_assignment ON public.zone_course_assignments;
CREATE TRIGGER trigger_validate_zone_assignment
  AFTER INSERT OR UPDATE ON public.zone_course_assignments
  FOR EACH ROW EXECUTE FUNCTION public.validate_single_entity_assignment();

DROP TRIGGER IF EXISTS trigger_validate_team_assignment ON public.team_course_assignments;
CREATE TRIGGER trigger_validate_team_assignment
  AFTER INSERT OR UPDATE ON public.team_course_assignments
  FOR EACH ROW EXECUTE FUNCTION public.validate_single_entity_assignment();

-- =====================================================
-- 4. TRIGGER PARA ACTUALIZAR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_hierarchy_assignment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_hierarchy_assignment_updated_at ON public.hierarchy_course_assignments;
CREATE TRIGGER trigger_update_hierarchy_assignment_updated_at
  BEFORE UPDATE ON public.hierarchy_course_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_hierarchy_assignment_updated_at();

