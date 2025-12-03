import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/features/auth/services/session.service';
import { randomBytes } from 'crypto';

/**
 * GET /api/study-planner/calendar-integrations/oauth/microsoft
 * Inicia el flujo OAuth con Microsoft Calendar
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

    const clientId = process.env.MICROSOFT_CALENDAR_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/study-planner/calendar-integrations/oauth/microsoft/callback`;
    const scope = 'Calendars.ReadWrite offline_access';
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Microsoft Calendar no está configurado' },
        { status: 500 }
      );
    }

    // Generar state para seguridad
    const state = randomBytes(32).toString('hex');
    
    const response = NextResponse.json({
      authorization_url: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_mode=query&` +
        `scope=${encodeURIComponent(scope)}&` +
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
    console.error('Error in Microsoft OAuth init:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

