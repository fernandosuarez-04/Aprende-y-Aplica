# 🔧 Solución: Tabla refresh_tokens Faltante

## 🚨 Problema Identificado

El error "Error inesperado al iniciar sesión" ocurre porque la tabla `refresh_tokens` no existe en la base de datos. Esta tabla es necesaria para el sistema de autenticación.

## ✅ Solución Rápida

### Paso 1: Acceder al SQL Editor de Supabase

1. Ve a: https://supabase.com/dashboard/project/odbxqmhbnkfledqcqujl
2. En el menú lateral, haz clic en **"SQL Editor"**
3. Haz clic en **"New query"**

### Paso 2: Ejecutar el Script de Creación

Copia y pega el contenido completo del archivo:
```
database-fixes/verify-and-create-auth-tables.sql
```

### Paso 3: Ejecutar la Query

1. Haz clic en el botón **"Run"** (o presiona Ctrl+Enter)
2. Espera a que se complete la ejecución
3. Deberías ver mensajes como:
   ```
   ✅ Tabla refresh_tokens creada exitosamente
   ✅ Tabla user_session ya existe
   ✅ VERIFICACIÓN COMPLETADA
   ```

### Paso 4: Reiniciar el Servidor

```powershell
# Detén el servidor (Ctrl+C)
cd apps/web
npm run dev
```

### Paso 5: Probar el Login

1. Ve a: http://localhost:3000/login
2. Ingresa tus credenciales
3. ✅ Ahora debería funcionar correctamente

---

## 📋 Qué Hace el Script

El script `verify-and-create-auth-tables.sql` realiza las siguientes acciones:

### 1. Crea la tabla `refresh_tokens`
- Almacena tokens de actualización para sesiones
- Incluye información de dispositivo y ubicación
- Permite revocar sesiones individualmente

### 2. Verifica la tabla `user_session`
- Sistema legacy de sesiones
- Mantiene compatibilidad con código existente

### 3. Agrega columnas a `users` (si faltan)
- `is_banned`: Indica si el usuario está baneado
- `ban_reason`: Razón del baneo

### 4. Crea funciones de limpieza
- `clean_expired_refresh_tokens()`: Limpia tokens expirados

---

## 🔍 Verificar que Todo Funcione

### Opción 1: Ejecutar Script de Diagnóstico

```powershell
cd apps/web
node scripts/diagnose-auth.js
```

Deberías ver:
```
✅ ✨ Todas las verificaciones pasaron correctamente
```

### Opción 2: Verificar Manualmente en Supabase

1. Ve al **Table Editor** en Supabase
2. Busca la tabla `refresh_tokens`
3. Debería tener estas columnas:
   - `id` (uuid)
   - `user_id` (uuid)
   - `token_hash` (text)
   - `expires_at` (timestamp)
   - `created_at` (timestamp)
   - `last_used_at` (timestamp)
   - `device_fingerprint` (text)
   - `ip_address` (text)
   - `user_agent` (text)
   - `is_revoked` (boolean)
   - `revoked_at` (timestamp)
   - `revoked_reason` (text)

---

## 🎯 Después de Ejecutar el Script

Una vez que ejecutes el script SQL:

1. ✅ El login con email/password funcionará
2. ✅ Las sesiones se crearán correctamente
3. ✅ Los tokens se renovarán automáticamente
4. ✅ Las sesiones expirarán correctamente según configuración

---

## 🐛 Si Aún Tienes Problemas

### Error: "relation refresh_tokens does not exist"

**Solución**: El script no se ejecutó correctamente.
- Verifica que copiaste TODO el contenido del script
- Ejecuta el script nuevamente
- Verifica que no haya errores en el SQL Editor

### Error: "permission denied"

**Solución**: Necesitas permisos de administrador.
- Usa el SQL Editor de Supabase (ya tienes permisos allí)
- No intentes ejecutar desde la aplicación

### Error al crear la tabla por referencia a users

**Solución**: La tabla `users` no existe.
- Ejecuta primero el script principal de la base de datos
- Luego ejecuta este script de verificación

---

## 📝 Notas Importantes

1. **Este script es seguro**: Verifica si las tablas existen antes de crearlas
2. **No borra datos**: Solo crea lo que falta
3. **Es idempotente**: Puedes ejecutarlo múltiples veces sin problemas
4. **Producción**: Este mismo script funciona en producción

---

## 🚀 Resumen de Pasos

```bash
1. Abrir Supabase SQL Editor
2. Copiar database-fixes/verify-and-create-auth-tables.sql
3. Pegar en SQL Editor
4. Hacer clic en "Run"
5. Esperar confirmación: "✅ VERIFICACIÓN COMPLETADA"
6. Reiniciar servidor: npm run dev
7. Probar login: http://localhost:3000/login
```

---

## 📞 Verificación Post-Instalación

Ejecuta este comando para verificar todo:

```powershell
cd apps/web
node scripts/diagnose-auth.js
```

Si todo está correcto, verás:
```
✅ ✨ Todas las verificaciones pasaron correctamente

📝 PRÓXIMOS PASOS:
1. Configura las URIs en Google Cloud Console
2. Espera 5-10 minutos para que los cambios se propaguen
3. Reinicia el servidor: npm run dev
4. Prueba el login en: http://localhost:3000/login
```

---

**Última actualización**: 3 de noviembre de 2025
