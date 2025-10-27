-- ============================================================================
-- Tabla: oauth_accounts
-- Descripción: Vincula cuentas OAuth (Google, GitHub, etc.) con usuarios
-- ============================================================================

CREATE TABLE IF NOT EXISTS oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Información del proveedor OAuth
  provider VARCHAR(50) NOT NULL,           -- 'google', 'github', 'facebook', etc.
  provider_account_id VARCHAR(255) NOT NULL, -- ID del usuario en el proveedor

  -- Tokens OAuth
  access_token TEXT,                       -- Token de acceso
  refresh_token TEXT,                      -- Token de refresco
  token_expires_at TIMESTAMP,              -- Expiración del access_token

  -- Información adicional
  scope TEXT,                              -- Permisos otorgados
  token_type VARCHAR(50),                  -- Tipo de token (Bearer)

  -- Metadatos
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_provider_account UNIQUE (provider, provider_account_id)
);

-- ============================================================================
-- Índices para optimizar consultas
-- ============================================================================

-- Búsqueda por usuario
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id
ON oauth_accounts(user_id);

-- Búsqueda por proveedor y ID de cuenta
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider_account
ON oauth_accounts(provider, provider_account_id);

-- Búsqueda por proveedor
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider
ON oauth_accounts(provider);

-- ============================================================================
-- Comentarios para documentación
-- ============================================================================

COMMENT ON TABLE oauth_accounts IS 'Cuentas OAuth vinculadas a usuarios';
COMMENT ON COLUMN oauth_accounts.provider IS 'Proveedor OAuth: google, github, facebook';
COMMENT ON COLUMN oauth_accounts.provider_account_id IS 'ID único del usuario en el proveedor';
COMMENT ON COLUMN oauth_accounts.access_token IS 'Token de acceso OAuth (cifrado)';
COMMENT ON COLUMN oauth_accounts.refresh_token IS 'Token de refresco OAuth (cifrado)';
