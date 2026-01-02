/**
 * Middleware de autenticación y autorización para rutas admin
 * 
 * Este middleware:
 * 1. Verifica que el usuario esté autenticado (tiene sesión válida)
 * 2. Verifica que el usuario tenga rol de Administrador
 * 3. Retorna el ID del usuario admin para logging/auditoría
 * 
 * Uso en route handlers:
 * ```typescript
 * import { requireAdmin } from '@/lib/auth/requireAdmin';
 * 
 * export async function POST(request: NextRequest) {
 *   const auth = await requireAdmin();
 *   if (auth instanceof NextResponse) return auth; // Error response
 *   
 *   const adminUserId = auth.userId; // UUID del admin autenticado
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
export interface AdminAuth {
  userId: string;
  userEmail: string;
  userRole: string;
}

/**
 * Verifica autenticación y autorización de administrador
 * 
 * @returns AdminAuth si el usuario es admin autenticado, o NextResponse con error
 */
export async function requireAdmin(): Promise<AdminAuth | NextResponse> {
  try {
    // PASO 1: Verificar cookie de sesión
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('aprende-y-aplica-session');

    if (!sessionCookie) {
      logger.warn('Admin route accessed without session cookie');
      return NextResponse.json(
        { 
          success: false,
          error: 'No autenticado. Por favor, inicia sesión.' 
        },
        { status: 401 }
      );
    }

    const sessionToken = sessionCookie.value;
    logger.debug('Validating admin session', { hasToken: !!sessionToken });

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
      .select('id, email, cargo_rol')
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

    // PASO 6: Verificar que el usuario sea Administrador
    if (user.cargo_rol !== 'Administrador') {
      logger.warn('Non-admin user attempted to access admin route', { 
        userId: user.id,
        email: user.email,
        role: user.cargo_rol 
      });
      return NextResponse.json(
        { 
          success: false,
          error: 'Permisos insuficientes. Se requiere rol de Administrador.' 
        },
        { status: 403 }
      );
    }



    // ✅ AUTENTICACIÓN Y AUTORIZACIÓN EXITOSA
    logger.auth('Admin access granted', { 
      userId: user.id, 
      email: user.email 
    });

    return {
      userId: user.id,
      userEmail: user.email,
      userRole: user.cargo_rol,
    };

  } catch (error) {
    logger.error('Error in requireAdmin middleware', error instanceof Error ? error : undefined);
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
 * Verifica autenticación y autorización de instructor o superior
 * Permite acceso a Administradores e Instructores
 * 
 * @returns AdminAuth si el usuario es admin/instructor autenticado, o NextResponse con error
 */
export async function requireInstructor(): Promise<AdminAuth | NextResponse> {
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
      .select('id, email, cargo_rol')
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

    // Permitir Administrador e Instructor
    if (user.cargo_rol !== 'Administrador' && user.cargo_rol !== 'Instructor') {
      logger.warn('User without instructor permissions attempted access', { 
        userId: user.id,
        role: user.cargo_rol 
      });
      return NextResponse.json(
        { 
          success: false,
          error: 'Permisos insuficientes. Se requiere rol de Instructor o Administrador.' 
        },
        { status: 403 }
      );
    }



    logger.auth('Instructor access granted', { 
      userId: user.id, 
      role: user.cargo_rol 
    });

    return {
      userId: user.id,
      userEmail: user.email,
      userRole: user.cargo_rol,
    };

  } catch (error) {
    logger.error('Error in requireInstructor middleware', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor.' 
      },
      { status: 500 }
    );
  }
}
