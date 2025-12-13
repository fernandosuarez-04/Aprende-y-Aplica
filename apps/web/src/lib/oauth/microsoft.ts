const AUTH_BASE = 'https://login.microsoftonline.com';
const TENANT = process.env.MICROSOFT_TENANT_ID || 'common';

export function getMicrosoftAuthUrl(state: string) {
  const clientId = process.env.MICROSOFT_OAUTH_CLIENT_ID!;
  // Normalizar y validar redirectUri (evita comillas/espacios accidentales en .env)
  const redirectRaw = process.env.MICROSOFT_OAUTH_REDIRECT_URI || '';
  const redirectUri = redirectRaw.replace(/^['"]|['"]$/g, '').trim();

  if (!redirectUri || !/^https?:\/\/.+/i.test(redirectUri)) {
    throw new Error(
      `MICROSOFT_OAUTH_REDIRECT_URI no es una URL absoluta válida. Valor recibido: "${redirectRaw}". ` +
      `Ejemplo correcto: http://localhost:3000/auth/oauth/microsoft/callback`
    );
  }

  // Scopes v2: lista en texto plano; URLSearchParams se encarga de codificar.
  // No usar encodeURIComponent aquí para evitar doble codificación (%2520).
  const scope = 'openid profile offline_access https://graph.microsoft.com/User.Read';

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    response_mode: 'query',
    redirect_uri: redirectUri,
    scope,
    state,
  });

  return `${AUTH_BASE}/${TENANT}/oauth2/v2.0/authorize?${params.toString()}`;
}


