import { createClient } from '@/lib/supabase/server';
import { OAuthAccount, OAuthProvider, OAuthTokens } from '../types/oauth.types';

export class OAuthService {
  /**
   * Crea o actualiza una cuenta OAuth
   */
  static async upsertOAuthAccount(
    userId: string,
    provider: OAuthProvider,
    providerAccountId: string,
    tokens: OAuthTokens
  ): Promise<OAuthAccount> {
    const supabase = await createClient();

    const expiresAt = tokens.expires_at ? new Date(tokens.expires_at) : null;

    const { data, error } = await supabase
      .from('oauth_accounts')
      .upsert(
        {
          user_id: userId,
          provider,
          provider_account_id: providerAccountId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: expiresAt,
          scope: tokens.scope,
          token_type: tokens.token_type,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'provider,provider_account_id',
        }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Error guardando cuenta OAuth: ${error.message}`);
    }

    return data as OAuthAccount;
  }

  /**
   * Busca una cuenta OAuth por proveedor y ID de proveedor
   */
  static async findOAuthAccount(
    provider: OAuthProvider,
    providerAccountId: string
  ): Promise<OAuthAccount | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('oauth_accounts')
      .select('*')
      .eq('provider', provider)
      .eq('provider_account_id', providerAccountId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw new Error(`Error buscando cuenta OAuth: ${error.message}`);
    }

    return data as OAuthAccount;
  }

  /**
   * Busca cuentas OAuth por usuario
   */
  static async findOAuthAccountsByUser(userId: string): Promise<OAuthAccount[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('oauth_accounts')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Error buscando cuentas OAuth: ${error.message}`);
    }

    return data as OAuthAccount[];
  }

  /**
   * Elimina una cuenta OAuth
   */
  static async deleteOAuthAccount(
    provider: OAuthProvider,
    providerAccountId: string
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('oauth_accounts')
      .delete()
      .eq('provider', provider)
      .eq('provider_account_id', providerAccountId);

    if (error) {
      throw new Error(`Error eliminando cuenta OAuth: ${error.message}`);
    }
  }

  /**
   * Verifica si un email ya está registrado
   */
  static async findUserByEmail(email: string): Promise<any | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('users')
      .select('id, email, username, first_name, last_name, email_verified')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw new Error(`Error buscando usuario: ${error.message}`);
    }

    return data;
  }

  /**
   * Crea un nuevo usuario desde perfil OAuth
   */
  static async createUserFromOAuth(
    email: string,
    firstName: string,
    lastName: string,
    profilePicture?: string
  ): Promise<string> {
    const supabase = await createClient();

    // Generar username único basado en email
    const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    let username = baseUsername;
    let attempts = 0;

    // Intentar hasta encontrar username disponible
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (!existing) break;

      attempts++;
      username = `${baseUsername}${Math.floor(Math.random() * 10000)}`;
    }

    const userId = crypto.randomUUID();

    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`.trim(),
        email_verified: true, // OAuth emails ya están verificados
        profile_picture_url: profilePicture || null,
        password_hash: null, // No hay contraseña para usuarios OAuth
        cargo_rol: 'Usuario',
        type_rol: 'Usuario',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creando usuario: ${error.message}`);
    }

    return userId;
  }
}
