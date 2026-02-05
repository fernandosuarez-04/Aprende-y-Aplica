import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from './lib/supabase/types'

// âœ… Sistema de logging condicional - solo en desarrollo
const isDevelopment = process.env.NODE_ENV === 'development';
const logger = {
  log: (...args: any[]) => isDevelopment && console.log(...args),
  error: console.error, // Siempre logguear errores
  warn: (...args: any[]) => isDevelopment && console.warn(...args),
};


export async function middleware(request: NextRequest) {
  logger.log('ðŸ” Middleware ejecutÃ¡ndose para:', request.nextUrl.pathname)

  // Verificar si es una ruta de auth y si el usuario tiene sesiÃ³n activa
  // Redirigir usuarios autenticados al dashboard apropiado segÃºn cargo_rol
  if ((request.nextUrl.pathname === '/auth' || request.nextUrl.pathname === '/auth/')
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
              setAll() { },
            },
          }
        )

        // Verificar sesiÃ³n y obtener usuario
        const { data: sessionData } = await supabase
          .from('user_session')
          .select('user_id')
          .eq('jwt_id', sessionCookie.value)
          .eq('revoked', false)
          .gt('expires_at', new Date().toISOString())
          .single()

        if (sessionData) {
          // Obtener cargo_rol del usuario
          const { data: user } = await supabase
            .from('users')
            .select('cargo_rol')
            .eq('id', sessionData.user_id)
            .single()

          // Redirigir segÃºn cargo_rol (Enfoque B2B)
          if (user) {
            const normalizedRole = user.cargo_rol?.toLowerCase().trim()

            logger.log('ðŸ”„ Usuario autenticado en /auth, redirigiendo segÃºn cargo_rol:', normalizedRole)

            if (normalizedRole === 'administrador') {
              return NextResponse.redirect(new URL('/admin/dashboard', request.url))
            } else if (normalizedRole === 'instructor') {
              // Instructor â†’ Panel de instructor
              return NextResponse.redirect(new URL('/instructor/dashboard', request.url))
            } else if (normalizedRole === 'business') {
              // Para usuarios Business, verificar que pertenezca a una organizaciÃ³n
              // La redirecciÃ³n se basa en organization_users.role (owner/admin/member)
              const { data: userOrgs, error: userOrgError } = await supabase
                .from('organization_users')
                .select('organization_id, role, status, joined_at, organizations!inner(id, name, slug, is_active, subscription_plan, subscription_status)')
                .eq('user_id', sessionData.user_id)
                .eq('status', 'active')
                .order('joined_at', { ascending: false })

              if (userOrgError || !userOrgs || userOrgs.length === 0) {
                // Si no pertenece a ninguna organizaciÃ³n, redirigir al dashboard normal
                return NextResponse.redirect(new URL('/dashboard', request.url))
              }

              // Si el usuario pertenece a mÃ¡s de una organizaciÃ³n, ir a selecciÃ³n
              if (userOrgs.length > 1) {
                return NextResponse.redirect(new URL('/auth/select-organization', request.url))
              }

              const userOrg = userOrgs[0]
              const orgRole = userOrg.role as string

              // âœ… RedirecciÃ³n basada en organization_users.role (owner/admin â†’ panel, member â†’ user dashboard)
              if (orgRole === 'owner' || orgRole === 'admin') {
                return NextResponse.redirect(new URL(`/${userOrg.organizations.slug}/business-panel/dashboard`, request.url))
              } else {
                return NextResponse.redirect(new URL(`/${userOrg.organizations.slug}/business-user/dashboard`, request.url))
              }
            } else {
              // Usuario normal (cargo_rol === 'usuario' o cualquier otro) â†’ Tour SOFLIA + Planes
              return NextResponse.redirect(new URL('/dashboard', request.url))
            }
          }
        }
      } catch (error) {
        // console.error('Error verificando sesiÃ³n en middleware:', error)
        // Continuar con flujo normal si hay error
      }
    }
  }

  // Rutas que estÃ¡n exentas de la validaciÃ³n de cuestionario
  const exemptRoutes = [
    '/auth',
    '/api',
    '/statistics',
    '/welcome',
    '/_next',
    '/favicon.ico',
    '/auth/select-organization' // âœ… Permitir acceso a selecciÃ³n de organizaciÃ³n
  ]

  const isExemptRoute = exemptRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Verificar si la ruta requiere autenticaciÃ³n
  // âœ… Incluye rutas B2B: business-panel (admin de org) y business-user (empleado)
  const protectedRoutes = ['/admin', '/dashboard', '/communities', '/business-panel', '/business-user']
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Si es ruta exenta, continuar sin validaciÃ³n adicional
  if (isExemptRoute) {
    logger.log('âœ… Ruta exenta, continuando...')
    return NextResponse.next()
  }

  // Si no es ruta protegida, continuar
  if (!isProtectedRoute) {
    logger.log('âœ… Ruta no protegida, continuando...')
    return NextResponse.next()
  }

  logger.log('ðŸ”’ Ruta protegida detectada:', request.nextUrl.pathname)

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

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

  // âœ… SOPORTE DUAL: Verificar sesiÃ³n con refresh tokens (nuevo) o legacy (user_session)
  const sessionCookie = request.cookies.get('aprende-y-aplica-session')
  const accessTokenCookie = request.cookies.get('access_token')
  const refreshTokenCookie = request.cookies.get('refresh_token')

  const hasLegacySession = !!sessionCookie
  const hasRefreshTokenSession = !!(accessTokenCookie && refreshTokenCookie)

  logger.log('ðŸª Cookies de sesiÃ³n:', {
    legacy: hasLegacySession,
    refreshToken: hasRefreshTokenSession
  })

  if (!hasLegacySession && !hasRefreshTokenSession) {
    logger.log('âŒ No hay sesiÃ³n (ni legacy ni refresh token), redirigiendo a /auth')
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // Validar que la sesiÃ³n sea vÃ¡lida en la base de datos
  logger.log('ðŸ” Validando sesiÃ³n en base de datos...')
  let userId: string | null = null;

  try {
    // PASO 1: Intentar con refresh tokens primero (sistema nuevo)
    if (hasRefreshTokenSession && refreshTokenCookie) {
      const encoder = new TextEncoder()
      const data = encoder.encode(refreshTokenCookie.value)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      const { data: tokenData, error: tokenError } = await supabase
        .from('refresh_tokens')
        .select('user_id')
        .eq('token_hash', tokenHash)
        .eq('is_revoked', false)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (!tokenError && tokenData) {
        userId = tokenData.user_id
        logger.log('âœ… SesiÃ³n validada via refresh token:', userId)
      }
    }

    // PASO 2: Fallback a sistema legacy si no funcionÃ³ refresh tokens
    if (!userId && hasLegacySession && sessionCookie) {
      const { data: sessionData, error: sessionError } = await supabase
        .from('user_session')
        .select('user_id')
        .eq('jwt_id', sessionCookie.value)
        .eq('revoked', false)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (!sessionError && sessionData) {
        userId = sessionData.user_id
        logger.log('âœ… SesiÃ³n validada via legacy (user_session):', userId)
      }
    }

    if (!userId) {
      logger.log('âŒ SesiÃ³n invÃ¡lida o expirada, redirigiendo a /auth')
      // Eliminar cookies invÃ¡lidas
      const redirectResponse = NextResponse.redirect(new URL('/auth', request.url));
      if (hasLegacySession) {
          redirectResponse.cookies.delete('aprende-y-aplica-session');
      }
      return redirectResponse;
    }

    logger.log('âœ… SesiÃ³n vÃ¡lida para usuario:', userId)

  } catch (error) {
    logger.error('âŒ Error validando sesiÃ³n:', error)
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // Para rutas de admin, verificar rol
  if (request.nextUrl.pathname.startsWith('/admin')) {
    logger.log('ðŸ‘‘ Verificando acceso de administrador...')
    try {
      // Usar el userId ya validado anteriormente
      const { data: userData } = await supabase
        .from('users')
        .select('cargo_rol')
        .eq('id', userId)
        .single()

      logger.log('ðŸ‘¤ Rol del usuario:', userData?.cargo_rol)

      // âœ… Normalizar rol antes de comparar (toLowerCase y trim)
      const userRole = userData?.cargo_rol?.toLowerCase().trim()

      if (!userData || userRole !== 'administrador') {
        logger.log('âŒ No es administrador, redirigiendo a /dashboard')
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      logger.log('âœ… Acceso de administrador autorizado')
    } catch (error) {
      logger.error('âŒ Error checking admin role:', error)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Para rutas de instructor (deprecated - pero mantenemos por compatibilidad)
  if (request.nextUrl.pathname.startsWith('/instructor')) {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('cargo_rol')
        .eq('id', userId)
        .single()

      const userRole = userData?.cargo_rol?.toLowerCase().trim()

      // Permitir acceso a instructores y administradores
      if (!userData || (userRole !== 'instructor' && userRole !== 'administrador')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch (error) {
      logger.error('Error checking instructor role:', error)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
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
