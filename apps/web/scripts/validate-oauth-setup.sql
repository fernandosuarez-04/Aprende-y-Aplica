-- ============================================================================
-- Script de validación para la configuración OAuth
-- Ejecutar este script después de create-oauth-accounts-table.sql y alter-users-for-oauth.sql
-- ============================================================================

-- Verificar que la tabla oauth_accounts existe
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name = 'oauth_accounts';

-- Verificar columnas de oauth_accounts
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'oauth_accounts'
ORDER BY ordinal_position;

-- Verificar constraints de oauth_accounts
SELECT
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'oauth_accounts';

-- Verificar índices de oauth_accounts
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'oauth_accounts';

-- Verificar que password_hash es nullable en users
SELECT
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name = 'password_hash';

-- Verificar nuevas columnas en users
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('profile_picture_url', 'oauth_provider', 'oauth_provider_id')
ORDER BY column_name;

-- Verificar índice OAuth en users
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'users'
  AND indexname = 'idx_users_oauth_provider';
