import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './src/lib/supabase/middleware'
import { RefreshTokenService } from './src/lib/auth/refreshToken.service'
import {
  validateAdminAccess,
  validateInstructorAccess,
  validateUserAccess,
  validateBusinessAccess,
  ROLE_ROUTES
} from './src/core/middleware/auth.middleware'
import { applyRateLimit, RATE_LIMITS, addRateLimitHeaders, checkRateLimit } from './src/core/lib/rate-limit'
import { createServerClient } from '@supabase/ssr'
import type { Database } from './src/lib/supabase/types'
import { QuestionnaireValidationService } from './src/features/auth/services/questionnaire-validation.service'

// ✅ Sistema de logging condicional - solo en desarrollo
const isDevelopment = process.env.NODE_ENV === 'development';
const logger = {
  log: (...args: any[]) => isDevelopment && console.log(...args),
  error: console.error, // Siempre logguear errores
  warn: (...args: any[]) => isDevelopment && console.warn(...args),
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  logger.log('🔍 Middleware ejecutándose para:', pathname);
  
  // ✅ RATE LIMITING (Issue #20)
  // Aplicar rate limiting antes de cualquier procesamiento
  
  // 1. Rate limiting estricto para auth endpoints
  if (pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/register')) {
    const rateLimitResponse = await applyRateLimit(request, RATE_LIMITS.strict, 'auth');
    if (rateLimitResponse) return rateLimitResponse;
  }
  
  // 2. Rate limiting estricto para password reset
  if (pathname.startsWith('/api/auth/reset-password') || pathname.startsWith('/api/auth/forgot-password')) {
    const rateLimitResponse = await applyRateLimit(request, RATE_LIMITS.strict, 'password');
    if (rateLimitResponse) return rateLimitResponse;
  }
  
  // 3. Rate limiting para operaciones de creación
  if (request.method === 'POST' && (
    pathname.includes('/create') || 
    pathname.startsWith('/api/admin/communities') ||
    pathname.startsWith('/api/courses') && pathname.includes('create')
  )) {
    const rateLimitResponse = await applyRateLimit(request, RATE_LIMITS.create, 'create');
    if (rateLimitResponse) return rateLimitResponse;
  }
  
  // 4. Rate limiting para uploads
  if (pathname.startsWith('/api/upload') || pathname.includes('/upload')) {
    const rateLimitResponse = await applyRateLimit(request, RATE_LIMITS.upload, 'upload');
    if (rateLimitResponse) return rateLimitResponse;
  }
  
  // 5. Rate limiting para admin endpoints
  if (pathname.startsWith('/api/admin')) {
    const rateLimitResponse = await applyRateLimit(request, RATE_LIMITS.admin, 'admin');
    if (rateLimitResponse) return rateLimitResponse;
  }
  
  // 6. Rate limiting general para todos los API endpoints
  if (pathname.startsWith('/api/')) {
    const rateLimitResult = checkRateLimit(request, RATE_LIMITS.api, 'api');
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }
    // Guardar info de rate limit para agregar headers después
    request.headers.set('X-Rate-Limit-Info', JSON.stringify({
      limit: rateLimitResult.limit,
      remaining: rateLimitResult.remaining,
      reset: rateLimitResult.reset.toISOString()
    }));
  }
  
  // Verificar si es una ruta de auth y si el usuario tiene organización
  // NO redirigir si hay un parámetro ?redirect=force que indica redirección forzada
  if ((pathname === '/auth' || pathname === '/auth/') 
      && !request.nextUrl.searchParams.has('redirect')) {
    const sessionCookie = request.cookies.get('aprende-y-aplica-session')
    if (sessionCookie) {
      try {
        const supabase = createServerClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() {
                return request.cookies.getAll()
              },
              setAll() {},
            },
          }
        )

        // Verificar sesión y obtener usuario
        const { data: sessionData } = await supabase
          .from('user_session')
          .select('user_id')
          .eq('jwt_id', sessionCookie.value)
          .eq('revoked', false)
          .gt('expires_at', new Date().toISOString())
          .single()

        if (sessionData) {
          // Obtener información del usuario
          const { data: user } = await supabase
            .from('users')
            .select('cargo_rol')
            .eq('id', sessionData.user_id)
            .single()

          // Obtener organización del usuario desde organization_users
          const { data: orgUser } = await supabase
            .from('organization_users')
            .select('organization_id')
            .eq('user_id', sessionData.user_id)
            .eq('status', 'active')
            .single()

          if (orgUser?.organization_id) {
            // Obtener slug de la organización
            const { data: organization } = await supabase
              .from('organizations')
              .select('slug, subscription_plan, subscription_status, is_active')
              .eq('id', orgUser.organization_id)
              .single()

            if (organization?.slug) {
              // Validar que puede usar login personalizado
              const allowedPlans = ['team', 'business', 'enterprise']
              const activeStatuses = ['active', 'trial']

              if (allowedPlans.includes(organization.subscription_plan ?? '') &&
                  activeStatuses.includes(organization.subscription_status ?? '') &&
                  organization.is_active) {
                // Redirigir a login personalizado
                logger.log('🔄 Redirigiendo usuario de organización a login personalizado')
                return NextResponse.redirect(new URL(`/auth/${organization.slug}`, request.url))
              }
            }
          }

          // Si el usuario está autenticado pero NO tiene organización válida,
          // redirigirlo al dashboard apropiado según su rol
          if (user) {
            const normalizedRole = user.cargo_rol?.toLowerCase().trim()
            
            logger.log('🔄 Usuario autenticado en /auth sin organización válida, redirigiendo según rol:', normalizedRole)
            
            if (normalizedRole === 'administrador') {
              return NextResponse.redirect(new URL('/admin/dashboard', request.url))
            } else if (normalizedRole === 'instructor') {
              return NextResponse.redirect(new URL('/instructor/dashboard', request.url))
            } else if (normalizedRole === 'business') {
              return NextResponse.redirect(new URL('/business-panel/dashboard', request.url))
            } else if (normalizedRole === 'business user') {
              return NextResponse.redirect(new URL('/business-user/dashboard', request.url))
            } else {
              // Usuario regular o sin rol específico
              return NextResponse.redirect(new URL('/dashboard', request.url))
            }
          }
        }
      } catch (error) {
        logger.error('Error verificando organización en middleware:', error)
        // Continuar con flujo normal si hay error
      }
    }
  }
  
  // Actualizar sesión de Supabase
  let response = await updateSession(request);
  
  // Rutas que están exentas de la validación de cuestionario
  const exemptRoutes = [
    '/auth',
    '/api',
    '/statistics',
    '/welcome',
    '/questionnaire',
    '/_next',
    '/favicon.ico'
  ]
  
  const isExemptRoute = exemptRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Rutas protegidas por rol
  const isAdminRoute = ROLE_ROUTES.admin.some(route => pathname.startsWith(route));
  const isInstructorRoute = ROLE_ROUTES.instructor.some(route => pathname.startsWith(route));
  const isUserRoute = ROLE_ROUTES.user.some(route => pathname.startsWith(route));
  const isBusinessRoute = ROLE_ROUTES.business.some(route => pathname.startsWith(route));
  const authRoutes = ['/auth'];

  // Verificar si es una ruta protegida
  const isProtectedRoute = isAdminRoute || isInstructorRoute || isUserRoute || isBusinessRoute;
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // Verificar cookies (sistema legacy y nuevo)
  const sessionCookie = request.cookies.get('aprende-y-aplica-session');
  const accessTokenCookie = request.cookies.get('access_token');
  const refreshTokenCookie = request.cookies.get('refresh_token');
  
  const hasLegacySession = !!sessionCookie?.value;
  const hasAccessToken = !!accessTokenCookie?.value;
  const hasRefreshToken = !!refreshTokenCookie?.value;
  const hasSession = hasLegacySession || hasAccessToken;
  
  // Si es una ruta protegida, verificar y refrescar tokens si es necesario
  if (isProtectedRoute) {
    // Si no hay ningún tipo de sesión, redirigir a login
    if (!hasSession && !hasRefreshToken) {
      logger.log('❌ Redirigiendo a /auth - no hay sesión para ruta protegida');
      return NextResponse.redirect(new URL('/auth?error=session_required', request.url));
    }
    
    // Si tiene refresh token pero no access token, intentar refrescar
    if (hasRefreshToken && !hasAccessToken) {
      logger.log('🔄 Intentando refrescar access token expirado');
      try {
        const sessionInfo = await RefreshTokenService.refreshSession(request);
        logger.log('✅ Access token refrescado exitosamente');
        
        // Crear nueva respuesta con cookies actualizadas
        response = NextResponse.next();
        
        // Las cookies ya fueron establecidas por RefreshTokenService.refreshSession()
        // Solo necesitamos continuar con la request
        
      } catch (error) {
        logger.error('❌ Error refrescando token:', error);
        logger.log('🔒 Redirigiendo a /auth - token refresh falló');
        
        // Crear respuesta de redirección y limpiar cookies inválidas
        const redirectResponse = NextResponse.redirect(
          new URL('/auth?error=session_expired', request.url)
        );
        
        redirectResponse.cookies.delete('access_token');
        redirectResponse.cookies.delete('refresh_token');
        redirectResponse.cookies.delete('aprende-y-aplica-session');
        
        return redirectResponse;
      }
    }
    
    // ✅ VALIDACIÓN DE ROL ROBUSTA (Issue #16)
    // Verificar permisos basados en el rol del usuario
    logger.log('🔐 Validando permisos de rol para:', pathname);
    
    let roleValidationResponse: NextResponse | null = null;

    if (isAdminRoute) {
      logger.log('🔐 Validando acceso de Administrador');
      roleValidationResponse = await validateAdminAccess(request);
    } else if (isInstructorRoute) {
      logger.log('🔐 Validando acceso de Instructor');
      roleValidationResponse = await validateInstructorAccess(request);
    } else if (isBusinessRoute) {
      logger.log('🔐 Validando acceso de Business');
      roleValidationResponse = await validateBusinessAccess(request);
    } else if (isUserRoute) {
      logger.log('🔐 Validando acceso de Usuario');
      roleValidationResponse = await validateUserAccess(request);
    }

    // Si la validación de rol devuelve una respuesta, significa que el acceso fue denegado
    if (roleValidationResponse) {
      logger.log('❌ Acceso denegado por validación de rol');
      return roleValidationResponse;
    }
    
    logger.log('✅ Validación de rol exitosa');
  }
  
  // Si es una ruta de auth y hay sesión válida, redirigir al panel apropiado según cargo_rol
  if (isAuthRoute && hasSession) {
    try {
      const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll() {},
          },
        }
      )

      // Obtener userId de la sesión
      let userId: string | null = null;
      
      // Intentar con sesión legacy primero
      if (sessionCookie?.value) {
        const { data: sessionData } = await supabase
          .from('user_session')
          .select('user_id')
          .eq('jwt_id', sessionCookie.value)
          .eq('revoked', false)
          .gt('expires_at', new Date().toISOString())
          .single()
        
        if (sessionData) {
          userId = sessionData.user_id;
        }
      }

      if (userId) {
        // Obtener cargo_rol del usuario
        const { data: userData } = await supabase
          .from('users')
          .select('cargo_rol')
          .eq('id', userId)
          .single()

        const normalizedRole = userData?.cargo_rol?.toLowerCase().trim();
        logger.log('🔄 Usuario autenticado en ruta auth, redirigiendo según cargo_rol:', normalizedRole);

        // Redirigir según cargo_rol
        if (normalizedRole === 'administrador') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        } else if (normalizedRole === 'instructor') {
          return NextResponse.redirect(new URL('/instructor/dashboard', request.url));
        } else if (normalizedRole === 'business') {
          // Verificar que tenga organización activa
          const { data: userOrg } = await supabase
            .from('organization_users')
            .select('organization_id')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single()
          
          if (userOrg) {
            return NextResponse.redirect(new URL('/business-panel/dashboard', request.url));
          }
          // Sin organización, ir al dashboard normal
          return NextResponse.redirect(new URL('/dashboard', request.url));
        } else if (normalizedRole === 'business user') {
          // Verificar que tenga organización activa
          const { data: userOrg } = await supabase
            .from('organization_users')
            .select('organization_id')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single()
          
          if (userOrg) {
            return NextResponse.redirect(new URL('/business-user/dashboard', request.url));
          }
          // Sin organización, ir al dashboard normal
          return NextResponse.redirect(new URL('/dashboard', request.url));
        } else {
          // Usuario normal (cargo_rol === 'usuario' o cualquier otro) → /dashboard
          logger.log('✅ Redirigiendo a /dashboard - usuario con rol:', normalizedRole || 'sin rol');
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      } else {
        // No se pudo obtener userId, redirigir al dashboard por defecto
        logger.log('⚠️ No se pudo obtener userId, redirigiendo a /dashboard');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      logger.error('Error obteniendo rol del usuario en auth route:', error);
      // En caso de error, redirigir al dashboard por defecto
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Si es ruta exenta, continuar sin validación adicional
  if (isExemptRoute) {
    logger.log('✅ Ruta exenta, continuando...');
    return NextResponse.next();
  }

  // Si no es ruta protegida, continuar
  if (!isProtectedRoute) {
    logger.log('✅ Ruta no protegida, continuando...');
    return NextResponse.next();
  }

  logger.log('🔒 Ruta protegida detectada:', pathname);

  // Validación de sesión personalizada para rutas protegidas
  if (!sessionCookie) {
    logger.log('❌ No hay sesión, redirigiendo a /auth');
    // Redirigir a login si no hay sesión
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Validar que la sesión sea válida en la base de datos
  logger.log('🔍 Validando sesión en base de datos...');
  try {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: sessionData, error: sessionError } = await supabase
      .from('user_session')
      .select('user_id')
      .eq('jwt_id', sessionCookie.value)
      .eq('revoked', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    logger.log('📋 Sesión en DB:', sessionData ? 'Válida' : 'No válida');
    logger.log('❌ Error de sesión:', sessionError?.message || 'Ninguno');

    if (sessionError || !sessionData) {
      logger.log('❌ Sesión inválida o expirada, redirigiendo a /auth');
      // Eliminar cookie inválida
      response.cookies.delete('aprende-y-aplica-session')
      return NextResponse.redirect(new URL('/auth', request.url))
    }

    logger.log('✅ Sesión válida para usuario:', sessionData.user_id);

    // Verificar si usuario OAuth necesita cuestionario (OBLIGATORIO - NO SE PUEDE ESQUIVAR)
    // Esta validación se ejecuta ANTES de las validaciones de rol para asegurar que ningún usuario OAuth
    // pueda acceder sin completar el cuestionario, incluso si es administrador o instructor
    try {
      const requiresQuestionnaire = await QuestionnaireValidationService.requiresQuestionnaire(sessionData.user_id)
      
      if (requiresQuestionnaire) {
        logger.log('📋 Usuario OAuth sin cuestionario detectado, redirigiendo a /statistics')
        // Redirigir a /statistics sin importar la ruta que intentó acceder
        return NextResponse.redirect(new URL('/statistics', request.url))
      }
    } catch (questionnaireError) {
      // Fail-secure: Si hay error verificando cuestionario, denegar acceso por seguridad
      // NO permitir acceso si no podemos verificar el estado del cuestionario
      logger.error('❌ Error verificando cuestionario - DENEGANDO ACCESO por seguridad:', questionnaireError)
      return NextResponse.redirect(new URL('/statistics', request.url))
    }
  } catch (error) {
    logger.error('❌ Error validando sesión:', error)
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // Para rutas de admin, verificar rol
  if (pathname.startsWith('/admin')) {
    logger.log('👑 Verificando acceso de administrador...');
    try {
      const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll() {},
          },
        }
      )

      // Obtener información de la sesión
      const { data: sessionData } = await supabase
        .from('user_session')
        .select('user_id')
        .eq('jwt_id', sessionCookie.value)
        .eq('revoked', false)
        .gt('expires_at', new Date().toISOString())
        .single()

      logger.log('📋 Datos de sesión:', sessionData ? 'Encontrados' : 'No encontrados');

      if (!sessionData) {
        logger.log('❌ Sesión inválida, redirigiendo a /auth');
        return NextResponse.redirect(new URL('/auth', request.url));
      }

      // Verificar rol del usuario
      const { data: userData } = await supabase
        .from('users')
        .select('cargo_rol')
        .eq('id', sessionData.user_id)
        .single()

      logger.log('👤 Rol del usuario:', userData?.cargo_rol);

      // ✅ Normalizar rol antes de comparar (toLowerCase y trim)
      const userRole = userData?.cargo_rol?.toLowerCase().trim()
      
      if (!userData || userRole !== 'administrador') {
        logger.log('❌ No es administrador, redirigiendo a /dashboard');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      logger.log('✅ Acceso de administrador autorizado');
    } catch (error) {
      logger.error('❌ Error checking admin role:', error);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Para rutas de instructor, verificar rol
  if (pathname.startsWith('/instructor')) {
    try {
      const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll() {},
          },
        }
      )

      // Obtener información de la sesión
      const { data: sessionData } = await supabase
        .from('user_session')
        .select('user_id')
        .eq('jwt_id', sessionCookie.value)
        .eq('revoked', false)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (!sessionData) {
        return NextResponse.redirect(new URL('/auth', request.url));
      }

      // Verificar rol del usuario
      const { data: userData } = await supabase
        .from('users')
        .select('cargo_rol')
        .eq('id', sessionData.user_id)
        .single()

      // ✅ Normalizar rol antes de comparar (toLowerCase y trim)
      const userRole = userData?.cargo_rol?.toLowerCase().trim()

      // Permitir acceso a instructores y administradores
      if (!userData || (userRole !== 'instructor' && userRole !== 'administrador')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      logger.error('Error checking instructor role:', error);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // Agregar headers de rate limit a la respuesta si están disponibles
  const rateLimitInfo = request.headers.get('X-Rate-Limit-Info');
  if (rateLimitInfo) {
    try {
      const { limit, remaining, reset } = JSON.parse(rateLimitInfo);
      response = addRateLimitHeaders(response, limit, remaining, new Date(reset));
    } catch (error) {
      logger.warn('Error agregando headers de rate limit:', error);
    }
  }
  
  return response;
}

export const config = {
  runtime: 'nodejs', // Usar Node.js runtime para soportar crypto y bcrypt
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}








