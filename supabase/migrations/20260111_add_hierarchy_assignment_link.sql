-- =====================================================
-- MIGRACIÓN: Agregar campo de vinculación a organization_course_assignments
-- Fecha: 2026-01-11
-- Descripción: Agrega campo opcional para vincular asignaciones individuales 
--              con asignaciones jerárquicas
-- =====================================================

-- Agregar campo hierarchy_assignment_id a organization_course_assignments
ALTER TABLE public.organization_course_assignments
ADD COLUMN IF NOT EXISTS hierarchy_assignment_id UUID REFERENCES public.hierarchy_course_assignments(id) ON DELETE SET NULL;

-- Crear índice para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_org_course_assignments_hierarchy_assignment 
  ON public.organization_course_assignments(hierarchy_assignment_id)
  WHERE hierarchy_assignment_id IS NOT NULL;

-- Comentario
COMMENT ON COLUMN public.organization_course_assignments.hierarchy_assignment_id IS 
  'ID de la asignación jerárquica que originó esta asignación individual. NULL si fue asignación directa.';

