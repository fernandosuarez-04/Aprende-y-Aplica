/**
 * Middleware de autenticación y autorización para rutas Business
 * 
 * Este middleware:
 * 1. Verifica que el usuario esté autenticado (tiene sesión válida)
 * 2. Verifica que el usuario tenga rol de Business (admin de organización)
 * 3. Retorna el ID del usuario business para logging/auditoría
 * 
 * Uso en route handlers:
 * ```typescript
 * import { requireBusiness } from '@/lib/auth/requireBusiness';
 * 
 * export async function POST(request: NextRequest) {
 *   const auth = await requireBusiness();
 *   if (auth instanceof NextResponse) return auth; // Error response
 *   
 *   const businessUserId = auth.userId; // UUID del admin de organización
 *   // ... resto del código
 * }
 * ```
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * Resultado exitoso de autenticación
 */
export interface BusinessAuth {
  userId: string;
  userEmail: string;
  userRole: string;
  organizationId?: string;
}

/**
 * Verifica autenticación y autorización de Business Admin
 * 
 * @returns BusinessAuth si el usuario es Business autenticado, o NextResponse con error
 */
export async function requireBusiness(): Promise<BusinessAuth | NextResponse> {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient();

    let userId: string | null = null;
    let sessionValidated = false;

    // PASO 1: Intentar primero con el sistema de refresh tokens (nuevo)
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (accessToken && refreshToken) {
      logger.debug('requireBusiness: Usando sistema de refresh tokens');

      // Generar hash del refresh token para búsqueda directa
      const crypto = await import('crypto');
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      // Query directo por hash
      const { data: token, error: tokenError } = await supabase
        .from('refresh_tokens')
        .select('id, user_id, expires_at')
        .eq('token_hash', tokenHash)
        .eq('is_revoked', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!tokenError && token) {
        userId = token.user_id;
        sessionValidated = true;
        logger.debug('requireBusiness: Sesión validada via refresh token', { userId });
      }
    }

    // PASO 2: Fallback al sistema legacy (user_session)
    if (!sessionValidated) {
      const sessionCookie = cookieStore.get('aprende-y-aplica-session');

      if (!sessionCookie) {
        logger.warn('Business route accessed without any session');
        return NextResponse.json(
          {
            success: false,
            error: 'No autenticado. Por favor, inicia sesión.'
          },
          { status: 401 }
        );
      }

      const sessionToken = sessionCookie.value;
      logger.debug('requireBusiness: Validando sesión legacy', { hasToken: !!sessionToken });

      const { data: session, error: sessionError } = await supabase
        .from('user_session')
        .select('user_id, expires_at, revoked')
        .eq('jwt_id', sessionToken)
        .single();

      if (sessionError || !session) {
        logger.warn('Invalid session token', { error: sessionError?.message });
        return NextResponse.json(
          {
            success: false,
            error: 'Sesión inválida. Por favor, inicia sesión nuevamente.'
          },
          { status: 401 }
        );
      }

      // Verificar que la sesión no esté revocada
      if (session.revoked) {
        logger.warn('Attempted access with revoked session', { userId: session.user_id });
        return NextResponse.json(
          {
            success: false,
            error: 'Sesión revocada. Por favor, inicia sesión nuevamente.'
          },
          { status: 401 }
        );
      }

      // Verificar que la sesión no esté expirada
      const now = new Date();
      const expiresAt = new Date(session.expires_at);

      if (now > expiresAt) {
        logger.warn('Attempted access with expired session', {
          userId: session.user_id,
          expiresAt: session.expires_at
        });

        return NextResponse.json(
          {
            success: false,
            error: 'Sesión expirada. Por favor, inicia sesión nuevamente.'
          },
          { status: 401 }
        );
      }

      userId = session.user_id;
    }

    // PASO 3: Verificar que tenemos userId
    if (!userId) {
      logger.warn('No se pudo obtener userId de ninguna sesión');
      return NextResponse.json(
        {
          success: false,
          error: 'No autenticado. Por favor, inicia sesión.'
        },
        { status: 401 }
      );
    }

    // PASO 4: Obtener información del usuario y verificar rol
    // NOTA: organization_id ya no existe en users, se obtiene de organization_users
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, cargo_rol')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      logger.error('User not found for valid session', {
        userId: userId,
        error: userError?.message
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario no encontrado.'
        },
        { status: 401 }
      );
    }

    // Intentar obtener organization_id de forma separada (la columna puede no existir)
    let userOrganizationId: string | null = null;
    const { data: orgData, error: orgError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .maybeSingle();

    if (!orgError && orgData) {
      userOrganizationId = orgData.organization_id || null;
    }

    // PASO 6: Verificar que el usuario sea Business (flexible con variaciones)
    const normalizedRole = user.cargo_rol?.toLowerCase().trim() || '';
    const isBusiness = normalizedRole === 'business' || normalizedRole.includes('business');

    if (!isBusiness) {
      logger.warn('Non-business user attempted to access business route', {
        userId: user.id,
        email: user.email,
        role: user.cargo_rol,
        normalizedRole
      });
      return NextResponse.json(
        {
          success: false,
          error: `Permisos insuficientes. Se requiere rol de Business. Rol actual: ${user.cargo_rol || 'sin rol'}`
        },
        { status: 403 }
      );
    }

    // PASO 7: Obtener organizationId desde organization_users (única fuente de verdad)
    let organizationId: string | undefined = undefined;

    const { data: userOrgs } = await supabase
      .from('organization_users')
      .select('organization_id, joined_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('joined_at', { ascending: false })
      .limit(1);

    if (userOrgs && userOrgs.length > 0) {
      organizationId = userOrgs[0].organization_id;
    }

    // ✅ AUTENTICACIÓN Y AUTORIZACIÓN EXITOSA
    logger.auth('Business access granted', {
      userId: user.id,
      email: user.email,
      organizationId: organizationId
    });

    return {
      userId: user.id,
      userEmail: user.email,
      userRole: user.cargo_rol,
      organizationId: organizationId
    };

  } catch (error) {
    logger.error('Error in requireBusiness middleware', error instanceof Error ? error : undefined);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor.'
      },
      { status: 500 }
    );
  }
}

/**
 * Verifica autenticación y autorización de Business User (empleado)
 * Permite acceso a usuarios con rol Business User dentro de una organización
 * 
 * @returns BusinessAuth si el usuario es Business User autenticado, o NextResponse con error
 */
export async function requireBusinessUser(): Promise<BusinessAuth | NextResponse> {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient();

    let userId: string | null = null;
    let sessionValidated = false;

    // PASO 1: Intentar primero con el sistema de refresh tokens (nuevo)
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (accessToken && refreshToken) {
      logger.debug('requireBusinessUser: Usando sistema de refresh tokens');

      const crypto = await import('crypto');
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      const { data: token, error: tokenError } = await supabase
        .from('refresh_tokens')
        .select('id, user_id, expires_at')
        .eq('token_hash', tokenHash)
        .eq('is_revoked', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!tokenError && token) {
        userId = token.user_id;
        sessionValidated = true;
      }
    }

    // PASO 2: Fallback al sistema legacy (user_session)
    if (!sessionValidated) {
      const sessionCookie = cookieStore.get('aprende-y-aplica-session');

      if (!sessionCookie) {
        return NextResponse.json(
          {
            success: false,
            error: 'No autenticado. Por favor, inicia sesión.'
          },
          { status: 401 }
        );
      }

      const sessionToken = sessionCookie.value;

      const { data: session, error: sessionError } = await supabase
        .from('user_session')
        .select('user_id, expires_at, revoked')
        .eq('jwt_id', sessionToken)
        .single();

      if (sessionError || !session || session.revoked) {
        return NextResponse.json(
          {
            success: false,
            error: 'Sesión inválida o expirada.'
          },
          { status: 401 }
        );
      }

      // Verificar expiración
      if (new Date() > new Date(session.expires_at)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Sesión expirada. Por favor, inicia sesión nuevamente.'
          },
          { status: 401 }
        );
      }

      userId = session.user_id;
    }

    // PASO 3: Verificar que tenemos userId
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autenticado. Por favor, inicia sesión.'
        },
        { status: 401 }
      );
    }

    // NOTA: organization_id ya no existe en users, se obtiene de organization_users
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, cargo_rol')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario no encontrado.'
        },
        { status: 401 }
      );
    }

    // Intentar obtener organization_id de forma separada (la columna puede no existir)
    let userOrgId: string | null = null;
    const { data: orgData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .maybeSingle();

    if (orgData) {
      userOrgId = orgData.organization_id || null;
    }

    // Permitir Business y Business User (flexible con variaciones)
    const normalizedRole = user.cargo_rol?.toLowerCase().trim() || '';
    const isBusiness = normalizedRole === 'business' || normalizedRole.includes('business');
    const isBusinessUser = normalizedRole === 'business user' || normalizedRole.includes('business user');

    if (!isBusiness && !isBusinessUser) {
      logger.warn('Unauthorized access attempt - invalid role', {
        userId: user.id,
        role: user.cargo_rol,
        normalizedRole
      });
      return NextResponse.json(
        {
          success: false,
          error: `Permisos insuficientes. Se requiere rol de Business o Business User. Rol actual: ${user.cargo_rol || 'sin rol'}`
        },
        { status: 403 }
      );
    }

    // Obtener organizationId desde organization_users (única fuente de verdad)
    let organizationId: string | undefined = undefined;

    const { data: userOrgs } = await supabase
      .from('organization_users')
      .select('organization_id, joined_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('joined_at', { ascending: false })
      .limit(1);

    if (userOrgs && userOrgs.length > 0) {
      organizationId = userOrgs[0].organization_id;
    }

    logger.auth('Business User access granted', {
      userId: user.id,
      email: user.email,
      role: user.cargo_rol,
      organizationId: organizationId
    });

    return {
      userId: user.id,
      userEmail: user.email,
      userRole: user.cargo_rol,
      organizationId: organizationId
    };

  } catch (error) {
    logger.error('Error in requireBusinessUser middleware', error instanceof Error ? error : undefined);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor.'
      },
      { status: 500 }
    );
  }
}

