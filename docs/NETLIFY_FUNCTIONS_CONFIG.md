# 🔧 Configuración del Functions Directory en Netlify

## 📋 ¿Qué es el Functions Directory?

El **Functions Directory** en Netlify es donde se ubican las funciones serverless que ejecutan tu lógica backend. Para proyectos Next.js, hay dos formas de configurarlo:

### 1️⃣ **Next.js API Routes (Automático - RECOMENDADO)**

Si usas el plugin `@netlify/plugin-nextjs` (ya configurado en tu `netlify.toml`), las rutas API de Next.js se convierten automáticamente en Netlify Functions:

- **Rutas API:** `apps/web/src/app/api/**/*.ts`
- **Se convierten en:** Funciones serverless automáticamente
- **No necesitas:** Un Functions directory separado

### 2️⃣ **Netlify Functions Tradicionales (Opcional)**

Si necesitas funciones fuera de Next.js, puedes usar `netlify/functions/` (opcional).

## ✅ Configuración Actual

En tu `netlify.toml`, tienes configurado:

```toml
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
  external_node_modules = ["sharp", "canvas"]
```

**Pero con Next.js**, esto es principalmente para funciones adicionales. El plugin de Next.js maneja automáticamente las funciones desde `apps/web/src/app/api/`.

## 🎯 Opciones de Configuración en Netlify Dashboard

### Opción A: Dejar vacío o usar el predeterminado (Recomendado)

**En Netlify Dashboard:**
1. Ve a **Site settings** → **Build & deploy** → **Build settings**
2. En **Functions directory**, puedes:
   - **Dejarlo vacío** (el plugin de Next.js lo maneja automáticamente)
   - O usar: `netlify/functions` (si tienes funciones adicionales)

### Opción B: Configurar explícitamente (Si tienes problemas)

Si Netlify no detecta las funciones correctamente:

**Functions directory:** `netlify/functions` o déjalo vacío

**Nota:** El plugin de Next.js genera las funciones en `apps/web/.next/serverless/` automáticamente, así que no necesitas configurar esto manualmente en la mayoría de los casos.

## 🔍 Verificación

### 1. Verificar que las API Routes funcionan

Tus rutas API están en:
```
apps/web/src/app/api/
├── auth/
├── instructor/
├── questionnaire/
└── ...
```

Estas se convierten automáticamente en funciones serverless.

### 2. Verificar en el Deploy

Después de hacer deploy, en Netlify Dashboard:
1. Ve a **Functions** (menú lateral)
2. Deberías ver funciones generadas desde tus rutas API
3. Cada ruta API se convierte en una función separada

### 3. Probar una API Route

Ejemplo: Si tienes `apps/web/src/app/api/auth/login/route.ts`
- Se convierte en función: `/api/auth/login`
- URL: `https://tu-sitio.netlify.app/api/auth/login`

## 🐛 Solución de Problemas

### Error: "Function not found"

**Causa:** El plugin de Next.js no está generando las funciones correctamente.

**Solución:**
1. Verifica que `[[plugins]]` con `package = "@netlify/plugin-nextjs"` esté en `netlify.toml`
2. Asegúrate de que el build de Next.js se completa exitosamente
3. Revisa los logs del deploy para ver si hay errores

### Error: "Functions directory not found"

**Solución:**
- Si NO usas funciones tradicionales de Netlify, puedes dejar el Functions directory vacío o configurarlo como `netlify/functions` (aunque esté vacío)
- El plugin de Next.js no requiere este directorio

## 📝 Recomendación Final

**Para tu proyecto:**

1. **En Netlify Dashboard** → **Build & deploy** → **Functions directory:**
   - Opción 1 (Recomendado): **Déjalo vacío** o usa `netlify/functions`
   - Opción 2: Si ya está configurado como `netlify/functions`, está bien dejarlo así

2. **No necesitas crear** el directorio `netlify/functions/` a menos que quieras añadir funciones adicionales fuera de Next.js

3. **Las API Routes de Next.js** funcionan automáticamente sin configuración adicional gracias al plugin

## 🚀 Resumen

- ✅ **Next.js API Routes:** Se manejan automáticamente por el plugin
- ✅ **Functions Directory:** Puede estar vacío o ser `netlify/functions`
- ✅ **No necesitas:** Configurar manualmente cada función
- ✅ **El plugin de Next.js:** Hace todo el trabajo pesado

---

**¿Tienes problemas?** Verifica que el plugin `@netlify/plugin-nextjs` esté activo y que el build de Next.js se complete correctamente.

