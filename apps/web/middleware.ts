import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './src/lib/supabase/middleware'
import { RefreshTokenService } from './src/lib/auth/refreshToken.service'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log('🚀 Middleware ejecutándose para:', pathname);
  
  // Actualizar sesión de Supabase
  let response = await updateSession(request);
  
  // Rutas protegidas que requieren autenticación
  const protectedRoutes = ['/dashboard', '/profile', '/courses', '/communities', '/admin'];
  const authRoutes = ['/auth'];
  
  // Verificar si es una ruta protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  console.log('📍 Ruta protegida:', isProtectedRoute, 'Ruta auth:', isAuthRoute);
  
  // Verificar cookies (sistema legacy y nuevo)
  const sessionCookie = request.cookies.get('aprende-y-aplica-session');
  const accessTokenCookie = request.cookies.get('access_token');
  const refreshTokenCookie = request.cookies.get('refresh_token');
  
  const hasLegacySession = !!sessionCookie?.value;
  const hasAccessToken = !!accessTokenCookie?.value;
  const hasRefreshToken = !!refreshTokenCookie?.value;
  const hasSession = hasLegacySession || hasAccessToken;
  
  // Para debugging: mostrar cookies
  console.log('🍪 Cookies detectadas:', {
    legacy: hasLegacySession,
    access: hasAccessToken,
    refresh: hasRefreshToken
  });
  
  // Si es una ruta protegida, verificar y refrescar tokens si es necesario
  if (isProtectedRoute) {
    // Si no hay ningún tipo de sesión, redirigir a login
    if (!hasSession && !hasRefreshToken) {
      console.log('� Redirigiendo a /auth - no hay sesión para ruta protegida');
      return NextResponse.redirect(new URL('/auth?error=session_required', request.url));
    }
    
    // Si tiene refresh token pero no access token, intentar refrescar
    if (hasRefreshToken && !hasAccessToken) {
      console.log('🔄 Intentando refrescar access token expirado');
      try {
        const sessionInfo = await RefreshTokenService.refreshSession(request);
        console.log('✅ Access token refrescado exitosamente');
        
        // Crear nueva respuesta con cookies actualizadas
        response = NextResponse.next();
        
        // Las cookies ya fueron establecidas por RefreshTokenService.refreshSession()
        // Solo necesitamos continuar con la request
        
      } catch (error) {
        console.log('❌ Error refrescando token:', error);
        console.log('🔒 Redirigiendo a /auth - token refresh falló');
        
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
  }
  
  // Si es una ruta de auth y hay sesión válida, redirigir al dashboard
  if (isAuthRoute && hasSession) {
    console.log('✅ Redirigiendo a /dashboard - usuario autenticado en ruta auth');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  console.log('➡️ Continuando sin redirección');
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
