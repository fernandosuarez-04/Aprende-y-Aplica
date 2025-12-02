import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/features/auth/services/session.service';
import { randomBytes } from 'crypto';

/**
 * GET /api/study-planner/calendar-integrations/oauth/google
 * Inicia el flujo OAuth con Google Calendar
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await SessionService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/study-planner/calendar-integrations/oauth/google/callback`;
    const scope = 'https://www.googleapis.com/auth/calendar.events';
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Google Calendar no está configurado' },
        { status: 500 }
      );
    }

    // Generar state para seguridad
    const state = randomBytes(32).toString('hex');
    
    // Guardar state en cookie o session (simplificado aquí)
    const response = NextResponse.json({
      authorization_url: `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${state}`,
      state,
    });

    // Guardar state en cookie
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutos
    });

    return response;
  } catch (error) {
    console.error('Error in Google OAuth init:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

