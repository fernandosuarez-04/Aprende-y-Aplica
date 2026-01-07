-- =============================================================================
-- OPTIMIZACION DE INDICES PARA CARGA DE DATOS DE ORGANIZACION
-- =============================================================================
-- Este script agrega índices críticos para mejorar el rendimiento de queries
-- relacionadas con organizaciones y usuarios de negocio.
--
-- IMPORTANTE: Ejecutar este script en Supabase SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. INDICES PARA organization_users (CRITICO - queries más frecuentes)
-- -----------------------------------------------------------------------------

-- Índice compuesto para búsqueda de usuario + status activo (query más común)
-- Usado en: /api/auth/me, requireBusiness, login.ts
CREATE INDEX IF NOT EXISTS idx_organization_users_user_status
ON public.organization_users(user_id, status)
WHERE status = 'active';

-- Índice compuesto para búsqueda por organización + status
-- Usado en: validar membresía, listar usuarios de organización
CREATE INDEX IF NOT EXISTS idx_organization_users_org_status
ON public.organization_users(organization_id, status)
WHERE status = 'active';

-- Índice para ordenamiento por joined_at (usado en queries con ORDER BY)
CREATE INDEX IF NOT EXISTS idx_organization_users_user_joined
ON public.organization_users(user_id, joined_at DESC)
WHERE status = 'active';

-- Índice para el FK de organization_id (acelera JOINs)
CREATE INDEX IF NOT EXISTS idx_organization_users_organization_id
ON public.organization_users(organization_id);

-- Índice para el FK de user_id (acelera JOINs)
CREATE INDEX IF NOT EXISTS idx_organization_users_user_id
ON public.organization_users(user_id);

-- -----------------------------------------------------------------------------
-- 2. INDICES PARA organizations (búsquedas por ID y slug)
-- -----------------------------------------------------------------------------

-- Índice para búsqueda por slug (login personalizado)
-- El campo ya tiene UNIQUE pero esto optimiza búsquedas case-insensitive
CREATE INDEX IF NOT EXISTS idx_organizations_slug_lower
ON public.organizations(LOWER(slug));

-- Índice para organizaciones activas (filtro común)
CREATE INDEX IF NOT EXISTS idx_organizations_active
ON public.organizations(id)
WHERE is_active = true;

-- Índice compuesto para validación de suscripción
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status
ON public.organizations(id, subscription_status, is_active)
WHERE is_active = true;

-- -----------------------------------------------------------------------------
-- 3. INDICES PARA refresh_tokens (autenticación)
-- -----------------------------------------------------------------------------

-- Índice para búsqueda por hash del token (login con refresh tokens)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash_active
ON public.refresh_tokens(token_hash)
WHERE is_revoked = false;

-- Índice para limpieza de tokens expirados
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires
ON public.refresh_tokens(expires_at)
WHERE is_revoked = false;

-- -----------------------------------------------------------------------------
-- 4. INDICES PARA user_session (sesiones legacy)
-- -----------------------------------------------------------------------------

-- Índice para búsqueda por jwt_id (validación de sesión)
CREATE INDEX IF NOT EXISTS idx_user_session_jwt_active
ON public.user_session(jwt_id)
WHERE revoked = false;

-- -----------------------------------------------------------------------------
-- 5. INDICES PARA users (búsqueda en login)
-- -----------------------------------------------------------------------------

-- Índice para búsqueda por email (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_users_email_lower
ON public.users(LOWER(email));

-- Índice para búsqueda por username (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_users_username_lower
ON public.users(LOWER(username));

-- -----------------------------------------------------------------------------
-- ANALIZAR TABLAS DESPUÉS DE CREAR ÍNDICES
-- -----------------------------------------------------------------------------
-- Actualizar estadísticas para que el planificador use los nuevos índices

ANALYZE public.organization_users;
ANALYZE public.organizations;
ANALYZE public.refresh_tokens;
ANALYZE public.user_session;
ANALYZE public.users;

-- -----------------------------------------------------------------------------
-- VERIFICAR ÍNDICES CREADOS
-- -----------------------------------------------------------------------------
-- Ejecutar esta query para verificar que los índices se crearon correctamente:

SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('organization_users', 'organizations', 'refresh_tokens', 'user_session', 'users')
ORDER BY tablename, indexname;
