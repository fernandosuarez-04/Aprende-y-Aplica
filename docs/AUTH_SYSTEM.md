# Sistema de Autenticación - Aprende y Aplica

## 📋 Tabla de Contenidos
1. [Arquitectura General](#arquitectura-general)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Flujo de Login](#flujo-de-login)
4. [Flujo de Registro (Sign Up)](#flujo-de-registro-sign-up)
5. [Flujo de Recuperación de Contraseña](#flujo-de-recuperación-de-contraseña)
6. [Sistema de Sesiones](#sistema-de-sesiones)
7. [Middleware de Protección](#middleware-de-protección)
8. [Base de Datos](#base-de-datos)
9. [Validaciones](#validaciones)
10. [Próximos Pasos](#próximos-pasos)

---

## 🏗️ Arquitectura General

El sistema de autenticación está construido sobre una **arquitectura de monorepo** con las siguientes características:

### Principios de Diseño

1. **Autenticación Híbrida**: Combina autenticación personalizada (bcrypt + sesiones manuales) con Supabase como backend
2. **Sistema de Sesiones Propio**: No utiliza Supabase Auth directamente, sino que gestiona sesiones mediante cookies y tabla `user_session`
3. **Validación en Múltiples Capas**: Frontend (React Hook Form + Zod) y Backend (Server Actions + Zod)
4. **Arquitectura Modular**: Separación clara entre actions, services, components y hooks

### Stack Tecnológico

- **Framework**: Next.js 14+ (App Router)
- **Backend**: Supabase (PostgreSQL)
- **Autenticación**: bcrypt (hashing) + JWT/Cookies (sesiones)
- **Validación**: Zod
- **Formularios**: React Hook Form
- **UI**: TailwindCSS + shadcn/ui

---

## 📁 Estructura del Proyecto

```
apps/web/src/
├── features/auth/                    # Feature de autenticación
│   ├── actions/                      # Server Actions (backend)
│   │   ├── login.ts                  # ✅ Acción de login
│   │   ├── register.ts               # ✅ Acción de registro
│   │   ├── logout.ts                 # ✅ Acción de cierre de sesión
│   │   ├── reset-password.ts         # 🟡 Recuperación de contraseña (parcial)
│   │   └── verify-email.ts           # 🟡 Verificación de email (pendiente)
│   │
│   ├── services/                     # Lógica de negocio
│   │   ├── auth.service.ts           # ✅ Servicio de autenticación
│   │   └── session.service.ts        # ✅ Gestión de sesiones
│   │
│   ├── components/                   # Componentes UI
│   │   ├── LoginForm/
│   │   │   ├── LoginForm.tsx
│   │   │   └── LoginForm.schema.ts
│   │   ├── RegisterForm/
│   │   │   ├── RegisterForm.tsx
│   │   │   └── RegisterForm.schema.ts
│   │   └── AuthTabs/
│   │       └── AuthTabs.tsx          # Tabs para Login/Register
│   │
│   ├── hooks/                        # Custom Hooks
│   │   ├── useAuth.ts                # Hook de autenticación
│   │   └── useUserProfile.ts         # Hook de perfil de usuario
│   │
│   └── types/                        # TypeScript Types
│       └── auth.types.ts
│
├── lib/supabase/                     # Cliente de Supabase
│   ├── client.ts                     # Cliente para componentes
│   ├── server.ts                     # Cliente para Server Components/Actions
│   ├── middleware.ts                 # Gestión de sesiones en middleware
│   └── types.ts                      # Tipos de base de datos
│
├── app/
│   ├── auth/
│   │   ├── page.tsx                  # Página de login/registro
│   │   └── layout.tsx
│   │
│   └── api/auth/                     # API Routes
│       ├── me/route.ts               # Obtener usuario actual
│       └── logout/route.ts           # Endpoint de logout
│
└── middleware.ts                     # Middleware global de Next.js
```

### Convenciones de Carpetas

- **`actions/`**: Server Actions de Next.js (lógica del servidor)
- **`services/`**: Lógica de negocio reutilizable
- **`components/`**: Componentes React de UI
- **`hooks/`**: Custom Hooks de React
- **`types/`**: Definiciones de TypeScript

---

## 🔐 Flujo de Login

### 1. Componente de UI

**Ubicación**: `apps/web/src/features/auth/components/LoginForm/LoginForm.tsx`

```typescript
// El formulario usa React Hook Form + Zod
const form = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
  defaultValues: {
    emailOrUsername: '',
    password: '',
    rememberMe: false,
  },
});

// Submit del formulario
const onSubmit = async (data: LoginFormData) => {
  const formData = new FormData();
  formData.append('emailOrUsername', data.emailOrUsername);
  formData.append('password', data.password);
  formData.append('rememberMe', String(data.rememberMe));

  const result = await loginAction(formData);
  // Manejo de resultado...
};
```

### 2. Validación del Schema

**Ubicación**: `apps/web/src/features/auth/components/LoginForm/LoginForm.schema.ts`

```typescript
export const loginSchema = z.object({
  emailOrUsername: z.string()
    .min(1, 'El correo o usuario es requerido')
    .refine(
      (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return emailRegex.test(value) || usernameRegex.test(value);
      },
      'Ingresa un correo o usuario válido'
    ),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  rememberMe: z.boolean().default(false),
});
```

### 3. Server Action

**Ubicación**: `apps/web/src/features/auth/actions/login.ts`

#### Proceso paso a paso:

```typescript
export async function loginAction(formData: FormData) {
  try {
    // PASO 1: Validar datos con Zod
    const parsed = loginSchema.parse({
      emailOrUsername: formData.get('emailOrUsername'),
      password: formData.get('password'),
      rememberMe: formData.get('rememberMe') === 'true',
    });

    // PASO 2: Crear cliente Supabase
    const supabase = await createClient();

    // PASO 3: Buscar usuario por username O email
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, password_hash, email_verified, cargo_rol, type_rol')
      .or(`username.ilike.${parsed.emailOrUsername},email.ilike.${parsed.emailOrUsername}`)
      .single();

    if (error || !user) {
      return { error: 'Credenciales inválidas' };
    }

    // PASO 4: Verificar contraseña con bcrypt
    const passwordValid = await bcrypt.compare(parsed.password, user.password_hash);
    
    if (!passwordValid) {
      return { error: 'Credenciales inválidas' };
    }

    // PASO 5: Verificar email (actualmente comentado)
    // if (!user.email_verified) {
    //   return { error: 'Debes verificar tu email antes de iniciar sesión' };
    // }

    // PASO 6: Crear sesión personalizada
    await SessionService.createSession(user.id, parsed.rememberMe);

    // PASO 7: Limpiar sesiones expiradas
    await AuthService.clearExpiredSessions();

    // PASO 8: Redirigir a dashboard
    redirect('/dashboard');
  } catch (error) {
    // Manejo de errores...
  }
}
```

### 4. Servicio de Sesiones

**Ubicación**: `apps/web/src/features/auth/services/session.service.ts`

```typescript
export class SessionService {
  private static readonly SESSION_COOKIE_NAME = 'aprende-y-aplica-session';
  private static readonly SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días

  static async createSession(userId: string, rememberMe: boolean = false): Promise<void> {
    // 1. Generar token UUID
    const sessionToken = crypto.randomUUID();
    
    // 2. Calcular expiración (7 días normal, 30 días con rememberMe)
    const expiresAt = new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000);
    
    // 3. Obtener información del request (IP, User-Agent)
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    
    // 4. Guardar sesión en base de datos
    const supabase = await createClient();
    const { error } = await supabase
      .from('user_session')
      .insert({
        user_id: userId,
        jwt_id: sessionToken,
        issued_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        ip: ip,
        user_agent: userAgent,
        revoked: false,
      });

    if (error) throw new Error('Error al guardar sesión');

    // 5. Crear cookie HTTP-only
    const cookieStore = await cookies();
    cookieStore.set(this.SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
      path: '/',
    });
  }
}
```

### Características de Seguridad

- ✅ **Contraseñas hasheadas** con bcrypt (12 rounds)
- ✅ **Cookies HTTP-only** (no accesibles desde JavaScript)
- ✅ **Tokens UUID** únicos para cada sesión
- ✅ **Registro de IP y User-Agent** para auditoría
- ✅ **Expiración automática** de sesiones
- ✅ **Opción "Recordarme"** para sesiones extendidas

---

## 📝 Flujo de Registro (Sign Up)

### 1. Componente de Registro

**Ubicación**: `apps/web/src/features/auth/components/RegisterForm/RegisterForm.tsx`

El formulario recopila:
- Nombre y apellido
- Usuario (username)
- Email y confirmación
- Contraseña y confirmación
- Código de país + teléfono
- Aceptación de términos

### 2. Validación del Schema

**Ubicación**: `apps/web/src/features/auth/components/RegisterForm/RegisterForm.schema.ts`

```typescript
export const registerSchema = z
  .object({
    firstName: z.string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'El nombre no puede exceder 50 caracteres')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo se permiten letras'),
    
    lastName: z.string()
      .min(2, 'El apellido debe tener al menos 2 caracteres')
      .max(50, 'El apellido no puede exceder 50 caracteres')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo se permiten letras'),
    
    username: z.string()
      .min(3, 'El usuario debe tener al menos 3 caracteres')
      .max(20, 'El usuario no puede exceder 20 caracteres')
      .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guión bajo'),
    
    countryCode: z.string().min(1, 'Selecciona un país'),
    
    phoneNumber: z.string()
      .min(8, 'El número debe tener al menos 8 dígitos')
      .max(15, 'El número no puede exceder 15 dígitos')
      .regex(/^[0-9]+$/, 'Solo se permiten números'),
    
    email: z.string().email('Ingresa un correo válido'),
    confirmEmail: z.string().email('Ingresa un correo válido'),
    
    password: z.string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número')
      .regex(/[^a-zA-Z0-9]/, 'Debe contener al menos un carácter especial'),
    
    confirmPassword: z.string(),
    
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'Debes aceptar los términos y condiciones',
    }),
  })
  .refine((data) => data.email === data.confirmEmail, {
    message: 'Los correos no coinciden',
    path: ['confirmEmail'],
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });
```

### 3. Server Action

**Ubicación**: `apps/web/src/features/auth/actions/register.ts`

#### Proceso paso a paso:

```typescript
export async function registerAction(formData: FormData) {
  try {
    // PASO 1: Convertir FormData a objeto y parsear
    const rawData = Object.fromEntries(formData);
    const formDataParsed = {
      ...rawData,
      acceptTerms: rawData.acceptTerms === 'true' || rawData.acceptTerms === 'on'
    };
    
    const parsed = registerSchema.parse(formDataParsed);

    // PASO 2: Crear cliente Supabase
    const supabase = await createClient();

    // PASO 3: Verificar que username/email no existan
    const { data: existing } = await supabase
      .from('users')
      .select('id, username, email')
      .or(`username.eq.${parsed.username},email.eq.${parsed.email}`);

    if (existing && existing.length > 0) {
      const conflict = existing.find(u => u.username === parsed.username)
        ? 'usuario'
        : 'email';
      return { error: `El ${conflict} ya existe` };
    }

    // PASO 4: Hashear contraseña
    const passwordHash = await bcrypt.hash(parsed.password, 12);

    // PASO 5: Generar ID único
    const userId = crypto.randomUUID();

    // PASO 6: Crear usuario en base de datos
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        username: parsed.username,
        email: parsed.email,
        password_hash: passwordHash,
        first_name: parsed.firstName,
        last_name: parsed.lastName,
        display_name: `${parsed.firstName} ${parsed.lastName}`.trim(),
        country_code: parsed.countryCode,
        phone: parsed.phoneNumber,
        cargo_rol: 'Usuario',
        type_rol: 'Usuario',
        email_verified: false, // Se verificará después
      })
      .select()
      .single();

    if (error) {
      return { error: 'Error al crear perfil de usuario' };
    }

    // PASO 7: Retornar éxito
    return { 
      success: true, 
      message: 'Cuenta creada exitosamente.',
      userId: user.id 
    };
  } catch (error) {
    // Manejo de errores...
  }
}
```

### Campos de la Tabla Users

```typescript
{
  id: string (UUID generado)
  username: string (único)
  email: string (único)
  password_hash: string (bcrypt)
  first_name: string
  last_name: string
  display_name: string (calculado)
  country_code: string (+51, +1, etc.)
  phone: string
  cargo_rol: 'Usuario' (por defecto)
  type_rol: 'Usuario' (por defecto)
  email_verified: false (por defecto)
  created_at: timestamp
  updated_at: timestamp
}
```

---

## 🔄 Flujo de Recuperación de Contraseña

### Estado Actual: 🟡 Implementación Parcial

**Ubicación**: `apps/web/src/features/auth/actions/reset-password.ts`

### Funciones Disponibles

#### 1. Solicitar Restablecimiento

```typescript
export async function requestPasswordResetAction(formData: FormData | { email: string }) {
  try {
    // PASO 1: Validar email
    const parsed = requestResetSchema.parse({ email: formData.get('email') });
    
    // PASO 2: Verificar que el email existe
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (!user) {
      // Por seguridad, no revelar si el email existe
      return { success: true, message: 'Si el email existe, recibirás instrucciones...' };
    }
    
    // PASO 3: Usar Supabase Auth para enviar email de recuperación
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    });
    
    return { success: true, message: 'Revisa tu email para las instrucciones' };
  } catch (error) {
    // Manejo de errores...
  }
}
```

#### 2. Restablecer Contraseña

```typescript
export async function resetPasswordAction(formData: FormData | { token: string; newPassword: string }) {
  try {
    // PASO 1: Validar datos
    const parsed = resetPasswordSchema.parse({
      token: formData.get('token'),
      newPassword: formData.get('newPassword'),
    });

    // PASO 2: Verificar token de recuperación con Supabase Auth
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery',
    });
    
    if (error) {
      return { error: 'Token inválido o expirado' };
    }
    
    // PASO 3: Hash nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    // PASO 4: Actualizar en tabla users
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('email', data.user.email);
    
    if (updateError) {
      return { error: 'Error al actualizar la contraseña' };
    }

    // PASO 5: Actualizar también en Supabase Auth (para mantener consistencia)
    await supabase.auth.updateUser({ password: newPassword });
    
    return { success: true, message: 'Contraseña actualizada correctamente' };
  } catch (error) {
    // Manejo de errores...
  }
}
```

### ⚠️ Componentes Faltantes

Para completar la implementación de recuperación de contraseña, se necesitan:

1. **Página de Solicitud** (`/auth/forgot-password`)
   - Formulario para ingresar email
   - Llamada a `requestPasswordResetAction`

2. **Página de Restablecimiento** (`/auth/reset-password`)
   - Captura del token desde URL
   - Formulario para nueva contraseña
   - Llamada a `resetPasswordAction`

3. **Configuración de Email**
   - Template de email en Supabase
   - Configuración de SMTP
   - Variables de entorno para URLs de callback

### Schema de Validación

```typescript
const requestResetSchema = z.object({
  email: z.string().email('Email inválido'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  newPassword: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
});
```

---

## 🔒 Sistema de Sesiones

### Arquitectura de Sesiones

El sistema NO utiliza Supabase Auth directamente. En su lugar:

1. **Almacenamiento**: Tabla `user_session` en PostgreSQL
2. **Identificación**: Cookie HTTP-only con UUID
3. **Validación**: Verificación contra base de datos en cada request

### Tabla user_session

```typescript
{
  id: string (UUID auto-generado)
  user_id: string (FK a users.id)
  jwt_id: string (UUID del token de sesión)
  issued_at: timestamp (fecha de creación)
  expires_at: timestamp (fecha de expiración)
  ip: string (dirección IP del cliente)
  user_agent: string (navegador/dispositivo)
  revoked: boolean (sesión revocada/cerrada)
}
```

### SessionService

**Ubicación**: `apps/web/src/features/auth/services/session.service.ts`

#### Métodos Principales

1. **`createSession(userId, rememberMe)`**
   - Genera UUID único
   - Calcula expiración (7 o 30 días)
   - Registra en DB con IP y User-Agent
   - Crea cookie HTTP-only

2. **`getCurrentUser()`**
   - Lee cookie de sesión
   - Valida contra DB (no expirada, no revocada)
   - Retorna datos del usuario

3. **`destroySession()`**
   - Marca sesión como revocada en DB
   - Elimina cookie

4. **`validateSession(token)`**
   - Verifica que el token existe en DB
   - Verifica que no esté expirado
   - Verifica que no esté revocado

### AuthService

**Ubicación**: `apps/web/src/features/auth/services/auth.service.ts`

#### Métodos Principales

1. **`getFingerprint()`**
   - Genera hash de User-Agent + Language + IP
   - Usado para validación adicional de sesiones

2. **`validateSession(userId, fingerprint)`**
   - Verifica sesión por userId y fingerprint
   - Retorna boolean

3. **`clearExpiredSessions()`**
   - Marca como revocadas las sesiones expiradas
   - Ejecutado periódicamente en login

---

## 🛡️ Middleware de Protección

**Ubicación**: `apps/web/middleware.ts`

### Responsabilidades

1. **Proteger rutas privadas** (requieren autenticación)
2. **Redirigir usuarios autenticados** desde rutas de auth
3. **Actualizar sesión de Supabase** (para queries a DB)

### Código del Middleware

```typescript
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Actualizar sesión de Supabase (para queries posteriores)
  const response = await updateSession(request);
  
  // 2. Definir rutas protegidas
  const protectedRoutes = ['/dashboard', '/profile', '/courses'];
  const authRoutes = ['/auth'];
  
  // 3. Verificar tipo de ruta
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // 4. Verificar cookie de sesión personalizada
  const sessionCookie = request.cookies.get('aprende-y-aplica-session');
  const hasSession = !!sessionCookie?.value;
  
  // 5. Proteger rutas privadas
  if (isProtectedRoute && !hasSession) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }
  
  // 6. Redirigir usuarios autenticados desde /auth
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### Rutas Protegidas

Actualmente:
- ✅ `/dashboard` → Requiere autenticación
- ✅ `/auth` → Solo accesible sin autenticación

Para agregar más rutas protegidas:
```typescript
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/courses',
  '/communities',
  // Agregar aquí...
];
```

---

## 🗄️ Base de Datos

### Esquema de Autenticación

#### Tabla: users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  display_name VARCHAR(100),
  email_verified BOOLEAN DEFAULT false,
  phone VARCHAR(15),
  country_code VARCHAR(5),
  cargo_rol VARCHAR(50) DEFAULT 'Usuario',
  type_rol VARCHAR(50) DEFAULT 'Usuario',
  profile_picture_url TEXT,
  bio TEXT,
  location VARCHAR(100),
  linkedin_url TEXT,
  github_url TEXT,
  website_url TEXT,
  points INTEGER DEFAULT 0,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla: user_session

```sql
CREATE TABLE user_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jwt_id UUID NOT NULL UNIQUE,
  issued_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip VARCHAR(45) NOT NULL,
  user_agent TEXT NOT NULL,
  revoked BOOLEAN DEFAULT false,
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Índices para optimizar consultas
CREATE INDEX idx_user_session_user_id ON user_session(user_id);
CREATE INDEX idx_user_session_jwt_id ON user_session(jwt_id);
CREATE INDEX idx_user_session_expires_at ON user_session(expires_at);
```

### Políticas RLS (Row Level Security)

⚠️ **Nota**: Si usas Supabase, considera agregar políticas RLS:

```sql
-- Permitir inserción de nuevos usuarios (registro)
CREATE POLICY "Allow public insert" ON users
  FOR INSERT
  WITH CHECK (true);

-- Permitir lectura del propio perfil
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Permitir actualización del propio perfil
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id);
```

---

## ✅ Validaciones

### Frontend (React Hook Form + Zod)

#### Login

```typescript
{
  emailOrUsername: string (min 1 char, email O username válido)
  password: string (min 8 chars, 1 mayúscula, 1 minúscula, 1 número)
  rememberMe: boolean
}
```

#### Registro

```typescript
{
  firstName: string (2-50 chars, solo letras)
  lastName: string (2-50 chars, solo letras)
  username: string (3-20 chars, alfanumérico + _)
  email: string (email válido)
  confirmEmail: string (debe coincidir con email)
  password: string (min 8 chars, 1 mayúscula, 1 minúscula, 1 número, 1 especial)
  confirmPassword: string (debe coincidir con password)
  countryCode: string (requerido)
  phoneNumber: string (8-15 dígitos)
  acceptTerms: boolean (debe ser true)
}
```

### Backend (Server Actions + Zod)

- ✅ Re-validación en el servidor de todos los datos
- ✅ Verificación de duplicados (username/email)
- ✅ Hashing seguro de contraseñas (bcrypt, 12 rounds)
- ✅ Generación segura de UUIDs
- ✅ Sanitización de inputs

---

## 🚀 Próximos Pasos

### Funcionalidades Pendientes

#### 1. Recuperación de Contraseña (Alta Prioridad)

- [ ] Crear página `/auth/forgot-password`
  - Formulario con campo de email
  - Integración con `requestPasswordResetAction`
  - Mensaje de confirmación

- [ ] Crear página `/auth/reset-password`
  - Captura de token desde query params
  - Formulario con nueva contraseña y confirmación
  - Integración con `resetPasswordAction`
  - Validación de token expirado/inválido

- [ ] Configurar templates de email en Supabase
  - Template personalizado para recuperación
  - Branding de "Aprende y Aplica"
  - Enlaces correctos de callback

- [ ] Variables de entorno
  ```env
  NEXT_PUBLIC_APP_URL=https://tu-dominio.com
  SUPABASE_AUTH_EMAIL_TEMPLATE_ID=...
  ```

#### 2. Verificación de Email

- [ ] Implementar envío de email de verificación
- [ ] Crear página `/auth/verify-email`
- [ ] Agregar lógica en `verify-email.ts`
- [ ] Habilitar validación en login (actualmente comentada)

#### 3. Autenticación OAuth (Opcional)

- [ ] Google Sign In
- [ ] GitHub Sign In
- [ ] LinkedIn Sign In

#### 4. Seguridad Adicional

- [ ] Rate limiting para intentos de login
- [ ] 2FA (Two-Factor Authentication)
- [ ] Detección de dispositivos sospechosos
- [ ] Notificaciones de nuevos inicios de sesión

#### 5. Mejoras UX

- [ ] "Recordar usuario" en login
- [ ] Mostrar última fecha de login
- [ ] Gestión de sesiones activas
- [ ] Forzar cierre de sesión en todos los dispositivos

---

## 📚 Referencias y Recursos

### Documentación Oficial

- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Authentication](https://supabase.com/docs/guides/auth)
- [Zod Validation](https://zod.dev/)
- [React Hook Form](https://react-hook-form.com/)

### Librerías Utilizadas

- **bcryptjs**: Hashing de contraseñas
- **crypto**: Generación de UUIDs y hashes
- **@supabase/ssr**: Cliente de Supabase para Next.js

### Archivos Clave para Recuperación de Contraseña

1. `apps/web/src/features/auth/actions/reset-password.ts` - Server actions
2. `apps/web/src/features/auth/components/` - Crear nuevos componentes aquí
3. `apps/web/src/app/auth/` - Agregar páginas de recuperación
4. `apps/web/.env.local` - Configurar variables de entorno

---

## 🔐 Consideraciones de Seguridad

### Implementadas ✅

- Contraseñas hasheadas con bcrypt (12 rounds)
- Cookies HTTP-only (no accesibles desde JS)
- Sesiones con expiración automática
- Validación en frontend y backend
- Prevención de SQL injection (uso de Supabase client)
- No revelar si email/username existe en errores

### Por Implementar ⚠️

- Rate limiting
- CSRF tokens (Next.js lo maneja parcialmente)
- Verificación de email obligatoria
- 2FA
- Auditoría de sesiones
- Detección de bots/automatización

---

## 📝 Notas para Desarrolladores

### Para implementar recuperación de contraseña:

1. **Crear componentes UI**
   ```typescript
   // apps/web/src/features/auth/components/ForgotPasswordForm/
   // apps/web/src/features/auth/components/ResetPasswordForm/
   ```

2. **Crear páginas**
   ```typescript
   // apps/web/src/app/auth/forgot-password/page.tsx
   // apps/web/src/app/auth/reset-password/page.tsx
   ```

3. **Configurar Supabase Email**
   - Dashboard → Authentication → Email Templates
   - Personalizar "Reset Password"
   - Configurar redirect URL

4. **Probar flujo completo**
   - Solicitar recuperación
   - Recibir email
   - Hacer click en link
   - Cambiar contraseña
   - Verificar login con nueva contraseña

### Estructura recomendada para nuevos componentes:

```
features/auth/components/ForgotPasswordForm/
├── ForgotPasswordForm.tsx
├── ForgotPasswordForm.schema.ts
└── index.ts

features/auth/components/ResetPasswordForm/
├── ResetPasswordForm.tsx
├── ResetPasswordForm.schema.ts
└── index.ts
```

---

**Última actualización**: 25 de octubre de 2025  
**Versión**: 1.0  
**Mantenido por**: Equipo de Desarrollo Aprende y Aplica
