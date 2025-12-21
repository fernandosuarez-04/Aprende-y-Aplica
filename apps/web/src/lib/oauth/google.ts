import { GoogleOAuthConfig } from '@/features/auth/types/oauth.types';
import { getBaseUrl } from '@/lib/env';

/**
 * Configuración de Google OAuth 2.0
 * 
 * IMPORTANTE: El nombre de la aplicación mostrado en la pantalla de consentimiento de Google OAuth
 * debe configurarse en Google Cloud Console como "sofialia.ai" para que coincida con el dominio.
 * 
 * Configuración en Google Cloud Console:
 * - APIs & Services > OAuth consent screen
 * - App name: sofialia.ai
 * - Application home page: https://sofialia.ai
 * - Application privacy policy link: https://sofialia.ai/privacy
 * - Application terms of service link: https://sofialia.ai/terms
 */
export const GOOGLE_OAUTH_CONFIG: GoogleOAuthConfig = {
  clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
  redirectUri: `${getBaseUrl()}/api/auth/callback/google`,
  scopes: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid',
  ],
};

/**
 * URLs de Google OAuth
 */
export const GOOGLE_OAUTH_URLS = {
  authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
  token: 'https://oauth2.googleapis.com/token',
  userinfo: 'https://www.googleapis.com/oauth2/v2/userinfo',
  revoke: 'https://oauth2.googleapis.com/revoke',
};

/**
 * Genera la URL de autorización de Google
 */
export function getGoogleAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_OAUTH_CONFIG.clientId,
    redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
    response_type: 'code',
    scope: GOOGLE_OAUTH_CONFIG.scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    ...(state && { state }),
  });

  return `${GOOGLE_OAUTH_URLS.authorize}?${params.toString()}`;
}

/**
 * Valida la configuración de Google OAuth
 */
export function validateGoogleOAuthConfig(): void {
  if (!GOOGLE_OAUTH_CONFIG.clientId) {
    throw new Error('GOOGLE_OAUTH_CLIENT_ID no está configurado');
  }
  if (!GOOGLE_OAUTH_CONFIG.clientSecret) {
    throw new Error('GOOGLE_OAUTH_CLIENT_SECRET no está configurado');
  }
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error('NEXT_PUBLIC_APP_URL no está configurado');
  }
}
