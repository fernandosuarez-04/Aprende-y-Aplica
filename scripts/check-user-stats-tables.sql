-- Script para verificar si las tablas de estadísticas de usuarios existen
-- Ejecutar en Supabase SQL Editor

-- Verificar si las tablas existen
SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN 'EXISTE'
    ELSE 'NO EXISTE'
  END as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'user_perfil',
    'preguntas', 
    'respuestas',
    'adopcion_genai',
    'roles',
    'niveles',
    'areas',
    'relaciones',
    'tamanos_empresa',
    'sectores'
  )
ORDER BY table_name;

-- Verificar estructura de la tabla user_perfil si existe
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_perfil' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar estructura de la tabla preguntas si existe
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'preguntas' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar estructura de la tabla respuestas si existe
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'respuestas' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar estructura de la tabla adopcion_genai si existe
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'adopcion_genai' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
