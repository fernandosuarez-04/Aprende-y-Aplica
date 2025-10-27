-- Script para verificar el estado de las tablas de estadísticas
-- Ejecutar en Supabase SQL Editor

-- Verificar que las tablas existen y tienen datos
SELECT 
  'users' as tabla,
  COUNT(*) as total_registros,
  CASE WHEN COUNT(*) > 0 THEN '✅ Con datos' ELSE '⚠️ Vacía' END as estado
FROM users
UNION ALL
SELECT 
  'courses' as tabla,
  COUNT(*) as total_registros,
  CASE WHEN COUNT(*) > 0 THEN '✅ Con datos' ELSE '⚠️ Vacía' END as estado
FROM courses
UNION ALL
SELECT 
  'ai_apps' as tabla,
  COUNT(*) as total_registros,
  CASE WHEN COUNT(*) > 0 THEN '✅ Con datos' ELSE '⚠️ Vacía' END as estado
FROM ai_apps
UNION ALL
SELECT 
  'news' as tabla,
  COUNT(*) as total_registros,
  CASE WHEN COUNT(*) > 0 THEN '✅ Con datos' ELSE '⚠️ Vacía' END as estado
FROM news
UNION ALL
SELECT 
  'reels' as tabla,
  COUNT(*) as total_registros,
  CASE WHEN COUNT(*) > 0 THEN '✅ Con datos' ELSE '⚠️ Vacía' END as estado
FROM reels
UNION ALL
SELECT 
  'user_favorites' as tabla,
  COUNT(*) as total_registros,
  CASE WHEN COUNT(*) > 0 THEN '✅ Con datos' ELSE '⚠️ Vacía' END as estado
FROM user_favorites
UNION ALL
SELECT 
  'user_session' as tabla,
  COUNT(*) as total_registros,
  CASE WHEN COUNT(*) > 0 THEN '✅ Con datos' ELSE '⚠️ Vacía' END as estado
FROM user_session
ORDER BY tabla;

-- Verificar si hay errores de permisos
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename IN ('users', 'courses', 'ai_apps', 'news', 'reels', 'user_favorites', 'user_session')
ORDER BY tablename;
