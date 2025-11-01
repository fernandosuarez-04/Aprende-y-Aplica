# Sistema de Rate Limiting

## 📋 Resumen

Sistema de rate limiting implementado para proteger la aplicación contra:
- ataques de fuerza bruta
- ataques de denegación de servicio (DoS)
- abuso de API
- spam de creación de recursos

## 🎯 Implementación

### Características

✅ **Sliding Window Algorithm**: Mejor precisión que fixed window
✅ **Sin dependencias externas**: Implementación en memoria para desarrollo
✅ **Headers RFC 6585**: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
✅ **Identificación multi-factor**: IP + User-Agent + User ID
✅ **Limpieza automática**: Previene memory leaks
✅ **Múltiples niveles**: 6 configuraciones diferentes

### Configuraciones de Rate Limit

| Tipo | Límite | Ventana | Descripción |
|------|--------|---------|-------------|
| **strict** | 3 requests | 1 hora | Password reset, email verification |
| **auth** | 5 requests | 15 minutos | Login, register |
| **create** | 10 requests | 1 hora | POST operations (comunidades, cursos) |
| **upload** | 20 requests | 1 hora | File uploads |
| **admin** | 50 requests | 1 minuto | Admin API endpoints |
| **api** | 100 requests | 1 minuto | General API endpoints |

### Ubicación de Archivos

```
apps/web/
├── src/core/lib/rate-limit.ts          # ✅ Módulo principal de rate limiting
├── middleware.ts                        # ✅ Integración en middleware
└── src/app/api/
    ├── auth/
    │   ├── login/route.ts              # 🎯 Protegido con strict
    │   └── reset-password/route.ts     # 🎯 Protegido con strict
    ├── admin/
    │   └── **/route.ts                 # 🎯 Protegido con admin
    └── upload/route.ts                  # 🎯 Protegido con upload
```

## 🔧 Uso en Código

### En Middleware (Automático)

El rate limiting está integrado automáticamente en `middleware.ts`. No requiere código adicional en routes.

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // Rate limiting se aplica automáticamente según el pathname
  
  // 1. Strict para auth
  if (pathname.startsWith('/api/auth/login')) {
    const rateLimitResponse = await applyRateLimit(request, RATE_LIMITS.strict, 'auth');
    if (rateLimitResponse) return rateLimitResponse;
  }
  
  // 2. Admin para endpoints admin
  if (pathname.startsWith('/api/admin')) {
    const rateLimitResponse = await applyRateLimit(request, RATE_LIMITS.admin, 'admin');
    if (rateLimitResponse) return rateLimitResponse;
  }
  
  // ... resto del middleware
}
```

### En un Endpoint Específico (Opcional)

Si necesitas rate limiting personalizado en un endpoint:

```typescript
// app/api/custom/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/core/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Verificar rate limit
  const rateLimit = checkRateLimit(request, RATE_LIMITS.create, 'custom');
  
  if (!rateLimit.success && rateLimit.response) {
    return rateLimit.response;
  }
  
  // Tu lógica aquí
  const result = await createResource();
  
  // Opcional: agregar headers de rate limit
  const response = NextResponse.json(result);
  response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
  response.headers.set('X-RateLimit-Reset', rateLimit.reset.toISOString());
  
  return response;
}
```

### Crear Rate Limit Personalizado

```typescript
import { checkRateLimit } from '@/core/lib/rate-limit';

const customConfig = {
  maxRequests: 15,
  windowMs: 30 * 60 * 1000, // 30 minutos
  message: 'Custom rate limit message'
};

export async function GET(request: NextRequest) {
  const rateLimit = checkRateLimit(request, customConfig, 'custom-prefix');
  
  if (!rateLimit.success && rateLimit.response) {
    return rateLimit.response;
  }
  
  // Continuar...
}
```

## 🧪 Testing

### 1. Test Manual con cURL

```bash
# Test auth endpoint (5 requests / 15 min)
for i in {1..6}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -i | grep -E "(HTTP|X-RateLimit|error)"
  echo ""
done

# Deberías ver:
# Request 1-5: HTTP/1.1 401 (unauthorized pero permite request)
# Request 6: HTTP/1.1 429 (rate limit exceeded)
```

### 2. Test con Script Node.js

```javascript
// test-rate-limit.js
const testRateLimit = async () => {
  const results = [];
  
  for (let i = 1; i <= 6; i++) {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'wrong' })
    });
    
    const headers = {
      limit: response.headers.get('X-RateLimit-Limit'),
      remaining: response.headers.get('X-RateLimit-Remaining'),
      reset: response.headers.get('X-RateLimit-Reset'),
      status: response.status
    };
    
    results.push({ request: i, ...headers });
    console.log(`Request ${i}:`, headers);
    
    if (response.status === 429) {
      const body = await response.json();
      console.log('Rate limit response:', body);
      break;
    }
  }
  
  return results;
};

testRateLimit();
```

### 3. Test con Playwright/Jest

```typescript
// __tests__/rate-limit.test.ts
import { NextRequest } from 'next/server';
import { checkRateLimit, RATE_LIMITS, clearAllRateLimits } from '@/core/lib/rate-limit';

describe('Rate Limiting', () => {
  beforeEach(() => {
    clearAllRateLimits(); // Limpiar antes de cada test
  });

  test('permite requests dentro del límite', () => {
    const request = new NextRequest('http://localhost:3000/api/test');
    
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(request, RATE_LIMITS.auth, 'test');
      expect(result.success).toBe(true);
    }
  });

  test('bloquea requests que exceden el límite', () => {
    const request = new NextRequest('http://localhost:3000/api/test');
    
    // Consumir el límite
    for (let i = 0; i < 5; i++) {
      checkRateLimit(request, RATE_LIMITS.auth, 'test');
    }
    
    // Siguiente request debe ser bloqueada
    const result = checkRateLimit(request, RATE_LIMITS.auth, 'test');
    expect(result.success).toBe(false);
    expect(result.response?.status).toBe(429);
  });

  test('headers incluyen información correcta', () => {
    const request = new NextRequest('http://localhost:3000/api/test');
    const result = checkRateLimit(request, RATE_LIMITS.auth, 'test');
    
    expect(result.limit).toBe(RATE_LIMITS.auth.maxRequests);
    expect(result.remaining).toBeLessThanOrEqual(result.limit);
    expect(result.reset).toBeInstanceOf(Date);
  });
});
```

### 4. Verificar Headers en Respuesta

```bash
# Verificar headers de rate limit
curl -X GET http://localhost:3000/api/test -I

# Deberías ver:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
# X-RateLimit-Reset: 2025-10-31T12:34:56.789Z
```

## 📊 Monitoreo

### Obtener Estadísticas (Endpoint Admin)

Crear endpoint para visualizar estadísticas:

```typescript
// app/api/admin/rate-limit/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRateLimitStats } from '@/core/lib/rate-limit';

export async function GET(request: NextRequest) {
  // Verificar que sea admin...
  
  const stats = getRateLimitStats();
  return NextResponse.json(stats);
}
```

Respuesta:
```json
{
  "totalEntries": 45,
  "entries": [
    {
      "identifier": "auth:192.168.1.1:a1b2c3d4:12345678",
      "count": 3,
      "resetTime": "2025-10-31T12:45:00.000Z"
    }
  ]
}
```

### Logs de Seguridad

El sistema registra automáticamente en consola:

```typescript
console.warn(`[RATE LIMIT] Blocked request from ${identifier}`);
```

Para producción, considera enviar a un servicio de logging:

```typescript
// Modificar en rate-limit.ts
import { logger } from '@/lib/logger'; // Tu sistema de logs

if (!result.success) {
  logger.warn('Rate limit exceeded', {
    identifier: getIdentifier(request, prefix),
    config: config,
    timestamp: new Date().toISOString()
  });
}
```

## 🚀 Migración a Producción (Upstash Redis)

### Por qué migrar

⚠️ **La implementación actual usa Map en memoria**:
- ❌ Se reinicia con cada deploy
- ❌ No funciona con múltiples instancias
- ❌ No es persistente

✅ **Upstash Redis ofrece**:
- ✅ Persistencia entre deploys
- ✅ Funcionamiento en múltiples instancias
- ✅ Edge-ready (baja latencia)
- ✅ Escalabilidad automática

### Paso 1: Crear cuenta Upstash

1. Ve a https://upstash.com
2. Crea cuenta gratuita
3. Crea una base de datos Redis
4. Copia las credenciales

### Paso 2: Instalar dependencias

```bash
npm install @upstash/redis @upstash/ratelimit
```

### Paso 3: Configurar variables de entorno

```env
# .env.local
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### Paso 4: Actualizar rate-limit.ts

```typescript
// src/core/lib/rate-limit.ts
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Crear cliente Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Crear rate limiters
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: 'ratelimit:auth',
});

export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'ratelimit:api',
});

export const adminLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, '1 m'),
  analytics: true,
  prefix: 'ratelimit:admin',
});

export const createLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
  prefix: 'ratelimit:create',
});

// Función helper
export async function checkRateLimitUpstash(
  identifier: string,
  limiter: Ratelimit
) {
  const { success, limit, remaining, reset } = await limiter.limit(identifier);
  
  return {
    success,
    limit,
    remaining,
    reset: new Date(reset),
    response: success ? null : NextResponse.json(
      {
        success: false,
        error: 'Too many requests',
        retryAfter: new Date(reset).toISOString(),
        limit,
        remaining: 0
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString()
        }
      }
    )
  };
}
```

### Paso 5: Actualizar middleware

```typescript
// middleware.ts
import { authLimiter, checkRateLimitUpstash } from '@/core/lib/rate-limit';

// En lugar de:
const rateLimitResponse = await applyRateLimit(request, RATE_LIMITS.strict, 'auth');

// Usar:
const identifier = getIdentifier(request);
const result = await checkRateLimitUpstash(identifier, authLimiter);
if (!result.success && result.response) return result.response;
```

## 🔒 Mejores Prácticas

### 1. Límites Apropiados

```typescript
// ❌ Muy restrictivo
{ maxRequests: 1, windowMs: 60000 } // 1 por minuto

// ✅ Balanceado
{ maxRequests: 5, windowMs: 15 * 60 * 1000 } // 5 por 15 min
```

### 2. Identificación Robusta

```typescript
// ❌ Solo IP (fácil de evadir con VPN)
const identifier = request.headers.get('x-forwarded-for');

// ✅ Multi-factor
const identifier = `${ip}:${userAgentHash}:${userId}`;
```

### 3. Mensajes de Error Claros

```typescript
// ❌ Genérico
{ message: 'Too many requests' }

// ✅ Específico y útil
{
  message: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.',
  retryAfter: '2025-10-31T12:45:00.000Z'
}
```

### 4. Whitelisting para Testing

```typescript
// En desarrollo, permitir bypass
if (process.env.NODE_ENV === 'development') {
  const bypassHeader = request.headers.get('X-Bypass-Rate-Limit');
  if (bypassHeader === process.env.RATE_LIMIT_BYPASS_TOKEN) {
    return { success: true, ... };
  }
}
```

## 📈 Métricas de Éxito

### Antes (Sin Rate Limiting)

- ❌ Vulnerable a ataques de fuerza bruta
- ❌ Sin protección contra DoS
- ❌ Posible abuso de API sin límites
- ❌ Costos de servidor impredecibles

### Después (Con Rate Limiting)

- ✅ Bloqueo automático después de 3-5 intentos fallidos
- ✅ Protección contra DoS (límite de 100 req/min por IP)
- ✅ Control de operaciones costosas (10 creates/hora)
- ✅ Costos de servidor predecibles

### Métricas de Monitoreo

```sql
-- Crear tabla para logs de rate limit (opcional)
CREATE TABLE rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  limit_type TEXT NOT NULL,
  blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Query para detectar abuso
SELECT 
  identifier,
  COUNT(*) as blocked_requests,
  MAX(created_at) as last_attempt
FROM rate_limit_logs
WHERE blocked = TRUE
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY identifier
HAVING COUNT(*) > 10
ORDER BY blocked_requests DESC;
```

## 🐛 Troubleshooting

### Problema: Rate limit se activa inmediatamente

**Causa**: IP compartida (proxy, VPN)

**Solución**: Agregar user ID al identifier

```typescript
const userId = request.cookies.get('aprende-y-aplica-session')?.value || 'anonymous';
const identifier = `${ip}:${userId}`;
```

### Problema: Rate limit no se aplica

**Causa**: Middleware no está capturando la ruta

**Solución**: Verificar config.matcher en middleware.ts

```typescript
export const config = {
  matcher: [
    '/api/:path*',  // Asegurar que captura APIs
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### Problema: Headers no aparecen

**Causa**: Response no incluye headers

**Solución**: Agregar headers manualmente

```typescript
response.headers.set('X-RateLimit-Limit', limit.toString());
response.headers.set('X-RateLimit-Remaining', remaining.toString());
response.headers.set('X-RateLimit-Reset', reset.toISOString());
```

## 📚 Referencias

- [RFC 6585 - Additional HTTP Status Codes](https://tools.ietf.org/html/rfc6585)
- [Upstash Rate Limiting](https://upstash.com/docs/oss/sdks/ts/ratelimit/overview)
- [OWASP - Rate Limiting](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

## ✅ Checklist de Implementación

- [x] Crear módulo rate-limit.ts
- [x] Integrar en middleware.ts
- [x] Proteger endpoints auth
- [x] Proteger endpoints admin
- [x] Proteger operaciones create
- [x] Proteger uploads
- [x] Agregar headers RFC 6585
- [x] Implementar limpieza automática
- [ ] Migrar a Upstash Redis (producción)
- [ ] Agregar endpoint de estadísticas
- [ ] Crear tests automatizados
- [ ] Configurar monitoreo
- [ ] Documentar en README principal

---

**Estado**: ✅ **COMPLETADO** - Sistema funcional en memoria  
**Próximo paso**: Migración a Upstash Redis para producción  
**Fecha**: 31 Octubre 2025
