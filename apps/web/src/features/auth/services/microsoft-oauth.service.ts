import { getMicrosoftRedirectUri } from '@/lib/oauth/microsoft';

export interface MicrosoftTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  id_token?: string;
  token_type: string;
  scope?: string;
}

export interface MicrosoftProfile {
  id: string;
  displayName?: string;
  givenName?: string;
  surname?: string;
  mail?: string;
  userPrincipalName?: string;
}

export class MicrosoftOAuthService {
  static async exchangeCodeForTokens(code: string): Promise<MicrosoftTokens> {
    const tenant = process.env.MICROSOFT_TENANT_ID || 'common';
    const clientId = process.env.MICROSOFT_OAUTH_CLIENT_ID!;
    const clientSecret = process.env.MICROSOFT_OAUTH_CLIENT_SECRET!;
    const redirectUri = getMicrosoftRedirectUri();

    const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Microsoft token error: ${res.status} ${res.statusText} - ${text}`);
    }
    return res.json();
  }

  static async getUserProfile(accessToken: string): Promise<MicrosoftProfile> {
    const res = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Microsoft profile error: ${res.status} ${res.statusText} - ${text}`);
    }
    return res.json();
  }
}


