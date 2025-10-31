# 🚀 Guía de Despliegue en Netlify

Esta guía te ayudará a desplegar la aplicación **Aprende y Aplica** en Netlify.

## 📋 Prerequisitos

- Cuenta en Netlify (gratis)
- Repositorio en GitHub/GitLab/Bitbucket
- Node.js 18.x instalado localmente (para pruebas)

## 🔧 Configuración del Proyecto

El proyecto está configurado como monorepo con la siguiente estructura:
```
├── apps/
│   ├── web/          # Next.js Frontend (se despliega en Netlify)
│   └── api/          # Backend Express (opcional en Netlify)
├── packages/
│   ├── shared/       # Paquetes compartidos
│   └── ui/           # Componentes UI compartidos
└── netlify.toml      # Configuración de Netlify
```

## 🚀 Pasos para Desplegar

### 1. Conectar Repositorio con Netlify

1. Ve a [Netlify](https://app.netlify.com)
2. Click en **"Add new site"** → **"Import an existing project"**
3. Conecta tu repositorio de GitHub/GitLab/Bitbucket
4. Selecciona el repositorio `Aprende-y-Aplica`

### 2. Configurar Build Settings

Netlify debería detectar automáticamente el `netlify.toml`, pero verifica:

**Build command:**
```bash
npm run prepare && cd apps/web && npm run build
```

**Publish directory:**
```
apps/web/.next
```

**Base directory:**
```
./
```

### 3. Configurar Variables de Entorno

En Netlify Dashboard → **Site settings** → **Environment variables**, añade:

#### Variables Requeridas

```bash
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# JWT
USER_JWT_SECRET=tu-jwt-secret-ultra-seguro
JWT_SECRET=tu-jwt-secret-alternativo

# OpenAI (si usas)
OPENAI_API_KEY=sk-tu-api-key

# Email (opcional)
SENDGRID_API_KEY=SG.tu-api-key
EMAIL_FROM=noreply@tudominio.com

# Google OAuth (si usas)
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=https://tu-sitio.netlify.app/auth/google/callback

# Entorno
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=Aprende y Aplica
```

### 4. Configurar Dominio Personalizado (Opcional)

1. En Netlify Dashboard → **Domain settings**
2. Click en **"Add custom domain"**
3. Sigue las instrucciones para configurar DNS

### 5. Deploy

Una vez configurado, Netlify desplegará automáticamente cuando hagas push a la rama principal.

Para deploy manual:
1. Click en **"Trigger deploy"** → **"Deploy site"**

## 🔍 Verificación Post-Deploy

1. Verifica que el sitio carga correctamente
2. Prueba la autenticación
3. Verifica que las APIs funcionan
4. Revisa los logs en **Deploy logs** si hay errores

## 🛠️ Solución de Problemas Comunes

### Error: "Cannot find module '@aprende-y-aplica/shared'"

**Solución:** Asegúrate de que el script `prepare` se ejecute antes del build:
```json
"prepare": "npm run build --workspace=packages/ui && npm run build --workspace=packages/shared"
```

### Error: "Build timeout"

**Solución:** Netlify tiene un timeout de 15 min. Si el build es muy lento:
- Optimiza dependencias
- Usa cache de Netlify
- Considera dividir el build

### Error: "Function not found"

**Solución:** Next.js en Netlify usa serverless functions. Asegúrate de que:
- El plugin `@netlify/plugin-nextjs` esté instalado
- Las rutas API estén en `apps/web/src/app/api/`

### Variables de entorno no cargan

**Solución:** 
- Verifica que las variables estén en Netlify Dashboard
- Usa `NEXT_PUBLIC_*` para variables del cliente
- Reinicia el deploy después de añadir variables

## 📝 Notas Importantes

1. **Backend API:** El backend Express (`apps/api`) probablemente necesite otro servicio (Railway, Render, etc.) ya que Netlify se enfoca en Next.js
2. **Base de Datos:** Supabase se conecta directamente desde el frontend, no necesita backend adicional
3. **Build Time:** El build puede tardar 3-5 minutos la primera vez
4. **Cache:** Netlify cachea dependencias automáticamente

## 🔗 Recursos

- [Documentación Netlify](https://docs.netlify.com/)
- [Next.js en Netlify](https://docs.netlify.com/integrations/frameworks/nextjs/)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)

---

**¿Problemas?** Revisa los logs de deploy en Netlify Dashboard o contacta al equipo.

