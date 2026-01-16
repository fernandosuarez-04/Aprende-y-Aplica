-- ============================================
-- SCRIPT DE VERIFICACIÓN: Sistema de Chats Jerárquicos
-- Fecha: 2026-01-13
-- Descripción: Verifica que las tablas y funciones existan
-- ============================================

-- Verificar que las tablas existen
DO $$
BEGIN
  -- Verificar hierarchy_chats
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'hierarchy_chats') THEN
    RAISE EXCEPTION 'La tabla hierarchy_chats no existe. Ejecuta primero 20260110_hierarchy_chats.sql';
  END IF;

  -- Verificar hierarchy_chat_messages
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'hierarchy_chat_messages') THEN
    RAISE EXCEPTION 'La tabla hierarchy_chat_messages no existe. Ejecuta primero 20260110_hierarchy_chats.sql';
  END IF;

  -- Verificar hierarchy_chat_participants
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'hierarchy_chat_participants') THEN
    RAISE EXCEPTION 'La tabla hierarchy_chat_participants no existe. Ejecuta primero 20260110_hierarchy_chats.sql';
  END IF;

  RAISE NOTICE '✅ Todas las tablas de chat existen';
END $$;

-- Verificar que las funciones existen
DO $$
BEGIN
  -- Verificar get_horizontal_chat_participants
  IF NOT EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_horizontal_chat_participants'
  ) THEN
    RAISE EXCEPTION 'La función get_horizontal_chat_participants no existe. Ejecuta 20260110_hierarchy_chats_fix_v2.sql';
  END IF;

  -- Verificar get_vertical_chat_participants
  IF NOT EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_vertical_chat_participants'
  ) THEN
    RAISE EXCEPTION 'La función get_vertical_chat_participants no existe. Ejecuta 20260110_hierarchy_chats_fix_v2.sql';
  END IF;

  RAISE NOTICE '✅ Todas las funciones de chat existen';
END $$;

-- Mostrar resumen
SELECT 
  'Tablas y funciones de chat verificadas correctamente' as status;



