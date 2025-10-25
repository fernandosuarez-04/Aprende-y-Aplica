-- ============================================================================
-- Tabla: password_reset_tokens
-- Descripción: Almacena tokens de recuperación de contraseña
-- Fecha: 2025-01-25
-- ============================================================================

-- Crear tabla para tokens de recuperación
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP,

  -- Foreign key constraint
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- Índices para optimizar consultas
-- ============================================================================

-- Índice para búsqueda rápida por token
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token
ON password_reset_tokens(token);

-- Índice para búsqueda por user_id
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
ON password_reset_tokens(user_id);

-- Índice para limpiar tokens expirados
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at
ON password_reset_tokens(expires_at);

-- ============================================================================
-- Comentarios para documentación
-- ============================================================================

COMMENT ON TABLE password_reset_tokens IS 'Tokens de recuperación de contraseña con expiración de 1 hora';
COMMENT ON COLUMN password_reset_tokens.id IS 'ID único del token';
COMMENT ON COLUMN password_reset_tokens.user_id IS 'ID del usuario que solicita recuperación';
COMMENT ON COLUMN password_reset_tokens.token IS 'Token aleatorio de 64 caracteres (hex)';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Fecha y hora de expiración (1 hora desde creación)';
COMMENT ON COLUMN password_reset_tokens.created_at IS 'Fecha y hora de creación del token';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'Fecha y hora cuando se usó el token (NULL si no usado)';

-- ============================================================================
-- Función para limpiar tokens expirados (ejecutar periódicamente)
-- ============================================================================

-- Esta query se puede ejecutar con un cron job o manualmente
-- DELETE FROM password_reset_tokens
-- WHERE expires_at < NOW() OR used_at IS NOT NULL;

-- ============================================================================
-- Verificación de creación exitosa
-- ============================================================================

-- Para verificar que la tabla se creó correctamente, ejecuta:
-- SELECT * FROM password_reset_tokens LIMIT 1;
