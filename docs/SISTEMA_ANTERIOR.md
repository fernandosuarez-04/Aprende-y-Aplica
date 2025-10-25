# Sistema de Autenticación - Documentación Completa

**Documento de Referencia para Implementación de Recuperación de Contraseña**

Este documento proporciona una documentación técnica completa del sistema de autenticación actual, con énfasis en el flujo de recuperación de contraseña para facilitar su implementación en la refactorización del proyecto.

---

## 📋 Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Sistema de Sign Up (Registro)](#sistema-de-sign-up-registro)
3. [Sistema de Login](#sistema-de-login)
4. [Sistema de Recuperación de Contraseña](#sistema-de-recuperación-de-contraseña)
5. [Sistema OTP (One-Time Password)](#sistema-otp-one-time-password)
6. [Gestión de Sesiones y Tokens](#gestión-de-sesiones-y-tokens)
7. [Base de Datos](#base-de-datos)
8. [Variables de Entorno](#variables-de-entorno)
9. [Seguridad y Rate Limiting](#seguridad-y-rate-limiting)

---

## Arquitectura General

### Stack Tecnológico

**Frontend:**
- Vanilla JavaScript (ES6+)
- HTML5/CSS3
- Supabase Client Library

**Backend:**
- Netlify Serverless Functions (Node.js)
- PostgreSQL
- Supabase (opcional, como proveedor secundario)

**Librerías Principales:**
```json
{
  "bcryptjs": "^2.4.3",        // Hashing de passwords
  "@supabase/supabase-js": "^2.x", // Cliente Supabase
  "nodemailer": "^6.x",        // Envío de emails
  "crypto": "built-in"         // Generación de tokens seguros
}
```

### Arquitectura Híbrida

El sistema utiliza un enfoque híbrido:

1. **Supabase Auth** (Opcional) - Proveedor primario cuando está habilitado
2. **Backend Propio** (Netlify Functions) - Fallback y sistema principal
3. **LocalStorage/SessionStorage** - Persistencia de sesión en cliente

**Flujo de Decisión:**
```
¿Supabase habilitado?
  ├─ SÍ → Intentar Supabase Auth
  │        ├─ Éxito → Usar Supabase
  │        └─ Error → Fallback a Backend Propio
  └─ NO → Usar Backend Propio directamente
```

### Estructura de Archivos

```
src/
├── login/
│   ├── new-auth.html          # UI principal autenticación
│   ├── new-auth.js            # Lógica frontend (2300+ líneas)
│   ├── new-auth.css           # Estilos
│   └── reset-password.html    # UI recuperación contraseña
├── utils/
│   ├── auth-utils.js          # Utilidades autenticación
│   ├── auth-guard.js          # Protección de rutas
│   ├── otp-service.js         # Servicio OTP (Node.js)
│   └── email-service.js       # Servicio envío emails
└── scripts/
    └── supabase-client.js     # Cliente Supabase

netlify/functions/
├── login.js                   # Endpoint login
├── register.js                # Endpoint registro
├── verify-email.js            # Verificación email OTP
├── forgot-password.js         # Solicitud recuperación
├── reset-password.js          # Restablecer contraseña
├── auth-issue.js              # Emisión JWT tokens
└── user-auth-session.js       # Gestión sesiones
```

---

## Sistema de Sign Up (Registro)

### Frontend: Formulario de Registro

**Archivo:** `src/login/new-auth.html` (líneas 125-250 aprox.)

**Campos del Formulario:**
```html
<form id="registerFormElement">
  <input type="text" id="firstName" name="first_name" required>
  <input type="text" id="lastName" name="last_name" required>
  <input type="text" id="username" name="username" required>
  <input type="email" id="email" name="email" required>
  <input type="email" id="confirmEmail" name="confirm_email" required>
  <input type="tel" id="phone" name="phone">
  <input type="password" id="password" name="password" required>
  <input type="password" id="confirmPassword" name="confirm_password" required>
  <input type="checkbox" id="terms" name="terms" required>
</form>
```

### Validaciones Frontend

**Función:** `validateRegisterForm()` en `new-auth.js`

**Validaciones Implementadas:**

1. **Nombres (first_name, last_name):**
   ```javascript
   const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
   if (!nameRegex.test(firstName)) {
     return { valid: false, error: 'Solo letras y espacios' };
   }
   ```

2. **Username:**
   ```javascript
   const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
   // Mínimo 3 caracteres, solo alfanuméricos y guion bajo
   ```

3. **Email:**
   ```javascript
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   if (email !== confirmEmail) {
     return { valid: false, error: 'Emails no coinciden' };
   }
   ```

4. **Teléfono (México):**
   ```javascript
   const phoneClean = phone.replace(/\D/g, '');
   if (phoneClean.length !== 10) {
     return { valid: false, error: 'Debe tener 10 dígitos' };
   }
   ```

5. **Password:**
   ```javascript
   if (password.length < 8) {
     return { valid: false, error: 'Mínimo 8 caracteres' };
   }
   if (!/[a-z]/.test(password)) {
     return { valid: false, error: 'Requiere minúscula' };
   }
   if (!/\d/.test(password)) {
     return { valid: false, error: 'Requiere número' };
   }
   if (password !== confirmPassword) {
     return { valid: false, error: 'Contraseñas no coinciden' };
   }
   ```

6. **Términos y Condiciones:**
   ```javascript
   if (!termsCheckbox.checked) {
     return { valid: false, error: 'Debes aceptar términos' };
   }
   ```

### Backend: Endpoint de Registro

**Archivo:** `netlify/functions/register.js` (150 líneas)

**API Endpoint:** `POST /api/register`

**Flujo Completo:**

```javascript
// 1. VALIDAR DATOS DE ENTRADA
const { first_name, last_name, username, email, password } = JSON.parse(event.body);

if (!first_name || !last_name || !username || !email || !password) {
  return json(400, { error: 'Campos requeridos faltantes' });
}

if (password.length < 8) {
  return json(400, { error: 'Contraseña debe tener mínimo 8 caracteres' });
}

// 2. VERIFICAR EXISTENCIA DE USUARIO
const { data: existingUser } = await supabase
  .from('users')
  .select('id, email, username')
  .or(`email.eq.${email.toLowerCase()},username.eq.${username}`)
  .single();

if (existingUser) {
  return json(409, {
    error: existingUser.email === email.toLowerCase()
      ? 'Email ya registrado'
      : 'Username ya existe'
  });
}

// 3. HASH DE PASSWORD
const saltRounds = 10;
const passwordHash = await bcrypt.hash(password, saltRounds);

// 4. DETECTAR COLUMNAS DISPONIBLES (Flexibilidad de schema)
const { data: columns } = await supabase.rpc('get_table_columns', {
  table_name: 'users'
});

const availableColumns = columns.map(c => c.column_name);

// 5. CONSTRUIR QUERY DINÁMICAMENTE
let insertData = {
  username: username.toLowerCase(),
  email: email.toLowerCase(),
  password_hash: passwordHash
};

// Agregar campos opcionales si existen en el schema
if (availableColumns.includes('first_name')) {
  insertData.first_name = first_name;
}
if (availableColumns.includes('last_name')) {
  insertData.last_name = last_name;
}
if (availableColumns.includes('display_name')) {
  insertData.display_name = `${first_name} ${last_name}`;
}
if (availableColumns.includes('cargo_rol')) {
  insertData.cargo_rol = 'usuario';
}
if (availableColumns.includes('type_rol')) {
  insertData.type_rol = null; // Para usuarios nuevos
}

// 6. INSERTAR USUARIO
const { data: newUser, error: insertError } = await supabase
  .from('users')
  .insert(insertData)
  .select()
  .single();

if (insertError) {
  console.error('Error insertando usuario:', insertError);
  return json(500, { error: 'Error creando cuenta' });
}

// 7. RETORNAR USUARIO CREADO
return json(200, {
  user: {
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    display_name: newUser.display_name,
    first_name: newUser.first_name,
    last_name: newUser.last_name
  }
});
```

**Códigos de Respuesta:**

| Código | Significado | Acción Frontend |
|--------|-------------|-----------------|
| 200 OK | Usuario creado exitosamente | Redirigir a verificación de email (si requerido) |
| 400 Bad Request | Validación fallida | Mostrar mensaje de error específico |
| 409 Conflict | Email/username ya existe | Mostrar mensaje "Ya registrado" |
| 500 Internal Server Error | Error del servidor | Mostrar mensaje genérico de error |

---

## Sistema de Login

### Frontend: Formulario de Login

**Archivo:** `src/login/new-auth.html` (líneas 80-120 aprox.)

**Campos del Formulario:**
```html
<form id="loginFormElement">
  <input type="text" id="emailOrUsername" name="emailOrUsername" required>
  <input type="password" id="password" name="password" required>
  <input type="checkbox" id="rememberMe" name="remember">
</form>
```

### Flujo de Login Frontend

**Función:** `handleLogin(e)` en `new-auth.js` (líneas 790-1000)

```javascript
async function handleLogin(e) {
  e.preventDefault();

  // 1. OBTENER DATOS DEL FORMULARIO
  const emailOrUsername = document.getElementById('emailOrUsername').value.trim();
  const password = document.getElementById('password').value;
  const remember = document.getElementById('rememberMe').checked;

  // 2. LIMPIAR DATOS PREVIOS
  clearPreviousAccountData();

  // 3. INTENTAR LOGIN CON SUPABASE (si está habilitado y es email)
  if (ENABLE_SUPABASE_AUTH && emailOrUsername.includes('@')) {
    try {
      const { data, error } = await window.supabase.auth.signInWithPassword({
        email: emailOrUsername,
        password: password
      });

      if (!error && data.session) {
        // Login exitoso con Supabase
        const token = data.session.access_token;
        const user = data.user;

        // Guardar en localStorage
        localStorage.setItem('userToken', token);
        localStorage.setItem('userData', JSON.stringify({
          id: user.id,
          email: user.email,
          display_name: user.user_metadata?.display_name || user.email
        }));

        // Crear sesión
        localStorage.setItem('userSession', JSON.stringify({
          sessionId: `session-${Date.now()}`,
          created: new Date().toISOString(),
          userId: user.id
        }));

        // Sincronizar datos
        ensureAuthDataSync();

        // Redirigir
        redirectUserByRole(user);
        return;
      }
    } catch (supabaseError) {
      console.warn('Supabase login falló, usando backend:', supabaseError);
      // Continuar con backend propio
    }
  }

  // 4. LOGIN CON BACKEND PROPIO (fallback o principal)
  try {
    const response = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: emailOrUsername,
        password: password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Manejar errores
      if (response.status === 401) {
        handleFailedLogin();
        showNotification('Credenciales inválidas', 'error');
      } else {
        showNotification(data.error || 'Error de login', 'error');
      }
      return;
    }

    // 5. VERIFICAR SI REQUIERE VERIFICACIÓN DE EMAIL
    if (data.requiresVerification) {
      localStorage.setItem('pendingVerification', JSON.stringify({
        email: data.email,
        userId: data.userId
      }));
      window.location.href = 'email-verification.html';
      return;
    }

    // 6. GUARDAR TOKEN Y DATOS DE USUARIO
    const user = data.user;

    // Token
    if (data.token) {
      localStorage.setItem('userToken', data.token);
      localStorage.setItem('authToken', data.token);
    }

    // Datos de usuario
    localStorage.setItem('userData', JSON.stringify(user));
    localStorage.setItem('currentUser', JSON.stringify(user));

    // Sesión
    localStorage.setItem('userSession', JSON.stringify({
      sessionId: `session-${Date.now()}`,
      created: new Date().toISOString(),
      userId: user.id || user.username
    }));

    // 7. "RECORDARME" (si está marcado)
    if (remember) {
      localStorage.setItem('rememberedEmailOrUsername', emailOrUsername);

      // Ofuscar password (XOR + Base64)
      const obfuscatedPassword = obfuscatePassword(password);
      localStorage.setItem('rememberedPassword', obfuscatedPassword);
      localStorage.setItem('rememberedTime', Date.now().toString());
    } else {
      // Limpiar remembered credentials
      localStorage.removeItem('rememberedEmailOrUsername');
      localStorage.removeItem('rememberedPassword');
      localStorage.removeItem('rememberedTime');
    }

    // 8. SINCRONIZAR DATOS ENTRE FUENTES
    ensureAuthDataSync();

    // 9. MOSTRAR MENSAJE DE ÉXITO
    showNotification('Inicio de sesión exitoso', 'success');

    // 10. REDIRIGIR SEGÚN ROL
    setTimeout(() => {
      redirectUserByRole(user);
    }, 500);

  } catch (error) {
    console.error('Error en login:', error);
    showNotification('Error de conexión', 'error');
  }
}
```

### Backend: Endpoint de Login

**Archivo:** `netlify/functions/login.js` (127 líneas)

**API Endpoint:** `POST /api/login`

```javascript
exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Método no permitido' });
  }

  try {
    const { username, password, googleId } = JSON.parse(event.body || '{}');

    // 1. VALIDAR ENTRADA
    if (!username || !password) {
      return json(400, { error: 'Username y password requeridos' });
    }

    // 2. CONFIGURAR SUPABASE
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 3. BUSCAR USUARIO POR EMAIL O USERNAME
    const { data: users, error: queryError } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${username.toLowerCase()},username.eq.${username.toLowerCase()}`)
      .limit(1);

    if (queryError || !users || users.length === 0) {
      return json(401, { error: 'Credenciales inválidas' });
    }

    const user = users[0];

    // 4. VERIFICAR PASSWORD
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return json(401, { error: 'Credenciales inválidas' });
    }

    // 5. VERIFICAR SI ES PRIMER LOGIN
    const isNewUser = !user.last_login_at;

    // 6. ACTUALIZAR LAST_LOGIN_AT
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    // 7. PREPARAR RESPUESTA
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name || user.username,
      profile_picture_url: user.profile_picture_url,
      isNewUser: isNewUser
    };

    // Incluir campos opcionales si existen
    if (user.cargo_rol) userResponse.cargo_rol = user.cargo_rol;
    if (user.type_rol) userResponse.type_rol = user.type_rol;
    if (user.google_id) userResponse.google_id = user.google_id;
    if (user.auth_provider) userResponse.auth_provider = user.auth_provider;

    // 8. RETORNAR USUARIO
    return json(200, {
      ok: true,
      user: userResponse
    });

  } catch (error) {
    console.error('Error en login:', error);
    return json(500, { error: 'Error interno del servidor' });
  }
};
```

### Función "Recordarme"

**Ofuscación de Password:**

```javascript
// OFUSCAR PASSWORD
function obfuscatePassword(password) {
  const key = 'some-static-key-here'; // Clave estática
  let obfuscated = '';

  for (let i = 0; i < password.length; i++) {
    obfuscated += String.fromCharCode(
      password.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }

  return btoa(obfuscated); // Base64 encode
}

// DESOFUSCAR PASSWORD
function deobfuscatePassword(obfuscated) {
  const key = 'some-static-key-here';
  const decoded = atob(obfuscated); // Base64 decode
  let password = '';

  for (let i = 0; i < decoded.length; i++) {
    password += String.fromCharCode(
      decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }

  return password;
}
```

**⚠️ IMPORTANTE:** Esta es ofuscación simple, NO encriptación real. No es segura contra ataques determinados.

**Expiración de Credenciales Recordadas:**

```javascript
// Al cargar la página
const rememberedTime = localStorage.getItem('rememberedTime');
if (rememberedTime) {
  const daysSince = (Date.now() - parseInt(rememberedTime)) / (1000 * 60 * 60 * 24);

  if (daysSince > 30) {
    // Expirar credenciales después de 30 días
    localStorage.removeItem('rememberedEmailOrUsername');
    localStorage.removeItem('rememberedPassword');
    localStorage.removeItem('rememberedTime');
  } else {
    // Auto-rellenar formulario
    const emailOrUsername = localStorage.getItem('rememberedEmailOrUsername');
    const obfuscatedPassword = localStorage.getItem('rememberedPassword');

    document.getElementById('emailOrUsername').value = emailOrUsername;
    document.getElementById('password').value = deobfuscatePassword(obfuscatedPassword);
    document.getElementById('rememberMe').checked = true;
  }
}
```

---

## Sistema de Recuperación de Contraseña

Este es el sistema más importante para la refactorización. Se documenta en detalle completo.

### 🔄 Flujo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE RECUPERACIÓN                         │
└─────────────────────────────────────────────────────────────────┘

1. Usuario click "¿Olvidaste tu contraseña?"
   ↓
2. Modal de recuperación se abre
   └─ Input: email
   └─ Botón: "Enviar enlace de recuperación"
   ↓
3. handleForgotPassword() - Frontend
   ├─ Validar formato email
   ├─ Intentar Supabase (si habilitado)
   │  └─ supabase.auth.resetPasswordForEmail()
   └─ Fallback: POST /api/forgot-password
   ↓
4. forgot-password.js - Backend
   ├─ Rate limiting check (3 intentos / 15 min)
   ├─ Buscar usuario por email
   ├─ Intentar Supabase resetPasswordForEmail()
   └─ Fallback: Sistema propio de tokens
       ├─ Generar token aleatorio (crypto.randomBytes(32))
       ├─ Guardar en tabla password_reset_tokens
       │   └─ Expiración: 1 hora
       └─ Enviar email con enlace
   ↓
5. Email enviado con enlace
   └─ URL: /login/reset-password.html?token=abc123...
   ↓
6. Usuario click enlace en email
   ↓
7. reset-password.html carga
   ├─ Extraer token de URL
   ├─ Mostrar formulario nueva contraseña
   └─ Validación strength en tiempo real
   ↓
8. Usuario ingresa nueva contraseña
   └─ Validaciones:
       ├─ Mínimo 8 caracteres
       ├─ 1 mayúscula
       ├─ 1 minúscula
       ├─ 1 número
       └─ Coincidencia confirmación
   ↓
9. Submit formulario → POST /api/reset-password
   ↓
10. reset-password.js - Backend
    ├─ Rate limiting check (5 intentos / 15 min)
    ├─ Validar token existe y no expirado
    ├─ Hash nueva password (bcrypt, 12 rounds)
    ├─ UPDATE users SET password_hash
    ├─ DELETE token usado
    └─ Invalidar sesiones activas (opcional)
   ↓
11. Mensaje de éxito
    └─ Redirect a login
```

### Frontend: Modal "Olvidé mi Contraseña"

**Archivo:** `src/login/new-auth.html` (líneas 495-547)

**HTML del Modal:**

```html
<!-- Modal de Recuperación de Contraseña -->
<div id="forgotPasswordModal" class="terms-modal">
  <div class="terms-modal-content forgot-password-modal">
    <!-- Header -->
    <div class="terms-card-header">
      <svg class="header-icon" width="24" height="24">...</svg>
      <h3 id="forgotTitle">Recuperar Contraseña</h3>
    </div>
    <button class="terms-close" type="button" onclick="closeForgotPasswordModal()">
      <svg>...</svg>
    </button>

    <!-- Contenido -->
    <div class="terms-card-content forgot-password-content">
      <form id="forgotPasswordForm" onsubmit="handleForgotPassword(event)">
        <div class="forgot-password-info">
          <p>Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
        </div>

        <div class="form-group">
          <label for="forgotPasswordEmail">Correo electrónico</label>
          <div class="input-wrapper">
            <input
              type="email"
              id="forgotPasswordEmail"
              name="email"
              required
              placeholder="tu@email.com">
            <svg class="input-icon">...</svg>
          </div>
        </div>

        <button type="submit" class="btn-primary" id="forgotPasswordSubmit">
          <span class="btn-text">Enviar enlace de recuperación</span>
          <span class="btn-loader" style="display: none;">
            <span class="spinner"></span>
          </span>
        </button>
      </form>
    </div>

    <!-- Footer -->
    <div class="terms-card-footer">
      <button class="btn-terms-close" onclick="closeForgotPasswordModal()">
        <span>Cancelar</span>
      </button>
    </div>
  </div>
</div>
```

**JavaScript del Modal:**

```javascript
// ABRIR MODAL
function openForgotPasswordModal() {
  const modal = document.getElementById('forgotPasswordModal');
  if (modal) {
    modal.classList.add('active');
    // Enfocar input de email
    setTimeout(() => {
      const emailInput = document.getElementById('forgotPasswordEmail');
      if (emailInput) emailInput.focus();
    }, 100);
  }
}

// CERRAR MODAL
function closeForgotPasswordModal() {
  const modal = document.getElementById('forgotPasswordModal');
  if (modal) {
    modal.classList.remove('active');
    // Limpiar formulario
    const form = document.getElementById('forgotPasswordForm');
    if (form) form.reset();
  }
}

// ESTADO DE CARGA
function setForgotPasswordLoadingState(isLoading) {
  const submitBtn = document.getElementById('forgotPasswordSubmit');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoader = submitBtn.querySelector('.btn-loader');

  submitBtn.disabled = isLoading;
  btnText.style.display = isLoading ? 'none' : 'block';
  btnLoader.style.display = isLoading ? 'flex' : 'none';
}
```

### Frontend: Handler de Solicitud

**Función:** `handleForgotPassword(e)` en `new-auth.js` (líneas 2695-2850 aprox.)

```javascript
async function handleForgotPassword(e) {
  e.preventDefault();

  // 1. OBTENER EMAIL DEL INPUT
  let emailInput = document.getElementById('forgotPasswordEmail');
  let email = emailInput ? emailInput.value.trim() : '';

  // Input de emergencia (si existe)
  if (!email) {
    const emergencyInput = document.getElementById('emergencyEmailInput');
    if (emergencyInput) {
      email = emergencyInput.value.trim();
    }
  }

  // 2. VALIDAR EMAIL
  if (!email) {
    showNotification('Por favor ingresa tu correo electrónico', 'error');
    return;
  }

  if (!validateEmail(email)) {
    showNotification('Por favor ingresa un correo electrónico válido', 'error');
    return;
  }

  // 3. ACTIVAR ESTADO DE CARGA
  setForgotPasswordLoadingState(true);

  try {
    // 4. INTENTAR CON SUPABASE (si está habilitado)
    if (ENABLE_SUPABASE_AUTH && window.supabase) {
      try {
        // Verificar si usuario existe
        const { data: userData, error: userError } = await window.supabase
          .from('users')
          .select('id, email')
          .eq('email', email.toLowerCase())
          .single();

        if (!userError && userData) {
          // Usuario existe, intentar Supabase Auth
          const redirectUrl = `${window.location.protocol}//${window.location.host}/src/login/reset-password.html`;

          const { data, error } = await window.supabase.auth.resetPasswordForEmail(
            email,
            { redirectTo: redirectUrl }
          );

          if (!error) {
            showNotification('Se ha enviado un enlace de recuperación a tu correo', 'success');
            closeForgotPasswordModal();
            setForgotPasswordLoadingState(false);
            return;
          } else {
            // Detectar si Email Provider está deshabilitado
            const isEmailLoginsDisabled = error.message && (
              error.message.includes('Email logins are disabled') ||
              error.message.includes('Email login is disabled') ||
              error.message.includes('email provider is disabled')
            );

            if (isEmailLoginsDisabled) {
              console.log('ℹ️ Supabase Email Provider no habilitado, usando servidor propio...');
              // Continuar con backend propio
            } else {
              console.error('❌ Error de Supabase:', error);

              if (error.message.includes('SMTP') || error.message.includes('mail server')) {
                showNotification('Error: Servicio de email no configurado', 'error');
                setForgotPasswordLoadingState(false);
                return;
              }
            }
          }
        }
      } catch (supabaseError) {
        console.log('⚠️ Supabase no disponible, usando servidor propio...');
      }
    }

    // 5. USAR BACKEND PROPIO (fallback o método principal)
    console.log('📧 Enviando solicitud al servidor propio...');

    const response = await fetch(`${API_BASE}/api/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    });

    const data = await response.json();

    if (response.ok) {
      showNotification(
        data.message || 'Se ha enviado un enlace de recuperación a tu correo',
        'success'
      );
      closeForgotPasswordModal();
    } else {
      // Manejar errores específicos
      if (response.status === 429) {
        showNotification('Demasiados intentos. Intenta más tarde.', 'error');
      } else {
        showNotification(data.error || 'Error al enviar email', 'error');
      }
    }

  } catch (error) {
    console.error('❌ Error en forgot password:', error);
    showNotification('Error de conexión. Inténtalo más tarde.', 'error');
  } finally {
    setForgotPasswordLoadingState(false);
  }
}
```

### Backend: Endpoint Forgot Password

**Archivo:** `netlify/functions/forgot-password.js` (247 líneas)

**API Endpoint:** `POST /api/forgot-password`

**Código Completo con Comentarios:**

```javascript
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const emailService = require('../../src/utils/email-service');

// CONFIGURACIÓN CORS
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// FUNCIÓN JSON HELPER
function json(statusCode, body, event) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...cors
    },
    body: JSON.stringify(body)
  };
}

// RATE LIMITING EN MEMORIA
const attempts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos
const MAX_ATTEMPTS = 3; // Máximo 3 intentos por ventana

function isRateLimited(ip) {
  const now = Date.now();
  const userAttempts = attempts.get(ip) || [];

  // Limpiar intentos antiguos
  const recentAttempts = userAttempts.filter(
    time => now - time < RATE_LIMIT_WINDOW
  );
  attempts.set(ip, recentAttempts);

  return recentAttempts.length >= MAX_ATTEMPTS;
}

function recordAttempt(ip) {
  const now = Date.now();
  const userAttempts = attempts.get(ip) || [];
  userAttempts.push(now);
  attempts.set(ip, userAttempts);
}

// HANDLER PRINCIPAL
exports.handler = async (event, context) => {
  // MANEJAR PREFLIGHT CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: cors, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Método no permitido' }, event);
  }

  try {
    // 1. RATE LIMITING
    const clientIP = event.headers['x-forwarded-for'] ||
                     event.headers['x-real-ip'] ||
                     'unknown';

    if (isRateLimited(clientIP)) {
      return json(429, {
        error: 'Demasiados intentos de recuperación. Inténtalo más tarde.'
      }, event);
    }

    // 2. PARSEAR Y VALIDAR EMAIL
    const { email } = JSON.parse(event.body || '{}');

    if (!email) {
      recordAttempt(clientIP);
      return json(400, { error: 'Email es requerido' }, event);
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      recordAttempt(clientIP);
      return json(400, { error: 'Formato de email inválido' }, event);
    }

    // 3. CONFIGURAR SUPABASE
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Configuración de Supabase faltante');
      return json(500, { error: 'Error de configuración del servidor' }, event);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. VERIFICAR SI USUARIO EXISTE
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, username')
      .eq('email', email.toLowerCase())
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error verificando usuario:', userError);
      recordAttempt(clientIP);
      return json(500, { error: 'Error del servidor' }, event);
    }

    // 5. MENSAJE DE SEGURIDAD
    // Por seguridad, siempre retornar el mismo mensaje (no revelar si usuario existe)
    const successMessage = 'Si el correo está registrado, recibirás un enlace de recuperación';

    if (!userData) {
      // Usuario no existe, pero no lo revelamos
      recordAttempt(clientIP);
      return json(200, { message: successMessage }, event);
    }

    // 6. INTENTAR SUPABASE AUTH (si está configurado)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${event.headers.origin || 'https://coach-lia-ia.netlify.app'}/src/login/reset-password.html`
      });

      if (!resetError) {
        recordAttempt(clientIP);
        return json(200, {
          message: 'Se ha enviado un enlace de recuperación a tu correo electrónico'
        }, event);
      } else {
        // Detectar si Email Provider está deshabilitado
        const isEmailLoginsDisabled = resetError.message && (
          resetError.message.includes('Email logins are disabled') ||
          resetError.message.includes('Email login is disabled') ||
          resetError.message.includes('email provider is disabled')
        );

        if (isEmailLoginsDisabled) {
          console.log('ℹ️ Supabase Email Provider no habilitado, usando sistema propio...');
        } else {
          console.warn('Error Supabase reset password:', resetError.message);
        }
      }
    } catch (supabaseError) {
      const isExpectedError = supabaseError.message && (
        supabaseError.message.includes('Email logins are disabled') ||
        supabaseError.message.includes('Email login is disabled') ||
        supabaseError.message.includes('email provider is disabled')
      );

      if (isExpectedError) {
        console.log('ℹ️ Supabase Email Provider no configurado, usando sistema propio...');
      } else {
        console.warn('Error con Supabase Auth:', supabaseError.message);
      }
    }

    // 7. SISTEMA PROPIO DE TOKENS (fallback)

    // Generar token aleatorio seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    try {
      // Crear tabla si no existe (solo en desarrollo, en producción debe existir)
      const { error: tableError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS password_reset_tokens (
            email VARCHAR(255) PRIMARY KEY,
            token VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `
      });

      if (tableError) {
        console.warn('No se pudo crear tabla password_reset_tokens:', tableError.message);
      }

      // Guardar token en base de datos (upsert para permitir múltiples solicitudes)
      const { error: insertError } = await supabase
        .from('password_reset_tokens')
        .upsert({
          email: email.toLowerCase(),
          token: resetToken,
          expires_at: resetTokenExpiry.toISOString(),
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.warn('Error guardando token:', insertError.message);
      }
    } catch (tokenError) {
      console.warn('Error con tokens de recuperación:', tokenError.message);
    }

    // 8. ENVIAR EMAIL CON TOKEN
    try {
      if (emailService.isConfigured()) {
        console.log(`📧 Intentando enviar email de recuperación a ${email}...`);

        await emailService.sendPasswordResetEmail(
          email,
          resetToken,
          userData.username || email.split('@')[0]
        );

        console.log(`✅ Email de recuperación enviado exitosamente a ${email}`);
        recordAttempt(clientIP);

        return json(200, {
          message: 'Se ha enviado un enlace de recuperación a tu correo electrónico'
        }, event);
      } else {
        console.error('⚠️ Servicio de email no configurado - Verifica variables SMTP_*');

        // En modo desarrollo, log del token
        if (process.env.NODE_ENV !== 'production') {
          console.log(`🔐 [DEV MODE] Token de recuperación para ${email}: ${resetToken}`);
          console.log(`🔗 [DEV MODE] URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/src/login/reset-password.html?token=${resetToken}`);
        }

        recordAttempt(clientIP);
        return json(200, {
          message: 'Se ha enviado un enlace de recuperación a tu correo electrónico'
        }, event);
      }
    } catch (emailError) {
      console.error('❌ Error enviando email de recuperación:', emailError);

      // En modo desarrollo, mostrar el token
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🔐 [DEV MODE] Token de recuperación para ${email}: ${resetToken}`);
        console.log(`🔗 [DEV MODE] URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/src/login/reset-password.html?token=${resetToken}`);
      }

      // No revelar el error al usuario por seguridad
      recordAttempt(clientIP);
      return json(200, {
        message: 'Se ha enviado un enlace de recuperación a tu correo electrónico'
      }, event);
    }

  } catch (error) {
    console.error('Error en forgot-password:', error);
    return json(500, { error: 'Error interno del servidor' }, event);
  }
};
```

**Características Importantes:**

1. **Rate Limiting:** 3 intentos por 15 minutos por IP
2. **Seguridad:** Siempre retorna mismo mensaje (no revela si usuario existe)
3. **Doble Sistema:** Intenta Supabase Auth primero, fallback a tokens propios
4. **Tokens Seguros:** crypto.randomBytes(32) → 64 caracteres hexadecimales
5. **Expiración:** 1 hora para usar el token
6. **Modo Desarrollo:** Log del token en consola si email no configurado

### Servicio de Email

**Archivo:** `src/utils/email-service.js` (489 líneas)

**Configuración:**

```javascript
class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,      // ej: smtp.gmail.com
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,  // true para 465, false para otros puertos
        auth: {
          user: process.env.SMTP_USER,    // tu-email@gmail.com
          pass: process.env.SMTP_PASS     // password o app password
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      console.log('✅ Servicio de email inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando servicio de email:', error);
      this.transporter = null;
    }
  }

  isConfigured() {
    return !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      this.transporter
    );
  }
}
```

**Envío de Email de Recuperación:**

```javascript
async sendPasswordResetEmail(to, resetToken, username) {
  if (!this.transporter) {
    throw new Error('Servicio de email no configurado');
  }

  // Construir URL completa
  const frontendUrl = process.env.FRONTEND_URL || 'https://aprendeyaplica.ai';
  const resetUrl = `${frontendUrl}/login/reset-password.html?token=${resetToken}`;

  const subject = 'Recuperación de Contraseña - Aprende y Aplica IA';
  const htmlContent = this.generatePasswordResetEmailHTML(resetUrl, resetToken, username);

  try {
    const info = await this.transporter.sendMail({
      from: `"Aprende y Aplica IA" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent,
      text: this.generatePasswordResetEmailText(resetUrl, resetToken, username)
    });

    console.log('📧 Email de recuperación enviado:', {
      to: to,
      messageId: info.messageId,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      messageId: info.messageId,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error enviando email de recuperación:', error);
    throw new Error('Error enviando email de recuperación');
  }
}
```

**Template HTML del Email:**

```javascript
generatePasswordResetEmailHTML(resetUrl, resetToken, username) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperación de Contraseña</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          color: #44E5FF;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #44E5FF, #0077A6);
          color: white !important;
          padding: 15px 35px;
          text-decoration: none;
          border-radius: 25px;
          margin: 20px 0;
          font-weight: bold;
          font-size: 16px;
        }
        .token-code {
          background: #f8f9fa;
          border: 2px dashed #44E5FF;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          margin: 20px 0;
          word-break: break-all;
          color: #0077A6;
        }
        .warning {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 5px;
          padding: 15px;
          margin: 20px 0;
          color: #856404;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🔐 Aprende y Aplica IA</div>
          <h1>Recuperación de Contraseña</h1>
        </div>

        <p>Hola <strong>${username}</strong>,</p>

        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" class="button">
            🔓 Restablecer mi contraseña
          </a>
        </div>

        <p style="text-align: center; color: #666; font-size: 14px;">
          O copia y pega este enlace en tu navegador:
        </p>

        <div class="token-code">
          ${resetUrl}
        </div>

        <div class="warning">
          <strong>⚠️ Importante:</strong>
          <ul>
            <li>Este enlace expira en <strong>1 hora</strong></li>
            <li>Solo puedes usar este enlace una vez</li>
            <li>Si no solicitaste este cambio, ignora este email</li>
            <li>Tu contraseña actual permanece segura hasta que la cambies</li>
          </ul>
        </div>

        <p style="margin-top: 30px;">
          Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.
          Tu cuenta permanece segura.
        </p>

        <div class="footer">
          <p>Este es un email automático, por favor no respondas a este mensaje.</p>
          <p>Si tienes problemas, contacta a nuestro equipo de soporte.</p>
          <p>&copy; 2024 Aprende y Aplica IA. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
```

### Frontend: Página Reset Password

**Archivo:** `src/login/reset-password.html` (793 líneas)

**Características Principales:**

1. **Extracción de Token de URL**
2. **Validación de Contraseña en Tiempo Real**
3. **Indicador Visual de Fortaleza**
4. **Scrollbar Personalizado**
5. **Estados: Loading, Form, Success, Error**

**Estructura HTML:**

```html
<!DOCTYPE html>
<html lang="es" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer Contraseña - Coach LIA IA</title>
  <link rel="icon" type="image/svg+xml" href="../assets/favicon.svg">
  <link rel="stylesheet" href="new-auth.css">
  <!-- Estilos inline específicos -->
</head>
<body>
  <div class="reset-container">
    <div class="reset-card">
      <div class="reset-card-content">

        <!-- Estado 1: Loading -->
        <div id="loadingMessage" class="loading-message show">
          <div class="reset-icon">⏳</div>
          <h2>Verificando enlace...</h2>
          <p>Por favor espera mientras validamos tu solicitud</p>
        </div>

        <!-- Estado 2: Formulario -->
        <div id="resetFormContainer" class="reset-form">
          <div class="reset-header">
            <div class="reset-icon">🔐</div>
            <h1>Nueva Contraseña</h1>
            <p>Crea una contraseña segura para tu cuenta</p>
          </div>

          <form id="resetForm">
            <!-- Nueva Contraseña -->
            <div class="form-group">
              <label for="newPassword">Nueva contraseña</label>
              <div class="input-wrapper">
                <input
                  type="password"
                  id="newPassword"
                  name="password"
                  required
                  placeholder="Mínimo 8 caracteres"
                  minlength="8"
                  autocomplete="new-password">
                <button type="button" class="toggle-password" data-target="newPassword">
                  👁️
                </button>
              </div>

              <!-- Indicador de Fortaleza -->
              <div class="password-strength">
                <div class="strength-bar">
                  <div class="strength-fill" id="strengthFill"></div>
                </div>
                <span class="strength-text" id="strengthText">Ingresa una contraseña</span>
              </div>

              <!-- Requisitos -->
              <div class="strength-requirements">
                <div class="requirement" id="req-length">
                  <span class="requirement-icon">○</span>
                  <span>Al menos 8 caracteres</span>
                </div>
                <div class="requirement" id="req-upper">
                  <span class="requirement-icon">○</span>
                  <span>Una letra mayúscula</span>
                </div>
                <div class="requirement" id="req-lower">
                  <span class="requirement-icon">○</span>
                  <span>Una letra minúscula</span>
                </div>
                <div class="requirement" id="req-number">
                  <span class="requirement-icon">○</span>
                  <span>Un número</span>
                </div>
              </div>
            </div>

            <!-- Confirmar Contraseña -->
            <div class="form-group">
              <label for="confirmPassword">Confirmar contraseña</label>
              <div class="input-wrapper">
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  placeholder="Repite la contraseña"
                  autocomplete="new-password">
                <button type="button" class="toggle-password" data-target="confirmPassword">
                  👁️
                </button>
              </div>
              <div class="error-message" id="matchError">
                Las contraseñas no coinciden
              </div>
            </div>

            <button type="submit" class="btn-primary" id="resetSubmit" disabled>
              <span class="btn-text">Actualizar Contraseña</span>
              <span class="btn-loader" style="display: none;">
                <div class="spinner"></div>
              </span>
            </button>
          </form>
        </div>

        <!-- Estado 3: Éxito -->
        <div id="successMessage" class="success-message">
          <div class="success-icon">✓</div>
          <h2>¡Contraseña Actualizada!</h2>
          <p>Tu contraseña ha sido restablecida exitosamente</p>
          <a href="new-auth.html" class="back-link">Iniciar Sesión</a>
        </div>

        <!-- Estado 4: Error -->
        <div id="errorContainer" class="error-container">
          <div class="error-icon">✕</div>
          <h2>Enlace Inválido</h2>
          <p id="errorText">Este enlace ha expirado o no es válido</p>
          <a href="new-auth.html" class="back-link">Volver al Login</a>
        </div>

      </div>

      <!-- Scrollbar personalizado -->
      <div class="custom-scrollbar">
        <div class="custom-scrollbar-thumb" id="customScrollbarThumb"></div>
      </div>
    </div>
  </div>

  <script>
    // JavaScript inline (ver sección JavaScript)
  </script>
</body>
</html>
```

**JavaScript del Formulario:**

```javascript
// CONSTANTES
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : '';

// ELEMENTOS DOM
const elements = {
  loadingMessage: document.getElementById('loadingMessage'),
  resetFormContainer: document.getElementById('resetFormContainer'),
  successMessage: document.getElementById('successMessage'),
  errorContainer: document.getElementById('errorContainer'),
  resetForm: document.getElementById('resetForm'),
  newPassword: document.getElementById('newPassword'),
  confirmPassword: document.getElementById('confirmPassword'),
  strengthFill: document.getElementById('strengthFill'),
  strengthText: document.getElementById('strengthText'),
  matchError: document.getElementById('matchError'),
  submitBtn: document.getElementById('resetSubmit'),
  errorText: document.getElementById('errorText')
};

// EXTRAER TOKEN DE URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// VERIFICAR FORTALEZA DE CONTRASEÑA
function checkPasswordStrength(password) {
  const requirements = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password)
  };

  // Actualizar indicadores visuales
  document.getElementById('req-length').classList.toggle('met', requirements.length);
  document.getElementById('req-upper').classList.toggle('met', requirements.upper);
  document.getElementById('req-lower').classList.toggle('met', requirements.lower);
  document.getElementById('req-number').classList.toggle('met', requirements.number);

  // Actualizar iconos
  ['length', 'upper', 'lower', 'number'].forEach(req => {
    const icon = document.querySelector(`#req-${req} .requirement-icon`);
    icon.textContent = requirements[req] ? '✓' : '○';
  });

  // Calcular fortaleza
  const metCount = Object.values(requirements).filter(Boolean).length;

  let strength = 'weak';
  let text = 'Débil';

  if (metCount === 4) {
    strength = 'strong';
    text = 'Fuerte';
  } else if (metCount >= 2) {
    strength = 'medium';
    text = 'Media';
  }

  elements.strengthFill.className = `strength-fill ${strength}`;
  elements.strengthText.textContent = `Fortaleza: ${text}`;
  elements.strengthText.style.color =
    strength === 'strong' ? '#51cf66' :
    strength === 'medium' ? '#ffd93d' : '#ff6b6b';

  return metCount === 4;
}

// VERIFICAR COINCIDENCIA DE CONTRASEÑAS
function checkPasswordMatch() {
  const match = elements.newPassword.value === elements.confirmPassword.value;

  if (elements.confirmPassword.value.length > 0) {
    elements.confirmPassword.classList.toggle('error', !match);
    elements.matchError.classList.toggle('show', !match);
  } else {
    elements.confirmPassword.classList.remove('error');
    elements.matchError.classList.remove('show');
  }

  return match;
}

// HABILITAR/DESHABILITAR BOTÓN SUBMIT
function updateSubmitButton() {
  const passwordStrong = checkPasswordStrength(elements.newPassword.value);
  const passwordsMatch = checkPasswordMatch();
  const bothFilled = elements.newPassword.value && elements.confirmPassword.value;

  elements.submitBtn.disabled = !(passwordStrong && passwordsMatch && bothFilled);
}

// TOGGLE VISIBILIDAD DE CONTRASEÑA
document.querySelectorAll('.toggle-password').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-target');
    const input = document.getElementById(targetId);
    const isPassword = input.type === 'password';

    input.type = isPassword ? 'text' : 'password';
    // Cambiar icono...
  });
});

// EVENT LISTENERS
elements.newPassword.addEventListener('input', updateSubmitButton);
elements.confirmPassword.addEventListener('input', updateSubmitButton);

// SUBMIT FORMULARIO
elements.resetForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const newPassword = elements.newPassword.value;
  const confirmPassword = elements.confirmPassword.value;

  if (newPassword !== confirmPassword) {
    elements.matchError.classList.add('show');
    return;
  }

  // Mostrar loading
  elements.submitBtn.disabled = true;
  elements.submitBtn.querySelector('.btn-text').style.display = 'none';
  elements.submitBtn.querySelector('.btn-loader').style.display = 'block';

  try {
    const response = await fetch(`${API_BASE}/api/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });

    const data = await response.json();

    if (response.ok) {
      // ÉXITO - Mostrar mensaje de éxito
      elements.resetFormContainer.classList.remove('active');
      elements.successMessage.classList.add('show');
    } else {
      throw new Error(data.error || 'Error al actualizar contraseña');
    }
  } catch (error) {
    // ERROR - Restaurar botón y mostrar error
    elements.submitBtn.disabled = false;
    elements.submitBtn.querySelector('.btn-text').style.display = 'block';
    elements.submitBtn.querySelector('.btn-loader').style.display = 'none';

    alert(`Error: ${error.message}`);
  }
});

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
  if (!token) {
    // No hay token en URL
    elements.loadingMessage.classList.remove('show');
    elements.errorContainer.classList.add('show');
    elements.errorText.textContent = 'Enlace de recuperación no válido';
    return;
  }

  // Simular validación (en producción, validar con backend)
  setTimeout(() => {
    elements.loadingMessage.classList.remove('show');
    elements.resetFormContainer.classList.add('active');
  }, 800);
});
```

### Backend: Endpoint Reset Password

**Archivo:** `netlify/functions/reset-password.js` (199 líneas)

**API Endpoint:** `POST /api/reset-password`

**Código Completo:**

```javascript
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// CONFIGURACIÓN CORS
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...cors
    },
    body: JSON.stringify(body)
  };
}

// RATE LIMITING EN MEMORIA
const attempts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos
const MAX_ATTEMPTS = 5; // Máximo 5 intentos

function isRateLimited(ip) {
  const now = Date.now();
  const userAttempts = attempts.get(ip) || [];
  const recentAttempts = userAttempts.filter(
    time => now - time < RATE_LIMIT_WINDOW
  );
  attempts.set(ip, recentAttempts);
  return recentAttempts.length >= MAX_ATTEMPTS;
}

function recordAttempt(ip) {
  const now = Date.now();
  const userAttempts = attempts.get(ip) || [];
  userAttempts.push(now);
  attempts.set(ip, userAttempts);
}

// HANDLER PRINCIPAL
exports.handler = async (event, context) => {
  // PREFLIGHT CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: cors, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Método no permitido' });
  }

  try {
    // 1. RATE LIMITING
    const clientIP = event.headers['x-forwarded-for'] ||
                     event.headers['x-real-ip'] ||
                     'unknown';

    if (isRateLimited(clientIP)) {
      return json(429, {
        error: 'Demasiados intentos. Inténtalo más tarde.'
      });
    }

    // 2. PARSEAR Y VALIDAR DATOS
    const { token, newPassword } = JSON.parse(event.body || '{}');

    if (!token || !newPassword) {
      recordAttempt(clientIP);
      return json(400, {
        error: 'Token y nueva contraseña son requeridos'
      });
    }

    if (newPassword.length < 8) {
      recordAttempt(clientIP);
      return json(400, {
        error: 'La contraseña debe tener al menos 8 caracteres'
      });
    }

    // 3. VALIDAR FORTALEZA DE CONTRASEÑA
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      recordAttempt(clientIP);
      return json(400, {
        error: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
      });
    }

    // 4. CONFIGURAR SUPABASE
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Configuración de Supabase faltante');
      return json(500, { error: 'Error de configuración del servidor' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 5. VERIFICAR TOKEN EN BASE DE DATOS
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('email, expires_at, created_at')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      console.warn('Token no encontrado o error:', tokenError?.message);
      recordAttempt(clientIP);
      return json(400, { error: 'Token inválido o expirado' });
    }

    // 6. VERIFICAR EXPIRACIÓN DEL TOKEN
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);

    if (expiresAt < now) {
      // Token expirado - Eliminar de base de datos
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('token', token);

      recordAttempt(clientIP);
      return json(400, {
        error: 'Token expirado. Solicita un nuevo enlace de recuperación.'
      });
    }

    // 7. VERIFICAR QUE USUARIO EXISTE
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', tokenData.email.toLowerCase())
      .single();

    if (userError || !userData) {
      console.error('Usuario no encontrado:', tokenData.email);
      recordAttempt(clientIP);
      return json(400, { error: 'Usuario no encontrado' });
    }

    // 8. GENERAR HASH DE NUEVA CONTRASEÑA
    const saltRounds = 12; // Mayor seguridad que register (10 rounds)
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // 9. ACTUALIZAR CONTRASEÑA EN BASE DE DATOS
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('email', tokenData.email.toLowerCase());

    if (updateError) {
      console.error('Error actualizando contraseña:', updateError);
      recordAttempt(clientIP);
      return json(500, { error: 'Error actualizando contraseña' });
    }

    // 10. ELIMINAR TOKEN USADO
    // Seguridad: Un token solo se puede usar una vez
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('token', token);

    // 11. OPCIONAL: INVALIDAR SESIONES ACTIVAS
    // Esto fuerza al usuario a iniciar sesión nuevamente
    try {
      await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userData.id);
    } catch (sessionError) {
      // No es crítico si falla, solo log
      console.warn('No se pudieron invalidar sesiones:', sessionError.message);
    }

    console.log(`✅ Contraseña actualizada exitosamente para ${tokenData.email}`);

    // 12. RETORNAR ÉXITO
    recordAttempt(clientIP);
    return json(200, {
      success: true,
      message: 'Contraseña actualizada correctamente. Ahora puedes iniciar sesión con tu nueva contraseña.'
    });

  } catch (error) {
    console.error('❌ Error en reset-password:', error);
    return json(500, {
      error: 'Error interno del servidor. Inténtalo más tarde.'
    });
  }
};
```

**Características Importantes:**

1. **Rate Limiting:** 5 intentos por 15 minutos (más permisivo que forgot-password)
2. **Validación Completa:** Longitud + mayúscula + minúscula + número
3. **Bcrypt Rounds:** 12 rounds (más seguro que registro que usa 10)
4. **Token de Un Solo Uso:** Se elimina después de usarse
5. **Invalidación de Sesiones:** Opcional, fuerza re-login
6. **Manejo de Expiración:** Limpia tokens expirados automáticamente

---

## Sistema OTP (One-Time Password)

Sistema opcional para verificación de email durante registro.

**Archivo:** `src/utils/otp-service.js` (305 líneas)

### Características del Sistema OTP

1. **Generación de Código:** 6 dígitos aleatorios seguros
2. **Almacenamiento:** Hash bcrypt (12 rounds)
3. **Expiración:** 15 minutos
4. **Límite de Intentos:** 5 intentos fallidos máximo
5. **Rate Limiting:** Máximo 3 códigos nuevos por 15 minutos

### Clase OTPService

```javascript
class OTPService {
  constructor() {
    this.rateLimitWindow = 15 * 60 * 1000; // 15 minutos
    this.maxAttempts = 5; // Máximo 5 intentos
    this.maxResends = 3; // Máximo 3 reenvíos
    this.otpExpiration = 15 * 60 * 1000; // 15 minutos
  }

  // GENERAR CÓDIGO OTP
  generateOTP() {
    // Usar crypto.randomInt para mayor seguridad
    return crypto.randomInt(100000, 999999).toString();
  }

  // HASH DEL OTP
  async hashOTP(otp) {
    const saltRounds = 12;
    return await bcrypt.hash(otp, saltRounds);
  }

  // VERIFICAR OTP
  async verifyOTP(otp, hash) {
    return await bcrypt.compare(otp, hash);
  }

  // CREAR OTP EN BASE DE DATOS
  async createOTP(pool, userId, purpose = 'verify_email') {
    const otp = this.generateOTP();
    const hash = await this.hashOTP(otp);
    const expiresAt = new Date(Date.now() + this.otpExpiration);

    try {
      // Limpiar OTPs expirados
      await this.cleanExpiredOTPs(pool, userId, purpose);

      // Verificar rate limiting
      const canCreate = await this.checkRateLimit(pool, userId, purpose);
      if (!canCreate) {
        throw new Error('Demasiados intentos. Espera 15 minutos.');
      }

      // Insertar nuevo OTP
      const query = `
        INSERT INTO email_otp (user_id, purpose, code_hash, expires_at, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, created_at, expires_at
      `;

      const result = await pool.query(query, [userId, purpose, hash, expiresAt]);

      return {
        success: true,
        otpId: result.rows[0].id,
        expiresAt: expiresAt,
        otp: otp // Solo retornar para envío inmediato
      };
    } catch (error) {
      console.error('❌ Error creando OTP:', error);
      throw error;
    }
  }

  // VERIFICAR OTP
  async verifyOTP(pool, userId, otp, purpose = 'verify_email') {
    try {
      // Buscar OTP válido y no usado
      const query = `
        SELECT id, code_hash, expires_at, used_at, attempts
        FROM email_otp
        WHERE user_id = $1
        AND purpose = $2
        AND used_at IS NULL
        AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const result = await pool.query(query, [userId, purpose]);

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Código no encontrado o expirado'
        };
      }

      const otpRecord = result.rows[0];

      // Verificar intentos máximos
      if (otpRecord.attempts >= this.maxAttempts) {
        return {
          success: false,
          error: 'Demasiados intentos fallidos. Solicita un nuevo código.'
        };
      }

      // Verificar si el código coincide
      const isValid = await this.verifyOTP(otp, otpRecord.code_hash);

      if (!isValid) {
        // Incrementar contador de intentos
        await this.incrementAttempts(pool, otpRecord.id);
        return {
          success: false,
          error: 'Código incorrecto'
        };
      }

      // Marcar como usado
      await this.markAsUsed(pool, otpRecord.id);

      return {
        success: true,
        message: 'Código verificado correctamente'
      };

    } catch (error) {
      console.error('❌ Error verificando OTP:', error);
      return {
        success: false,
        error: 'Error interno verificando código'
      };
    }
  }

  // INCREMENTAR INTENTOS FALLIDOS
  async incrementAttempts(pool, otpId) {
    const query = `
      UPDATE email_otp
      SET attempts = attempts + 1
      WHERE id = $1
    `;
    await pool.query(query, [otpId]);
  }

  // MARCAR COMO USADO
  async markAsUsed(pool, otpId) {
    const query = `
      UPDATE email_otp
      SET used_at = NOW()
      WHERE id = $1
    `;
    await pool.query(query, [otpId]);
  }

  // LIMPIAR OTPS EXPIRADOS
  async cleanExpiredOTPs(pool, userId, purpose) {
    const query = `
      DELETE FROM email_otp
      WHERE user_id = $1
      AND purpose = $2
      AND expires_at <= NOW()
    `;
    await pool.query(query, [userId, purpose]);
  }

  // VERIFICAR RATE LIMITING
  async checkRateLimit(pool, userId, purpose) {
    const windowStart = new Date(Date.now() - this.rateLimitWindow);

    const query = `
      SELECT COUNT(*) as count
      FROM email_otp
      WHERE user_id = $1
      AND purpose = $2
      AND created_at >= $3
    `;

    const result = await pool.query(query, [userId, purpose, windowStart]);
    const count = parseInt(result.rows[0].count);

    return count < this.maxResends;
  }
}

module.exports = new OTPService();
```

---

## Gestión de Sesiones y Tokens

### LocalStorage Keys

**Datos de Autenticación:**
```javascript
// Tokens
'userToken'          // JWT token principal
'authToken'          // Backup/compatibilidad

// Datos de usuario
'userData'           // Objeto user principal
'currentUser'        // Copia de compatibilidad

// Sesión
'userSession'        // Metadata de sesión

// Credenciales recordadas
'rememberedEmailOrUsername'
'rememberedPassword'  // Ofuscado (XOR + Base64)
'rememberedTime'      // Timestamp

// Rate limiting local
'loginAttempts'       // Contador intentos fallidos
'lockoutEndTime'      // Timestamp fin de bloqueo

// Configuración
'supabaseUrl'
'supabaseAnonKey'
```

### Estructura userSession

```javascript
{
  sessionId: "session-1234567890",
  created: "2024-01-15T10:30:00Z",
  userId: "user-id-or-username"
}
```

### Sincronización Multi-Fuente

**Archivo:** `src/utils/auth-utils.js` (300 líneas)

**5 Fuentes de Autenticación:**

1. **localStorage** - Principal
2. **sessionStorage** - Secundario
3. **Variables globales** - window.currentUser, window.user
4. **Supabase** - window.supabase.auth.getSession()
5. **Backend** - /api/user/auth-session

**Función de Sincronización:**

```javascript
function ensureAuthDataSync() {
  const user = getCurrentAuthenticatedUser();

  if (!user) {
    console.warn('No hay usuario autenticado para sincronizar');
    return;
  }

  // Sincronizar a localStorage
  localStorage.setItem('userData', JSON.stringify(user));
  localStorage.setItem('currentUser', JSON.stringify(user));

  // Sincronizar a sessionStorage
  sessionStorage.setItem('userData', JSON.stringify(user));
  sessionStorage.setItem('currentUser', JSON.stringify(user));

  // Sincronizar a variables globales
  window.currentUser = user;
  window.user = user;

  console.log('✅ Datos de usuario sincronizados en todas las fuentes');
}

function getCurrentAuthenticatedUser() {
  // PRIORIDAD 1: localStorage
  let userData = localStorage.getItem('userData') || localStorage.getItem('currentUser');
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (e) {
      console.error('Error parsing userData from localStorage');
    }
  }

  // PRIORIDAD 2: sessionStorage
  userData = sessionStorage.getItem('userData') || sessionStorage.getItem('currentUser');
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (e) {
      console.error('Error parsing userData from sessionStorage');
    }
  }

  // PRIORIDAD 3: Variables globales
  if (window.currentUser) return window.currentUser;
  if (window.user) return window.user;

  // PRIORIDAD 4: Supabase
  if (window.supabase) {
    try {
      const { data: { session } } = await window.supabase.auth.getSession();
      if (session && session.user) {
        return {
          id: session.user.id,
          email: session.user.email,
          display_name: session.user.user_metadata?.display_name || session.user.email,
          ...session.user
        };
      }
    } catch (error) {
      console.error('Error getting Supabase session');
    }
  }

  // PRIORIDAD 5: Backend
  // (Requiere llamada async, generalmente no se usa en sync)

  return null;
}
```

### JWT Token Structure

**Generación (auth-issue.js):**

```javascript
const jwt = require('jsonwebtoken');

const payload = {
  sub: userId,      // Subject (user ID)
  username: username,
  iat: Math.floor(Date.now() / 1000),  // Issued at
  exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)  // Expiration (7 días)
};

const token = jwt.sign(payload, process.env.JWT_SECRET);
```

**Validación:**

```javascript
// Parsear JWT manualmente (no requiere librería en cliente)
function parseJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = parseJWT(token);
  if (!payload || !payload.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}
```

---

## Base de Datos

### Tabla: users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,

  -- Información personal
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  display_name VARCHAR(255),
  profile_picture_url TEXT,

  -- Roles y permisos
  cargo_rol VARCHAR(50) DEFAULT 'usuario',
  type_rol VARCHAR(50),  -- NULL para nuevos usuarios

  -- Autenticación
  auth_provider VARCHAR(50) DEFAULT 'email',
  google_id VARCHAR(255),

  -- Verificación
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

-- Índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_google_id ON users(google_id);
```

### Tabla: password_reset_tokens

```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Opcional: permitir múltiples tokens activos o solo uno
  CONSTRAINT unique_email_token UNIQUE (email)
);

-- Índices
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);
```

### Tabla: email_otp (Opcional)

```sql
CREATE TABLE email_otp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose VARCHAR(50) NOT NULL,  -- 'verify_email', 'reset_password'
  code_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_email_otp_user_id ON email_otp(user_id);
CREATE INDEX idx_email_otp_purpose ON email_otp(purpose);
CREATE INDEX idx_email_otp_expires ON email_otp(expires_at);
```

### Tabla: user_sessions (Opcional)

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
```

---

## Variables de Entorno

### Variables Requeridas

```bash
# ============================================
# DATABASE
# ============================================
DATABASE_URL=postgresql://user:password@host:5432/database

# ============================================
# SUPABASE (Opcional pero recomendado)
# ============================================
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...

# ============================================
# SECURITY & JWT
# ============================================
JWT_SECRET=tu-secret-key-super-seguro-minimo-32-caracteres
SESSION_SECRET=otro-secret-key-diferente-para-sesiones
API_SECRET_KEY=api-secret-para-endpoints-protegidos

# ============================================
# EMAIL SERVICE (SMTP)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-o-app-password

# Gmail App Password: https://myaccount.google.com/apppasswords
# Otros proveedores:
# - SendGrid: smtp.sendgrid.net (port 587)
# - Mailgun: smtp.mailgun.org (port 587)
# - AWS SES: email-smtp.region.amazonaws.com (port 587)

# ============================================
# FRONTEND URL
# ============================================
FRONTEND_URL=https://tudominio.com
# Desarrollo: http://localhost:3000

# ============================================
# ENVIRONMENT
# ============================================
NODE_ENV=production  # o 'development'

# ============================================
# GOOGLE OAUTH (Opcional)
# ============================================
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret
```

### Configuración Email Gmail

**Paso 1:** Habilitar verificación en 2 pasos
1. Ir a https://myaccount.google.com/security
2. Activar "Verificación en 2 pasos"

**Paso 2:** Crear App Password
1. Ir a https://myaccount.google.com/apppasswords
2. Seleccionar "Correo" y "Otro (nombre personalizado)"
3. Ingresar nombre: "NodeJS App"
4. Copiar el password de 16 caracteres
5. Usar ese password en `SMTP_PASS`

**Variables para Gmail:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # App Password (16 caracteres)
```

---

## Seguridad y Rate Limiting

### Rate Limiting Implementado

**forgot-password.js:**
- **Límite:** 3 intentos por 15 minutos
- **Basado en:** IP del cliente
- **Acción:** Retornar 429 Too Many Requests

**reset-password.js:**
- **Límite:** 5 intentos por 15 minutos
- **Basado en:** IP del cliente
- **Acción:** Retornar 429 Too Many Requests

**Login Frontend:**
- **Límite:** 3 intentos fallidos
- **Bloqueo:** 5 minutos
- **Storage:** localStorage
- **Acción:** Deshabilitar formulario y mostrar mensaje

**Código Rate Limiting:**

```javascript
// EN MEMORIA (Netlify Functions)
const attempts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const MAX_ATTEMPTS = 3;

function isRateLimited(ip) {
  const now = Date.now();
  const userAttempts = attempts.get(ip) || [];

  // Limpiar intentos antiguos
  const recentAttempts = userAttempts.filter(
    time => now - time < RATE_LIMIT_WINDOW
  );
  attempts.set(ip, recentAttempts);

  return recentAttempts.length >= MAX_ATTEMPTS;
}

function recordAttempt(ip) {
  const now = Date.now();
  const userAttempts = attempts.get(ip) || [];
  userAttempts.push(now);
  attempts.set(ip, userAttempts);
}
```

**NOTA:** Este rate limiting en memoria es básico. Para producción se recomienda:
- Redis para persistencia entre invocaciones
- Identificación por usuario + IP
- Rate limiting por endpoint

### Password Security

**Hash Algorithm:** bcrypt

**Salt Rounds:**
- **Registro:** 10 rounds
- **Reset Password:** 12 rounds (mayor seguridad)
- **OTP:** 12 rounds

**Validación de Fortaleza:**

```javascript
// Backend
function validatePasswordStrength(password) {
  if (password.length < 8) {
    return { valid: false, error: 'Mínimo 8 caracteres' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Requiere mayúscula' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Requiere minúscula' };
  }

  if (!/\d/.test(password)) {
    return { valid: false, error: 'Requiere número' };
  }

  return { valid: true };
}
```

### Token Security

**Password Reset Tokens:**
- **Generación:** crypto.randomBytes(32).toString('hex')
- **Longitud:** 64 caracteres hexadecimales
- **Entropía:** 256 bits
- **Expiración:** 1 hora
- **Un solo uso:** Se elimina después de usarse

**JWT Tokens:**
- **Algoritmo:** HS256 (HMAC SHA256)
- **Secret:** Mínimo 32 caracteres (recomendado 64+)
- **Expiración:** 7 días
- **Claims:** sub, username, iat, exp

**OTP Codes:**
- **Generación:** crypto.randomInt(100000, 999999)
- **Longitud:** 6 dígitos
- **Expiración:** 15 minutos
- **Intentos:** Máximo 5
- **Storage:** Hash bcrypt (no plaintext)

### CORS Configuration

```javascript
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// Manejar preflight OPTIONS
if (event.httpMethod === 'OPTIONS') {
  return {
    statusCode: 200,
    headers: cors,
    body: ''
  };
}
```

**IMPORTANTE:** En producción, cambiar `'*'` por el dominio específico:
```javascript
'Access-Control-Allow-Origin': 'https://tudominio.com'
```

### Input Validation

**Email:**
```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

**Username:**
```javascript
const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
```

**Phone (México):**
```javascript
const phoneClean = phone.replace(/\D/g, '');
if (phoneClean.length !== 10) {
  return { valid: false };
}
```

### Security Best Practices Implementadas

1. ✅ **Passwords hasheados** (bcrypt)
2. ✅ **Tokens aleatorios seguros** (crypto.randomBytes)
3. ✅ **Rate limiting** (IP-based)
4. ✅ **Expiración de tokens** (1 hora)
5. ✅ **Tokens de un solo uso** (eliminados después de usar)
6. ✅ **Validación de fortaleza de contraseña**
7. ✅ **No revelar existencia de usuarios** (mismo mensaje siempre)
8. ✅ **CORS configurado**
9. ✅ **Validación de entrada** (frontend y backend)
10. ✅ **HTTPS requerido en producción**

---

## Notas de Implementación

### Para la Refactorización

**Puntos Clave a Mantener:**

1. **Flujo Híbrido Supabase + Backend Propio**
   - Mantener flexibilidad para usar Supabase o sistema propio
   - Implementar fallbacks robustos

2. **Sistema de Tokens Propio**
   - Tabla password_reset_tokens
   - Tokens crypto.randomBytes(32)
   - Expiración 1 hora
   - Eliminación después de uso

3. **Rate Limiting**
   - Implementar en todos los endpoints críticos
   - Considerar Redis para persistencia

4. **Validación de Contraseñas**
   - Frontend: Validación en tiempo real con indicadores visuales
   - Backend: Validación robusta antes de aceptar

5. **Email Service**
   - Usar nodemailer
   - Templates HTML profesionales
   - Modo desarrollo con logs de tokens

6. **Seguridad**
   - Bcrypt con salt rounds apropiados
   - Tokens seguros
   - No revelar información sensible
   - CORS estricto en producción

### Mejoras Recomendadas

**Para Implementar en Refactorización:**

1. **Rate Limiting Avanzado**
   - Redis para persistencia
   - Por usuario + IP
   - Límites configurables por endpoint

2. **Logging y Monitoreo**
   - Logs estructurados (Winston/Pino)
   - Tracking de eventos críticos
   - Alertas para patrones sospechosos

3. **Testing**
   - Tests unitarios para validaciones
   - Tests de integración para flujos
   - Tests E2E para user journeys

4. **Documentación**
   - OpenAPI/Swagger para APIs
   - Ejemplos de uso
   - Diagramas de flujo

5. **Multi-idioma**
   - Mensajes de error localizados
   - Templates de email multi-idioma

6. **Notificaciones**
   - Email de confirmación después de cambio de contraseña
   - Alertas de seguridad
   - Notificación de actividad sospechosa

### Endpoints a Implementar

**Lista Completa:**

| Endpoint | Método | Propósito | Prioridad |
|----------|--------|-----------|-----------|
| /api/register | POST | Registro de usuario | ✅ Crítico |
| /api/login | POST | Login | ✅ Crítico |
| /api/forgot-password | POST | Solicitar recuperación | ✅ Crítico |
| /api/reset-password | POST | Restablecer contraseña | ✅ Crítico |
| /api/verify-email | POST | Verificar email con OTP | ⚠️ Opcional |
| /api/auth/issue | POST | Emitir JWT token | ⚠️ Opcional |
| /api/user/session | GET | Obtener sesión actual | ⚠️ Opcional |

---

## Checklist de Implementación

### Fase 1: Backend Setup

- [ ] Configurar variables de entorno
- [ ] Crear tablas en base de datos
- [ ] Implementar endpoint `/api/forgot-password`
- [ ] Implementar endpoint `/api/reset-password`
- [ ] Configurar servicio de email
- [ ] Implementar rate limiting
- [ ] Testing de endpoints

### Fase 2: Frontend Setup

- [ ] Crear modal "Olvidé mi contraseña"
- [ ] Implementar handler `handleForgotPassword()`
- [ ] Crear página `reset-password.html`
- [ ] Implementar validación de contraseña en tiempo real
- [ ] Implementar indicador de fortaleza
- [ ] Implementar submit de nueva contraseña
- [ ] Testing de flujo completo

### Fase 3: Integración

- [ ] Conectar frontend con backend
- [ ] Probar flujo end-to-end
- [ ] Implementar manejo de errores
- [ ] Implementar mensajes de éxito/error
- [ ] Testing en diferentes browsers
- [ ] Testing responsive

### Fase 4: Seguridad

- [ ] Verificar rate limiting funciona
- [ ] Verificar tokens se eliminan después de uso
- [ ] Verificar expiración de tokens
- [ ] Verificar validación de passwords
- [ ] Penetration testing básico
- [ ] Code review de seguridad

### Fase 5: Producción

- [ ] Configurar CORS estricto
- [ ] Configurar SMTP production
- [ ] Configurar HTTPS
- [ ] Configurar logging
- [ ] Configurar monitoreo
- [ ] Deploy a production
- [ ] Smoke testing production

---

## Contacto y Soporte

Para preguntas sobre esta documentación o la implementación del sistema de recuperación de contraseña, contactar al equipo de desarrollo.

---

**Fin de la Documentación**

*Última actualización: Julio 2025*
*Versión: 1.0*
