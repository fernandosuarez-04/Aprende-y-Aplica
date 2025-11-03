# 🚀 Guía Rápida: Configuración Google OAuth

## 📸 Instrucciones Visuales

### 1️⃣ Accede a Google Cloud Console
```
🔗 https://console.cloud.google.com/apis/credentials
```

### 2️⃣ Busca tu Client ID
```
Client ID: 608376953775-lp2c5kjrplo4248oes9uuei2jnfs2hja.apps.googleusercontent.com
```
- Haz clic en el ícono de **lápiz/editar** junto al nombre

### 3️⃣ Configura los Orígenes JavaScript
En la sección **"Authorized JavaScript origins"**:
```
✅ AGREGAR:  http://localhost:3000
```
**NO** agregues espacios, barras finales `/`, ni nada extra.

### 4️⃣ Configura las URIs de Redirección
En la sección **"Authorized redirect URIs"**:
```
✅ AGREGAR:  http://localhost:3000/api/auth/callback/google
```
**EXACTAMENTE** como está escrito, sin modificaciones.

### 5️⃣ Guarda y Espera
1. Haz clic en **"GUARDAR"** (botón azul al final)
2. ⏰ **ESPERA 5-10 MINUTOS** antes de probar
3. Google necesita tiempo para propagar los cambios

### 6️⃣ Reinicia tu Servidor
```powershell
# En la terminal, presiona Ctrl+C para detener el servidor
# Luego ejecuta:
npm run dev
```

---

## ✅ Checklist de Verificación

Antes de probar, verifica:

- [ ] ✅ Agregaste `http://localhost:3000` en **Authorized JavaScript origins**
- [ ] ✅ Agregaste `http://localhost:3000/api/auth/callback/google` en **Authorized redirect URIs**
- [ ] ✅ Hiciste clic en **GUARDAR** en Google Cloud Console
- [ ] ⏰ Esperaste al menos **5 minutos**
- [ ] 🔄 Reiniciaste el servidor (`npm run dev`)
- [ ] 🌐 El servidor está corriendo en **http://localhost:3000**

---

## 🧪 Prueba el Login

### Login con Email/Password:
1. Ve a: `http://localhost:3000/login`
2. Ingresa tus credenciales
3. Deberías ver redirección exitosa al dashboard

### Login con Google:
1. Ve a: `http://localhost:3000/login`
2. Haz clic en **"Continuar con Google"**
3. Selecciona tu cuenta
4. Deberías ver redirección exitosa

---

## ❌ Si ves errores:

### Error 400: redirect_uri_mismatch
```
❌ Problema: Las URIs no coinciden
✅ Solución: 
   1. Verifica que las URIs estén EXACTAMENTE como se indica
   2. No agregues espacios ni barras finales
   3. Espera 5-10 minutos después de guardar
```

### Error: Invalid Credentials
```
❌ Problema: Credenciales incorrectas
✅ Solución:
   - Verifica usuario y contraseña
   - Verifica que el usuario exista en la base de datos
```

### Error inesperado al iniciar sesión
```
✅ YA CORREGIDO en el código
   - Si aún lo ves, reinicia el servidor
   - Limpia la caché del navegador (Ctrl+Shift+R)
```

---

## 🔧 Comandos Útiles

### Verificar configuración OAuth:
```powershell
cd apps/web
node scripts/check-oauth-config.js
```

### Ver logs del servidor:
```powershell
cd apps/web
npm run dev
# Observa la consola cuando hagas login
```

### Limpiar todo y reiniciar:
```powershell
# Detén el servidor (Ctrl+C)
cd apps/web
Remove-Item -Recurse -Force .next  # Limpia caché de Next.js
npm run dev  # Reinicia
```

---

## 📞 Soporte

Si después de seguir todos los pasos aún tienes problemas:

1. Ejecuta el script de diagnóstico
2. Revisa los logs del servidor
3. Verifica que todas las variables de entorno estén correctas en `.env.local`
4. Verifica que las URIs en Google Cloud Console sean exactas

---

**Última actualización**: 3 de noviembre de 2025
