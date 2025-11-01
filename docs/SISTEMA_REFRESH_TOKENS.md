# Sistema de Refresh Tokens - Documentación Completa

## 📋 Descripción General

El sistema de refresh tokens implementa una arquitectura de seguridad robusta que reduce significativamente el riesgo de secuestro de sesión mediante el uso de tokens de corta duración (access tokens) y tokens de larga duración (refresh tokens).

### Problema Resuelto (Issue #17)

**Antes**: Las sesiones duraban 7-30 días completos, lo que significaba que si un token era robado, el atacante tenía acceso durante todo ese período.

**Ahora**: Los access tokens duran solo 30 minutos y se renuevan automáticamente usando refresh tokens seguros. Si un access token es robado, el atacante solo tiene acceso por máximo 30 minutos.

## 🏗️ Arquitectura

### Flujo de Autenticación

```
┌─────────────┐       ┌──────────────┐       ┌──────────────┐
│   Cliente   │       │   Servidor   │       │   Database   │
└─────┬───────┘       └──────┬───────┘       └──────┬───────┘
      │                      │                      │
      │  1. Login (OAuth)    │                      │
      ├─────────────────────>│                      │
      │                      │  2. Crear usuario    │
      │                      ├─────────────────────>│
      │                      │                      │
      │                      │  3. Guardar refresh  │
      │                      │     token (hash)     │
      │                      ├─────────────────────>│
      │                      │                      │
      │  4. Set cookies:     │                      │
      │     - access_token   │                      │
      │     - refresh_token  │                      │
      │<─────────────────────┤                      │
      │                      │                      │
      │  5. Request protegido│                      │
      │     (con access_token)                      │
      ├─────────────────────>│                      │
      │                      │  6. Validar token    │
      │                      ├─────────────────────>│
      │                      │                      │
      │  7. Response         │                      │
      │<─────────────────────┤                      │
      │                      │                      │
      │  [30 min después]    │                      │
      │                      │                      │
      │  8. Request (token   │                      │
      │     expirado)        │                      │
      ├─────────────────────>│                      │
      │                      │  9. Auto-refresh     │
      │                      │     (middleware)     │
      │                      ├─────────────────────>│
      │                      │                      │
      │  10. New access_token│                      │
      │<─────────────────────┤                      │
      │                      │                      │
      │  11. Logout          │                      │
      ├─────────────────────>│                      │
      │                      │  12. Revocar tokens  │
      │                      ├─────────────────────>│
      │                      │                      │
      │  13. Clear cookies   │                      │
      │<─────────────────────┤                      │
```

## 🔐 Características de Seguridad

### 1. Tokens de Corta Duración
- **Access Token**: 30 minutos
- **Refresh Token**: 7 días (login normal) o 30 días (remember me)
- Si un access token es robado, solo funciona 30 minutos

### 2. Hashing Seguro
- Los refresh tokens se guardan hasheados con bcrypt (10 rounds)
- Nunca se almacenan en texto plano en la base de datos
- Los tokens se generan con `crypto.randomBytes(32)` (256 bits de entropía)

### 3. Device Fingerprinting
- Se crea una huella digital del dispositivo usando:
  - User-Agent
  - Accept-Language
  - Accept-Encoding
- Se hashea con SHA256
- Permite detectar tokens usados desde dispositivos sospechosos

### 4. Detección de Inactividad
- Timeout de inactividad: 24 horas
- Si un usuario no usa su sesión por 24 horas, debe re-autenticarse
- Se actualiza `last_used_at` en cada refresh

### 5. Revocación de Tokens
- Los tokens pueden ser revocados individualmente
- Logout revoca TODOS los tokens del usuario (cierra todas las sesiones)
- Los tokens revocados se marcan con `is_revoked = true` y `revoked_reason`

### 6. Limpieza Automática
- Función `clean_expired_refresh_tokens()` limpia:
  - Tokens expirados hace más de 30 días
  - Tokens revocados hace más de 90 días

## 📂 Estructura de Archivos

```
apps/web/
├── src/
│   ├── lib/
│   │   └── auth/
│   │       └── refreshToken.service.ts      # Servicio principal
│   ├── features/
│   │   └── auth/
│   │       ├── services/
│   │       │   └── session.service.ts       # Integración con sistema legacy
│   │       └── hooks/
│   │           └── useSessionRefresh.ts     # Hook de React
│   ├── app/
│   │   └── api/
│   │       └── auth/
│   │           ├── refresh/
│   │           │   └── route.ts             # Endpoint de refresh manual
│   │           └── sessions/
│   │               └── route.ts             # Gestión de sesiones
│   └── middleware.ts                        # Auto-refresh middleware
└── database-fixes/
    └── create_refresh_tokens_table.sql      # Schema de base de datos
```

## 🗄️ Schema de Base de Datos

### Tabla: `refresh_tokens`

```sql
CREATE TABLE public.refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  device_fingerprint TEXT,
  ip_address TEXT,
  user_agent TEXT,
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_reason TEXT
);
```

### Índices

```sql
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_last_used_at ON refresh_tokens(last_used_at);
CREATE INDEX idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked) WHERE is_revoked = false;
```

## 🚀 Uso del Sistema

### 1. Integración Automática en Login

El sistema se integra automáticamente cuando un usuario inicia sesión:

```typescript
// apps/web/src/features/auth/actions/oauth.ts
await SessionService.createSession(userId, false);
```

Internamente, esto:
1. Genera access token (30 min) y refresh token (7-30 días)
2. Hashea el refresh token con bcrypt
3. Guarda el hash en la base de datos con metadata
4. Establece cookies httpOnly seguras
5. Mantiene compatibilidad con sistema legacy

### 2. Refresh Automático en Middleware

El middleware intercepta todas las requests a rutas protegidas:

```typescript
// apps/web/middleware.ts
if (hasRefreshToken && !hasAccessToken) {
  await RefreshTokenService.refreshSession(request);
}
```

Esto sucede transparentemente para el usuario.

### 3. Refresh Manual desde el Cliente

Usa el hook `useSessionRefresh` en componentes que requieren autenticación:

```tsx
'use client';

import { useSessionRefresh } from '@/features/auth/hooks/useSessionRefresh';

export function Dashboard() {
  const { refreshNow, isRefreshing } = useSessionRefresh({
    refreshBeforeExpiry: 5, // Refrescar 5 min antes de expirar
    onExpiry: () => {
      toast.error('Tu sesión ha expirado');
    }
  });
  
  return (
    <div>
      <h1>Dashboard</h1>
      {/* El hook refresca automáticamente cada ~25 minutos */}
      <button onClick={refreshNow} disabled={isRefreshing}>
        Refrescar sesión manualmente
      </button>
    </div>
  );
}
```

### 4. Ver Sesiones Activas

Crear una página de perfil/seguridad:

```tsx
'use client';

import { useEffect, useState } from 'react';

interface Session {
  id: string;
  created_at: string;
  last_used_at: string;
  device_fingerprint: string;
  ip_address: string;
  user_agent: string;
}

export function SessionsManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  
  useEffect(() => {
    fetch('/api/auth/sessions')
      .then(res => res.json())
      .then(data => setSessions(data.sessions));
  }, []);
  
  const revokeSession = async (tokenId: string) => {
    await fetch(`/api/auth/sessions/${tokenId}`, {
      method: 'DELETE'
    });
    // Refrescar lista
    const res = await fetch('/api/auth/sessions');
    const data = await res.json();
    setSessions(data.sessions);
  };
  
  return (
    <div>
      <h2>Sesiones Activas</h2>
      {sessions.map(session => (
        <div key={session.id}>
          <p>IP: {session.ip_address}</p>
          <p>Dispositivo: {session.user_agent}</p>
          <p>Último uso: {new Date(session.last_used_at).toLocaleString()}</p>
          <button onClick={() => revokeSession(session.id)}>
            Cerrar esta sesión
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 5. Logout

El logout automáticamente revoca todos los tokens:

```typescript
// apps/web/src/app/api/auth/logout/route.ts
await SessionService.destroySession();
```

Esto:
1. Busca el user_id de la sesión actual
2. Marca todos los refresh tokens del usuario como revocados
3. Elimina las cookies
4. Marca la sesión legacy como revocada

## 🔧 API Endpoints

### POST /api/auth/refresh

Renueva el access token manualmente.

**Request**: No requiere body, usa cookies

**Response**:
```json
{
  "success": true,
  "message": "Token renovado exitosamente",
  "expiresAt": "2025-10-31T12:30:00Z"
}
```

**Errores**:
- `401 SESSION_EXPIRED`: Refresh token inválido o expirado
- `500`: Error del servidor

### GET /api/auth/refresh

Obtiene el estado de la sesión actual.

**Response**:
```json
{
  "success": true,
  "authenticated": true,
  "userId": "uuid-here",
  "accessExpiresAt": "2025-10-31T12:00:00Z",
  "refreshExpiresAt": "2025-11-07T11:30:00Z"
}
```

### GET /api/auth/sessions

Lista todas las sesiones activas del usuario.

**Response**:
```json
{
  "success": true,
  "sessions": [
    {
      "id": "uuid-1",
      "created_at": "2025-10-31T11:00:00Z",
      "last_used_at": "2025-10-31T11:30:00Z",
      "device_fingerprint": "abc123...",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "expires_at": "2025-11-07T11:00:00Z"
    }
  ]
}
```

### DELETE /api/auth/sessions/:tokenId

Revoca una sesión específica.

**Response**:
```json
{
  "success": true,
  "message": "Sesión revocada exitosamente"
}
```

## 🛠️ Mantenimiento

### Limpieza de Tokens Expirados

Ejecutar periódicamente (cron job o similar):

```typescript
import { RefreshTokenService } from '@/lib/auth/refreshToken.service';

// En un cron job diario
await RefreshTokenService.cleanExpiredTokens();
```

Esto elimina:
- Tokens expirados hace más de 30 días
- Tokens revocados hace más de 90 días

### Monitoreo

Queries útiles para monitorear el sistema:

```sql
-- Tokens activos por usuario
SELECT user_id, COUNT(*) as active_sessions
FROM refresh_tokens
WHERE is_revoked = false AND expires_at > NOW()
GROUP BY user_id
ORDER BY active_sessions DESC;

-- Tokens expirados pendientes de limpieza
SELECT COUNT(*)
FROM refresh_tokens
WHERE expires_at < NOW() - INTERVAL '30 days';

-- Sesiones por dispositivo
SELECT 
  LEFT(user_agent, 50) as device,
  COUNT(*) as sessions
FROM refresh_tokens
WHERE is_revoked = false AND expires_at > NOW()
GROUP BY LEFT(user_agent, 50)
ORDER BY sessions DESC;
```

## 🧪 Testing

### Test 1: Login crea tokens correctamente

```bash
# 1. Login via OAuth
# (navegar a /auth y hacer login con Google)

# 2. Verificar cookies en DevTools
# Deberías ver:
# - access_token (httpOnly)
# - refresh_token (httpOnly)

# 3. Verificar en DB
SELECT * FROM refresh_tokens WHERE user_id = 'tu-user-id';
# Debería haber un registro con is_revoked = false
```

### Test 2: Access token expira y se refresca automáticamente

```bash
# 1. Login normalmente
# 2. Esperar 30 minutos (o modificar ACCESS_TOKEN_EXPIRY_MS a 1 minuto para testing)
# 3. Hacer una request a una ruta protegida
# 4. Verificar en DevTools > Network que se refrescó el access_token
# 5. Verificar en DB que last_used_at se actualizó
```

### Test 3: Inactividad de 24 horas cierra sesión

```bash
# 1. Login normalmente
# 2. Modificar last_used_at a hace 25 horas:
UPDATE refresh_tokens 
SET last_used_at = NOW() - INTERVAL '25 hours'
WHERE user_id = 'tu-user-id';

# 3. Intentar acceder a ruta protegida
# 4. Debería redirigir a /auth con error=session_expired
```

### Test 4: Logout revoca todos los tokens

```bash
# 1. Login desde múltiples dispositivos/navegadores
# 2. Verificar múltiples tokens en DB:
SELECT COUNT(*) FROM refresh_tokens 
WHERE user_id = 'tu-user-id' AND is_revoked = false;

# 3. Hacer logout desde un dispositivo
# 4. Verificar que TODOS los tokens están revocados:
SELECT COUNT(*) FROM refresh_tokens 
WHERE user_id = 'tu-user-id' AND is_revoked = false;
-- Debería ser 0
```

### Test 5: Refresh manual funciona

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Cookie: access_token=...; refresh_token=..." \
  -H "Content-Type: application/json"

# Debería devolver:
# {
#   "success": true,
#   "message": "Token renovado exitosamente",
#   "expiresAt": "..."
# }
```

## 🔒 Mejores Prácticas

### Para Desarrolladores

1. **Siempre usa httpOnly cookies**: Nunca almacenes tokens en localStorage o sessionStorage
2. **No compartas refresh tokens**: Cada dispositivo debe tener su propio refresh token
3. **Revoca tokens en logout**: Usa `destroySession()` en lugar de solo eliminar cookies
4. **Monitorea sesiones sospechosas**: Compara device_fingerprint para detectar anomalías
5. **Limpia tokens expirados**: Ejecuta `cleanExpiredTokens()` regularmente

### Para Usuarios (Features a implementar)

1. **Notificaciones de nueva sesión**: Avisar cuando se detecta login desde nuevo dispositivo
2. **Página de sesiones activas**: Permitir ver y cerrar sesiones remotamente
3. **Alertas de seguridad**: Notificar sobre intentos de acceso sospechosos
4. **Verificación de 2 factores**: Agregar 2FA para mayor seguridad

## 📊 Métricas de Seguridad

### Antes (Sistema Legacy)
- **Ventana de ataque**: 7-30 días
- **Tokens en texto plano**: ✅ (UUIDs sin hashear)
- **Device tracking**: ❌
- **Inactividad detectada**: ❌
- **Revocación granular**: ❌

### Después (Refresh Tokens)
- **Ventana de ataque**: 30 minutos (reducción de 99.9%)
- **Tokens hasheados**: ✅ (bcrypt, 10 rounds)
- **Device tracking**: ✅ (SHA256 fingerprint)
- **Inactividad detectada**: ✅ (24 horas)
- **Revocación granular**: ✅ (por token o todos)

## 🐛 Troubleshooting

### Error: "Refresh token no encontrado"

**Causa**: Cookie no se está enviando correctamente

**Solución**:
1. Verificar que `credentials: 'include'` está en fetch requests
2. Verificar que el dominio de las cookies es correcto
3. Verificar que CORS permite credentials

### Error: "Token inválido o expirado"

**Causa**: Token corrupto o modificado

**Solución**:
1. Hacer logout y login nuevamente
2. Limpiar cookies del navegador
3. Verificar integridad de la DB

### Error: "Sesión inactiva por más de 24 horas"

**Causa**: Usuario no ha usado la app por 24+ horas

**Solución**:
1. Normal - usuario debe re-autenticarse
2. Si no es deseado, aumentar `MAX_INACTIVITY_HOURS`

### Refresh loop infinito

**Causa**: Middleware refrescando constantemente

**Solución**:
1. Verificar que las cookies se están estableciendo correctamente
2. Verificar que el middleware no está en las rutas excluidas
3. Revisar logs para identificar el problema

## 📝 Changelog

### v1.0.0 (31 Octubre 2025) - Issue #17

**Añadido**:
- Sistema de refresh tokens con access token de 30 minutos
- Tabla `refresh_tokens` con RLS policies
- `RefreshTokenService` con 13 métodos
- Auto-refresh en middleware
- Endpoints `/api/auth/refresh` y `/api/auth/sessions`
- Hook `useSessionRefresh` para React
- Device fingerprinting con SHA256
- Detección de inactividad (24 horas)
- Revocación granular de tokens
- Función de limpieza automática

**Cambiado**:
- `SessionService.createSession()` ahora usa refresh tokens
- `SessionService.destroySession()` revoca todos los tokens del usuario
- `SessionService.getCurrentUser()` soporta ambos sistemas (legacy y nuevo)

**Seguridad**:
- Reducción del 99.9% en ventana de ataque (30 días → 30 minutos)
- Tokens hasheados con bcrypt (nunca en texto plano)
- Device fingerprinting para detectar anomalías
- Timeout de inactividad automático

## 🎯 Próximos Pasos

1. **Migración gradual**: Remover sistema legacy después de 30 días
2. **2FA Integration**: Agregar verificación en dos pasos
3. **Rate limiting**: Limitar intentos de refresh
4. **Alertas de seguridad**: Notificar logins desde nuevos dispositivos
5. **Analytics**: Dashboard de seguridad para admins
6. **Audit log**: Registrar todos los eventos de autenticación

## 📚 Referencias

- [OWASP: Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [RFC 6749: OAuth 2.0 Authorization Framework](https://datatracker.ietf.org/doc/html/rfc6749)
- [NIST: Digital Identity Guidelines](https://pages.nist.gov/800-63-3/)

---

**Autor**: GitHub Copilot  
**Fecha**: 31 Octubre 2025  
**Versión**: 1.0.0  
**Issue**: #17 - Expiración de sesión débil
