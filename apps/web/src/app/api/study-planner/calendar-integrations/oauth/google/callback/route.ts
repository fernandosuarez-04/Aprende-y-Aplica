import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/features/auth/services/session.service';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/study-planner/calendar-integrations/oauth/google/callback
 * Callback de OAuth de Google Calendar
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
    const state = searchParams.get('state');

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

    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/study-planner/calendar-integrations/oauth/google/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/study-planner/dashboard?error=not_configured`
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
        provider: 'google',
        access_token,
        refresh_token,
        expires_at: expiresAt.toISOString(),
        scope: 'https://www.googleapis.com/auth/calendar.events',
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
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/study-planner/dashboard?success=google_connected`
    );
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/study-planner/dashboard?error=internal_error`
    );
  }
}

