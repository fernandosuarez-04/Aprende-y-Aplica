# Plan de Implementación - SSO con Google

## 📋 Información General

**Fecha de Creación**: 26 de octubre de 2025
**Versión**: 1.0
**Sistema Base**: Sistema de Autenticación v1.1 (Login/Register/Password Reset)
**Objetivo**: Agregar autenticación con Google OAuth 2.0 sin afectar el sistema existente

---

## 🎯 Objetivos de la Implementación

### Funcionalidades a Implementar

1. ✅ **Login con Google**: Usuarios existentes pueden iniciar sesión con Google
2. ✅ **Registro con Google**: Nuevos usuarios pueden registrarse con Google
3. ✅ **Vinculación de Cuentas**: Vincular cuenta Google a cuenta existente
4. ✅ **Manejo de Duplicados**: Detectar y manejar emails duplicados
5. ✅ **Sincronización de Datos**: Mantener datos de perfil actualizados desde Google
6. ✅ **Integración con Sesiones**: Usar el mismo sistema de sesiones existente

### Requisitos No Funcionales

- 🔒 **Seguridad**: OAuth 2.0 con PKCE
- 🎨 **UX**: Experiencia fluida y consistente con diseño actual
- ⚡ **Performance**: Autenticación en < 2 segundos
- 🔄 **Compatibilidad**: No romper funcionalidad existente
- 📱 **Responsive**: Funcionar en mobile y desktop

---

## 🏗️ Arquitectura de la Solución

### Diagrama de Flujo SSO

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUJO SSO CON GOOGLE                         │
└─────────────────────────────────────────────────────────────────┘

🔵 INICIO: Usuario en /auth
    │
    ↓
┌──────────────────────────────┐
│ 1. Click "Continuar con       │
│    Google"                    │
│ - GoogleLoginButton          │
└──────────────┬───────────────┘
               │
               ↓
┌──────────────────────────────┐
│ 2. Redirigir a Google         │
│ - OAuth 2.0 Authorization    │
│ - Solicitar permisos:        │
│   · email                    │
│   · profile                  │
│   · openid                   │
└──────────────┬───────────────┘
               │
               ↓
┌──────────────────────────────┐
│ 3. Usuario Autoriza en Google│
│ - Selecciona cuenta Google   │
│ - Acepta permisos            │
└──────────────┬───────────────┘
               │
               ↓
┌──────────────────────────────┐
│ 4. Google Callback           │
│ GET /api/auth/callback/google│
│ - Recibe authorization code  │
└──────────────┬───────────────┘
               │
               ↓
┌──────────────────────────────┐
│ 5. Intercambiar Code por     │
│    Tokens                    │
│ - POST a Google OAuth API    │
│ - Obtener access_token       │
│ - Obtener id_token (JWT)     │
└──────────────┬───────────────┘
               │
               ↓
┌──────────────────────────────┐
│ 6. Verificar ID Token         │
│ - Validar firma JWT          │
│ - Extraer email, name, pic   │
│ - Verificar issuer           │
└──────────────┬───────────────┘
               │
        ┌──────┴──────┐
        │             │
    Usuario         Usuario
    Existente       Nuevo
        │             │
        │             ↓
        │   ┌──────────────────────────────┐
        │   │ 7a. Crear Nuevo Usuario       │
        │   │ - INSERT en tabla users      │
        │   │ - first_name, last_name      │
        │   │ - email, profile_picture     │
        │   │ - email_verified = true      │
        │   │ - username auto-generado     │
        │   └──────────────┬───────────────┘
        │                  │
        └──────────────────┼───────────────┐
                           │               │
                           ↓               ↓
              ┌──────────────────────────────┐
              │ 8. Registrar OAuth Account   │
              │ - INSERT oauth_accounts      │
              │ - provider: 'google'         │
              │ - provider_account_id        │
              │ - access_token, refresh_token│
              └──────────────┬───────────────┘
                             │
                             ↓
              ┌──────────────────────────────┐
              │ 9. Crear Sesión              │
              │ - SessionService.createSession│
              │ - Cookie HTTP-only           │
              │ - Registro en user_session   │
              └──────────────┬───────────────┘
                             │
                             ↓
              ┌──────────────────────────────┐
              │ 10. Redireccionar a Dashboard│
              │ redirect('/dashboard')       │
              └──────────────┬───────────────┘
                             │
                             ↓
                    🟢 FIN: Usuario autenticado
```

### Estrategia de Integración

**Opción Elegida**: Integración Híbrida

- **Supabase OAuth Flow** para manejar el flujo OAuth con Google
- **Sistema de Sesiones Custom** existente para mantener sesiones
- **Tabla `oauth_accounts`** para vincular cuentas OAuth con usuarios
- **No usar Supabase Auth directamente** para mantener consistencia

---

## 📦 Cambios en Base de Datos

### Nueva Tabla: oauth_accounts

```sql
-- ============================================================================
-- Tabla: oauth_accounts
-- Descripción: Vincula cuentas OAuth (Google, GitHub, etc.) con usuarios
-- ============================================================================

CREATE TABLE IF NOT EXISTS oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Información del proveedor OAuth
  provider VARCHAR(50) NOT NULL,           -- 'google', 'github', 'facebook', etc.
  provider_account_id VARCHAR(255) NOT NULL, -- ID del usuario en el proveedor

  -- Tokens OAuth
  access_token TEXT,                       -- Token de acceso
  refresh_token TEXT,                      -- Token de refresco
  token_expires_at TIMESTAMP,              -- Expiración del access_token

  -- Información adicional
  scope TEXT,                              -- Permisos otorgados
  token_type VARCHAR(50),                  -- Tipo de token (Bearer)

  -- Metadatos
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_provider_account UNIQUE (provider, provider_account_id)
);

-- ============================================================================
-- Índices para optimizar consultas
-- ============================================================================

-- Búsqueda por usuario
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id
ON oauth_accounts(user_id);

-- Búsqueda por proveedor y ID de cuenta
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider_account
ON oauth_accounts(provider, provider_account_id);

-- Búsqueda por proveedor
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider
ON oauth_accounts(provider);

-- ============================================================================
-- Comentarios para documentación
-- ============================================================================

COMMENT ON TABLE oauth_accounts IS 'Cuentas OAuth vinculadas a usuarios';
COMMENT ON COLUMN oauth_accounts.provider IS 'Proveedor OAuth: google, github, facebook';
COMMENT ON COLUMN oauth_accounts.provider_account_id IS 'ID único del usuario en el proveedor';
COMMENT ON COLUMN oauth_accounts.access_token IS 'Token de acceso OAuth (cifrado)';
COMMENT ON COLUMN oauth_accounts.refresh_token IS 'Token de refresco OAuth (cifrado)';
```

### Modificaciones a Tabla users

```sql
-- Agregar campos para SSO (si no existen)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS oauth_provider_id VARCHAR(255);

-- Índice para búsqueda rápida por OAuth
CREATE INDEX IF NOT EXISTS idx_users_oauth_provider
ON users(oauth_provider, oauth_provider_id);

-- Hacer password_hash nullable para usuarios OAuth
ALTER TABLE users
ALTER COLUMN password_hash DROP NOT NULL;

-- Comentarios
COMMENT ON COLUMN users.profile_picture_url IS 'URL de foto de perfil (de OAuth o subida)';
COMMENT ON COLUMN users.oauth_provider IS 'Proveedor OAuth principal (google, github)';
COMMENT ON COLUMN users.oauth_provider_id IS 'ID del usuario en el proveedor OAuth';
```

---

## 📁 Estructura de Archivos a Crear

```
apps/web/src/

├── features/auth/
│   ├── actions/
│   │   └── oauth.ts                      # ✨ NUEVO - Server actions OAuth
│   │
│   ├── services/
│   │   ├── oauth.service.ts              # ✨ NUEVO - Lógica OAuth
│   │   └── google-oauth.service.ts       # ✨ NUEVO - Específico Google
│   │
│   ├── components/
│   │   ├── GoogleLoginButton/            # ✨ NUEVO
│   │   │   ├── GoogleLoginButton.tsx
│   │   │   └── GoogleLoginButton.styles.ts
│   │   │
│   │   ├── SocialLoginButtons/           # ✨ NUEVO
│   │   │   └── SocialLoginButtons.tsx
│   │   │
│   │   └── OAuthCallback/                # ✨ NUEVO
│   │       └── OAuthCallbackHandler.tsx
│   │
│   ├── hooks/
│   │   └── useOAuth.ts                   # ✨ NUEVO - Hook OAuth
│   │
│   └── types/
│       └── oauth.types.ts                # ✨ NUEVO - Tipos OAuth
│
├── app/
│   └── api/
│       └── auth/
│           └── callback/
│               └── google/
│                   └── route.ts           # ✨ NUEVO - Callback OAuth
│
└── lib/
    └── oauth/
        ├── google.ts                      # ✨ NUEVO - Config Google
        └── providers.ts                   # ✨ NUEVO - Config proveedores

scripts/
└── create-oauth-accounts-table.sql        # ✨ NUEVO - Script DB
```

---

## 🔧 Plan de Implementación Paso a Paso

### FASE 1: Configuración Base de Datos ⏱️ 30 min

#### Paso 1.1: Crear Tabla oauth_accounts
**Archivo**: `apps/web/scripts/create-oauth-accounts-table.sql`

```sql
-- Contenido del script SQL mostrado arriba
-- Ejecutar en Supabase SQL Editor
```

**Validación**:
```sql
-- Verificar creación
SELECT * FROM oauth_accounts LIMIT 1;

-- Verificar constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'oauth_accounts';
```

#### Paso 1.2: Modificar Tabla users
**Archivo**: `apps/web/scripts/alter-users-for-oauth.sql`

```sql
-- Script de alteración mostrado arriba
```

**Validación**:
```sql
-- Verificar que password_hash es nullable
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'password_hash';
```

---

### FASE 2: Tipos y Configuración ⏱️ 45 min

#### Paso 2.1: Definir Tipos TypeScript
**Archivo**: `apps/web/src/features/auth/types/oauth.types.ts`

```typescript
/**
 * Tipos para autenticación OAuth
 */

export type OAuthProvider = 'google' | 'github' | 'facebook';

export interface OAuthProfile {
  id: string;
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email_verified?: boolean;
  locale?: string;
}

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  token_type: string;
  scope: string;
}

export interface OAuthAccount {
  id: string;
  user_id: string;
  provider: OAuthProvider;
  provider_account_id: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: Date;
  scope?: string;
  token_type?: string;
  created_at: Date;
  updated_at: Date;
}

export interface OAuthCallbackParams {
  code: string;
  state?: string;
  error?: string;
  error_description?: string;
}

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}
```

#### Paso 2.2: Configuración de Google OAuth
**Archivo**: `apps/web/src/lib/oauth/google.ts`

```typescript
import { GoogleOAuthConfig } from '@/features/auth/types/oauth.types';

/**
 * Configuración de Google OAuth 2.0
 */
export const GOOGLE_OAUTH_CONFIG: GoogleOAuthConfig = {
  clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
  scopes: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid',
  ],
};

/**
 * URLs de Google OAuth
 */
export const GOOGLE_OAUTH_URLS = {
  authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
  token: 'https://oauth2.googleapis.com/token',
  userinfo: 'https://www.googleapis.com/oauth2/v2/userinfo',
  revoke: 'https://oauth2.googleapis.com/revoke',
};

/**
 * Genera la URL de autorización de Google
 */
export function getGoogleAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_OAUTH_CONFIG.clientId,
    redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
    response_type: 'code',
    scope: GOOGLE_OAUTH_CONFIG.scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    ...(state && { state }),
  });

  return `${GOOGLE_OAUTH_URLS.authorize}?${params.toString()}`;
}

/**
 * Valida la configuración de Google OAuth
 */
export function validateGoogleOAuthConfig(): void {
  if (!GOOGLE_OAUTH_CONFIG.clientId) {
    throw new Error('GOOGLE_OAUTH_CLIENT_ID no está configurado');
  }
  if (!GOOGLE_OAUTH_CONFIG.clientSecret) {
    throw new Error('GOOGLE_OAUTH_CLIENT_SECRET no está configurado');
  }
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error('NEXT_PUBLIC_APP_URL no está configurado');
  }
}
```

#### Paso 2.3: Configuración de Proveedores
**Archivo**: `apps/web/src/lib/oauth/providers.ts`

```typescript
import { OAuthProvider } from '@/features/auth/types/oauth.types';
import { GOOGLE_OAUTH_CONFIG, getGoogleAuthUrl } from './google';

export interface OAuthProviderConfig {
  name: string;
  displayName: string;
  icon: string;
  color: string;
  getAuthUrl: (state?: string) => string;
}

export const OAUTH_PROVIDERS: Record<OAuthProvider, OAuthProviderConfig> = {
  google: {
    name: 'google',
    displayName: 'Google',
    icon: 'google',
    color: '#4285F4',
    getAuthUrl: getGoogleAuthUrl,
  },
  github: {
    name: 'github',
    displayName: 'GitHub',
    icon: 'github',
    color: '#24292e',
    getAuthUrl: () => {
      throw new Error('GitHub OAuth no implementado aún');
    },
  },
  facebook: {
    name: 'facebook',
    displayName: 'Facebook',
    icon: 'facebook',
    color: '#1877F2',
    getAuthUrl: () => {
      throw new Error('Facebook OAuth no implementado aún');
    },
  },
};

export function getProviderConfig(provider: OAuthProvider): OAuthProviderConfig {
  return OAUTH_PROVIDERS[provider];
}
```

---

### FASE 3: Servicios Backend ⏱️ 2 horas

#### Paso 3.1: Servicio Google OAuth
**Archivo**: `apps/web/src/features/auth/services/google-oauth.service.ts`

```typescript
import {
  GOOGLE_OAUTH_CONFIG,
  GOOGLE_OAUTH_URLS,
} from '@/lib/oauth/google';
import {
  OAuthProfile,
  OAuthTokens,
} from '../types/oauth.types';

export class GoogleOAuthService {
  /**
   * Intercambia el código de autorización por tokens
   */
  static async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    const params = new URLSearchParams({
      code,
      client_id: GOOGLE_OAUTH_CONFIG.clientId,
      client_secret: GOOGLE_OAUTH_CONFIG.clientSecret,
      redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
      grant_type: 'authorization_code',
    });

    const response = await fetch(GOOGLE_OAUTH_URLS.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error obteniendo tokens: ${error.error_description || error.error}`);
    }

    const data = await response.json();

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
      token_type: data.token_type,
      scope: data.scope,
    };
  }

  /**
   * Obtiene el perfil del usuario desde Google
   */
  static async getUserProfile(accessToken: string): Promise<OAuthProfile> {
    const response = await fetch(GOOGLE_OAUTH_URLS.userinfo, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error obteniendo perfil de usuario');
    }

    const data = await response.json();

    return {
      id: data.id || data.sub,
      email: data.email,
      name: data.name,
      given_name: data.given_name,
      family_name: data.family_name,
      picture: data.picture,
      email_verified: data.email_verified,
      locale: data.locale,
    };
  }

  /**
   * Refresca el access token usando el refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_OAUTH_CONFIG.clientId,
      client_secret: GOOGLE_OAUTH_CONFIG.clientSecret,
      grant_type: 'refresh_token',
    });

    const response = await fetch(GOOGLE_OAUTH_URLS.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error('Error refrescando access token');
    }

    const data = await response.json();

    return {
      access_token: data.access_token,
      expires_at: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
      token_type: data.token_type,
      scope: data.scope,
    };
  }

  /**
   * Revoca el access token
   */
  static async revokeToken(token: string): Promise<void> {
    const params = new URLSearchParams({ token });

    await fetch(GOOGLE_OAUTH_URLS.revoke, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
  }
}
```

#### Paso 3.2: Servicio OAuth General
**Archivo**: `apps/web/src/features/auth/services/oauth.service.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { OAuthAccount, OAuthProvider, OAuthTokens } from '../types/oauth.types';

export class OAuthService {
  /**
   * Crea o actualiza una cuenta OAuth
   */
  static async upsertOAuthAccount(
    userId: string,
    provider: OAuthProvider,
    providerAccountId: string,
    tokens: OAuthTokens
  ): Promise<OAuthAccount> {
    const supabase = await createClient();

    const expiresAt = tokens.expires_at ? new Date(tokens.expires_at) : null;

    const { data, error } = await supabase
      .from('oauth_accounts')
      .upsert(
        {
          user_id: userId,
          provider,
          provider_account_id: providerAccountId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: expiresAt,
          scope: tokens.scope,
          token_type: tokens.token_type,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'provider,provider_account_id',
        }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Error guardando cuenta OAuth: ${error.message}`);
    }

    return data as OAuthAccount;
  }

  /**
   * Busca una cuenta OAuth por proveedor y ID de proveedor
   */
  static async findOAuthAccount(
    provider: OAuthProvider,
    providerAccountId: string
  ): Promise<OAuthAccount | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('oauth_accounts')
      .select('*')
      .eq('provider', provider)
      .eq('provider_account_id', providerAccountId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw new Error(`Error buscando cuenta OAuth: ${error.message}`);
    }

    return data as OAuthAccount;
  }

  /**
   * Busca cuentas OAuth por usuario
   */
  static async findOAuthAccountsByUser(userId: string): Promise<OAuthAccount[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('oauth_accounts')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Error buscando cuentas OAuth: ${error.message}`);
    }

    return data as OAuthAccount[];
  }

  /**
   * Elimina una cuenta OAuth
   */
  static async deleteOAuthAccount(
    provider: OAuthProvider,
    providerAccountId: string
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('oauth_accounts')
      .delete()
      .eq('provider', provider)
      .eq('provider_account_id', providerAccountId);

    if (error) {
      throw new Error(`Error eliminando cuenta OAuth: ${error.message}`);
    }
  }

  /**
   * Verifica si un email ya está registrado
   */
  static async findUserByEmail(email: string): Promise<any | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('users')
      .select('id, email, username, first_name, last_name, email_verified')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw new Error(`Error buscando usuario: ${error.message}`);
    }

    return data;
  }

  /**
   * Crea un nuevo usuario desde perfil OAuth
   */
  static async createUserFromOAuth(
    email: string,
    firstName: string,
    lastName: string,
    profilePicture?: string
  ): Promise<string> {
    const supabase = await createClient();

    // Generar username único basado en email
    const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    let username = baseUsername;
    let attempts = 0;

    // Intentar hasta encontrar username disponible
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (!existing) break;

      attempts++;
      username = `${baseUsername}${Math.floor(Math.random() * 10000)}`;
    }

    const userId = crypto.randomUUID();

    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`.trim(),
        email_verified: true, // OAuth emails ya están verificados
        profile_picture_url: profilePicture || null,
        password_hash: null, // No hay contraseña para usuarios OAuth
        cargo_rol: 'Usuario',
        type_rol: 'Usuario',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creando usuario: ${error.message}`);
    }

    return userId;
  }
}
```

---

### FASE 4: Server Actions ⏱️ 1 hora

#### Paso 4.1: Actions de OAuth
**Archivo**: `apps/web/src/features/auth/actions/oauth.ts`

```typescript
'use server';

import { redirect } from 'next/navigation';
import { GoogleOAuthService } from '../services/google-oauth.service';
import { OAuthService } from '../services/oauth.service';
import { SessionService } from '../services/session.service';
import { AuthService } from '../services/auth.service';
import { OAuthCallbackParams } from '../types/oauth.types';

/**
 * Inicia el flujo de autenticación con Google
 */
export async function initiateGoogleLogin() {
  try {
    const { getGoogleAuthUrl } = await import('@/lib/oauth/google');

    // Generar state para prevenir CSRF
    const state = crypto.randomUUID();

    // TODO: Guardar state en sesión temporal para validar después

    const authUrl = getGoogleAuthUrl(state);

    redirect(authUrl);
  } catch (error) {
    console.error('Error iniciando login con Google:', error);
    return { error: 'Error al iniciar sesión con Google' };
  }
}

/**
 * Maneja el callback de Google OAuth
 */
export async function handleGoogleCallback(params: OAuthCallbackParams) {
  try {
    // Validar que no haya errores
    if (params.error) {
      return {
        error: params.error_description || 'Error de autenticación',
      };
    }

    if (!params.code) {
      return { error: 'Código de autorización no recibido' };
    }

    // TODO: Validar state para prevenir CSRF

    // PASO 1: Intercambiar código por tokens
    const tokens = await GoogleOAuthService.exchangeCodeForTokens(params.code);

    // PASO 2: Obtener perfil de usuario
    const profile = await GoogleOAuthService.getUserProfile(tokens.access_token);

    if (!profile.email) {
      return { error: 'No se pudo obtener el email del usuario' };
    }

    // PASO 3: Buscar si el usuario ya existe
    let userId: string;
    let isNewUser = false;

    const existingUser = await OAuthService.findUserByEmail(profile.email);

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // PASO 4: Crear nuevo usuario
      userId = await OAuthService.createUserFromOAuth(
        profile.email,
        profile.given_name || profile.name.split(' ')[0] || 'Usuario',
        profile.family_name || profile.name.split(' ').slice(1).join(' ') || '',
        profile.picture
      );
      isNewUser = true;
    }

    // PASO 5: Guardar/actualizar cuenta OAuth
    await OAuthService.upsertOAuthAccount(
      userId,
      'google',
      profile.id,
      tokens
    );

    // PASO 6: Crear sesión usando el sistema existente
    await SessionService.createSession(userId, false);

    // PASO 7: Limpiar sesiones expiradas
    await AuthService.clearExpiredSessions();

    // PASO 8: Redirigir según sea usuario nuevo o existente
    if (isNewUser) {
      redirect('/dashboard?welcome=true');
    } else {
      redirect('/dashboard');
    }
  } catch (error) {
    console.error('Error en callback de Google:', error);
    return {
      error: 'Error procesando autenticación. Inténtalo de nuevo.',
    };
  }
}
```

---

### FASE 5: API Route para Callback ⏱️ 30 min

#### Paso 5.1: Route Handler de Google Callback
**Archivo**: `apps/web/src/app/api/auth/callback/google/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { handleGoogleCallback } from '@/features/auth/actions/oauth';

/**
 * GET /api/auth/callback/google
 *
 * Maneja el callback de Google OAuth después de la autorización
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Llamar a la server action
    const result = await handleGoogleCallback({
      code: code || '',
      state: state || undefined,
      error: error || undefined,
      error_description: errorDescription || undefined,
    });

    // Si hay error, redirigir a login con mensaje de error
    if (result && 'error' in result) {
      return NextResponse.redirect(
        new URL(`/auth?error=${encodeURIComponent(result.error)}`, request.url)
      );
    }

    // El éxito se maneja con redirect en handleGoogleCallback
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Error en callback route:', error);

    return NextResponse.redirect(
      new URL('/auth?error=callback_error', request.url)
    );
  }
}
```

---

### FASE 6: Componentes UI ⏱️ 2 horas

#### Paso 6.1: Botón de Google Login
**Archivo**: `apps/web/src/features/auth/components/GoogleLoginButton/GoogleLoginButton.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { initiateGoogleLogin } from '../../actions/oauth';

// SVG del logo de Google
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17.64 9.20443C17.64 8.56625 17.5827 7.95262 17.4764 7.36353H9V10.8449H13.8436C13.635 11.9699 13.0009 12.9231 12.0477 13.5613V15.8194H14.9564C16.6582 14.2526 17.64 11.9453 17.64 9.20443Z"
      fill="#4285F4"
    />
    <path
      d="M8.99976 18C11.4298 18 13.467 17.1941 14.9561 15.8195L12.0475 13.5613C11.2416 14.1013 10.2107 14.4204 8.99976 14.4204C6.65567 14.4204 4.67158 12.8372 3.96385 10.71H0.957031V13.0418C2.43794 15.9831 5.48158 18 8.99976 18Z"
      fill="#34A853"
    />
    <path
      d="M3.96409 10.7098C3.78409 10.1698 3.68182 9.59301 3.68182 8.99983C3.68182 8.40665 3.78409 7.82983 3.96409 7.28983V4.95801H0.957273C0.347727 6.17301 0 7.54756 0 8.99983C0 10.4521 0.347727 11.8266 0.957273 13.0416L3.96409 10.7098Z"
      fill="#FBBC05"
    />
    <path
      d="M8.99976 3.57955C10.3211 3.57955 11.5075 4.03364 12.4402 4.92545L15.0216 2.34409C13.4629 0.891818 11.4257 0 8.99976 0C5.48158 0 2.43794 2.01682 0.957031 4.95818L3.96385 7.29C4.67158 5.16273 6.65567 3.57955 8.99976 3.57955Z"
      fill="#EA4335"
    />
  </svg>
);

export function GoogleLoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await initiateGoogleLogin();
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className="
        w-full px-4 py-2.5 rounded-lg
        bg-white dark:bg-gray-800
        border-2 border-gray-300 dark:border-gray-600
        text-gray-700 dark:text-gray-200
        font-medium text-sm
        hover:bg-gray-50 dark:hover:bg-gray-700
        hover:border-gray-400 dark:hover:border-gray-500
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        flex items-center justify-center space-x-3
      "
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Conectando...</span>
        </>
      ) : (
        <>
          <GoogleIcon />
          <span>Continuar con Google</span>
        </>
      )}
    </button>
  );
}
```

#### Paso 6.2: Contenedor de Botones Sociales
**Archivo**: `apps/web/src/features/auth/components/SocialLoginButtons/SocialLoginButtons.tsx`

```typescript
'use client';

import { GoogleLoginButton } from '../GoogleLoginButton/GoogleLoginButton';

export function SocialLoginButtons() {
  return (
    <div className="space-y-3">
      {/* Divisor "O continuar con" */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
            O continuar con
          </span>
        </div>
      </div>

      {/* Botones de providers */}
      <GoogleLoginButton />

      {/* Espacio para futuros providers */}
      {/* <GitHubLoginButton /> */}
      {/* <FacebookLoginButton /> */}
    </div>
  );
}
```

#### Paso 6.3: Integrar en LoginForm
**Modificar**: `apps/web/src/features/auth/components/LoginForm/LoginForm.tsx`

```typescript
// Agregar import
import { SocialLoginButtons } from '../SocialLoginButtons/SocialLoginButtons';

// Agregar después del botón de submit, antes del link de forgot password:

{/* Botones de login social */}
<SocialLoginButtons />
```

#### Paso 6.4: Integrar en AuthTabs
**Modificar**: `apps/web/src/features/auth/components/AuthTabs/AuthTabs.tsx`

```typescript
// Agregar import
import { SocialLoginButtons } from '../SocialLoginButtons/SocialLoginButtons';

// En el tab de Register, agregar al inicio (antes del formulario):

<div className="mb-6">
  <SocialLoginButtons />

  {/* Divisor */}
  <div className="relative my-6">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
    </div>
    <div className="relative flex justify-center text-sm">
      <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
        O regístrate con email
      </span>
    </div>
  </div>
</div>
```

---

### FASE 7: Testing y Validación ⏱️ 1 hora

#### Paso 7.1: Crear Script de Prueba
**Archivo**: `apps/web/scripts/test-oauth-flow.md`

```markdown
# Script de Prueba - OAuth con Google

## Pre-requisitos
- [ ] Tabla `oauth_accounts` creada
- [ ] Tabla `users` modificada (password_hash nullable)
- [ ] Variables de entorno configuradas
- [ ] Google OAuth configurado en Google Cloud Console

## Flujo 1: Nuevo Usuario con Google

1. **Navegar a Login**
   - URL: http://localhost:3000/auth
   - Verificar que se muestra botón "Continuar con Google"

2. **Click en Botón Google**
   - Estado de loading debe mostrarse
   - Redirección a Google OAuth

3. **Autorizar en Google**
   - Seleccionar cuenta Google
   - Aceptar permisos (email, profile, openid)

4. **Callback**
   - Debe redirigir a: /api/auth/callback/google?code=...
   - Verificar loading durante procesamiento

5. **Dashboard**
   - Debe redirigir a: /dashboard?welcome=true
   - Usuario debe estar autenticado

6. **Verificar en Base de Datos**
   ```sql
   -- Verificar usuario creado
   SELECT id, username, email, first_name, last_name, email_verified, password_hash
   FROM users
   WHERE email = 'tu-email@gmail.com';

   -- Verificar cuenta OAuth creada
   SELECT user_id, provider, provider_account_id
   FROM oauth_accounts
   WHERE provider = 'google';

   -- Verificar sesión creada
   SELECT user_id, jwt_id, expires_at, revoked
   FROM user_session
   WHERE user_id = 'id-del-usuario';
   ```

## Flujo 2: Usuario Existente con Google

1. **Registrar usuario manualmente**
   - Usar formulario de registro
   - Email: mismo que cuenta Google

2. **Logout**

3. **Login con Google**
   - Click en "Continuar con Google"
   - Autorizar

4. **Verificar**
   - Debe vincular cuenta Google a usuario existente
   - No crear usuario duplicado
   - Redirección a /dashboard (sin ?welcome=true)

5. **Verificar en Base de Datos**
   ```sql
   -- Verificar que NO se creó usuario duplicado
   SELECT COUNT(*) FROM users WHERE email = 'tu-email@gmail.com';
   -- Debe retornar 1

   -- Verificar cuenta OAuth vinculada
   SELECT * FROM oauth_accounts WHERE user_id = 'id-del-usuario';
   ```

## Flujo 3: Manejo de Errores

### Error 1: Usuario cancela en Google
- Click en botón Google
- En pantalla de Google, click "Cancelar"
- Debe redirigir a /auth con mensaje de error

### Error 2: Token inválido
- Modificar URL de callback manualmente
- Debe mostrar error apropiado

### Error 3: Email no disponible
- Cuenta Google sin email público
- Debe mostrar error claro

## Checklist de Validación

### Funcionalidad
- [ ] Botón Google se muestra correctamente
- [ ] Loading state funciona
- [ ] Redirección a Google funciona
- [ ] Callback procesa correctamente
- [ ] Crea nuevo usuario si no existe
- [ ] Vincula cuenta si usuario existe
- [ ] Crea sesión correctamente
- [ ] Redirecciona a dashboard

### Base de Datos
- [ ] Usuario se crea con email_verified = true
- [ ] password_hash es NULL para usuarios OAuth
- [ ] username se genera automáticamente sin conflictos
- [ ] Cuenta OAuth se guarda con todos los campos
- [ ] Tokens se almacenan correctamente
- [ ] No hay usuarios duplicados

### Seguridad
- [ ] Tokens no se exponen en URLs
- [ ] Sesión es HTTP-only
- [ ] CSRF protection con state (cuando se implemente)
- [ ] Tokens en DB están seguros

### UX
- [ ] Diseño consistente con login actual
- [ ] Modo dark funciona
- [ ] Responsive en mobile
- [ ] Mensajes de error claros
- [ ] Estados de loading apropiados
```

---

### FASE 8: Mejoras Opcionales ⏱️ Variable

#### Paso 8.1: CSRF Protection con State

**Modificar**: `apps/web/src/features/auth/actions/oauth.ts`

```typescript
// Implementar guardado y validación de state
// Usar cookies o sesión temporal para guardar state
```

#### Paso 8.2: Actualización Automática de Perfil

**Crear**: Hook para sincronizar datos de perfil desde Google

```typescript
// Hook que actualiza foto y nombre desde Google periódicamente
```

#### Paso 8.3: Manejo de Múltiples Proveedores

**Crear**: Página de gestión de cuentas vinculadas

```typescript
// /dashboard/settings/connected-accounts
// Mostrar todas las cuentas OAuth vinculadas
// Permitir desvincular (con validación de que tenga al menos un método de login)
```

#### Paso 8.4: Refrescar Tokens Automáticamente

**Crear**: Background job para refrescar tokens antes de expirar

```typescript
// Cron job o webhook que refresca tokens
// Actualiza token_expires_at en oauth_accounts
```

---

## 📊 Estimación de Tiempos

| Fase | Descripción | Tiempo Estimado | Prioridad |
|------|-------------|-----------------|-----------|
| Fase 1 | Base de Datos | 30 min | 🔴 Alta |
| Fase 2 | Tipos y Config | 45 min | 🔴 Alta |
| Fase 3 | Servicios Backend | 2 horas | 🔴 Alta |
| Fase 4 | Server Actions | 1 hora | 🔴 Alta |
| Fase 5 | API Routes | 30 min | 🔴 Alta |
| Fase 6 | Componentes UI | 2 horas | 🔴 Alta |
| Fase 7 | Testing | 1 hora | 🟡 Media |
| Fase 8 | Mejoras Opcionales | Variable | 🟢 Baja |
| **TOTAL** | **Sin opcionales** | **~8 horas** | - |

---

## ✅ Checklist de Implementación

### Pre-requisitos
- [ ] Desarrollador completó configuración en Google Cloud Console
- [ ] Variables de entorno agregadas a .env.local
- [ ] Script de base de datos ejecutado en Supabase
- [ ] Validar que password_hash es nullable

### Fase 1: Base de Datos
- [ ] Tabla `oauth_accounts` creada
- [ ] Índices creados
- [ ] Tabla `users` modificada
- [ ] Scripts SQL validados

### Fase 2: Tipos y Config
- [ ] `oauth.types.ts` creado
- [ ] `google.ts` config creado
- [ ] `providers.ts` creado
- [ ] Validación de env funcionando

### Fase 3: Servicios
- [ ] `google-oauth.service.ts` implementado
- [ ] `oauth.service.ts` implementado
- [ ] Métodos probados individualmente

### Fase 4: Server Actions
- [ ] `oauth.ts` actions creadas
- [ ] `initiateGoogleLogin` funcional
- [ ] `handleGoogleCallback` funcional

### Fase 5: API Routes
- [ ] Route `/api/auth/callback/google` creada
- [ ] Manejo de errores implementado

### Fase 6: Componentes UI
- [ ] `GoogleLoginButton` creado
- [ ] `SocialLoginButtons` creado
- [ ] Integrado en `LoginForm`
- [ ] Integrado en `AuthTabs`
- [ ] Estilos consistentes con diseño actual

### Fase 7: Testing
- [ ] Flujo completo de nuevo usuario probado
- [ ] Flujo de usuario existente probado
- [ ] Manejo de errores validado
- [ ] Base de datos verificada
- [ ] UX validada en mobile y desktop

### Fase 8: Mejoras (Opcional)
- [ ] CSRF protection implementado
- [ ] Sincronización de perfil
- [ ] Gestión de cuentas vinculadas
- [ ] Refresh automático de tokens

---

## 🚨 Consideraciones Importantes

### Seguridad

1. **NUNCA exponer tokens en logs o cliente**
   - Tokens OAuth deben permanecer en servidor
   - No incluir en responses al cliente

2. **Validar emails duplicados**
   - Verificar que email no exista antes de crear usuario
   - Vincular cuenta si usuario ya existe

3. **CSRF Protection**
   - Implementar validación de state parameter
   - Usar cookies seguras para state

4. **Tokens expirados**
   - Implementar refresh automático
   - Manejar errores de token expirado

### UX

1. **Mensajes claros**
   - Indicar cuando se está procesando OAuth
   - Mostrar errores específicos y accionables

2. **Consistencia visual**
   - Mantener diseño consistente con login actual
   - Respetar modo dark

3. **Mobile first**
   - Probar en dispositivos móviles
   - Popup de Google debe funcionar correctamente

### Performance

1. **Caching**
   - No cachear respuestas con tokens
   - Usar revalidación apropiada

2. **Optimización**
   - Minimizar llamadas a API de Google
   - Usar refresh token cuando sea posible

---

## 📚 Referencias y Recursos

### Documentación Oficial

- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Google OAuth Playground](https://developers.google.com/oauthplayground/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

### Herramientas Útiles

- [JWT.io](https://jwt.io/) - Decodificar ID tokens
- [Postman](https://www.postman.com/) - Probar flujo OAuth manualmente

### Testing

```bash
# Probar en desarrollo
npm run dev

# Verificar variables de entorno
node -e "console.log(process.env.GOOGLE_OAUTH_CLIENT_ID)"
```

---

## 🎯 Métricas de Éxito

### Funcionales
- ✅ Usuario puede registrarse con Google en < 30 segundos
- ✅ Usuario puede iniciar sesión con Google en < 15 segundos
- ✅ No se crean usuarios duplicados
- ✅ Sesión persiste correctamente

### Técnicas
- ✅ Tiempo de respuesta de callback < 2 segundos
- ✅ 0 errores en producción durante primera semana
- ✅ Cobertura de testing > 80%

### UX
- ✅ Diseño consistente con sistema actual
- ✅ Funciona en todos los navegadores principales
- ✅ Mobile responsive

---

**Última actualización**: 26 de octubre de 2025
**Versión**: 1.0
**Status**: Listo para implementación
