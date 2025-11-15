'use server';

import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import validator from 'validator';
import crypto from 'crypto';
import { getBaseUrl } from '@/lib/env';
import { logger } from '@/lib/logger';
import { GoogleOAuthService } from '../services/google-oauth.service';
import { OAuthService } from '../services/oauth.service';
import { SessionService } from '../services/session.service';
import { RefreshTokenService } from '../../../lib/auth/refreshToken.service';
import { SECURE_COOKIE_OPTIONS, getCustomCookieOptions } from '../../../lib/auth/cookie-config';
import { AuthService } from '../services/auth.service';
import { OAuthCallbackParams } from '../types/oauth.types';
import { QuestionnaireValidationService } from '../services/questionnaire-validation.service';

/**
 * Inicia el flujo de autenticación con Google
 */
export async function initiateGoogleLogin() {
  const { getGoogleAuthUrl } = await import('@/lib/oauth/google');

  // ✅ SEGURIDAD: Generar state CSRF con 32 bytes de entropía
  const stateBuffer = crypto.randomBytes(32);
  const state = stateBuffer.toString('base64url');
  
  logger.auth('OAuth: Generando state CSRF', { stateLength: state.length });

  // ✅ SEGURIDAD: Guardar state en cookie HttpOnly para validación posterior
  const cookieStore = await cookies();
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60, // 10 minutos (expira si no se completa el flujo)
    path: '/',
  });

  logger.debug('State CSRF guardado en cookie');

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
    logger.auth('Iniciando OAuth callback');

    // Validar que no haya errores
    if (params.error) {
      logger.error('Error del proveedor OAuth', undefined, { error: params.error });
      return {
        error: params.error_description || 'Error de autenticación',
      };
    }

    if (!params.code) {
      logger.error('Código de autorización no recibido');
      return { error: 'Código de autorización no recibido' };
    }

    logger.debug('Código de autorización recibido');

    // ✅ SEGURIDAD: Validar state CSRF para prevenir ataques
    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state')?.value;
    const receivedState = params.state;

    logger.debug('Validando state CSRF', { 
      hasStoredState: !!storedState, 
      hasReceivedState: !!receivedState 
    });

    if (!storedState) {
      logger.error('CSRF: State no encontrado en cookie (posible ataque o sesión expirada)');
      return { 
        error: 'Sesión de autenticación expirada. Por favor, inicia el proceso nuevamente.' 
      };
    }

    if (!receivedState) {
      logger.error('CSRF: State no recibido del proveedor OAuth (posible manipulación)');
      return { 
        error: 'Error de validación de seguridad. Intenta nuevamente.' 
      };
    }

    if (storedState !== receivedState) {
      logger.error('CSRF: State mismatch detectado', { 
        storedLength: storedState.length, 
        receivedLength: receivedState.length 
      });
      return { 
        error: 'Error de validación de seguridad. Posible ataque CSRF detectado.' 
      };
    }

    logger.auth('State CSRF validado exitosamente');

    // ✅ SEGURIDAD: Limpiar cookie de state después de validación
    cookieStore.delete('oauth_state');
    logger.debug('Cookie de state CSRF eliminada')

    // PASO 1: Intercambiar código por tokens
    logger.info('OAuth: Intercambiando código por tokens');
    const tokens = await GoogleOAuthService.exchangeCodeForTokens(params.code);
    logger.info('OAuth: Tokens obtenidos exitosamente');

    // PASO 2: Obtener perfil de usuario
    logger.info('OAuth: Obteniendo perfil de usuario');
    const profile = await GoogleOAuthService.getUserProfile(tokens.access_token);
    logger.auth('Perfil obtenido', { hasEmail: !!profile.email, hasName: !!profile.name });

    // Validar que el email existe y tiene formato válido
    if (!profile.email) {
      logger.error('Email no disponible en el perfil OAuth');
      return { error: 'No se pudo obtener el email del usuario' };
    }

    if (!validator.isEmail(profile.email)) {
      logger.error('Email con formato inválido');
      return { error: 'El email proporcionado no tiene un formato válido' };
    }

    // PASO 3: Buscar si el usuario ya existe
    logger.info('OAuth: Buscando usuario existente');
    let userId: string;
    let isNewUser = false;

    const existingUser = await OAuthService.findUserByEmail(profile.email);

    if (existingUser) {
      logger.auth('Usuario existente encontrado');
      userId = existingUser.id;
    } else {
      // PASO 4: Crear nuevo usuario
      logger.info('OAuth: Creando nuevo usuario');
      userId = await OAuthService.createUserFromOAuth(
        profile.email,
        profile.given_name || profile.name.split(' ')[0] || 'Usuario',
        profile.family_name || profile.name.split(' ').slice(1).join(' ') || '',
        profile.picture
      );
      logger.auth('Nuevo usuario creado exitosamente');
      isNewUser = true;
    }

    // PASO 5: Guardar/actualizar cuenta OAuth
    logger.info('OAuth: Guardando cuenta OAuth');
    await OAuthService.upsertOAuthAccount(
      userId,
      'google',
      profile.id,
      tokens
    );
    logger.info('OAuth: Cuenta OAuth guardada');

    // PASO 6: Crear sesión usando el sistema existente
    logger.info('OAuth: Creando sesión');
    // Reutilizar cookieStore obtenido anteriormente para validar CSRF
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || 'unknown';
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') ||
               'unknown';

    // Crear Request mock para RefreshTokenService
    const requestHeaders = new Headers();
    requestHeaders.set('user-agent', userAgent);
    requestHeaders.set('x-real-ip', ip);
    const mockRequest = new Request('http://localhost', {
      headers: requestHeaders
    });

    // Crear sesión con refresh tokens
    const sessionInfo = await RefreshTokenService.createSession(
      userId,
      false,
      mockRequest
    );

    // Establecer cookies de refresh tokens directamente en el Server Action
    cookieStore.set('access_token', sessionInfo.accessToken, {
      ...SECURE_COOKIE_OPTIONS,
      expires: sessionInfo.accessExpiresAt,
    });

    cookieStore.set('refresh_token', sessionInfo.refreshToken, {
      ...SECURE_COOKIE_OPTIONS,
      expires: sessionInfo.refreshExpiresAt,
    });

    // Crear sesión legacy (user_session) para compatibilidad
    const legacySession = await SessionService.createLegacySession(userId, false);

    // Establecer cookie legacy directamente en el Server Action
    const maxAge = 7 * 24 * 60 * 60; // 7 días
    cookieStore.set('aprende-y-aplica-session', legacySession.sessionToken, {
      ...getCustomCookieOptions(maxAge),
      expires: legacySession.expiresAt,
    });

    logger.auth('Sesión creada exitosamente');

    // PASO 7: Limpiar sesiones expiradas
    logger.debug('Limpiando sesiones expiradas');
    await AuthService.clearExpiredSessions();
    logger.debug('Sesiones expiradas limpiadas');

    // PASO 8: Crear notificación de login (con timeout para no bloquear demasiado)
    // Reutilizar ip y userAgent ya obtenidos en PASO 6
    try {
      logger.info('🔔 Iniciando creación de notificación de login OAuth', { userId });
      const { AutoNotificationsService } = await import('../../notifications/services/auto-notifications.service');
      
      // Usar Promise.race con timeout para no bloquear más de 2 segundos
      await Promise.race([
        AutoNotificationsService.notifyLoginSuccess(userId, ip, userAgent, {
          isOAuth: true,
          isNewUser,
          timestamp: new Date().toISOString()
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000)
        )
      ]).catch((error) => {
        // Si es timeout, continuar sin bloquear
        if (error instanceof Error && error.message === 'Timeout') {
          logger.warn('⏱️ Timeout en notificación de login OAuth, continuando', { userId });
        } else {
          logger.error('❌ Error en notificación de login OAuth:', {
            userId,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      });
      logger.info('✅ Notificación de login OAuth procesada', { userId });
    } catch (notificationError) {
      // Log del error pero no bloquear el flujo
      logger.error('❌ Error en notificación de login OAuth:', {
        userId,
        error: notificationError instanceof Error ? notificationError.message : String(notificationError)
      });
    }

    // PASO 9: Verificar si necesita cuestionario y redirigir apropiadamente
    logger.info('OAuth: Proceso completado', { isNewUser });

    // Verificar si el usuario necesita completar el cuestionario
    const requiresQuestionnaire = await QuestionnaireValidationService.requiresQuestionnaire(userId);

    if (isNewUser) {
      // Usuario nuevo de Google OAuth siempre necesita cuestionario
      logger.info('Redirigiendo usuario nuevo OAuth a pantalla de bienvenida');
      redirect('/welcome?oauth=google');
    } else if (requiresQuestionnaire) {
      // Usuario existente sin cuestionario completado
      logger.info('Redirigiendo usuario existente OAuth sin cuestionario a bienvenida');
      redirect('/welcome?oauth=google');
    } else {
      // Usuario existente con cuestionario completado
      logger.info('Redirigiendo a dashboard');
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
    logger.error('Error en callback OAuth', error);
    return {
      error: 'Error procesando autenticación. Inténtalo de nuevo.',
    };
  }
}
