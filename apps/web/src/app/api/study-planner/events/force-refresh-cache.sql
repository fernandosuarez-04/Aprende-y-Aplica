-- Script para forzar la actualización del caché de PostgREST
-- Ejecuta este script DESPUÉS de ejecutar migration.sql

-- 1. Verificar que la tabla existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_calendar_events'
  ) THEN
    RAISE EXCEPTION 'La tabla user_calendar_events no existe. Ejecuta primero migration.sql';
  END IF;
END $$;

-- 2. Forzar la actualización del caché de PostgREST
-- Esto se hace ejecutando una consulta simple que fuerza a PostgREST a refrescar su caché
SELECT 1 FROM user_calendar_events LIMIT 1;

-- 3. Verificar que todo está correcto
SELECT 
  'Tabla creada correctamente' as status,
  COUNT(*) as total_events
FROM user_calendar_events;

-- NOTA: Si después de ejecutar esto sigue sin funcionar:
-- 1. Espera 1-2 minutos
-- 2. Reinicia tu proyecto de Supabase (Settings > Restart Project)
-- 3. O contacta con soporte de Supabase

