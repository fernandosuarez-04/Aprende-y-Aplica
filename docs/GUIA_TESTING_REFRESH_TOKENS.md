# 🔐 Sistema de Refresh Tokens - Guía Rápida

## ✅ Estado de Implementación

**COMPLETADO** - 31 Octubre 2025  
**Issue**: #17 - Expiración de sesión débil  
**Severidad**: CRÍTICO (RESUELTO)

## 📝 ¿Qué se implementó?

### 1. Base de Datos ✅
- Tabla `refresh_tokens` con 12 columnas
- 5 índices para performance
- Funciones helper (limpieza automática, revocación)
- RLS policies para seguridad
- **Archivo**: `database-fixes/create_refresh_tokens_table.sql`
- **Estado**: ✅ Ejecutado en Supabase

### 2. Backend ✅
- `RefreshTokenService` con 13 métodos
- Integración en `SessionService`
- Auto-refresh en middleware
- API endpoints (`/api/auth/refresh`, `/api/auth/sessions`)
- **Archivos**:
  - `apps/web/src/lib/auth/refreshToken.service.ts`
  - `apps/web/src/features/auth/services/session.service.ts`
  - `apps/web/middleware.ts`
  - `apps/web/src/app/api/auth/refresh/route.ts`
  - `apps/web/src/app/api/auth/sessions/route.ts`

### 3. Frontend ✅
- Hook `useSessionRefresh` para auto-refresh
- **Archivo**: `apps/web/src/features/auth/hooks/useSessionRefresh.ts`

### 4. Documentación ✅
- Documentación completa del sistema
- **Archivo**: `docs/SISTEMA_REFRESH_TOKENS.md`

## 🚀 Cómo Probar

### Paso 1: Verificar Base de Datos

```sql
-- Verificar que la tabla existe
SELECT * FROM refresh_tokens LIMIT 5;

-- Debe mostrar columnas:
-- id, user_id, token_hash, expires_at, created_at, last_used_at,
-- device_fingerprint, ip_address, user_agent, is_revoked, revoked_at, revoked_reason
```

### Paso 2: Login

1. Abre la aplicación: http://localhost:3000
2. Ve a `/auth` y haz login con Google OAuth
3. Abre DevTools → Application → Cookies
4. Deberías ver 3 cookies:
   - `access_token` (expira en 30 min)
   - `refresh_token` (expira en 7-30 días)
   - `aprende-y-aplica-session` (legacy, para compatibilidad)

### Paso 3: Verificar Token en DB

```sql
-- Buscar tu refresh token (sustituye tu email)
SELECT 
  rt.id,
  rt.user_id,
  rt.expires_at,
  rt.last_used_at,
  rt.is_revoked,
  rt.ip_address,
  LEFT(rt.user_agent, 50) as device,
  u.email
FROM refresh_tokens rt
JOIN users u ON u.id = rt.user_id
WHERE u.email = 'tu-email@gmail.com'
  AND rt.is_revoked = false
ORDER BY rt.created_at DESC
LIMIT 1;

-- Debería mostrar:
-- - is_revoked = false
-- - expires_at en el futuro (7 o 30 días)
-- - tu IP y navegador
```

### Paso 4: Probar Auto-Refresh

**Opción A: Esperar 30 minutos (recomendado para testing real)**
1. Login normalmente
2. Esperar 30 minutos
3. Navegar a cualquier ruta protegida (ej: `/dashboard`)
4. El middleware debería refrescar automáticamente el `access_token`
5. Verificar en DB que `last_used_at` se actualizó

**Opción B: Modificar tiempo de expiración (solo para testing rápido)**
```typescript
// apps/web/src/lib/auth/refreshToken.service.ts (línea ~14)
// CAMBIAR TEMPORALMENTE (revertir después):
private static ACCESS_TOKEN_EXPIRY_MS = 60 * 1000; // 1 minuto

// REVERTIR A:
private static ACCESS_TOKEN_EXPIRY_MS = 30 * 60 * 1000; // 30 minutos
```

1. Cambiar a 1 minuto
2. Reiniciar servidor: `npm run dev`
3. Login
4. Esperar 1 minuto
5. Navegar a `/dashboard`
6. El token debería refrescarse automáticamente

### Paso 5: Probar Inactividad (24 horas)

```sql
-- Simular inactividad de 25 horas (sustituye tu user_id)
UPDATE refresh_tokens
SET last_used_at = NOW() - INTERVAL '25 hours'
WHERE user_id = 'tu-user-id'
  AND is_revoked = false;

-- Ahora intenta acceder a una ruta protegida
-- Deberías ser redirigido a /auth?error=session_expired
```

### Paso 6: Probar Logout (Revocación)

1. Login desde múltiples navegadores/dispositivos
2. Verificar múltiples tokens en DB:
   ```sql
   SELECT COUNT(*) as active_sessions
   FROM refresh_tokens
   WHERE user_id = 'tu-user-id'
     AND is_revoked = false;
   ```
3. Hacer logout desde UN dispositivo
4. Verificar que TODOS los tokens fueron revocados:
   ```sql
   SELECT COUNT(*) as active_sessions
   FROM refresh_tokens
   WHERE user_id = 'tu-user-id'
     AND is_revoked = false;
   -- Debería ser 0
   ```

### Paso 7: Probar API Endpoints

**Refresh Manual:**
```bash
# (Primero, copia las cookies desde DevTools)
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Cookie: access_token=...; refresh_token=..." \
  -H "Content-Type: application/json"

# Respuesta esperada:
# {
#   "success": true,
#   "message": "Token renovado exitosamente",
#   "expiresAt": "2025-10-31T12:30:00Z"
# }
```

**Estado de Sesión:**
```bash
curl -X GET http://localhost:3000/api/auth/refresh \
  -H "Cookie: access_token=...; refresh_token=..."

# Respuesta esperada:
# {
#   "success": true,
#   "authenticated": true,
#   "userId": "...",
#   "accessExpiresAt": "2025-10-31T12:00:00Z",
#   "refreshExpiresAt": "2025-11-07T11:30:00Z"
# }
```

**Listar Sesiones:**
```bash
curl -X GET http://localhost:3000/api/auth/sessions \
  -H "Cookie: access_token=...; refresh_token=..."

# Respuesta esperada:
# {
#   "success": true,
#   "sessions": [
#     {
#       "id": "...",
#       "created_at": "...",
#       "last_used_at": "...",
#       "ip_address": "192.168.1.1",
#       "user_agent": "Mozilla/5.0...",
#       "expires_at": "..."
#     }
#   ]
# }
```

## 🎯 Hook de React (Uso en Componentes)

```tsx
'use client';

import { useSessionRefresh } from '@/features/auth/hooks/useSessionRefresh';
import { toast } from 'sonner'; // o tu librería de toast

export function Dashboard() {
  // ✅ El hook refresca automáticamente cada ~25 minutos
  const { refreshNow, isRefreshing } = useSessionRefresh({
    refreshBeforeExpiry: 5, // Refrescar 5 min antes de expirar
    onRefresh: () => {
      console.log('✅ Token refrescado automáticamente');
    },
    onExpiry: () => {
      toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }
  });
  
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Botón opcional para refresh manual */}
      <button 
        onClick={refreshNow} 
        disabled={isRefreshing}
        className="btn btn-secondary"
      >
        {isRefreshing ? 'Refrescando...' : 'Refrescar sesión'}
      </button>
    </div>
  );
}
```

## 📊 Queries de Monitoreo

### Sesiones Activas por Usuario
```sql
SELECT 
  u.email,
  COUNT(*) as active_sessions,
  MAX(rt.last_used_at) as last_activity
FROM refresh_tokens rt
JOIN users u ON u.id = rt.user_id
WHERE rt.is_revoked = false 
  AND rt.expires_at > NOW()
GROUP BY u.email
ORDER BY active_sessions DESC
LIMIT 10;
```

### Tokens Próximos a Expirar
```sql
SELECT 
  u.email,
  rt.expires_at,
  rt.last_used_at,
  (rt.expires_at - NOW()) as time_until_expiry
FROM refresh_tokens rt
JOIN users u ON u.id = rt.user_id
WHERE rt.is_revoked = false 
  AND rt.expires_at > NOW()
  AND rt.expires_at < NOW() + INTERVAL '24 hours'
ORDER BY rt.expires_at ASC;
```

### Tokens Revocados Recientemente
```sql
SELECT 
  u.email,
  rt.revoked_at,
  rt.revoked_reason,
  rt.ip_address,
  LEFT(rt.user_agent, 50) as device
FROM refresh_tokens rt
JOIN users u ON u.id = rt.user_id
WHERE rt.is_revoked = true
  AND rt.revoked_at > NOW() - INTERVAL '7 days'
ORDER BY rt.revoked_at DESC
LIMIT 20;
```

### Actividad Sospechosa (Múltiples Dispositivos)
```sql
SELECT 
  u.email,
  COUNT(DISTINCT rt.device_fingerprint) as unique_devices,
  COUNT(*) as total_sessions
FROM refresh_tokens rt
JOIN users u ON u.id = rt.user_id
WHERE rt.is_revoked = false 
  AND rt.expires_at > NOW()
GROUP BY u.email
HAVING COUNT(DISTINCT rt.device_fingerprint) > 3
ORDER BY unique_devices DESC;
```

## 🔧 Mantenimiento

### Limpieza Manual de Tokens Expirados

```sql
-- Ver cuántos tokens se limpiarían
SELECT 
  'Expirados hace >30 días' as category,
  COUNT(*) as count
FROM refresh_tokens
WHERE expires_at < NOW() - INTERVAL '30 days'
UNION ALL
SELECT 
  'Revocados hace >90 días',
  COUNT(*)
FROM refresh_tokens
WHERE is_revoked = true 
  AND revoked_at < NOW() - INTERVAL '90 days';

-- Ejecutar limpieza
SELECT clean_expired_refresh_tokens();
```

### Limpieza Programada (Cron Job)

Crear archivo `scripts/cleanup-tokens.ts`:

```typescript
import { RefreshTokenService } from '../apps/web/src/lib/auth/refreshToken.service';

async function cleanupTokens() {
  console.log('🧹 Iniciando limpieza de tokens expirados...');
  
  try {
    await RefreshTokenService.cleanExpiredTokens();
    console.log('✅ Limpieza completada');
  } catch (error) {
    console.error('❌ Error en limpieza:', error);
    process.exit(1);
  }
}

cleanupTokens();
```

Agregar a `package.json`:
```json
{
  "scripts": {
    "cleanup:tokens": "ts-node scripts/cleanup-tokens.ts"
  }
}
```

Configurar cron (Linux/Mac) en `crontab -e`:
```bash
# Ejecutar limpieza diaria a las 3 AM
0 3 * * * cd /path/to/project && npm run cleanup:tokens >> /var/log/token-cleanup.log 2>&1
```

## ⚠️ Troubleshooting

### Error: "Refresh token no encontrado"
- **Causa**: Cookie no se envió correctamente
- **Solución**: Verificar que `credentials: 'include'` está en fetch requests

### Error: "Token inválido o expirado"
- **Causa**: Token corrupto o modificado
- **Solución**: Hacer logout y login nuevamente

### Error: "Sesión inactiva por más de 24 horas"
- **Causa**: Usuario no usó la app por 24+ horas
- **Solución**: Re-autenticarse (comportamiento esperado)

### Refresh Loop Infinito
- **Causa**: Middleware refrescando constantemente
- **Solución**: Verificar que las cookies se establecen correctamente

## 📚 Documentación Completa

Para más detalles técnicos, ver:
- `docs/SISTEMA_REFRESH_TOKENS.md` - Documentación completa (arquitectura, API, testing)
- `docs/BUGS_Y_OPTIMIZACIONES.md` - Issue #17 resuelto

## ✅ Checklist de Testing

- [ ] Tabla `refresh_tokens` existe en Supabase
- [ ] Login crea ambos tokens (access + refresh)
- [ ] Cookies se establecen correctamente (httpOnly, secure)
- [ ] Token en DB está hasheado (no texto plano)
- [ ] Access token expira después de 30 minutos
- [ ] Refresh automático funciona en middleware
- [ ] Inactividad de 24h cierra sesión
- [ ] Logout revoca TODOS los tokens del usuario
- [ ] API `/api/auth/refresh` funciona
- [ ] API `/api/auth/sessions` lista sesiones activas
- [ ] Hook `useSessionRefresh` refresca automáticamente
- [ ] Device fingerprint se guarda correctamente
- [ ] RLS policies funcionan correctamente

---

**Implementado por**: GitHub Copilot  
**Fecha**: 31 Octubre 2025  
**Issue**: #17 - Expiración de sesión débil  
**Versión**: 1.0.0
