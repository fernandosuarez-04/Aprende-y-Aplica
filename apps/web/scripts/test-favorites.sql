-- Script para probar la funcionalidad de favoritos
-- Ejecutar este script en Supabase SQL Editor

-- 1. Verificar que la tabla user_favorites existe
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_favorites'
ORDER BY ordinal_position;

-- 2. Verificar que hay cursos en la tabla courses
SELECT 
  id,
  title,
  category,
  is_active
FROM courses 
WHERE is_active = true
LIMIT 5;

-- 3. Verificar que hay usuarios en la tabla users
SELECT 
  id,
  username,
  email
FROM users
LIMIT 3;

-- 4. Insertar algunos favoritos de prueba (reemplaza los IDs con los reales)
-- NOTA: Ejecuta esto solo después de verificar que tienes usuarios y cursos
/*
INSERT INTO user_favorites (user_id, course_id) VALUES
(
  (SELECT id FROM users LIMIT 1), -- Primer usuario
  (SELECT id FROM courses WHERE is_active = true LIMIT 1) -- Primer curso
),
(
  (SELECT id FROM users LIMIT 1), -- Primer usuario
  (SELECT id FROM courses WHERE is_active = true LIMIT 1 OFFSET 1) -- Segundo curso
);
*/

-- 5. Verificar favoritos insertados
SELECT 
  uf.id,
  u.username,
  c.title as course_title,
  uf.created_at
FROM user_favorites uf
JOIN users u ON uf.user_id = u.id
JOIN courses c ON uf.course_id = c.id
ORDER BY uf.created_at DESC;

-- 6. Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'user_favorites';
