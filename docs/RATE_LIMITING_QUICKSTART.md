# 🛡️ Sistema de Rate Limiting - Guía Rápida

## ✅ Estado: IMPLEMENTADO (31 Oct 2025)

El sistema de rate limiting está completamente implementado y protege automáticamente todos los endpoints de la aplicación.

## 🎯 ¿Qué protege?

| Tipo | Endpoints | Límite | Ventana |
|------|-----------|--------|---------|
| **Strict** | `/api/auth/login`, `/api/auth/register`, `/api/auth/reset-password` | 3 requests | 1 hora |
| **Auth** | Endpoints de autenticación | 5 requests | 15 minutos |
| **Create** | `POST` en `/api/admin/communities`, `/api/courses/create` | 10 requests | 1 hora |
| **Upload** | `/api/upload`, rutas con `/upload` | 20 requests | 1 hora |
| **Admin** | `/api/admin/*` | 50 requests | 1 minuto |
| **API General** | `/api/*` (todos los endpoints) | 100 requests | 1 minuto |

## 🚀 Uso Automático

No necesitas hacer nada - el rate limiting está integrado en el middleware y se aplica automáticamente a todas las rutas.

### Headers en Respuestas

Todas las respuestas de API incluyen:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2025-10-31T12:34:56.789Z
Retry-After: 45
```

### Respuesta cuando se excede el límite (429)

```json
{
  "success": false,
  "error": "Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.",
  "retryAfter": "2025-10-31T12:45:00.000Z",
  "limit": 5,
  "remaining": 0
}
```

## 🧪 Testing

### Opción 1: Script automatizado

```bash
node scripts/test-rate-limit.js
```

Este script ejecuta:
- ✅ Test de auth rate limit (5 intentos)
- ✅ Test de headers RFC 6585
- ✅ Test de estadísticas
- ✅ Limpieza de rate limits

### Opción 2: cURL manual

```bash
# Probar login (debería bloquearse después de 3 intentos)
for i in {1..4}; do
  echo "Intento $i:"
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -i | grep -E "(HTTP|X-RateLimit|error)"
  echo ""
done
```

### Opción 3: Navegador (Postman/Thunder Client)

1. Haz 3 requests POST a `http://localhost:3000/api/auth/login` con credenciales incorrectas
2. La 4ta request debería devolver `429 Too Many Requests`
3. Verifica los headers `X-RateLimit-*` en la respuesta

## 📊 Monitoreo

### Ver estadísticas en desarrollo

```bash
# GET /api/admin/rate-limit/stats
curl http://localhost:3000/api/admin/rate-limit/stats
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "totalEntries": 12,
    "entries": [
      {
        "identifier": "auth:192.168.1.1:a1b2c3d4:12345678",
        "count": 3,
        "resetTime": "2025-10-31T12:45:00.000Z"
      }
    ]
  }
}
```

### Limpiar rate limits (solo desarrollo)

```bash
# DELETE /api/admin/rate-limit/stats
curl -X DELETE http://localhost:3000/api/admin/rate-limit/stats
```

## 🔧 Personalización

### Agregar rate limit a un endpoint específico

```typescript
// app/api/custom/route.ts
import { checkRateLimit, RATE_LIMITS } from '@/core/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Verificar rate limit
  const rateLimit = checkRateLimit(request, RATE_LIMITS.create, 'custom');
  
  if (!rateLimit.success && rateLimit.response) {
    return rateLimit.response;
  }
  
  // Tu lógica aquí...
  
  return NextResponse.json({ success: true });
}
```

### Crear configuración personalizada

```typescript
import { checkRateLimit } from '@/core/lib/rate-limit';

const customConfig = {
  maxRequests: 15,
  windowMs: 30 * 60 * 1000, // 30 minutos
  message: 'Mensaje personalizado'
};

export async function GET(request: NextRequest) {
  const rateLimit = checkRateLimit(request, customConfig, 'custom-endpoint');
  
  if (!rateLimit.success && rateLimit.response) {
    return rateLimit.response;
  }
  
  // Continuar...
}
```

## ⚙️ Configuración Actual

### Implementación

- ✅ **En memoria** (Map) - Perfecto para desarrollo y testing
- ⚠️ **Producción**: Migrar a Upstash Redis (ver [docs/RATE_LIMITING.md](./RATE_LIMITING.md))

### Por qué migrar a Redis en producción

| Característica | Map (actual) | Redis (recomendado) |
|----------------|--------------|---------------------|
| Persistencia | ❌ Se pierde con restart | ✅ Persiste |
| Multi-instancia | ❌ No funciona | ✅ Funciona |
| Escalabilidad | ❌ Limitada | ✅ Infinita |
| Edge-ready | ❌ No | ✅ Sí |

## 🚀 Migración a Producción (Upstash Redis)

### Paso 1: Crear cuenta

1. Ve a https://upstash.com
2. Crea cuenta gratuita
3. Crea Redis database
4. Copia credentials

### Paso 2: Instalar dependencias

```bash
npm install @upstash/redis @upstash/ratelimit
```

### Paso 3: Configurar .env

```env
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

### Paso 4: Actualizar código

Ver guía completa en [docs/RATE_LIMITING.md](./RATE_LIMITING.md) sección "Migración a Producción".

## 📚 Documentación Completa

Para información detallada sobre:
- Arquitectura del sistema
- Algoritmo sliding window
- Testing exhaustivo
- Monitoreo y alertas
- Migración a producción
- Troubleshooting
- Mejores prácticas

Ver: **[docs/RATE_LIMITING.md](./RATE_LIMITING.md)**

## 🐛 Troubleshooting

### Rate limit se activa inmediatamente

**Problema**: Estás en una red con IP compartida (VPN, proxy)

**Solución**: El sistema ya usa IP + User-Agent + User ID para identificación única

### Rate limit no se aplica

**Problema**: El middleware no captura la ruta

**Solución**: Verificar `config.matcher` en `middleware.ts`

### Headers no aparecen

**Problema**: CORS o middleware no configurado correctamente

**Solución**: Los headers ya están configurados automáticamente en `middleware.ts`

### Necesito aumentar el límite temporalmente

**En desarrollo**:
```bash
# Limpiar rate limits
curl -X DELETE http://localhost:3000/api/admin/rate-limit/stats
```

**En producción**: Modificar valores en `RATE_LIMITS` en `rate-limit.ts`

## ✅ Checklist de Implementación

- [x] Módulo `rate-limit.ts` creado
- [x] Integrado en `middleware.ts`
- [x] 6 niveles de protección configurados
- [x] Headers RFC 6585 implementados
- [x] Endpoint de estadísticas creado
- [x] Script de testing creado
- [x] Documentación completa escrita
- [ ] Migrar a Upstash Redis (para producción)
- [ ] Configurar alertas de monitoreo
- [ ] Integrar con sistema de logging

## 📞 Soporte

Para preguntas o problemas, consultar:
- [docs/RATE_LIMITING.md](./RATE_LIMITING.md) - Documentación completa
- [docs/BUGS_Y_OPTIMIZACIONES.md](./BUGS_Y_OPTIMIZACIONES.md) - Issue #20

---

**Estado**: ✅ Funcionando en desarrollo  
**Próximo paso**: Migración a Upstash Redis para producción  
**Fecha**: 31 Octubre 2025
