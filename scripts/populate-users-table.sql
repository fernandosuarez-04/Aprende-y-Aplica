-- Script para poblar la tabla users con datos de ejemplo
-- Ejecutar en Supabase SQL Editor

-- Insertar usuarios de ejemplo
INSERT INTO users (
  id,
  username,
  email,
  first_name,
  last_name,
  display_name,
  profile_picture_url,
  created_at,
  updated_at
) VALUES 
(
  '8365d552-f342-4cd7-ae6b-dff8063a1377',
  'admin_user',
  'admin@aprendeyapica.com',
  'Admin',
  'User',
  'Admin User',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  NOW(),
  NOW()
),
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'maria_garcia',
  'maria.garcia@empresa.com',
  'María',
  'García',
  'María García',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
  NOW(),
  NOW()
),
(
  'b2c3d4e5-f6g7-8901-bcde-f23456789012',
  'carlos_lopez',
  'carlos.lopez@tech.com',
  'Carlos',
  'López',
  'Carlos López',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  NOW(),
  NOW()
),
(
  'c3d4e5f6-g7h8-9012-cdef-345678901234',
  'ana_martinez',
  'ana.martinez@startup.com',
  'Ana',
  'Martínez',
  'Ana Martínez',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  NOW(),
  NOW()
),
(
  'd4e5f6g7-h8i9-0123-defg-456789012345',
  'jose_rodriguez',
  'jose.rodriguez@consulting.com',
  'José',
  'Rodríguez',
  'José Rodríguez',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  display_name = EXCLUDED.display_name,
  profile_picture_url = EXCLUDED.profile_picture_url,
  updated_at = NOW();

-- Verificar que los usuarios se insertaron correctamente
SELECT 
  id,
  username,
  email,
  display_name,
  profile_picture_url
FROM users 
WHERE id IN (
  '8365d552-f342-4cd7-ae6b-dff8063a1377',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'b2c3d4e5-f6g7-8901-bcde-f23456789012',
  'c3d4e5f6-g7h8-9012-cdef-345678901234',
  'd4e5f6g7-h8i9-0123-defg-456789012345'
)
ORDER BY created_at;
