import { cookies, headers } from 'next/headers';
import { createClient } from '../../../lib/supabase/server';
import { logger } from '../../../lib/logger';
import { cacheGet, cacheSet } from '@/lib/cache/ttlCache'
import crypto from 'crypto';

export class SessionService {
  private static readonly SESSION_COOKIE_NAME = 'aprende-y-aplica-session';
  private static readonly SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días

  static async createSession(userId: string, rememberMe: boolean = false): Promise<void> {
    logger.auth('Creando sesión', { rememberMe });
    
    const cookieStore = await cookies();
    
    // Crear token de sesión (UUID válido para jwt_id)
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000);
    
    logger.debug('Token de sesión generado');
    logger.debug('Sesión expira', { expiresAt: expiresAt.toISOString() });
    
    // Guardar sesión en base de datos usando la estructura real de la tabla
    const supabase = await createClient();
    
    // Obtener información del request para IP y User-Agent
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               headersList.get('x-real-ip') || 
               '127.0.0.1';
    
    const { error: dbError } = await supabase
      .from('user_session')
      .insert({
        user_id: userId,
        jwt_id: sessionToken, // Usamos el token como jwt_id
        issued_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        ip: ip,
        user_agent: userAgent,
        revoked: false,
      });
    
    if (dbError) {
      logger.error('Error guardando sesión en DB', dbError);
      throw new Error('Error al guardar sesión');
    }

    logger.info('Sesión guardada en DB');

    // Crear cookie
    cookieStore.set(this.SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60, // 30 días o 7 días
      path: '/',
    });

    logger.debug('Cookie de sesión creada');
  }

  static async getCurrentUser(): Promise<any | null> {
    try {
      logger.debug('SessionService: Obteniendo usuario actual');
      const cookieStore = await cookies();
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

      // Obtener datos del usuario
      console.log('👤 Buscando usuario con ID:', session.user_id)
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, username, email, first_name, last_name, display_name, cargo_rol, type_rol, profile_picture_url')
        .eq('id', session.user_id)
        .single();

      console.log('👤 Usuario encontrado:', user ? 'Sí' : 'No')
      console.log('❌ Error de usuario:', userError)
      
      if (userError || !user) {
        console.log('❌ Usuario no encontrado')
        return null;
      }

      console.log('✅ Usuario obtenido exitosamente:', user)
      cacheSet(`user-by-session:${sessionToken}`, user, 30_000)
      return user;
    } catch (error) {
      console.error('💥 Error getting current user:', error);
      return null;
    }
  }

  static async destroySession(): Promise<void> {
    try {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get(this.SESSION_COOKIE_NAME)?.value;
      
      if (sessionToken) {
        const supabase = await createClient();
        
        // Marcar sesión como revocada en lugar de eliminarla
        await supabase
          .from('user_session')
          .update({ revoked: true })
          .eq('jwt_id', sessionToken);
      }

      // Eliminar cookie con opciones explícitas para asegurar destrucción completa
      // Primero establecer la cookie con valor vacío y expiración inmediata
      cookieStore.set(this.SESSION_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // Expira inmediatamente
        path: '/',
      });
      
      // Luego eliminar la cookie
      cookieStore.delete(this.SESSION_COOKIE_NAME);
      
      console.log('✅ Cookie de sesión eliminada correctamente');
    } catch (error) {
      console.error('Error destroying session:', error);
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
