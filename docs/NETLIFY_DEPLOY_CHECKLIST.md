# ✅ Checklist de Despliegue en Netlify

Usa este checklist antes de desplegar tu aplicación en Netlify.

## 📦 Archivos de Configuración

- [x] `netlify.toml` creado en la raíz
- [x] `.nvmrc` especificando Node.js 18
- [x] `.npmrc` configurado para monorepo
- [x] `docs/DEPLOY_NETLIFY.md` con instrucciones completas

## 🔗 Conexión con Netlify

- [ ] Repositorio conectado a Netlify (GitHub/GitLab/Bitbucket)
- [ ] Site creado en Netlify Dashboard
- [ ] Build settings verificados (deberían detectar `netlify.toml` automáticamente)

## 🔐 Variables de Entorno

Asegúrate de configurar estas variables en **Netlify Dashboard** → **Site settings** → **Environment variables**:

### Obligatorias
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `USER_JWT_SECRET`
- [ ] `JWT_SECRET`

### Opcionales (según funcionalidades)
- [ ] `OPENAI_API_KEY` (si usas IA)
- [ ] `SENDGRID_API_KEY` (si usas email)
- [ ] `GOOGLE_CLIENT_ID` (si usas OAuth Google)
- [ ] `GOOGLE_CLIENT_SECRET` (si usas OAuth Google)
- [ ] `GOOGLE_REDIRECT_URI` (URL de producción)

### Públicas (Next.js)
- [ ] `NEXT_PUBLIC_APP_NAME`
- [ ] `NEXT_PUBLIC_APP_VERSION`

## 🚀 Build Settings

Verifica en **Site settings** → **Build & deploy** → **Build settings**:

- [ ] **Base directory:** `.` (raíz del repo)
- [ ] **Build command:** `npm ci && npm run prepare && cd apps/web && npm run build`
- [ ] **Publish directory:** `apps/web/.next` (Netlify plugin lo maneja automáticamente)

## 🔍 Verificación Pre-Deploy

- [ ] Build local funciona: `npm run prepare && cd apps/web && npm run build`
- [ ] No hay errores de TypeScript: `npm run type-check`
- [ ] Testeos básicos pasan (si los tienes)

## 📝 Configuración Adicional

### Dominio Personalizado (Opcional)
- [ ] Dominio añadido en Netlify
- [ ] DNS configurado correctamente
- [ ] SSL certificado automáticamente

### Notificaciones (Opcional)
- [ ] Email notifications configuradas
- [ ] Slack/Discord webhooks (si usas)

## 🚀 Deploy

1. [ ] Push a rama principal (`main` o `master`)
2. [ ] Verifica que Netlify detecta el push
3. [ ] Revisa los logs del build en Netlify Dashboard
4. [ ] Espera a que el deploy termine (3-5 minutos)

## ✅ Post-Deploy

- [ ] Sitio carga correctamente
- [ ] Autenticación funciona
- [ ] Conexión con Supabase funciona
- [ ] APIs responden correctamente
- [ ] No hay errores en la consola del navegador
- [ ] Logs de Netlify no muestran errores críticos

## 🐛 Si hay Problemas

1. **Revisa los logs de build** en Netlify Dashboard
2. **Verifica variables de entorno** (mayúsculas/minúsculas, sin espacios extra)
3. **Revisa que los paquetes compartidos se construyen** (`npm run prepare`)
4. **Confirma versión de Node.js** (debe ser 18.x)
5. **Verifica que el plugin de Next.js esté activo** (automático con `netlify.toml`)

## 📚 Recursos

- Documentación completa: `docs/DEPLOY_NETLIFY.md`
- [Netlify Dashboard](https://app.netlify.com)
- [Netlify Docs](https://docs.netlify.com/)
- [Next.js en Netlify](https://docs.netlify.com/integrations/frameworks/nextjs/)

---

**¿Todo listo?** ¡Despliega y verifica! 🎉

