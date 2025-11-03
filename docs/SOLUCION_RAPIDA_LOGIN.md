# 🚨 ERROR DE LOGIN - SOLUCIÓN COMPLETA

## ❌ Error Actual
```
Error inesperado al iniciar sesión
```

## 🔍 Causa Raíz
La tabla `refresh_tokens` no existe en la base de datos Supabase.

---

## ✅ SOLUCIÓN RÁPIDA (5 minutos)

### 1️⃣ Crear Tabla en Supabase (OBLIGATORIO)

1. **Abre Supabase**:
   - Ve a: https://supabase.com/dashboard/project/odbxqmhbnkfledqcqujl
   - Haz clic en **"SQL Editor"** en el menú lateral
   - Haz clic en **"New query"**

2. **Copia el script**:
   - Abre el archivo: `database-fixes/verify-and-create-auth-tables.sql`
   - Copia TODO el contenido (Ctrl+A, Ctrl+C)

3. **Ejecuta el script**:
   - Pega en el SQL Editor de Supabase (Ctrl+V)
   - Haz clic en **"Run"** (o Ctrl+Enter)
   - Espera a ver: `✅ VERIFICACIÓN COMPLETADA`

### 2️⃣ Reiniciar Servidor

```powershell
# Si el servidor está corriendo, deténlo (Ctrl+C)
cd apps/web
npm run dev
```

### 3️⃣ Probar Login

```
http://localhost:3000/login
```

Ingresa tus credenciales y deberías poder iniciar sesión correctamente.

---

## 🔧 SOLUCIÓN GOOGLE OAUTH (Opcional pero Recomendado)

Si también quieres que funcione el login con Google:

### 1️⃣ Configurar Google Cloud Console

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Busca: `608376953775-lp2c5kjrplo4248oes9uuei2jnfs2hja.apps.googleusercontent.com`
3. Haz clic en el nombre del cliente OAuth 2.0

**Agrega estas URIs EXACTAMENTE**:

**Orígenes de JavaScript autorizados**:
```
http://localhost:3000
```

**URIs de redirección autorizadas**:
```
http://localhost:3000/api/auth/callback/google
```

4. Haz clic en **"GUARDAR"**
5. ⏰ **ESPERA 5-10 MINUTOS**

### 2️⃣ Reiniciar Servidor

```powershell
cd apps/web
npm run dev
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

Antes de probar, asegúrate de que:

- [ ] ✅ Ejecutaste el script SQL en Supabase
- [ ] ✅ Viste el mensaje "✅ VERIFICACIÓN COMPLETADA"
- [ ] ✅ Reiniciaste el servidor (`npm run dev`)
- [ ] ✅ El servidor está corriendo en `http://localhost:3000`
- [ ] ✅ (Opcional) Configuraste Google OAuth URIs
- [ ] ✅ (Opcional) Esperaste 5-10 minutos después de configurar Google

---

## 🧪 PRUEBAS

### Test 1: Login con Email/Password
```
1. Ve a: http://localhost:3000/login
2. Ingresa usuario: [tu-usuario]
3. Ingresa contraseña: [tu-contraseña]
4. Haz clic en "Iniciar sesión"
5. ✅ Deberías ser redirigido al dashboard
```

### Test 2: Login con Google (si configuraste)
```
1. Ve a: http://localhost:3000/login
2. Haz clic en "Continuar con Google"
3. Selecciona tu cuenta de Google
4. ✅ Deberías ser redirigido al dashboard
```

---

## 🛠️ COMANDOS ÚTILES

### Diagnóstico completo del sistema:
```powershell
cd apps/web
node scripts/diagnose-auth.js
```

### Verificar configuración OAuth:
```powershell
cd apps/web
node scripts/check-oauth-config.js
```

### Limpiar caché y reiniciar:
```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error persiste después de ejecutar el script SQL

**Posibles causas**:
1. El script no se ejecutó completamente
2. Hay un error en el script SQL
3. No reiniciaste el servidor

**Solución**:
```powershell
# 1. Verifica en Supabase que la tabla existe:
#    Table Editor → Buscar "refresh_tokens"

# 2. Si no existe, ejecuta el script nuevamente

# 3. Reinicia el servidor
cd apps/web
npm run dev
```

### Error: "credenciales inválidas"

**Causa**: Usuario o contraseña incorrectos

**Solución**:
- Verifica que el usuario existe en la tabla `users`
- Verifica que la contraseña sea correcta
- Si olvidaste la contraseña, usa la función de recuperación

### Error 400 con Google OAuth

**Causa**: URIs no configuradas o aún no propagadas

**Solución**:
1. Verifica que agregaste las URIs EXACTAMENTE como se indica
2. Espera 10 minutos más
3. Limpia las cookies del navegador
4. Intenta nuevamente

---

## 📁 ARCHIVOS IMPORTANTES

### Scripts creados:
- `database-fixes/verify-and-create-auth-tables.sql` - Script SQL para crear tablas
- `apps/web/scripts/diagnose-auth.js` - Diagnóstico del sistema
- `apps/web/scripts/check-oauth-config.js` - Verificar configuración OAuth

### Documentación:
- `docs/FIX_MISSING_REFRESH_TOKENS_TABLE.md` - Guía detallada de la tabla
- `docs/SOLUCION_ERRORES_LOGIN.md` - Solución completa de errores
- `docs/GUIA_RAPIDA_OAUTH.md` - Guía rápida de OAuth

### Archivos modificados:
- `apps/web/src/features/auth/actions/login.ts` - Mejorados logs
- `apps/web/src/features/auth/services/session.service.ts` - Mejor manejo de errores
- `apps/web/.env.local` - Agregada variable `NEXT_PUBLIC_APP_URL`

---

## ⚡ RESUMEN ULTRA-RÁPIDO

```bash
# 1. Ejecutar script SQL en Supabase
database-fixes/verify-and-create-auth-tables.sql

# 2. Reiniciar servidor
cd apps/web
npm run dev

# 3. Probar
http://localhost:3000/login
```

---

## 📞 SOPORTE

Si después de seguir todos los pasos aún tienes problemas:

1. Ejecuta el diagnóstico: `node scripts/diagnose-auth.js`
2. Revisa los logs del servidor en la terminal
3. Revisa los logs del navegador (F12 → Console)
4. Verifica que la tabla `refresh_tokens` existe en Supabase

---

**Última actualización**: 3 de noviembre de 2025

**Estado**: 
- ✅ Código corregido
- ⏳ Requiere ejecutar script SQL en Supabase
- ⏳ (Opcional) Configurar Google OAuth
