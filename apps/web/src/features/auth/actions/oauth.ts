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
