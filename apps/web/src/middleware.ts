import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from './lib/supabase/types'

export async function middleware(request: NextRequest) {
  console.log('🔍 Middleware ejecutándose para:', request.nextUrl.pathname)
  
  // Verificar si la ruta requiere autenticación
  const protectedRoutes = ['/admin', '/instructor', '/dashboard']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  if (!isProtectedRoute) {
    console.log('✅ Ruta no protegida, continuando...')
    return NextResponse.next()
  }

  console.log('🔒 Ruta protegida detectada:', request.nextUrl.pathname)

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
  console.log('🍪 Cookie de sesión:', sessionCookie ? 'Encontrada' : 'No encontrada')

  if (!sessionCookie) {
    console.log('❌ No hay sesión, redirigiendo a /auth')
    // Redirigir a login si no hay sesión
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // Validar que la sesión sea válida en la base de datos
  console.log('🔍 Validando sesión en base de datos...')
  try {
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_session')
      .select('user_id')
      .eq('jwt_id', sessionCookie.value)
      .eq('revoked', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    console.log('📋 Sesión en DB:', sessionData ? 'Válida' : 'No válida')
    console.log('❌ Error de sesión:', sessionError?.message || 'Ninguno')

    if (sessionError || !sessionData) {
      console.log('❌ Sesión inválida o expirada, redirigiendo a /auth')
      // Eliminar cookie inválida
      response.cookies.delete('aprende-y-aplica-session')
      return NextResponse.redirect(new URL('/auth', request.url))
    }

    console.log('✅ Sesión válida para usuario:', sessionData.user_id)
  } catch (error) {
    console.error('❌ Error validando sesión:', error)
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // Para rutas de admin, verificar rol
  if (request.nextUrl.pathname.startsWith('/admin')) {
    console.log('👑 Verificando acceso de administrador...')
    try {
      // Obtener información de la sesión
      const { data: sessionData } = await supabase
        .from('user_session')
        .select('user_id')
        .eq('jwt_id', sessionCookie.value)
        .eq('revoked', false)
        .gt('expires_at', new Date().toISOString())
        .single()

      console.log('📋 Datos de sesión:', sessionData ? 'Encontrados' : 'No encontrados')

      if (!sessionData) {
        console.log('❌ Sesión inválida, redirigiendo a /auth')
        return NextResponse.redirect(new URL('/auth', request.url))
      }

      // Verificar rol del usuario
      const { data: userData } = await supabase
        .from('users')
        .select('cargo_rol')
        .eq('id', sessionData.user_id)
        .single()

      console.log('👤 Rol del usuario:', userData?.cargo_rol)

      if (!userData || userData.cargo_rol !== 'Administrador') {
        console.log('❌ No es administrador, redirigiendo a /dashboard')
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      console.log('✅ Acceso de administrador autorizado')
    } catch (error) {
      console.error('❌ Error checking admin role:', error)
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

      if (!userData || userData.cargo_rol !== 'Instructor') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch (error) {
      console.error('Error checking instructor role:', error)
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
