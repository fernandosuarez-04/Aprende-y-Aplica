import { cookies, headers } from 'next/headers';
import { createClient } from '../../../lib/supabase/server';
import { logger } from '../../../lib/logger';
import { cacheGet, cacheSet } from '../../../lib/cache/ttlCache'
import crypto from 'crypto';
import { RefreshTokenService } from '../../../lib/auth/refreshToken.service';
import { getCustomCookieOptions } from '../../../lib/auth/cookie-config';

export class SessionService {
  private static readonly SESSION_COOKIE_NAME = 'aprende-y-aplica-session';
  private static readonly SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días

  /**
   * Crea una nueva sesión utilizando el sistema de refresh tokens
   * @param userId ID del usuario
   * @param rememberMe Si true, el refresh token dura 30 días; si false, 7 días
   */
  static async createSession(userId: string, rememberMe: boolean = false): Promise<void> {
    logger.auth('🔐 Creando sesión con refresh tokens', { userId, rememberMe });
    
    try {
      // Obtener headers
      const headersList = await headers();
      const userAgent = headersList.get('user-agent') || 'unknown';
      const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                 headersList.get('x-real-ip') || 
                 '127.0.0.1';
      
      logger.debug('Headers obtenidos', { userAgent, ip });
      
      // Crear una Request mock para el RefreshTokenService
      const requestHeaders = new Headers();
      requestHeaders.set('user-agent', userAgent);
      requestHeaders.set('x-real-ip', ip);
      
      const mockRequest = new Request('http://localhost', {
        headers: requestHeaders
      });
      
      logger.debug('Mock request creado');
      
      // Crear sesión con refresh tokens (access token: 30min, refresh token: 7-30 días)
      logger.debug('Llamando a RefreshTokenService.createSession');
      const sessionInfo = await RefreshTokenService.createSession(
        userId, 
        rememberMe, 
        mockRequest
      );
      
      logger.auth('✅ Sesión con refresh tokens creada exitosamente', {
        userId,
        accessExpiresAt: sessionInfo.accessExpiresAt,
        refreshExpiresAt: sessionInfo.refreshExpiresAt
      });

      // Mantener compatibilidad con sistema legacy (user_session)
      // Esto permite una migración gradual y rollback si es necesario
      logger.debug('Creando sesión legacy para compatibilidad');
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000);
      
      const supabase = await createClient();
      
      const legacySession: any = {
        user_id: userId,
        jwt_id: sessionToken,
        issued_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        ip: ip,
        user_agent: userAgent,
        revoked: false,
      };
      
      const { error: legacyError } = await supabase.from('user_session').insert(legacySession);
      
      if (legacyError) {
        logger.error('Error creando sesión legacy (no crítico)', legacyError);
        // No lanzar error, la sesión con refresh tokens ya está creada
      } else {
        logger.debug('✅ Sesión legacy creada exitosamente');
      }
      
      if (insertError) {
        logger.error('❌ Error insertando sesión en DB:', insertError);
        throw new Error(`Error al crear sesión en base de datos: ${insertError.message}`);
      }
      
      // ✅ Usar configuración segura de cookies
      const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
      cookieStore.set(this.SESSION_COOKIE_NAME, sessionToken, getCustomCookieOptions(maxAge));
      
      logger.debug('✅ Cookie de sesión legacy establecida');
      logger.auth('✅ Sesión completa creada exitosamente');
      
    } catch (error) {
      logger.error('❌ Error creando sesión', error);
      logger.error('❌ Error details:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      throw error; // Re-lanzar el error original, no crear uno nuevo
    }
  }

  /**
   * Obtiene el usuario actual desde la sesión
   * Soporta tanto el sistema legacy (user_session) como el nuevo (refresh_tokens)
   */
  static async getCurrentUser(): Promise<any | null> {
    try {
      logger.debug('SessionService: Obteniendo usuario actual');
      const cookieStore = await cookies();
      
      // Intentar obtener userId desde el sistema de refresh tokens primero
      const accessToken = cookieStore.get('access_token')?.value;
      let userId: string | null = null;
      
      if (accessToken) {
        // Sistema nuevo: buscar en refresh_tokens
        logger.debug('Usando sistema de refresh tokens');
        const supabase = await createClient();
        
        // Buscar refresh token activo para este usuario
        // (no podemos decodificar el access token sin JWT, así que usamos el refresh token)
        const refreshToken = cookieStore.get('refresh_token')?.value;
        
        if (refreshToken) {
          const { data: tokens } = await supabase
            .from('refresh_tokens')
            .select('user_id, last_used_at')
            .eq('is_revoked', false)
            .gt('expires_at', new Date().toISOString())
            .order('last_used_at', { ascending: false })
            .limit(1);
          
          if (tokens && tokens.length > 0) {
            userId = (tokens[0] as any).user_id;
            logger.debug('Usuario encontrado via refresh token');
          }
        }
      }
      
      // Fallback al sistema legacy si no se encontró con refresh tokens
      if (!userId) {
        logger.debug('Usando sistema legacy (user_session)');
        const sessionToken = cookieStore.get(this.SESSION_COOKIE_NAME)?.value;
        
        if (!sessionToken) {
          logger.debug('No hay token de sesión en cookie');
          return null;
        }

        // Cache de 30s por token para evitar golpear DB en cada request
        const cached = cacheGet<any>(`user-by-session:${sessionToken}`)
        if (cached) {
          return cached
        }

        const supabase = await createClient();
        
        // Buscar sesión válida
        logger.debug('Buscando sesión en DB');
        const { data: session, error: sessionError } = await supabase
          .from('user_session')
          .select('user_id, expires_at')
          .eq('jwt_id', sessionToken)
          .eq('revoked', false)
          .gt('expires_at', new Date().toISOString())
          .single();

        console.log('📋 Sesión encontrada:', session ? 'Sí' : 'No')
        console.log('❌ Error de sesión:', sessionError)
        
        if (sessionError || !session) {
          console.log('❌ Sesión no válida o no encontrada')
          return null;
        }
        
        userId = (session as any).user_id;
      }

      // Obtener datos del usuario
      if (!userId) {
        logger.debug('No se pudo determinar userId');
        return null;
      }
      
      console.log('👤 Buscando usuario con ID:', userId)
      const supabase = await createClient();
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, username, email, first_name, last_name, display_name, cargo_rol, type_rol, profile_picture_url, is_banned')
        .eq('id', userId)
        .single();

      console.log('👤 Usuario encontrado:', user ? 'Sí' : 'No')
      console.log('❌ Error de usuario:', userError)
      
      if (userError || !user) {
        console.log('❌ Usuario no encontrado')
        return null;
      }

      // ⭐ MODERACIÓN: Verificar si el usuario está baneado
      if ((user as any).is_banned) {
        logger.auth('🚫 Usuario baneado intentando acceder');
        // Destruir la sesión automáticamente
        await this.destroySession();
        return null;
      }

      console.log('✅ Usuario obtenido exitosamente:', user)
      cacheSet(`user-by-session:${userId}`, user, 30_000)
      return user;
    } catch (error) {
      console.error('💥 Error getting current user:', error);
      return null;
    }
  }

  /**
   * Destruye la sesión actual, revocando tanto los refresh tokens como la sesión legacy
   */
  static async destroySession(): Promise<void> {
    try {
      logger.auth('🚪 Destruyendo sesión');
      const cookieStore = await cookies();
      
      // Obtener el user_id de la sesión actual para revocar todos sus refresh tokens
      const sessionToken = cookieStore.get(this.SESSION_COOKIE_NAME)?.value;
      let userId: string | null = null;
      
      if (sessionToken) {
        const supabase = await createClient();
        
        // Obtener user_id de la sesión legacy
        const { data: session } = await supabase
          .from('user_session')
          .select('user_id')
          .eq('jwt_id', sessionToken)
          .single();
        
        if (session) {
          userId = (session as any).user_id;
        }
        
        // Marcar sesión legacy como revocada
        await (supabase
          .from('user_session') as any)
          .update({ revoked: true })
          .eq('jwt_id', sessionToken);
        
        logger.debug('Sesión legacy revocada');
      }
      
      // Revocar todos los refresh tokens del usuario
      if (userId) {
        await RefreshTokenService.revokeAllUserTokens(userId, 'user_logout');
        logger.auth('✅ Todos los refresh tokens del usuario revocados');
      }
      
      // Eliminar cookies (tanto legacy como refresh tokens)
      cookieStore.set(this.SESSION_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
      cookieStore.delete(this.SESSION_COOKIE_NAME);
      
      // Eliminar cookies de refresh token system
      cookieStore.delete('access_token');
      cookieStore.delete('refresh_token');
      
      logger.auth('✅ Sesión destruida completamente');
    } catch (error) {
      logger.error('❌ Error destroying session:', error);
      throw error;
    }
  }

  static async validateSession(sessionToken: string): Promise<boolean> {
    try {
      const supabase = await createClient();
      
      const { data: session, error } = await supabase
        .from('user_session')
        .select('id')
        .eq('jwt_id', sessionToken)
        .eq('revoked', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      return !error && !!session;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  }
}
