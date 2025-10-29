-- ============================================================================
-- Modificaciones a la tabla users para soportar OAuth
-- ============================================================================

-- Agregar campos para SSO (si no existen)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS oauth_provider_id VARCHAR(255);

-- Índice para búsqueda rápida por OAuth
CREATE INDEX IF NOT EXISTS idx_users_oauth_provider
ON users(oauth_provider, oauth_provider_id);

-- Hacer password_hash nullable para usuarios OAuth
ALTER TABLE users
ALTER COLUMN password_hash DROP NOT NULL;

-- Comentarios
COMMENT ON COLUMN users.profile_picture_url IS 'URL de foto de perfil (de OAuth o subida)';
COMMENT ON COLUMN users.oauth_provider IS 'Proveedor OAuth principal (google, github)';
COMMENT ON COLUMN users.oauth_provider_id IS 'ID del usuario en el proveedor OAuth';
