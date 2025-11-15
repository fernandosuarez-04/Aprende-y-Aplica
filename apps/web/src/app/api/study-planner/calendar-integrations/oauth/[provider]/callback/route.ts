import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../../../../features/auth/services/session.service';
import { StudyPlannerService } from '../../../../../../../features/study-planner/services/studyPlannerService';
import { logger } from '@/lib/utils/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.redirect(
        new URL('/study-planner?error=auth_required', request.url)
      );
    }

    const { provider } = await params;
    const typedProvider = provider as 'google' | 'microsoft';
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/study-planner?error=oauth_error&message=${error}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/study-planner?error=no_code', request.url)
      );
    }

    // Intercambiar código por tokens
    let accessToken = '';
    let refreshToken = '';
    let expiresAt: Date | null = null;

    if (typedProvider === 'google') {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = `${request.nextUrl.origin}/api/study-planner/calendar-integrations/oauth/${typedProvider}/callback`;

      if (!clientId || !clientSecret) {
        return NextResponse.redirect(
          new URL('/study-planner?error=config_error', request.url)
        );
      }

      // Intercambiar código por tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Error al obtener tokens de Google');
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;
      refreshToken = tokenData.refresh_token;
      expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
    } else if (typedProvider === 'microsoft') {
      const clientId = process.env.MICROSOFT_CLIENT_ID;
      const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
      const redirectUri = `${request.nextUrl.origin}/api/study-planner/calendar-integrations/oauth/${typedProvider}/callback`;

      if (!clientId || !clientSecret) {
        return NextResponse.redirect(
          new URL('/study-planner?error=config_error', request.url)
        );
      }

      // Intercambiar código por tokens
      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          scope: 'Calendars.ReadWrite offline_access',
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Error al obtener tokens de Microsoft');
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;
      refreshToken = tokenData.refresh_token;
      expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
    }

    // Guardar integración en la base de datos
    await StudyPlannerService.createOrUpdateCalendarIntegration({
      user_id: user.id,
      provider: typedProvider,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt?.toISOString() || null,
      scope: typedProvider === 'google' 
        ? 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events'
        : 'Calendars.ReadWrite offline_access',
    });

    return NextResponse.redirect(
      new URL('/study-planner?success=calendar_connected', request.url)
    );
  } catch (error) {
    logger.error('Error in OAuth callback:', error);
    return NextResponse.redirect(
      new URL(
        `/study-planner?error=callback_error&message=${encodeURIComponent(
          error instanceof Error ? error.message : 'Error desconocido'
        )}`,
        request.url
      )
    );
  }
}

