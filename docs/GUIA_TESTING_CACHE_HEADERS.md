# 🚀 Guía Rápida: Probar Cache Headers

## ✅ Pre-requisitos

1. La aplicación debe estar corriendo:
   ```powershell
   cd apps\web
   npm run dev
   ```

2. El servidor debe estar escuchando en `http://localhost:3000`

---

## 🧪 Opción 1: Test Automatizado (Recomendado)

### Ejecutar el script de testing:

```powershell
cd apps\web
npm run test:cache
```

### Salida esperada:

```
╔════════════════════════════════════════════╗
║  Cache Headers Test Suite                  ║
╚════════════════════════════════════════════╝

Base URL: http://localhost:3000
Total routes to test: 6

Testing: GET /api/communities
Expected cache: static
  ✅ cache-control: public, s-maxage=3600, stale-while-revalidate=86400
  ✅ cdn-cache-control: max-age=3600

PASSED

Testing: GET /api/auth/me
Expected cache: private
  ✅ cache-control: private, no-cache, no-store, must-revalidate
  ✅ pragma: no-cache
  ✅ expires: 0

PASSED

═══════════════════════════════════════════
Summary:
  Total:  6
  Passed: 6
  Failed: 0

✅ All tests passed!
```

---

## 🔍 Opción 2: Testing Manual con cURL

### 1. Probar comunidades (cache 1 hora):

```powershell
curl -I http://localhost:3000/api/communities
```

**Debe mostrar**:
```
HTTP/1.1 200 OK
Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
CDN-Cache-Control: max-age=3600
Content-Type: application/json
```

### 2. Probar posts (cache 5 minutos):

```powershell
curl -I http://localhost:3000/api/communities/profesionales/posts
```

**Debe mostrar**:
```
Cache-Control: public, s-maxage=300, stale-while-revalidate=600
CDN-Cache-Control: max-age=300
```

### 3. Probar auth (sin cache):

```powershell
curl -I http://localhost:3000/api/auth/me
```

**Debe mostrar**:
```
Cache-Control: private, no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

---

## 🌐 Opción 3: Testing en el Navegador

### Chrome DevTools:

1. **Abrir DevTools**: `F12` o `Ctrl+Shift+I`

2. **Ir a Network tab**

3. **Limpiar**: Click en 🚫 (Clear)

4. **Navegar**: Ve a `http://localhost:3000/communities`

5. **Ver request**: 
   - Click en `communities` en la lista
   - Ve a la pestaña **Headers**
   - Busca **Response Headers**
   - Verifica:
     ```
     cache-control: public, s-maxage=3600, stale-while-revalidate=86400
     cdn-cache-control: max-age=3600
     ```

6. **Probar cache**:
   - Recarga la página (`F5`)
   - El request debe mostrar **(from disk cache)** o **(from memory cache)**
   - Esto significa que funcionó! 🎉

### Firefox DevTools:

1. `F12` → **Network**
2. Navega a la página
3. Click en el request
4. Pestaña **Headers**
5. Verifica los headers de respuesta

---

## 📊 Interpretación de Resultados

### ✅ Headers Correctos

#### Para rutas públicas (comunidades, cursos):
```
Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
CDN-Cache-Control: max-age=3600
```

#### Para rutas semi-estáticas (posts, news):
```
Cache-Control: public, s-maxage=300, stale-while-revalidate=600
CDN-Cache-Control: max-age=300
```

#### Para rutas privadas (auth):
```
Cache-Control: private, no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

### ❌ Problemas Comunes

#### No aparecen headers de cache:
```powershell
# Verificar que el archivo existe
ls apps\web\src\lib\utils\cache-headers.ts

# Verificar imports en las rutas
```

#### Headers incorrectos:
- Verificar que importaste `cacheHeaders` correctamente
- Verificar que usas la configuración correcta (static, semiStatic, private)

---

## 🔄 Verificar Cache en Acción

### Test completo de cache:

1. **Primera carga** (sin cache):
   ```powershell
   curl -w "\nTime: %{time_total}s\n" http://localhost:3000/api/communities
   ```
   Ejemplo: `Time: 0.245s`

2. **Segunda carga** (con cache):
   ```powershell
   curl -w "\nTime: %{time_total}s\n" http://localhost:3000/api/communities
   ```
   Ejemplo: `Time: 0.002s` ⚡

   **Mejora: ~122x más rápido!**

### En el navegador:

1. **Abrir DevTools Network**
2. **Primera carga**: 
   - Status: `200 OK`
   - Size: `4.2 KB`
   - Time: `245ms`

3. **Recargar página**:
   - Status: `200 OK (from disk cache)`
   - Size: `(disk cache)`
   - Time: `2ms` ⚡

---

## 🎯 Métricas de Éxito

### Antes (sin cache):
- Cada request: ~245ms
- 10 requests: ~2.45s
- Carga en servidor: 100%

### Después (con cache):
- Primera request: ~245ms
- Siguientes 9 requests: ~2ms cada una
- 10 requests totales: ~263ms (vs 2.45s)
- **Mejora: 90% más rápido** 🚀
- Carga en servidor: ~10%

---

## 🐛 Troubleshooting

### El cache no funciona:

1. **Verificar desarrollo vs producción**:
   - Next.js puede tener comportamiento diferente en dev
   - Probar en build de producción:
     ```powershell
     npm run build
     npm run start
     ```

2. **Limpiar cache del navegador**:
   - Chrome: `Ctrl+Shift+Delete` → Limpiar cache
   - O modo incógnito: `Ctrl+Shift+N`

3. **Verificar middleware**:
   - Asegúrate que no hay middleware que sobrescriba los headers

4. **Verificar CORS**:
   - Si pruebas desde otro dominio, verifica CORS

---

## 📝 Próximos Pasos

Una vez verificado que funciona:

1. ✅ Agregar más rutas con cache
2. ✅ Monitorear performance en producción
3. ✅ Implementar invalidación de cache si es necesario
4. ✅ Considerar CDN (Vercel Edge, Cloudflare, etc.)

---

## 📚 Referencias

- [Documentación completa](./IMPLEMENTACION_CACHE_HEADERS.md)
- [Plan de optimización](./PLAN_OPTIMIZACION_PERFORMANCE.md)

---

**¡Listo para probar! 🚀**
