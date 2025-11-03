# 🔧 Solución de Problemas de Autenticación

## ✅ Problemas Corregidos

### 1. ❌ Error en login con email/password
**Problema**: "Error inesperado al iniciar sesión"

**Causa**: El componente `LoginForm` estaba capturando la redirección de Next.js como un error.

**Solución Aplicada**: 
- ✅ Corregido el manejo de excepciones en `LoginForm.tsx`
- ✅ Ahora detecta correctamente las redirecciones exitosas de Next.js
- ✅ Solo muestra error cuando hay un problema real de autenticación

### 2. ❌ Error 400: redirect_uri_mismatch en Google OAuth
**Problema**: "Acceso bloqueado: la solicitud de aya no es válida"

**Causa**: Las URIs de redirección en Google Cloud Console no coinciden con las configuradas en la aplicación.

**Solución**: Configurar correctamente las URIs en Google Cloud Console.

---

## 🔐 Configuración de Google OAuth (OBLIGATORIO)

### Paso 1: Acceder a Google Cloud Console
1. Ve a: https://console.cloud.google.com/apis/credentials
2. Inicia sesión con tu cuenta de Google

### Paso 2: Encontrar tus credenciales OAuth
1. Busca el Client ID: `608376953775-lp2c5kjrplo4248oes9uuei2jnfs2hja.apps.googleusercontent.com`
2. Haz clic en el nombre del cliente OAuth 2.0 (aparece como un ícono de lápiz/editar)

### Paso 3: Configurar las URIs

#### A) Orígenes de JavaScript autorizados
En la sección "Authorized JavaScript origins", **agrega exactamente**:
```
http://localhost:3000
```

#### B) URIs de redirección autorizadas
En la sección "Authorized redirect URIs", **agrega exactamente**:
```
http://localhost:3000/api/auth/callback/google
```

### Paso 4: Guardar cambios
1. Haz clic en el botón **"GUARDAR"** al final de la página
2. ⏳ **IMPORTANTE**: Espera 5-10 minutos para que los cambios se propaguen en los servidores de Google

### Paso 5: Reiniciar el servidor
```powershell
# Detén el servidor actual (Ctrl+C)
# Luego ejecuta:
cd apps/web
npm run dev
```

---

## ✅ Verificación Post-Corrección

### 1. Login con Email/Password
```
1. Ve a: http://localhost:3000/login
2. Ingresa:
   - Email o usuario: [tu-email-registrado]
   - Contraseña: [tu-contraseña]
3. Haz clic en "Iniciar sesión"
4. ✅ Deberías ser redirigido al dashboard según tu rol
```

### 2. Login con Google
```
1. Ve a: http://localhost:3000/login
2. Haz clic en el botón "Continuar con Google"
3. Selecciona tu cuenta de Google
4. Autoriza el acceso a la aplicación
5. ✅ Deberías ser redirigido al dashboard
```

---

## 🐛 Si aún tienes problemas

### Error persiste con Google OAuth
```powershell
# Ejecuta el script de diagnóstico:
cd apps/web
node scripts/check-oauth-config.js
```

Esto te mostrará:
- ✅ Si las variables de entorno están configuradas
- 📋 Las URIs exactas que debes configurar
- 📝 Instrucciones paso a paso

### Error de "Invalid Credentials"
- Verifica que tu usuario existe en la base de datos
- Verifica que la contraseña sea correcta
- Revisa los logs del servidor para más detalles

### Error 500 o errores de servidor
```powershell
# Verifica los logs del servidor:
cd apps/web
npm run dev
# Observa la consola del servidor cuando intentes hacer login
```

---

## 📝 Cambios Realizados

### Archivos Modificados:
1. ✅ `apps/web/src/features/auth/components/LoginForm/LoginForm.tsx`
   - Mejorado manejo de errores y redirecciones

2. ✅ `apps/web/.env.local`
   - Agregada variable `NEXT_PUBLIC_APP_URL="http://localhost:3000"`

### Archivos Creados:
3. ✅ `apps/web/scripts/check-oauth-config.js`
   - Script de diagnóstico para verificar configuración OAuth

---

## 🎯 Próximos Pasos

1. ✅ Configurar las URIs en Google Cloud Console (siguiendo las instrucciones arriba)
2. ⏳ Esperar 5-10 minutos para que los cambios se propaguen
3. 🔄 Reiniciar el servidor (`npm run dev`)
4. 🧪 Probar ambos flujos de autenticación

---

## 💡 Notas Adicionales

### ⚠️ IMPORTANTE para Producción
Cuando despliegues a producción (ej: Netlify, Vercel):
1. Actualiza `NEXT_PUBLIC_APP_URL` en las variables de entorno de producción
2. Agrega las nuevas URIs de producción en Google Cloud Console:
   ```
   https://tu-dominio.com
   https://tu-dominio.com/api/auth/callback/google
   ```

### 🔒 Seguridad
- No compartas tu `GOOGLE_OAUTH_CLIENT_SECRET` públicamente
- Mantén tu archivo `.env.local` fuera del control de versiones
- Las credenciales mostradas aquí deben ser rotadas si se exponen públicamente
