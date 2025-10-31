# 🔧 Solución de Problemas de Build en Netlify

## ❌ Error: Build se cancela durante descarga de Node.js

Si tu build se cancela mientras Node.js se está descargando, sigue estos pasos:

### Solución 1: Usar configuración simplificada (RECOMENDADO)

1. **Verifica que el archivo `.nvmrc` existe** con el contenido `18`
2. **En Netlify Dashboard** → **Site settings** → **Build & deploy** → **Build settings**:
   - Asegúrate de que **"Build command"** esté vacío o sea: `npm install && npm run prepare && npm run build --workspace=apps/web`
   - **Base directory:** `.` (raíz)
   - **Publish directory:** `apps/web/.next`

### Solución 2: Verificar configuración manual en Netlify

Si el problema persiste, configura manualmente en Netlify Dashboard:

1. Ve a **Site settings** → **Build & deploy** → **Build settings**
2. **Edita build settings** y configura:
   - **Base directory:** `.`
   - **Build command:** `npm install && npm run prepare && npm run build --workspace=apps/web`
   - **Publish directory:** `apps/web/.next`
   - Deja que el plugin de Next.js maneje el resto automáticamente

### Solución 3: Verificar versiones

En Netlify Dashboard → **Site settings** → **Build & deploy** → **Build environment variables**:

- Añade `NODE_VERSION = 18` (si no está)
- Añade `NPM_VERSION = 9` (si no está)

### Solución 4: Build más robusto

Si el build sigue fallando, prueba este comando alternativo:

```bash
npm install --legacy-peer-deps && npm run prepare && npm run build --workspace=apps/web
```

Configúralo en Netlify Dashboard → **Build command**

## ✅ Verificación

Después de hacer los cambios:

1. **Haz commit y push** de los cambios al repositorio
2. **Trigger un nuevo deploy** en Netlify (o espera al push automático)
3. **Revisa los logs** en Netlify Dashboard → **Deploys** → **Latest deploy** → **View deploy log**

## 📋 Checklist de Verificación

- [ ] Archivo `.nvmrc` existe con `18`
- [ ] Archivo `netlify.toml` existe en la raíz
- [ ] Build command está configurado correctamente
- [ ] Base directory es `.` (raíz)
- [ ] Publish directory es `apps/web/.next`
- [ ] Variables de entorno están configuradas
- [ ] Plugin de Next.js está activo (automático con `netlify.toml`)

## 🐛 Si el problema persiste

1. **Revisa los logs completos** en Netlify (no solo hasta la línea 13)
2. **Verifica que el repositorio esté accesible** públicamente (o que Netlify tenga permisos)
3. **Intenta un build local** para verificar que funciona:
   ```bash
   npm install
   npm run prepare
   npm run build --workspace=apps/web
   ```
4. **Contacta al soporte de Netlify** con los logs completos

---

**Última actualización:** Cambios en `netlify.toml` para usar `npm install` en lugar de `npm ci` y `--workspace` en lugar de `cd`.

