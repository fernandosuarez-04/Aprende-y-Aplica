'use server';

import { redirect } from 'next/navigation';
import validator from 'validator';
import { GoogleOAuthService } from '../services/google-oauth.service';
import { OAuthService } from '../services/oauth.service';
import { SessionService } from '../services/session.service';
import { AuthService } from '../services/auth.service';
import { OAuthCallbackParams } from '../types/oauth.types';

/**
 * Inicia el flujo de autenticación con Google
 */
export async function initiateGoogleLogin() {
  const { getGoogleAuthUrl } = await import('@/lib/oauth/google');

  // Generar state para prevenir CSRF
  const state = crypto.randomUUID();

  // TODO: Guardar state en sesión temporal para validar después

  const authUrl = getGoogleAuthUrl(state);

  // redirect() lanza un error especial NEXT_REDIRECT que es manejado por Next.js
  // No necesitamos try-catch aquí porque es el comportamiento esperado
  redirect(authUrl);
}

/**
 * Maneja el callback de Google OAuth
 */
export async function handleGoogleCallback(params: OAuthCallbackParams) {
  try {
    console.log('🚀 [OAuth] Iniciando handleGoogleCallback');

    // Validar que no haya errores
    if (params.error) {
      console.error('❌ [OAuth] Error del proveedor:', params.error);
      return {
        error: params.error_description || 'Error de autenticación',
      };
    }

    if (!params.code) {
      console.error('❌ [OAuth] Código de autorización no recibido');
      return { error: 'Código de autorización no recibido' };
    }

    console.log('✅ [OAuth] Código recibido:', params.code.substring(0, 20) + '...');

    // TODO: Validar state para prevenir CSRF

    // PASO 1: Intercambiar código por tokens
    console.log('🔄 [OAuth] Paso 1: Intercambiando código por tokens...');
    const tokens = await GoogleOAuthService.exchangeCodeForTokens(params.code);
    console.log('✅ [OAuth] Tokens obtenidos');

    // PASO 2: Obtener perfil de usuario
    console.log('🔄 [OAuth] Paso 2: Obteniendo perfil de usuario...');
    const profile = await GoogleOAuthService.getUserProfile(tokens.access_token);
    console.log('✅ [OAuth] Perfil obtenido:', { email: profile.email, name: profile.name });

    // Validar que el email existe y tiene formato válido
    if (!profile.email) {
      console.error('❌ [OAuth] Email no disponible en el perfil');
      return { error: 'No se pudo obtener el email del usuario' };
    }

    if (!validator.isEmail(profile.email)) {
      console.error('❌ [OAuth] Email con formato inválido:', profile.email);
      return { error: 'El email proporcionado no tiene un formato válido' };
    }

    // PASO 3: Buscar si el usuario ya existe
    console.log('🔄 [OAuth] Paso 3: Buscando usuario existente...');
    let userId: string;
    let isNewUser = false;

    const existingUser = await OAuthService.findUserByEmail(profile.email);

    if (existingUser) {
      console.log('✅ [OAuth] Usuario existente encontrado:', existingUser.id);
      userId = existingUser.id;
    } else {
      // PASO 4: Crear nuevo usuario
      console.log('🔄 [OAuth] Paso 4: Creando nuevo usuario...');
      userId = await OAuthService.createUserFromOAuth(
        profile.email,
        profile.given_name || profile.name.split(' ')[0] || 'Usuario',
        profile.family_name || profile.name.split(' ').slice(1).join(' ') || '',
        profile.picture
      );
      console.log('✅ [OAuth] Nuevo usuario creado:', userId);
      isNewUser = true;
    }

    // PASO 5: Guardar/actualizar cuenta OAuth
    console.log('🔄 [OAuth] Paso 5: Guardando cuenta OAuth...');
    await OAuthService.upsertOAuthAccount(
      userId,
      'google',
      profile.id,
      tokens
    );
    console.log('✅ [OAuth] Cuenta OAuth guardada');

    // PASO 6: Crear sesión usando el sistema existente
    console.log('🔄 [OAuth] Paso 6: Creando sesión...');
    await SessionService.createSession(userId, false);
    console.log('✅ [OAuth] Sesión creada exitosamente');

    // PASO 7: Limpiar sesiones expiradas
    console.log('🔄 [OAuth] Paso 7: Limpiando sesiones expiradas...');
    await AuthService.clearExpiredSessions();
    console.log('✅ [OAuth] Sesiones expiradas limpiadas');

    // PASO 8: Redirigir según sea usuario nuevo o existente
    console.log('🔄 [OAuth] Paso 8: Redirigiendo a dashboard...');
    console.log('📊 [OAuth] isNewUser:', isNewUser);

    if (isNewUser) {
      console.log('➡️ [OAuth] Redirigiendo a /dashboard?welcome=true');
      redirect('/dashboard?welcome=true');
    } else {
      console.log('➡️ [OAuth] Redirigiendo a /dashboard');
      redirect('/dashboard');
    }
  } catch (error) {
    // Verificar si es una redirección de Next.js (no es un error real)
    if (error && typeof error === 'object' && 'digest' in error) {
      const digest = (error as any).digest;
      if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
        // Es una redirección exitosa, relanzar para que Next.js la maneje
        throw error;
      }
    }

    // Solo es un error real si llegamos aquí
    console.error('Error en callback de Google:', error);
    return {
      error: 'Error procesando autenticación. Inténtalo de nuevo.',
    };
  }
}
