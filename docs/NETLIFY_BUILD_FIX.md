# 🔧 Solución: Build se Cancela Durante Instalación de Node.js

## ❌ Problema

El build de Netlify se cancela durante la descarga/instalación de Node.js y no muestra el error completo. Esto puede deberse a:

1. **Timeout durante la descarga** de Node.js
2. **Problemas con el comando de build** (comando cortado o muy largo)
3. **Conflicto con la configuración del monorepo**

## ✅ Soluciones Aplicadas

### 1. Comando de Build Simplificado

**Antes:**
```bash
npm install && npm run prepare && npm run build --workspace=apps/web
```

**Ahora:**
```bash
npm install --legacy-peer-deps && npm run prepare && npm run build:web
```

**Cambios:**
- ✅ `--legacy-peer-deps` para mejor compatibilidad con workspaces
- ✅ `npm run build:web` en lugar de `--workspace=apps/web` (más directo)

### 2. Configuración Limpia

- Simplificado `netlify.toml` para evitar conflictos
- Removidas configuraciones innecesarias que pueden causar problemas

## 📋 Pasos Siguientes

### 1. En Netlify Dashboard

Ve a **Site settings** → **Build & deploy** → **Build settings** y verifica:

- **Base directory:** `.`
- **Build command:** `npm install --legacy-peer-deps && npm run prepare && npm run build:web`
- **Publish directory:** `apps/web/.next`

### 2. Si el Problema Persiste

#### Opción A: Build Más Simple

En Netlify Dashboard, cambia el **Build command** a:

```bash
cd apps/web && npm install --legacy-peer-deps && npm run build
```

**Nota:** Esto requerirá configurar las dependencias de los paquetes compartidos antes.

#### Opción B: Usar npm ci (Más Rápido)

```bash
npm ci && npm run prepare && npm run build:web
```

**Nota:** Requiere `package-lock.json` actualizado y commitado.

#### Opción C: Build en Dos Pasos

1. **Instalar dependencias:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Build separado:**
   ```bash
   npm run prepare
   npm run build:web
   ```

## 🔍 Verificación

### 1. Revisar Logs Completos

En Netlify Dashboard:
1. Ve a **Deploys** → **Latest deploy**
2. Click en **View deploy log**
3. Revisa **TODO el log**, no solo hasta la línea 13
4. Busca errores específicos después de la instalación de Node.js

### 2. Build Local de Prueba

Prueba localmente que el build funciona:

```bash
# Desde la raíz del proyecto
npm install --legacy-peer-deps
npm run prepare
npm run build:web
```

Si esto funciona localmente, debería funcionar en Netlify.

### 3. Verificar Variables de Entorno

Asegúrate de tener todas las variables de entorno configuradas en Netlify Dashboard.

## 🐛 Errores Comunes

### Error: "Cannot find module '@aprende-y-aplica/shared'"

**Solución:**
1. Verifica que `npm run prepare` se ejecute correctamente
2. Verifica que los paquetes se construyan: `packages/ui/dist` y `packages/shared/dist` existen

### Error: "Build timeout"

**Solución:**
- El timeout por defecto es 15 minutos
- Si tu build tarda más, considera optimizar dependencias o dividir el build

### Error: "Command not found"

**Solución:**
- Verifica que los scripts `prepare` y `build:web` existan en `package.json`
- Verifica que estés usando npm (no yarn o pnpm)

## 📝 Notas Importantes

1. **El plugin de Next.js** (`@netlify/plugin-nextjs`) se instala automáticamente
2. **Functions directory** puede quedarse como `netlify/functions` o vacío
3. **El build puede tardar** 3-5 minutos la primera vez

## 🚀 Próximo Deploy

1. **Commit y push** los cambios:
   ```bash
   git add netlify.toml package.json
   git commit -m "Fix: Simplificar build command para Netlify"
   git push
   ```

2. **Trigger nuevo deploy** en Netlify o espera al push automático

3. **Revisa los logs completos** en Netlify Dashboard

---

**¿Sigue fallando?** Comparte el log completo después de la línea 13 para poder identificar el error específico.

