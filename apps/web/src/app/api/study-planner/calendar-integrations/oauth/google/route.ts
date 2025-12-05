import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/features/auth/services/session.service';
import { randomBytes } from 'crypto';

/**
 * GET /api/study-planner/calendar-integrations/oauth/google
 * Inicia el flujo OAuth con Google Calendar
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Iniciando OAuth de Google Calendar...');
    
    const currentUser = await SessionService.getCurrentUser();
    
    if (!currentUser) {
      console.error('❌ Usuario no autenticado');
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    console.log('✅ Usuario autenticado:', currentUser.id);

    // Verificar variables de entorno con logging detallado
    // Aceptar tanto GOOGLE_CALENDAR_CLIENT_ID como GOOGLE_CLIENT_ID (fallback)
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${appUrl}/api/study-planner/calendar-integrations/oauth/google/callback`;
    const scope = 'https://www.googleapis.com/auth/calendar.events';
    
    console.log('🔑 Variables de entorno:', {
      hasClientId: !!clientId,
      clientIdLength: clientId?.length || 0,
      usingGOOGLE_CALENDAR_CLIENT_ID: !!process.env.GOOGLE_CALENDAR_CLIENT_ID,
      usingGOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CALENDAR_CLIENT_ID,
      appUrl,
      redirectUri,
    });
    
    if (!clientId) {
      console.error('❌ No se encontró GOOGLE_CALENDAR_CLIENT_ID ni GOOGLE_CLIENT_ID');
      console.error('📋 Variables de entorno disponibles relacionadas con Google:', {
        GOOGLE_CALENDAR_CLIENT_ID: process.env.GOOGLE_CALENDAR_CLIENT_ID ? 'definida' : 'undefined',
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'definida' : 'undefined',
        NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'definida' : 'undefined',
      });
      
      return NextResponse.json(
        { 
          error: 'Google Calendar no está configurado',
          details: 'No se encontró GOOGLE_CALENDAR_CLIENT_ID ni GOOGLE_CLIENT_ID. Por favor, verifica tu archivo .env.local',
          requiredEnvVars: [
            'GOOGLE_CALENDAR_CLIENT_ID (o GOOGLE_CLIENT_ID como alternativa)',
            'GOOGLE_CALENDAR_CLIENT_SECRET (o GOOGLE_CLIENT_SECRET como alternativa)',
          ]
        },
        { status: 500 }
      );
    }

    // Generar state para seguridad
    const state = randomBytes(32).toString('hex');
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${state}`;
    
    console.log('✅ URL de autorización generada:', {
      hasAuthUrl: !!authUrl,
      redirectUri,
    });
    
    // Guardar state en cookie o session (simplificado aquí)
    const response = NextResponse.json({
      authorization_url: authUrl,
      state,
    });

    // Guardar state en cookie
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutos
    });

    console.log('✅ Respuesta OAuth preparada correctamente');
    return response;
  } catch (error: any) {
    console.error('❌ Error in Google OAuth init:', error);
    console.error('Stack trace:', error?.stack);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error?.message || 'Error desconocido',
        ...(process.env.NODE_ENV === 'development' && { stack: error?.stack })
      },
      { status: 500 }
    );
  }
}

