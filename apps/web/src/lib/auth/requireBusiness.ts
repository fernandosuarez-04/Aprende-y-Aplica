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
    // PASO 1: Verificar cookie de sesión
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('aprende-y-aplica-session');

    if (!sessionCookie) {
      logger.warn('Business route accessed without session cookie');
      return NextResponse.json(
        { 
          success: false,
          error: 'No autenticado. Por favor, inicia sesión.' 
        },
        { status: 401 }
      );
    }

    const sessionToken = sessionCookie.value;
    logger.debug('Validating business session', { hasToken: !!sessionToken });

    // PASO 2: Verificar sesión en base de datos
    const supabase = await createClient();
    
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

    // PASO 3: Verificar que la sesión no esté revocada
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

    // PASO 4: Verificar que la sesión no esté expirada
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

    // PASO 5: Obtener información del usuario y verificar rol
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, cargo_rol, organization_id')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
      logger.error('User not found for valid session', { 
        userId: session.user_id,
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

    // PASO 6: Verificar que el usuario sea Business
    const normalizedRole = user.cargo_rol?.toLowerCase().trim();
    if (normalizedRole !== 'business') {
      logger.warn('Non-business user attempted to access business route', { 
        userId: user.id,
        email: user.email,
        role: user.cargo_rol 
      });
      return NextResponse.json(
        { 
          success: false,
          error: 'Permisos insuficientes. Se requiere rol de Business.' 
        },
        { status: 403 }
      );
    }

    // ✅ AUTENTICACIÓN Y AUTORIZACIÓN EXITOSA
    logger.auth('Business access granted', { 
      userId: user.id, 
      email: user.email,
      organizationId: user.organization_id
    });

    return {
      userId: user.id,
      userEmail: user.email,
      userRole: user.cargo_rol,
      organizationId: user.organization_id || undefined
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

    const supabase = await createClient();
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

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, cargo_rol, organization_id')
      .eq('id', session.user_id)
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

    logger.auth('Business User access granted', { 
      userId: user.id,
      email: user.email,
      role: user.cargo_rol,
      organizationId: user.organization_id
    });

    return {
      userId: user.id,
      userEmail: user.email,
      userRole: user.cargo_rol,
      organizationId: user.organization_id || undefined
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

