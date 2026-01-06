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
import { MicrosoftOAuthService } from '../services/microsoft-oauth.service';
import { createClient } from '../../../lib/supabase/server';
import {
  validateInvitationAction,
  findInvitationByEmailAction,
  consumeInvitationAction
} from './invitation';

/**
 * Parámetros para iniciar OAuth con contexto de organización
 */
interface OAuthInitParams {
  organizationId?: string;
  organizationSlug?: string;
  invitationToken?: string;
}

/**
 * Inicia el flujo de autenticación con Google
 */
export async function initiateGoogleLogin(params: OAuthInitParams = {}) {
  const { getGoogleAuthUrl } = await import('@/lib/oauth/google');

  // ✅ SEGURIDAD: Generar state CSRF con 32 bytes de entropía
  const stateBuffer = crypto.randomBytes(32);
  const csrfToken = stateBuffer.toString('base64url');

  // Crear state con contexto de organización (si existe)
  let state: string;
  if (params.organizationId || params.invitationToken) {
    // Incluir contexto de organización en el state
    const stateData = {
      csrf: csrfToken,
      orgId: params.organizationId,
      orgSlug: params.organizationSlug,
      invToken: params.invitationToken,
    };
    state = Buffer.from(JSON.stringify(stateData)).toString('base64url');
  } else {
    state = csrfToken;
  }

  logger.auth('OAuth: Generando state CSRF', { stateLength: state.length, hasOrgContext: !!params.organizationId });

  // ✅ SEGURIDAD: Guardar CSRF token en cookie HttpOnly para validación posterior
  const cookieStore = await cookies();
  cookieStore.set('oauth_state', csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60, // 10 minutos (expira si no se completa el flujo)
    path: '/',
  });

  // Guardar contexto de organización en cookie separada (si existe)
  if (params.organizationId || params.invitationToken) {
    const orgContext = {
      orgId: params.organizationId,
      orgSlug: params.organizationSlug,
      invToken: params.invitationToken,
    };
    cookieStore.set('oauth_org_context', JSON.stringify(orgContext), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60,
      path: '/',
    });
  }

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
    const orgContextCookie = cookieStore.get('oauth_org_context')?.value;

    logger.debug('Validando state CSRF', {
      hasStoredState: !!storedState,
      hasReceivedState: !!receivedState,
      hasOrgContext: !!orgContextCookie
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

    // Extraer CSRF token del state (puede ser simple o con contexto de organización)
    let csrfFromState = receivedState;
    try {
      const decoded = Buffer.from(receivedState, 'base64url').toString('utf-8');
      const stateData = JSON.parse(decoded);
      if (stateData.csrf) {
        csrfFromState = stateData.csrf;
      }
    } catch {
      // El state es el token CSRF simple
      csrfFromState = receivedState;
    }

    if (storedState !== csrfFromState) {
      logger.error('CSRF: State mismatch detectado', {
        storedLength: storedState.length,
        receivedLength: csrfFromState.length
      });
      return {
        error: 'Error de validación de seguridad. Posible ataque CSRF detectado.'
      };
    }

    logger.auth('State CSRF validado exitosamente');

    // Obtener contexto de organización de la cookie
    let orgContext: { orgId?: string; orgSlug?: string; invToken?: string } = {};
    if (orgContextCookie) {
      try {
        orgContext = JSON.parse(orgContextCookie);
        logger.info('📋 OAuth: Contexto de organización encontrado', {
          orgId: orgContext.orgId,
          orgSlug: orgContext.orgSlug,
          hasInvToken: !!orgContext.invToken
        });
      } catch {
        logger.warn('No se pudo parsear contexto de organización');
      }
    }

    // ✅ SEGURIDAD: Limpiar cookies de state después de validación
    cookieStore.delete('oauth_state');
    cookieStore.delete('oauth_org_context');
    logger.debug('Cookies de state CSRF y contexto eliminadas');

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

    // ============================================================================
    // VALIDACIÓN DE INVITACIÓN PARA OAUTH
    // ============================================================================
    let invitedRole: string | undefined;
    let invitedPosition: string | undefined;
    const supabase = await createClient();

    if (orgContext.orgId) {
      logger.info('🔍 OAuth: Validando invitación para organización', { orgId: orgContext.orgId });

      if (orgContext.invToken) {
        // Caso 1: OAuth con token de invitación
        const validation = await validateInvitationAction(orgContext.invToken);

        if (!validation.valid) {
          logger.error('OAuth: Invitación inválida', { error: validation.error });
          return { error: validation.error || 'Invitación inválida o expirada' };
        }

        // Verificar que el email coincide con la invitación
        if (validation.email?.toLowerCase() !== profile.email.toLowerCase()) {
          logger.error('OAuth: Email no coincide con invitación', {
            invitationEmail: validation.email,
            oauthEmail: profile.email
          });
          return { error: 'El email de tu cuenta de Google no coincide con la invitación' };
        }

        // Verificar que la invitación es para esta organización
        if (validation.organizationId !== orgContext.orgId) {
          return { error: 'Esta invitación no es para esta organización' };
        }

        invitedRole = validation.role;
        invitedPosition = validation.position;

        logger.info('✅ OAuth: Invitación validada', { role: invitedRole, position: invitedPosition });
      } else {
        // Caso 2: OAuth desde página de organización sin token - buscar invitación por email
        const { hasInvitation, role, position, error: invError } = await findInvitationByEmailAction(
          profile.email,
          orgContext.orgId
        );

        if (!hasInvitation) {
          logger.error('OAuth: Email no invitado a la organización');
          return {
            error: invError || 'Tu correo no ha sido invitado a esta organización. Contacta al administrador para solicitar una invitación.'
          };
        }

        invitedRole = role;
        invitedPosition = position;
        logger.info('✅ OAuth: Invitación encontrada por email', { role: invitedRole });
      }
    }

    // PASO 3: Buscar si el usuario ya existe
    logger.info('OAuth: Buscando usuario existente');
    let userId: string;
    let isNewUser = false;

    const existingUser = await OAuthService.findUserByEmail(profile.email);

    if (existingUser) {
      logger.auth('Usuario existente encontrado');
      userId = existingUser.id;

      // Si es usuario existente y viene de invitación, actualizar su rol
      if (orgContext.orgId && invitedRole) {
        let cargoRol = 'Usuario';
        if (invitedRole === 'owner' || invitedRole === 'admin') {
          cargoRol = 'Business';
        } else if (invitedRole === 'member') {
          cargoRol = 'Business User';
        }

        const { error: updateError } = await supabase
          .from('users')
          .update({
            cargo_rol: cargoRol,
            type_rol: invitedPosition || existingUser.type_rol || 'Usuario'
          })
          .eq('id', userId);

        if (updateError) {
          logger.warn('No se pudo actualizar rol de usuario existente:', updateError);
        } else {
          logger.info('✅ OAuth: Rol de usuario actualizado', { cargoRol });
        }
      }
    } else {
      // PASO 4: Crear nuevo usuario
      logger.info('OAuth: Creando nuevo usuario');

      // Determinar cargo_rol basado en invitación
      let cargoRol = 'Usuario';
      if (orgContext.orgId && invitedRole) {
        if (invitedRole === 'owner' || invitedRole === 'admin') {
          cargoRol = 'Business';
        } else {
          cargoRol = 'Business User';
        }
      }

      userId = await OAuthService.createUserFromOAuth(
        profile.email,
        profile.given_name || profile.name.split(' ')[0] || 'Usuario',
        profile.family_name || profile.name.split(' ').slice(1).join(' ') || '',
        profile.picture,
        cargoRol,
        invitedPosition
      );
      logger.auth('Nuevo usuario creado exitosamente', { cargoRol, typeRol: invitedPosition });
      isNewUser = true;
    }

    // ============================================================================
    // VINCULAR USUARIO A ORGANIZACIÓN
    // ============================================================================
    if (orgContext.orgId) {
      // Verificar si ya está vinculado
      const { data: existingOrgUser } = await supabase
        .from('organization_users')
        .select('id')
        .eq('organization_id', orgContext.orgId)
        .eq('user_id', userId)
        .single();

      if (!existingOrgUser) {
        logger.info('🔗 OAuth: Vinculando usuario a organización', {
          orgId: orgContext.orgId,
          userId,
          role: invitedRole || 'member'
        });

        const { error: orgUserError } = await supabase
          .from('organization_users')
          .insert({
            organization_id: orgContext.orgId,
            user_id: userId,
            role: invitedRole || 'member',
            status: 'active',
            joined_at: new Date().toISOString()
          });

        if (orgUserError) {
          logger.error('❌ OAuth: Error vinculando a organización:', orgUserError);
        } else {
          logger.info('✅ OAuth: Usuario vinculado exitosamente a la organización');
        }

        // Consumir la invitación
        await consumeInvitationAction(
          orgContext.invToken || profile.email,
          orgContext.orgId,
          userId
        );
        logger.info('✅ OAuth: Invitación consumida');
      } else {
        logger.info('OAuth: Usuario ya estaba vinculado a la organización');
      }
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

    // PASO 5.5: Actualizar last_login_at en la tabla users
    const supabaseForLogin = await createClient();
    const { error: updateLoginError } = await supabaseForLogin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateLoginError) {
      logger.warn('No se pudo actualizar last_login_at:', updateLoginError);
    } else {
      logger.info('OAuth: last_login_at actualizado');
    }

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

    // Verificar rol para redirección específica (B2B)
    // Reutilizar supabase ya declarado anteriormente
    const { data: user } = await supabase
      .from('users')
      .select('cargo_rol')
      .eq('id', userId)
      .single();
    
    const normalizedRole = user?.cargo_rol?.toLowerCase().trim();
    let destination = '/dashboard';

    if (normalizedRole === 'administrador') {
      destination = '/admin/dashboard';
    } else if (normalizedRole === 'instructor') {
      destination = '/instructor/dashboard';
    } else if (normalizedRole === 'business' || normalizedRole === 'business user') {
        // Verificar organización activa
        const { data: userOrg } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();
      
      if (userOrg) {
        if (normalizedRole === 'business') {
          destination = '/business-panel/dashboard';
        } else {
          destination = '/business-user/dashboard';
        }
      }
    }

    logger.info(`Redirigiendo a ${destination} (Rol: ${normalizedRole})`);
    redirect(destination);
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

/**
 * Inicia el flujo de autenticación con Microsoft
 */
export async function initiateMicrosoftLogin(params: OAuthInitParams = {}) {
  const { getMicrosoftAuthUrl } = await import('@/lib/oauth/microsoft');

  // ✅ SEGURIDAD: Generar state CSRF con 32 bytes de entropía
  const stateBuffer = crypto.randomBytes(32);
  const csrfToken = stateBuffer.toString('base64url');

  // Crear state con contexto de organización (si existe)
  let state: string;
  if (params.organizationId || params.invitationToken) {
    const stateData = {
      csrf: csrfToken,
      orgId: params.organizationId,
      orgSlug: params.organizationSlug,
      invToken: params.invitationToken,
    };
    state = Buffer.from(JSON.stringify(stateData)).toString('base64url');
  } else {
    state = csrfToken;
  }

  const cookieStore = await cookies();
  cookieStore.set('oauth_state', csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60,
    path: '/',
  });

  // Guardar contexto de organización en cookie separada (si existe)
  if (params.organizationId || params.invitationToken) {
    const orgContext = {
      orgId: params.organizationId,
      orgSlug: params.organizationSlug,
      invToken: params.invitationToken,
    };
    cookieStore.set('oauth_org_context', JSON.stringify(orgContext), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60,
      path: '/',
    });
  }

  const authUrl = getMicrosoftAuthUrl(state);
  redirect(authUrl);
}

/**
 * Maneja el callback de Microsoft OAuth
 */
export async function handleMicrosoftCallback(params: { code?: string; state?: string; error?: string; error_description?: string; }) {
  try {
    if (params.error) return { error: params.error_description || 'Error de autenticación' };
    if (!params.code) return { error: 'Código de autorización no recibido' };

    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state')?.value;
    const orgContextCookie = cookieStore.get('oauth_org_context')?.value;

    if (!storedState || !params.state) {
      return { error: 'Error de validación de seguridad (CSRF). Intenta nuevamente.' };
    }

    // Extraer CSRF token del state (puede ser simple o con contexto de organización)
    let csrfFromState = params.state;
    try {
      const decoded = Buffer.from(params.state, 'base64url').toString('utf-8');
      const stateData = JSON.parse(decoded);
      if (stateData.csrf) {
        csrfFromState = stateData.csrf;
      }
    } catch {
      csrfFromState = params.state;
    }

    if (storedState !== csrfFromState) {
      return { error: 'Error de validación de seguridad (CSRF). Intenta nuevamente.' };
    }

    // Obtener contexto de organización de la cookie
    let orgContext: { orgId?: string; orgSlug?: string; invToken?: string } = {};
    if (orgContextCookie) {
      try {
        orgContext = JSON.parse(orgContextCookie);
        logger.info('📋 Microsoft OAuth: Contexto de organización encontrado', {
          orgId: orgContext.orgId,
          orgSlug: orgContext.orgSlug,
          hasInvToken: !!orgContext.invToken
        });
      } catch {
        logger.warn('No se pudo parsear contexto de organización');
      }
    }

    cookieStore.delete('oauth_state');
    cookieStore.delete('oauth_org_context');

    // Intercambiar código por tokens y obtener perfil
    const tokens = await MicrosoftOAuthService.exchangeCodeForTokens(params.code);
    const profile = await MicrosoftOAuthService.getUserProfile(tokens.access_token);
    const email = (profile as any).mail || (profile as any).userPrincipalName;

    if (!email || !validator.isEmail(email)) {
      return { error: 'Email inválido o no disponible' };
    }

    // ============================================================================
    // VALIDACIÓN DE INVITACIÓN PARA MICROSOFT OAUTH
    // ============================================================================
    let invitedRole: string | undefined;
    let invitedPosition: string | undefined;
    const supabase = await createClient();

    if (orgContext.orgId) {
      logger.info('🔍 Microsoft OAuth: Validando invitación para organización', { orgId: orgContext.orgId });

      if (orgContext.invToken) {
        const validation = await validateInvitationAction(orgContext.invToken);

        if (!validation.valid) {
          logger.error('Microsoft OAuth: Invitación inválida', { error: validation.error });
          return { error: validation.error || 'Invitación inválida o expirada' };
        }

        if (validation.email?.toLowerCase() !== email.toLowerCase()) {
          return { error: 'El email de tu cuenta de Microsoft no coincide con la invitación' };
        }

        if (validation.organizationId !== orgContext.orgId) {
          return { error: 'Esta invitación no es para esta organización' };
        }

        invitedRole = validation.role;
        invitedPosition = validation.position;

        logger.info('✅ Microsoft OAuth: Invitación validada', { role: invitedRole, position: invitedPosition });
      } else {
        const { hasInvitation, role, position, error: invError } = await findInvitationByEmailAction(
          email,
          orgContext.orgId
        );

        if (!hasInvitation) {
          return {
            error: invError || 'Tu correo no ha sido invitado a esta organización. Contacta al administrador para solicitar una invitación.'
          };
        }

        invitedRole = role;
        invitedPosition = position;
        logger.info('✅ Microsoft OAuth: Invitación encontrada por email', { role: invitedRole });
      }
    }

    // Usuario (crear o usar existente)
    let userId: string; let isNewUser = false;
    const existingUser = await OAuthService.findUserByEmail(email);

    if (existingUser) {
      userId = existingUser.id;

      // Si es usuario existente y viene de invitación, actualizar su rol
      if (orgContext.orgId && invitedRole) {
        let cargoRol = 'Usuario';
        if (invitedRole === 'owner' || invitedRole === 'admin') {
          cargoRol = 'Business';
        } else if (invitedRole === 'member') {
          cargoRol = 'Business User';
        }

        await supabase
          .from('users')
          .update({
            cargo_rol: cargoRol,
            type_rol: invitedPosition || existingUser.type_rol || 'Usuario'
          })
          .eq('id', userId);

        logger.info('✅ Microsoft OAuth: Rol de usuario actualizado', { cargoRol });
      }
    } else {
      let cargoRol = 'Usuario';
      if (orgContext.orgId && invitedRole) {
        if (invitedRole === 'owner' || invitedRole === 'admin') {
          cargoRol = 'Business';
        } else {
          cargoRol = 'Business User';
        }
      }

      const first = (profile as any).givenName || ((profile as any).displayName?.split(' ')[0] ?? 'Usuario');
      const last  = (profile as any).surname || ((profile as any).displayName?.split(' ').slice(1).join(' ') ?? '');
      userId = await OAuthService.createUserFromOAuth(email, first, last, undefined, cargoRol, invitedPosition);
      isNewUser = true;
    }

    // ============================================================================
    // VINCULAR USUARIO A ORGANIZACIÓN
    // ============================================================================
    if (orgContext.orgId) {
      const { data: existingOrgUser } = await supabase
        .from('organization_users')
        .select('id')
        .eq('organization_id', orgContext.orgId)
        .eq('user_id', userId)
        .single();

      if (!existingOrgUser) {
        logger.info('🔗 Microsoft OAuth: Vinculando usuario a organización', {
          orgId: orgContext.orgId,
          userId,
          role: invitedRole || 'member'
        });

        const { error: orgUserError } = await supabase
          .from('organization_users')
          .insert({
            organization_id: orgContext.orgId,
            user_id: userId,
            role: invitedRole || 'member',
            status: 'active',
            joined_at: new Date().toISOString()
          });

        if (orgUserError) {
          logger.error('❌ Microsoft OAuth: Error vinculando a organización:', orgUserError);
        } else {
          logger.info('✅ Microsoft OAuth: Usuario vinculado exitosamente a la organización');
        }

        // Consumir la invitación
        await consumeInvitationAction(
          orgContext.invToken || email,
          orgContext.orgId,
          userId
        );
        logger.info('✅ Microsoft OAuth: Invitación consumida');
      }
    }

    // Guardar/actualizar cuenta OAuth
    await OAuthService.upsertOAuthAccount(userId, 'microsoft', (profile as any).id, tokens as any);

    // Actualizar last_login_at en la tabla users
    const supabaseForLogin = await createClient();
    await supabaseForLogin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId);

    // Crear sesión
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || 'unknown';
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') ||
               'unknown';

    const requestHeaders = new Headers();
    requestHeaders.set('user-agent', userAgent);
    requestHeaders.set('x-real-ip', ip);
    const mockRequest = new Request('http://localhost', { headers: requestHeaders });

    const sessionInfo = await RefreshTokenService.createSession(userId, false, mockRequest);

    cookieStore.set('access_token', sessionInfo.accessToken, {
      ...SECURE_COOKIE_OPTIONS,
      expires: sessionInfo.accessExpiresAt,
    });

    cookieStore.set('refresh_token', sessionInfo.refreshToken, {
      ...SECURE_COOKIE_OPTIONS,
      expires: sessionInfo.refreshExpiresAt,
    });

    const legacySession = await SessionService.createLegacySession(userId, false);
    const maxAge = 7 * 24 * 60 * 60;
    cookieStore.set('aprende-y-aplica-session', legacySession.sessionToken, {
      ...getCustomCookieOptions(maxAge),
      expires: legacySession.expiresAt,
    });

    // Verificar rol para redirección específica (B2B)
    const { data: user } = await supabase
      .from('users')
      .select('cargo_rol')
      .eq('id', userId)
      .single();

    const normalizedRole = user?.cargo_rol?.toLowerCase().trim();
    let destination = '/dashboard';

    if (normalizedRole === 'administrador') {
      destination = '/admin/dashboard';
    } else if (normalizedRole === 'instructor') {
      destination = '/instructor/dashboard';
    } else if (normalizedRole === 'business' || normalizedRole === 'business user') {
        const { data: userOrg } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (userOrg) {
        if (normalizedRole === 'business') {
          destination = '/business-panel/dashboard';
        } else {
          destination = '/business-user/dashboard';
        }
      }
    }
    redirect(destination);
  } catch (error) {
    // Verificar si es una redirección de Next.js
    if (error && typeof error === 'object' && 'digest' in error) {
      const digest = (error as any).digest;
      if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
        throw error;
      }
    }
    logger.error('Error en callback Microsoft OAuth', error);
    return { error: 'Error procesando autenticación con Microsoft' };
  }
}
