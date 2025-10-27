-- Script para actualizar user_perfil con user_ids válidos
-- Ejecutar en Supabase SQL Editor

-- Actualizar los perfiles existentes para que apunten a usuarios válidos
UPDATE user_perfil 
SET user_id = '8365d552-f342-4cd7-ae6b-dff8063a1377'
WHERE user_id = '8365d552-f342-4cd7-ae6b-dff8063a1377' OR user_id IS NULL;

-- Insertar perfiles adicionales para los otros usuarios
INSERT INTO user_perfil (
  id,
  user_id,
  cargo_titulo,
  pais,
  rol_id,
  nivel_id,
  area_id,
  relacion_id,
  tamano_id,
  sector_id,
  creado_en,
  actualizado_en
) VALUES 
(
  gen_random_uuid(),
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Desarrolladora Senior',
  'España',
  1,
  2,
  1,
  1,
  2,
  1,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'b2c3d4e5-f6g7-8901-bcde-f23456789012',
  'Tech Lead',
  'México',
  2,
  3,
  2,
  2,
  3,
  2,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'c3d4e5f6-g7h8-9012-cdef-345678901234',
  'Product Manager',
  'Colombia',
  3,
  2,
  3,
  1,
  1,
  3,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'd4e5f6g7-h8i9-0123-defg-456789012345',
  'Consultor Senior',
  'Argentina',
  1,
  3,
  1,
  2,
  2,
  1,
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO NOTHING;

-- Verificar que los perfiles se crearon correctamente
SELECT 
  up.id,
  up.user_id,
  up.cargo_titulo,
  up.pais,
  u.username,
  u.display_name,
  u.profile_picture_url
FROM user_perfil up
LEFT JOIN users u ON up.user_id = u.id
ORDER BY up.creado_en DESC;
