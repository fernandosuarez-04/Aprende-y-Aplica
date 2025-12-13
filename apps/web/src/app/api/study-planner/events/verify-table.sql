-- Script para verificar que la tabla user_calendar_events existe
-- Ejecuta este script en Supabase SQL Editor para verificar

-- 1. Verificar que la tabla existe
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_calendar_events';

-- 2. Verificar las columnas de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_calendar_events'
ORDER BY ordinal_position;

-- 3. Verificar las políticas RLS
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'user_calendar_events';

-- 4. Verificar los índices
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'user_calendar_events';

-- 5. Si la tabla NO existe, ejecuta el contenido de migration.sql
-- Si la tabla existe pero PostgREST no la reconoce, espera 1-2 minutos
-- o reinicia tu proyecto de Supabase

