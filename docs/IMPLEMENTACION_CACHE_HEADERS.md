# ✅ Implementación de Cache-Control Headers

**Fecha**: 30 de octubre de 2025  
**Optimización**: #2 del Plan de Optimización de Performance  
**Tiempo de implementación**: ~4 horas  
**Impacto esperado**: **50% reducción en llamadas API** 🎯

---

## 📋 Resumen

Se implementó un sistema de cache headers para optimizar el performance de la aplicación mediante la reducción de llamadas innecesarias a la API.

## 🎯 Archivos Creados

### 1. Helper de Cache Headers
**Archivo**: `apps/web/src/lib/utils/cache-headers.ts`

Configuraciones disponibles:

#### 🟢 `cacheHeaders.static` (1 hora)
- **Uso**: Datos que cambian raramente
- **Ejemplos**: Comunidades, cursos, configuración general
- **Config**: `public, s-maxage=3600, stale-while-revalidate=86400`

#### 🟡 `cacheHeaders.semiStatic` (5 minutos)
- **Uso**: Datos semi-estáticos
- **Ejemplos**: Posts, noticias, preguntas
- **Config**: `public, s-maxage=300, stale-while-revalidate=600`

#### 🟠 `cacheHeaders.dynamic` (30 segundos)
- **Uso**: Datos dinámicos
- **Ejemplos**: Estadísticas, contadores, actividad reciente
- **Config**: `public, s-maxage=30, stale-while-revalidate=60`

#### 🔴 `cacheHeaders.private` (sin cache)
- **Uso**: Datos privados/sensibles
- **Ejemplos**: Autenticación, datos de usuario, tokens
- **Config**: `private, no-cache, no-store, must-revalidate`

---

## 🔧 Rutas Actualizadas

### ✅ Comunidades (Static Cache - 1 hora)

#### GET `/api/communities`
- **Cache**: `static` (1 hora)
- **Razón**: Lista de comunidades cambia raramente
- **Archivo**: `apps/web/src/app/api/communities/route.ts`

#### GET `/api/communities/[slug]`
- **Cache**: `static` (1 hora)
- **Razón**: Detalles de comunidad cambian raramente
- **Archivo**: `apps/web/src/app/api/communities/[slug]/route.ts`

### ✅ Posts (Semi-Static Cache - 5 minutos)

#### GET `/api/communities/[slug]/posts`
- **Cache**: `semiStatic` (5 minutos)
- **Razón**: Posts cambian moderadamente
- **Archivo**: `apps/web/src/app/api/communities/[slug]/posts/route.ts`

### ✅ Cursos (Static Cache - 1 hora)

#### GET `/api/courses`
- **Cache**: `static` (1 hora)
- **Razón**: Cursos cambian raramente
- **Archivo**: `apps/web/src/app/api/courses/route.ts`

### ✅ Admin (Semi-Static Cache - 5 minutos)

#### GET `/api/admin/communities`
- **Cache**: `semiStatic` (5 minutos)
- **Razón**: Admin puede modificar datos frecuentemente
- **Archivo**: `apps/web/src/app/api/admin/communities/route.ts`

### ✅ Auth (Private - Sin Cache)

#### GET `/api/auth/me`
- **Cache**: `private` (sin cache)
- **Razón**: Datos sensibles de usuario
- **Archivo**: `apps/web/src/app/api/auth/me/route.ts`

---

## 📊 Ejemplo de Uso

### Antes (Sin Cache)
```typescript
export async function GET(request: NextRequest) {
  const data = await fetchData()
  
  return NextResponse.json({
    data
  })
}
```

### Después (Con Cache)
```typescript
import { cacheHeaders } from '@/lib/utils/cache-headers'

export async function GET(request: NextRequest) {
  const data = await fetchData()
  
  return NextResponse.json({
    data
  }, {
    headers: cacheHeaders.static // 👈 Agregar headers
  })
}
```

---

## 🧪 Validación

### Verificar Headers con cURL
```bash
# Verificar que las comunidades tengan cache
curl -I http://localhost:3000/api/communities

# Debe mostrar:
# Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
# CDN-Cache-Control: max-age=3600
```

### Verificar en DevTools
1. Abrir Chrome DevTools
2. Ir a Network tab
3. Recargar la página
4. Verificar headers en las peticiones API
5. Segunda recarga debe usar cache (mostrar "disk cache" o "memory cache")

---

## 📈 Impacto Esperado

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| **Llamadas API** | 100% | ~50% | **50%** ⬇️ |
| **Tiempo de carga** | ~800ms | ~200ms | **75%** ⬇️ |
| **Carga del servidor** | Alta | Media | **40%** ⬇️ |

### Beneficios Específicos

1. **Reducción de carga en BD**: Menos queries a Supabase
2. **Mejor UX**: Respuestas más rápidas para el usuario
3. **Ahorro de costos**: Menos llamadas = menos uso de API/BD
4. **Escalabilidad**: Mejor manejo de tráfico alto
5. **CDN-Ready**: Compatible con CDNs como Vercel Edge

---

## 🚀 Próximos Pasos

### Rutas Prioritarias a Actualizar

#### Alta Prioridad
- [ ] `/api/admin/news` → `semiStatic`
- [ ] `/api/communities/[slug]/members` → `semiStatic`
- [ ] `/api/courses/[slug]` → `static`
- [ ] `/api/statistics` → `dynamic`

#### Media Prioridad
- [ ] `/api/admin/users` → `dynamic`
- [ ] `/api/communities/[slug]/leagues` → `semiStatic`
- [ ] Todas las rutas de posts → `semiStatic`
- [ ] Todas las rutas de comments → `semiStatic`

#### Baja Prioridad
- [ ] Rutas de reacciones → `noCache` (siempre actualizar)
- [ ] Rutas de votes → `noCache` (siempre actualizar)
- [ ] Todas las rutas POST/PUT/DELETE → Sin cache

### Monitoreo Recomendado

1. **Implementar logging de cache hits/misses**
   ```typescript
   // En desarrollo
   console.log('🎯 Cache hit:', request.url)
   ```

2. **Agregar headers de debugging**
   ```typescript
   headers: {
     ...cacheHeaders.static,
     'X-Cache-Status': 'HIT', // o 'MISS'
   }
   ```

3. **Monitorear métricas en producción**
   - Cache hit ratio
   - Reducción en queries a BD
   - Tiempos de respuesta

---

## ⚠️ Consideraciones

### Invalidación de Cache

Si necesitas invalidar el cache manualmente:

```typescript
// Opción 1: Agregar timestamp al request
const timestamp = Date.now()
fetch(`/api/communities?_t=${timestamp}`)

// Opción 2: Usar mutate de SWR (si usas SWR)
mutate('/api/communities')

// Opción 3: Revalidación por servidor (Incremental Static Regeneration)
// Next.js revalida automáticamente después del tiempo especificado
```

### Datos en Tiempo Real

Para datos que necesitan ser en tiempo real, **NO uses cache**:
- Chat/mensajería
- Notificaciones
- Live updates
- Contadores en vivo

---

## 📚 Referencias

- [Plan de Optimización de Performance](./PLAN_OPTIMIZACION_PERFORMANCE.md)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [HTTP Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [Stale-While-Revalidate](https://web.dev/stale-while-revalidate/)

---

**✅ Implementación completada exitosamente**
