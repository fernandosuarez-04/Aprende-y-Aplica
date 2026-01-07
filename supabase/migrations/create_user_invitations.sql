-- =============================================================================
-- MIGRACIÓN: TABLA user_invitations
-- Sistema de Invitaciones por Correo para Organizaciones Empresariales
-- =============================================================================
-- INSTRUCCIONES: Ejecutar este script en Supabase SQL Editor
-- =============================================================================

-- Crear tabla de invitaciones
CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =============================================================================
-- ÍNDICES PARA OPTIMIZACIÓN DE QUERIES
-- =============================================================================

-- Índice principal para búsqueda por token (validación de invitación)
CREATE INDEX IF NOT EXISTS idx_invitations_token
  ON user_invitations(token)
  WHERE status = 'pending';

-- Índice para buscar invitaciones por email + organización (registro SSO/manual)
CREATE INDEX IF NOT EXISTS idx_invitations_email_org
  ON user_invitations(email, organization_id, status);

-- Índice para listar invitaciones de una organización
CREATE INDEX IF NOT EXISTS idx_invitations_org_status
  ON user_invitations(organization_id, status, created_at DESC);

-- Índice para limpieza de invitaciones expiradas
CREATE INDEX IF NOT EXISTS idx_invitations_expires
  ON user_invitations(expires_at)
  WHERE status = 'pending';

-- =============================================================================
-- FUNCIÓN PARA LIMPIAR INVITACIONES EXPIRADAS
-- =============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE user_invitations
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =============================================================================

COMMENT ON TABLE user_invitations IS 'Almacena invitaciones de usuarios a organizaciones empresariales';
COMMENT ON COLUMN user_invitations.token IS 'Token único para validar la invitación (64 caracteres hexadecimales)';
COMMENT ON COLUMN user_invitations.role IS 'Rol asignado al usuario al aceptar la invitación (owner, admin, member)';
COMMENT ON COLUMN user_invitations.status IS 'Estado de la invitación: pending, accepted, expired, revoked';
COMMENT ON COLUMN user_invitations.expires_at IS 'Fecha de expiración de la invitación (por defecto 7 días)';
COMMENT ON COLUMN user_invitations.metadata IS 'Datos adicionales: position, department, custom_message, etc.';

-- =============================================================================
-- VERIFICAR CREACIÓN
-- =============================================================================

-- Ejecutar esta query para verificar que la tabla se creó correctamente:
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_invitations'
ORDER BY ordinal_position;
