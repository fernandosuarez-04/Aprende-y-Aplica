import { cookies, headers } from 'next/headers';
import { createClient } from '../../../lib/supabase/server';
import crypto from 'crypto';

export class SessionService {
  private static readonly SESSION_COOKIE_NAME = 'aprende-y-aplica-session';
  private static readonly SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días

  static async createSession(userId: string, rememberMe: boolean = false): Promise<void> {
    console.log('🔐 Creando sesión para usuario:', userId, 'rememberMe:', rememberMe);
    
    const cookieStore = await cookies();
    
    // Crear token de sesión (UUID válido para jwt_id)
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000);
    
    console.log('🎫 Token de sesión creado:', sessionToken.substring(0, 10) + '...');
    console.log('⏰ Expira en:', expiresAt.toISOString());
    
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
      console.error('❌ Error guardando sesión en DB:', dbError);
      throw new Error('Error al guardar sesión');
    }

    console.log('✅ Sesión guardada en DB correctamente');

    // Crear cookie
    cookieStore.set(this.SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60, // 30 días o 7 días
      path: '/',
    });

    console.log('🍪 Cookie creada:', this.SESSION_COOKIE_NAME, 'con valor:', sessionToken.substring(0, 10) + '...');
  }

  static async getCurrentUser(): Promise<any | null> {
    try {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get(this.SESSION_COOKIE_NAME)?.value;
      
      if (!sessionToken) {
        return null;
      }

      const supabase = await createClient();
      
      // Buscar sesión válida
      const { data: session, error: sessionError } = await supabase
        .from('user_session')
        .select('user_id, expires_at')
        .eq('jwt_id', sessionToken)
        .eq('revoked', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (sessionError || !session) {
        return null;
      }

      // Obtener datos del usuario
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, username, email, first_name, last_name, display_name, cargo_rol, type_rol, profile_picture_url')
        .eq('id', session.user_id)
        .single();

      if (userError || !user) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
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

      // Eliminar cookie
      cookieStore.delete(this.SESSION_COOKIE_NAME);
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
