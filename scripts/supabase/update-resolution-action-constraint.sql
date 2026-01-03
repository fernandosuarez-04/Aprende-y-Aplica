-- Script para actualizar el constraint de resolution_action en community_post_reports
-- Este script agrega 'unhide_post' como valor válido para resolution_action

-- Paso 1: Eliminar el constraint existente
ALTER TABLE community_post_reports 
DROP CONSTRAINT IF EXISTS community_post_reports_resolution_action_check;

-- Paso 2: Crear el nuevo constraint con todos los valores válidos
ALTER TABLE community_post_reports
ADD CONSTRAINT community_post_reports_resolution_action_check 
CHECK (
  resolution_action IS NULL OR 
  resolution_action IN (
    'delete_post',
    'hide_post',
    'unhide_post',
    'ignore_report',
    'warn_user',
    'false_report',
    'warn_reporter'
  )
);

-- Verificar que el constraint se creó correctamente
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'community_post_reports_resolution_action_check';




