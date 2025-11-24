import {
  GOOGLE_OAUTH_CONFIG,
  GOOGLE_OAUTH_URLS,
} from '@/lib/oauth/google';
import {
  OAuthProfile,
  OAuthTokens,
} from '../types/oauth.types';

export class GoogleOAuthService {
  /**
   * Intercambia el código de autorización por tokens
   */
  static async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    const params = new URLSearchParams({
      code,
      client_id: GOOGLE_OAUTH_CONFIG.clientId,
      client_secret: GOOGLE_OAUTH_CONFIG.clientSecret,
      redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
      grant_type: 'authorization_code',
    });

    const response = await fetch(GOOGLE_OAUTH_URLS.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error obteniendo tokens: ${error.error_description || error.error}`);
    }

    const data = await response.json();

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
      token_type: data.token_type,
      scope: data.scope,
    };
  }

  /**
   * Obtiene el perfil del usuario desde Google
   */
  static async getUserProfile(accessToken: string): Promise<OAuthProfile> {
    const response = await fetch(GOOGLE_OAUTH_URLS.userinfo, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error obteniendo perfil de usuario');
    }

    const data = await response.json();

    return {
      id: data.id || data.sub,
      email: data.email,
      name: data.name,
      given_name: data.given_name,
      family_name: data.family_name,
      picture: data.picture,
      email_verified: data.email_verified,
      locale: data.locale,
    };
  }

  /**
   * Refresca el access token usando el refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_OAUTH_CONFIG.clientId,
      client_secret: GOOGLE_OAUTH_CONFIG.clientSecret,
      grant_type: 'refresh_token',
    });

    const response = await fetch(GOOGLE_OAUTH_URLS.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error('Error refrescando access token');
    }

    const data = await response.json();

    return {
      access_token: data.access_token,
      expires_at: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
      token_type: data.token_type,
      scope: data.scope,
    };
  }

  /**
   * Revoca el access token
   */
  static async revokeToken(token: string): Promise<void> {
    const params = new URLSearchParams({ token });

    await fetch(GOOGLE_OAUTH_URLS.revoke, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
  }
}
