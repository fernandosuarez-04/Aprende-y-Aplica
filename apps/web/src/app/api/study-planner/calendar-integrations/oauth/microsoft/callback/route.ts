import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/features/auth/services/session.service';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/study-planner/calendar-integrations/oauth/microsoft/callback
 * Callback de OAuth de Microsoft Calendar
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await SessionService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth?error=not_authenticated`
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/study-planner/dashboard?error=oauth_error`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/study-planner/dashboard?error=no_code`
      );
    }

    const clientId = process.env.MICROSOFT_CALENDAR_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CALENDAR_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/study-planner/calendar-integrations/oauth/microsoft/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/study-planner/dashboard?error=not_configured`
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
      const errorData = await tokenResponse.text();
      console.error('Error exchanging code for tokens:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/study-planner/dashboard?error=token_exchange_failed`
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);

    // Guardar integración en la base de datos
    const supabase = await createClient();
    const { error: insertError } = await supabase
      .from('calendar_integrations')
      .upsert({
        user_id: currentUser.id,
        provider: 'microsoft',
        access_token,
        refresh_token,
        expires_at: expiresAt.toISOString(),
        scope: 'Calendars.ReadWrite offline_access',
        metadata: {},
      }, {
        onConflict: 'user_id,provider',
      });

    if (insertError) {
      console.error('Error saving integration:', insertError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/study-planner/dashboard?error=save_failed`
      );
    }

    // Sincronizar sesiones existentes
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/study-planner/calendar-integrations/sync`, {
        method: 'POST',
      });
    } catch (syncError) {
      console.error('Error syncing sessions:', syncError);
      // No fallar si la sincronización falla
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/study-planner/dashboard?success=microsoft_connected`
    );
  } catch (error) {
    console.error('Error in Microsoft OAuth callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/study-planner/dashboard?error=internal_error`
    );
  }
}




