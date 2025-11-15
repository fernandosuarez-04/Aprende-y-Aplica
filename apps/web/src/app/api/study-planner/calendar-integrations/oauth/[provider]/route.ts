import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../../../features/auth/services/session.service';
import { logger } from '@/lib/utils/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { provider } = await params;
    const typedProvider = provider as 'google' | 'microsoft' | 'apple';

    if (!['google', 'microsoft', 'apple'].includes(typedProvider)) {
      return NextResponse.json(
        { success: false, error: 'Proveedor no válido' },
        { status: 400 }
      );
    }

    // Generar URL de autorización OAuth
    const redirectUri = `${request.nextUrl.origin}/api/study-planner/calendar-integrations/oauth/${typedProvider}/callback`;
    let authUrl = '';

    if (typedProvider === 'google') {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        return NextResponse.json(
          { success: false, error: 'Google OAuth no configurado' },
          { status: 500 }
        );
      }
      const scopes = encodeURIComponent(
        'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events'
      );
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code&scope=${scopes}&access_type=offline&prompt=consent`;
    } else if (typedProvider === 'microsoft') {
      const clientId = process.env.MICROSOFT_CLIENT_ID;
      if (!clientId) {
        return NextResponse.json(
          { success: false, error: 'Microsoft OAuth no configurado' },
          { status: 500 }
        );
      }
      const scopes = encodeURIComponent('Calendars.ReadWrite offline_access');
      authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_mode=query&scope=${scopes}`;
    } else {
      // Apple Calendar no requiere OAuth, usa ICS
      return NextResponse.json(
        { success: false, error: 'Apple Calendar usa exportación ICS' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, authUrl });
  } catch (error) {
    logger.error('Error initiating OAuth flow:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error desconocido',
          code: 'OAUTH_INIT_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

