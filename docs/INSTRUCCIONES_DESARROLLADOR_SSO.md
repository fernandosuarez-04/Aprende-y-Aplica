# Instrucciones para el Desarrollador - Configuración SSO Google

## 📋 Información General

**Documento**: Guía de configuración manual para SSO con Google
**Destinatario**: Desarrollador responsable del proyecto
**Prerrequisito**: Tener acceso a Google Cloud Console
**Tiempo estimado**: 30-45 minutos

---

## 🎯 Tareas del Desarrollador

Este documento contiene **todas las configuraciones que debes realizar manualmente** antes de que Claude pueda implementar el código SSO.

---

## 1️⃣ Configuración en Google Cloud Console

### Paso 1.1: Crear Proyecto en Google Cloud

1. **Ir a Google Cloud Console**
   - URL: https://console.cloud.google.com/
   - Iniciar sesión con cuenta de Google (preferiblemente cuenta corporativa)

2. **Crear Nuevo Proyecto**
   ```
   - Click en el selector de proyectos (arriba a la izquierda)
   - Click en "Nuevo Proyecto"
   - Nombre del proyecto: "Aprende y Aplica Auth" (o similar)
   - Organización: Seleccionar si aplica
   - Ubicación: Dejar por defecto
   - Click en "Crear"
   ```

3. **Esperar a que se cree el proyecto**
   - Puede tomar 30-60 segundos
   - Verificar que estás en el proyecto correcto (nombre visible arriba)

### Paso 1.2: Habilitar API de Google OAuth

1. **Ir a APIs & Services**
   ```
   - Menú hamburguesa (☰) → APIs & Services → Library
   - O buscar: "APIs & Services" en el buscador superior
   ```

2. **Habilitar Google+ API**
   ```
   - En el buscador, escribir: "Google+ API"
   - Click en "Google+ API"
   - Click en "ENABLE" (Habilitar)
   ```

3. **Habilitar Google OAuth2 API**
   ```
   - Buscar: "Google OAuth2 API"
   - Click en la API
   - Click en "ENABLE"
   ```

### Paso 1.3: Configurar Pantalla de Consentimiento OAuth

⚠️ **IMPORTANTE**: Este paso es crucial para que el flujo OAuth funcione.

1. **Ir a OAuth Consent Screen**
   ```
   Menú → APIs & Services → OAuth consent screen
   ```

2. **Seleccionar Tipo de Usuario**
   ```
   Opciones:

   [X] Internal (Solo usuarios de tu organización)
       - Recomendado para: Testing interno, empresas con Google Workspace
       - Límite: Solo emails del dominio de la organización

   [ ] External (Cualquier usuario con cuenta Google)
       - Recomendado para: Producción, acceso público
       - Requiere: Verificación de Google (puede tomar días/semanas)
       - Mientras no esté verificado: Solo 100 usuarios de prueba

   👉 Para empezar, selecciona "External" y luego "CREATE"
   ```

3. **Configurar Información de la App (Página 1)**
   ```
   App name*: Aprende y Aplica

   User support email*: tu-email@ejemplo.com

   App logo: (Opcional - puedes agregarlo después)
   - Formato: PNG, JPG
   - Tamaño: 120x120 px
   - Debe ser cuadrado

   App domain (Opcional por ahora):
   - Application home page: https://tu-dominio.com
   - Application privacy policy link: https://tu-dominio.com/privacy
   - Application terms of service link: https://tu-dominio.com/terms

   Authorized domains:
   - tu-dominio.com (si ya tienes dominio)
   - localhost (para desarrollo - NO funciona, ver nota abajo)

   Developer contact information*:
   - Email addresses: tu-email@ejemplo.com

   Click "SAVE AND CONTINUE"
   ```

   ⚠️ **NOTA**: Google NO permite `localhost` en authorized domains. Para desarrollo local, usarás la configuración de "Test users" (paso siguiente).

4. **Configurar Scopes (Página 2)**
   ```
   Click en "ADD OR REMOVE SCOPES"

   Seleccionar los siguientes scopes:
   ✅ .../auth/userinfo.email
      - Ver tu dirección de email

   ✅ .../auth/userinfo.profile
      - Ver tu información personal básica

   ✅ openid
      - Autenticar usando OpenID Connect

   Click "UPDATE"
   Click "SAVE AND CONTINUE"
   ```

5. **Configurar Test Users (Página 3)**
   ```
   ⚠️ IMPORTANTE para desarrollo:

   Mientras tu app esté en modo "Testing", solo estos usuarios pueden usarla.

   Click en "ADD USERS"

   Agregar emails de prueba:
   - tu-email-personal@gmail.com
   - email-del-equipo@gmail.com
   - (puedes agregar hasta 100)

   Click "ADD"
   Click "SAVE AND CONTINUE"
   ```

6. **Revisar y Confirmar (Página 4)**
   ```
   Revisar toda la información
   Click "BACK TO DASHBOARD"
   ```

### Paso 1.4: Crear Credenciales OAuth

1. **Ir a Credentials**
   ```
   Menú → APIs & Services → Credentials
   ```

2. **Crear OAuth 2.0 Client ID**
   ```
   Click en "CREATE CREDENTIALS" (arriba)
   Seleccionar: "OAuth client ID"
   ```

3. **Configurar Client ID**
   ```
   Application type*: Web application

   Name*: Aprende y Aplica Web Client

   Authorized JavaScript origins:
   Click "ADD URI"
   - http://localhost:3000
   - http://127.0.0.1:3000
   - https://tu-dominio.com (cuando tengas producción)

   Authorized redirect URIs*:
   Click "ADD URI"
   - http://localhost:3000/api/auth/callback/google
   - http://127.0.0.1:3000/api/auth/callback/google
   - https://tu-dominio.com/api/auth/callback/google (producción)

   ⚠️ IMPORTANTE: La URL debe coincidir EXACTAMENTE con lo que tengas en código

   Click "CREATE"
   ```

4. **Guardar Credenciales**
   ```
   Aparecerá un modal con:

   📋 Your Client ID:
   123456789-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com

   📋 Your Client Secret:
   GOCSPX-xxxxxxxxxxxxxxxxxxxxxx

   ⚠️ COPIAR Y GUARDAR estos valores de forma segura
   ⚠️ NO compartir el Client Secret públicamente
   ⚠️ NO hacer commit al repositorio con estos valores

   Click "DOWNLOAD JSON" (opcional - backup)
   Click "OK"
   ```

---

## 2️⃣ Configurar Variables de Entorno

### Paso 2.1: Agregar Variables a .env.local

1. **Abrir archivo .env.local**
   ```bash
   # Si no existe, crearlo:
   # En raíz del proyecto: apps/web/.env.local
   ```

2. **Agregar las siguientes variables**
   ```env
   # ============================================================================
   # GOOGLE OAUTH CONFIGURATION
   # ============================================================================

   # Client ID de Google Cloud Console
   # Ejemplo: 123456789-abc123xyz.apps.googleusercontent.com
   GOOGLE_OAUTH_CLIENT_ID=tu-client-id-aqui

   # Client Secret de Google Cloud Console
   # Ejemplo: GOCSPX-abc123xyz
   GOOGLE_OAUTH_CLIENT_SECRET=tu-client-secret-aqui

   # URL base de la aplicación
   # Desarrollo: http://localhost:3000
   # Producción: https://tu-dominio.com
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Ejemplo completo**
   ```env
   # GOOGLE OAUTH (Ejemplo - NO usar estos valores)
   GOOGLE_OAUTH_CLIENT_ID=123456789-abc123def456ghi789.apps.googleusercontent.com
   GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-AbCdEf123456
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Verificar que funciona**
   ```bash
   # En terminal, ejecutar:
   node -e "console.log(process.env.GOOGLE_OAUTH_CLIENT_ID)"

   # Debe imprimir tu Client ID
   # Si imprime "undefined", revisar que el archivo esté en el lugar correcto
   ```

### Paso 2.2: Actualizar .env.example

Para documentar las variables para otros desarrolladores:

```env
# Agregar al archivo .env.example:

# ============================================================================
# GOOGLE OAUTH CONFIGURATION
# ============================================================================
GOOGLE_OAUTH_CLIENT_ID=tu-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=tu-google-client-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 3️⃣ Ejecutar Scripts de Base de Datos

⚠️ **IMPORTANTE**: Estos scripts deben ejecutarse en Supabase SQL Editor.

### Paso 3.1: Crear Tabla oauth_accounts

1. **Ir a Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Seleccionar tu proyecto

2. **Ir a SQL Editor**
   ```
   Menú lateral → SQL Editor
   Click en "New query"
   ```

3. **Copiar y ejecutar el script**
   ```
   El script completo está en:
   apps/web/scripts/create-oauth-accounts-table.sql

   Claude lo creará durante la implementación
   ```

4. **Verificar creación**
   ```sql
   -- Ejecutar en SQL Editor:
   SELECT * FROM oauth_accounts LIMIT 1;

   -- Debe retornar: (sin errores)
   -- Si hay error "relation does not exist", revisar el script
   ```

### Paso 3.2: Modificar Tabla users

1. **Ejecutar script de alteración**
   ```
   El script completo está en:
   apps/web/scripts/alter-users-for-oauth.sql

   Claude lo creará durante la implementación
   ```

2. **Verificar cambios**
   ```sql
   -- Verificar que password_hash es ahora nullable:
   SELECT column_name, is_nullable, data_type
   FROM information_schema.columns
   WHERE table_name = 'users'
     AND column_name IN ('password_hash', 'profile_picture_url', 'oauth_provider');

   -- password_hash debe tener is_nullable = 'YES'
   ```

---

## 4️⃣ Verificar Configuración

### Checklist Pre-implementación

Antes de que Claude comience la implementación, verificar:

```
Base de Datos:
✅ [ ] Tabla oauth_accounts creada sin errores
✅ [ ] Tabla users modificada (password_hash nullable)
✅ [ ] Índices creados correctamente
✅ [ ] No hay errores en SQL Editor

Google Cloud Console:
✅ [ ] Proyecto creado
✅ [ ] APIs habilitadas (Google+ API, OAuth2 API)
✅ [ ] Pantalla de consentimiento configurada
✅ [ ] Test users agregados (para desarrollo)
✅ [ ] OAuth Client ID creado
✅ [ ] Redirect URIs configurados correctamente
✅ [ ] Credenciales guardadas de forma segura

Variables de Entorno:
✅ [ ] .env.local existe
✅ [ ] GOOGLE_OAUTH_CLIENT_ID configurado
✅ [ ] GOOGLE_OAUTH_CLIENT_SECRET configurado
✅ [ ] NEXT_PUBLIC_APP_URL configurado
✅ [ ] Variables verificadas (node -e)

Seguridad:
✅ [ ] .env.local está en .gitignore
✅ [ ] Credenciales NO están en código
✅ [ ] Credenciales guardadas en lugar seguro (1Password, etc.)
```

### Script de Verificación Rápida

Ejecutar en terminal:

```bash
# 1. Verificar variables de entorno
echo "Verificando variables de entorno..."
echo "GOOGLE_OAUTH_CLIENT_ID: ${GOOGLE_OAUTH_CLIENT_ID:0:20}..."
echo "GOOGLE_OAUTH_CLIENT_SECRET: ${GOOGLE_OAUTH_CLIENT_SECRET:0:10}..."
echo "NEXT_PUBLIC_APP_URL: $NEXT_PUBLIC_APP_URL"

# 2. Verificar estructura de archivos
echo ""
echo "Verificando estructura..."
ls -la apps/web/.env.local
ls -la apps/web/scripts/

# 3. Iniciar servidor para verificar
echo ""
echo "Iniciando servidor de desarrollo..."
npm run dev

# Verificar que no haya errores de variables de entorno faltantes
```

---

## 5️⃣ Configuración para Producción

### Cuando estés listo para producción:

#### 5.1: Actualizar Google Cloud Console

1. **Agregar URLs de producción**
   ```
   En Credentials → Tu OAuth Client → Edit:

   Authorized JavaScript origins:
   ✅ https://tu-dominio.com
   ✅ https://www.tu-dominio.com (si usas www)

   Authorized redirect URIs:
   ✅ https://tu-dominio.com/api/auth/callback/google
   ✅ https://www.tu-dominio.com/api/auth/callback/google
   ```

2. **Publicar App (OAuth Consent Screen)**
   ```
   Si quieres que cualquiera pueda usar Google login:

   OAuth consent screen → PUBLISH APP

   ⚠️ Requiere verificación de Google (puede tomar semanas)
   ⚠️ Mientras tanto, solo pueden usarla los "Test users"

   Para iniciar verificación:
   - Completar toda la información de la app
   - Agregar todos los dominios autorizados
   - Enviar a revisión desde el dashboard
   ```

#### 5.2: Variables de Entorno en Vercel/Hosting

```env
# En Vercel/Railway/tu hosting, agregar:

GOOGLE_OAUTH_CLIENT_ID=mismo-client-id
GOOGLE_OAUTH_CLIENT_SECRET=mismo-client-secret
NEXT_PUBLIC_APP_URL=https://tu-dominio.com

# ⚠️ NO incluir http://localhost en producción
```

---

## 6️⃣ Solución de Problemas Comunes

### Problema 1: "redirect_uri_mismatch"

**Error**:
```
Error 400: redirect_uri_mismatch
```

**Solución**:
1. Verificar que la URL en código coincida EXACTAMENTE con la configurada en Google Cloud Console
2. Verificar protocolo (http vs https)
3. Verificar puerto (localhost:3000)
4. Verificar path exacto (/api/auth/callback/google)

**Ejemplo de coincidencia correcta**:
```
Código:     http://localhost:3000/api/auth/callback/google
Console:    http://localhost:3000/api/auth/callback/google
            ✅ COINCIDE EXACTAMENTE
```

### Problema 2: "access_denied"

**Error**:
```
Error: access_denied
```

**Posibles causas**:
1. Usuario no está en la lista de "Test users" (si app está en modo Testing)
2. Usuario canceló el consentimiento
3. Cuenta de Google no tiene permisos necesarios

**Solución**:
- Agregar usuario a "Test users" en Google Cloud Console
- Verificar que el usuario aceptó todos los permisos

### Problema 3: Variables de entorno undefined

**Error**:
```
Error: GOOGLE_OAUTH_CLIENT_ID no está configurado
```

**Solución**:
1. Verificar que .env.local existe en `apps/web/.env.local`
2. Verificar que no tiene errores de sintaxis
3. Reiniciar servidor de desarrollo: `npm run dev`
4. Verificar con: `node -e "console.log(process.env.GOOGLE_OAUTH_CLIENT_ID)"`

### Problema 4: "Invalid client"

**Error**:
```
Error 401: invalid_client
```

**Solución**:
- Verificar que Client ID y Client Secret son correctos
- Verificar que no hay espacios al inicio/final
- Regenerar credenciales si es necesario

---

## 7️⃣ Testing Durante Desarrollo

### URLs de Testing

Para probar el flujo OAuth localmente:

```
1. Login page:
   http://localhost:3000/auth

2. Iniciar OAuth (automático al hacer click en botón):
   Se redirige a Google

3. Callback (automático después de autorizar):
   http://localhost:3000/api/auth/callback/google?code=...

4. Dashboard (automático si todo funciona):
   http://localhost:3000/dashboard
```

### Cuentas de Prueba

Asegúrate de tener al menos 2-3 cuentas Gmail de prueba:
```
1. Cuenta nueva (para probar registro)
2. Cuenta existente (para probar login)
3. Cuenta para pruebas de error
```

---

## 8️⃣ Seguridad y Mejores Prácticas

### ✅ DO (Hacer)

```
✅ Guardar credenciales en 1Password/LastPass
✅ Usar diferentes credenciales para dev/staging/prod
✅ Rotar Client Secret cada 6-12 meses
✅ Monitorear intentos de OAuth en Google Cloud Console
✅ Habilitar 2FA en cuenta de Google Cloud Console
✅ Usar environment-specific redirect URIs
✅ Limitar scopes solo a los necesarios
✅ Revisar regularmente la lista de test users
```

### ❌ DON'T (No hacer)

```
❌ Hacer commit de .env.local al repositorio
❌ Compartir Client Secret en Slack/Email
❌ Usar mismas credenciales en múltiples proyectos
❌ Copiar credenciales en código directamente
❌ Publicar Client Secret en logs
❌ Usar credenciales de producción en desarrollo
❌ Agregar dominios no confiables a authorized domains
❌ Ignorar alertas de seguridad de Google
```

---

## 9️⃣ Documentos de Referencia

### Google OAuth Documentation

```
📚 Documentación principal:
https://developers.google.com/identity/protocols/oauth2

📚 OAuth 2.0 for Web Server Applications:
https://developers.google.com/identity/protocols/oauth2/web-server

📚 OAuth 2.0 Scopes for Google APIs:
https://developers.google.com/identity/protocols/oauth2/scopes

📚 OAuth Consent Screen:
https://support.google.com/cloud/answer/10311615
```

### Testing Tools

```
🔧 OAuth Playground (probar flujo manualmente):
https://developers.google.com/oauthplayground/

🔧 JWT Decoder (decodificar ID tokens):
https://jwt.io/

🔧 Google API Explorer:
https://developers.google.com/apis-explorer
```

---

## 🎯 Resumen Final

**Lo que debes completar ANTES de la implementación**:

```
1. [ ] Crear proyecto en Google Cloud Console
2. [ ] Habilitar APIs necesarias
3. [ ] Configurar pantalla de consentimiento OAuth
4. [ ] Crear OAuth Client ID
5. [ ] Configurar redirect URIs
6. [ ] Agregar test users
7. [ ] Guardar credenciales de forma segura
8. [ ] Agregar variables a .env.local
9. [ ] Ejecutar scripts de base de datos
10. [ ] Verificar que todo funciona con checklist
```

**Tiempo total estimado**: 30-45 minutos

---

## 📞 Contacto y Soporte

### Si tienes problemas:

1. **Revisar esta guía completa**
2. **Revisar "Solución de Problemas Comunes"**
3. **Consultar documentación oficial de Google**
4. **Verificar en Google Cloud Console → Quotas & limits**

### Información para compartir si necesitas ayuda:

```
✅ Puedes compartir:
- Mensajes de error (sin tokens)
- Configuración de redirect URIs
- Screenshots del flujo (sin credenciales)

❌ NUNCA compartas:
- Client Secret
- Access tokens
- Refresh tokens
- Credenciales completas
```

---

## ✅ Confirmación Final

Una vez completados todos los pasos, confirma:

```
[ ] He completado TODAS las configuraciones de Google Cloud Console
[ ] He agregado TODAS las variables de entorno necesarias
[ ] He ejecutado TODOS los scripts de base de datos
[ ] He verificado TODAS las configuraciones con el checklist
[ ] He guardado las credenciales de forma SEGURA
[ ] Estoy listo para que Claude inicie la implementación
```

**Cuando todo esté ✅, puedes decirle a Claude**:
"Todo configurado, puedes empezar la implementación de SSO"

---

**Última actualización**: 26 de octubre de 2025
**Versión**: 1.0
**Próximo paso**: Implementación por Claude según PLAN_IMPLEMENTACION_SSO_GOOGLE.md
