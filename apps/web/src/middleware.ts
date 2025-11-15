import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from './lib/supabase/types'
import { QuestionnaireValidationService } from './features/auth/services/questionnaire-validation.service'

// ✅ Sistema de logging condicional - solo en desarrollo
const isDevelopment = process.env.NODE_ENV === 'development';
const logger = {
  log: (...args: any[]) => isDevelopment && console.log(...args),
  error: console.error, // Siempre logguear errores
  warn: (...args: any[]) => isDevelopment && console.warn(...args),
};

export async function middleware(request: NextRequest) {
  logger.log('🔍 Middleware ejecutándose para:', request.nextUrl.pathname)
  
  // Verificar si es una ruta de auth y si el usuario tiene organización
  // NO redirigir si hay un parámetro ?redirect=force que indica redirección forzada
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
          // Obtener información del usuario y su organización
          const { data: user } = await supabase
            .from('users')
            .select('organization_id, cargo_rol')
            .eq('id', sessionData.user_id)
            .single()

          if (user?.organization_id) {
            // Obtener slug de la organización
            const { data: organization } = await supabase
              .from('organizations')
              .select('slug, subscription_plan, subscription_status, is_active')
              .eq('id', user.organization_id)
              .single()

            if (organization?.slug) {
              // Validar que puede usar login personalizado
              const allowedPlans = ['team', 'business', 'enterprise']
              const activeStatuses = ['active', 'trial']
              
              if (allowedPlans.includes(organization.subscription_plan) && 
                  activeStatuses.includes(organization.subscription_status) &&
                  organization.is_active) {
                // Redirigir a login personalizado
                // console.log('🔄 Redirigiendo usuario de organización a login personalizado')
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
        // console.error('Error verificando organización en middleware:', error)
        // Continuar con flujo normal si hay error
      }
    }
  }
  
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
    request.nextUrl.pathname.startsWith(route)
  )

  // Verificar si la ruta requiere autenticación
  const protectedRoutes = ['/admin', '/instructor', '/dashboard', '/communities']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Si es ruta exenta, continuar sin validación adicional
  if (isExemptRoute) {
    logger.log('✅ Ruta exenta, continuando...')
    return NextResponse.next()
  }

  // Si no es ruta protegida, continuar
  if (!isProtectedRoute) {
    logger.log('✅ Ruta no protegida, continuando...')
    return NextResponse.next()
  }

  logger.log('🔒 Ruta protegida detectada:', request.nextUrl.pathname)

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

  // Verificar sesión personalizada
  const sessionCookie = request.cookies.get('aprende-y-aplica-session')
  logger.log('🍪 Cookie de sesión:', sessionCookie ? 'Encontrada' : 'No encontrada')

  if (!sessionCookie) {
    logger.log('❌ No hay sesión, redirigiendo a /auth')
    // Redirigir a login si no hay sesión
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // Validar que la sesión sea válida en la base de datos
  logger.log('🔍 Validando sesión en base de datos...')
  try {
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_session')
      .select('user_id')
      .eq('jwt_id', sessionCookie.value)
      .eq('revoked', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    logger.log('📋 Sesión en DB:', sessionData ? 'Válida' : 'No válida')
    logger.log('❌ Error de sesión:', sessionError?.message || 'Ninguno')

    if (sessionError || !sessionData) {
      logger.log('❌ Sesión inválida o expirada, redirigiendo a /auth')
      // Eliminar cookie inválida
      response.cookies.delete('aprende-y-aplica-session')
      return NextResponse.redirect(new URL('/auth', request.url))
    }

    logger.log('✅ Sesión válida para usuario:', sessionData.user_id)

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
  if (request.nextUrl.pathname.startsWith('/admin')) {
    logger.log('👑 Verificando acceso de administrador...')
    try {
      // Obtener información de la sesión
      const { data: sessionData } = await supabase
        .from('user_session')
        .select('user_id')
        .eq('jwt_id', sessionCookie.value)
        .eq('revoked', false)
        .gt('expires_at', new Date().toISOString())
        .single()

      logger.log('📋 Datos de sesión:', sessionData ? 'Encontrados' : 'No encontrados')

      if (!sessionData) {
        logger.log('❌ Sesión inválida, redirigiendo a /auth')
        return NextResponse.redirect(new URL('/auth', request.url))
      }

      // Verificar rol del usuario
      const { data: userData } = await supabase
        .from('users')
        .select('cargo_rol')
        .eq('id', sessionData.user_id)
        .single()

      logger.log('👤 Rol del usuario:', userData?.cargo_rol)

      // ✅ Normalizar rol antes de comparar (toLowerCase y trim)
      const userRole = userData?.cargo_rol?.toLowerCase().trim()
      
      if (!userData || userRole !== 'administrador') {
        logger.log('❌ No es administrador, redirigiendo a /dashboard')
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      logger.log('✅ Acceso de administrador autorizado')
    } catch (error) {
      logger.error('❌ Error checking admin role:', error)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Para rutas de instructor, verificar rol
  if (request.nextUrl.pathname.startsWith('/instructor')) {
    try {
      // Obtener información de la sesión
      const { data: sessionData } = await supabase
        .from('user_session')
        .select('user_id')
        .eq('jwt_id', sessionCookie.value)
        .eq('revoked', false)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (!sessionData) {
        return NextResponse.redirect(new URL('/auth', request.url))
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
