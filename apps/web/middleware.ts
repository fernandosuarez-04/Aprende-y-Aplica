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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
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
  
  // console.log('🚀 Middleware ejecutándose para:', pathname);
  
  // Actualizar sesión de Supabase
  let response = await updateSession(request);
  
  // Rutas protegidas por rol
  const isAdminRoute = ROLE_ROUTES.admin.some(route => pathname.startsWith(route));
  const isInstructorRoute = ROLE_ROUTES.instructor.some(route => pathname.startsWith(route));
  const isUserRoute = ROLE_ROUTES.user.some(route => pathname.startsWith(route));
  const isBusinessRoute = ROLE_ROUTES.business.some(route => pathname.startsWith(route));
  const authRoutes = ['/auth'];

  // Verificar si es una ruta protegida
  const isProtectedRoute = isAdminRoute || isInstructorRoute || isUserRoute || isBusinessRoute;
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // console.log('📍 Ruta protegida:', isProtectedRoute, 'Ruta auth:', isAuthRoute);
  
  // Verificar cookies (sistema legacy y nuevo)
  const sessionCookie = request.cookies.get('aprende-y-aplica-session');
  const accessTokenCookie = request.cookies.get('access_token');
  const refreshTokenCookie = request.cookies.get('refresh_token');
  
  const hasLegacySession = !!sessionCookie?.value;
  const hasAccessToken = !!accessTokenCookie?.value;
  const hasRefreshToken = !!refreshTokenCookie?.value;
  const hasSession = hasLegacySession || hasAccessToken;
  
  // Para debugging: mostrar cookies
  // console.log('🍪 Cookies detectadas:', {
    legacy: hasLegacySession,
    access: hasAccessToken,
    refresh: hasRefreshToken
  });
  
  // Si es una ruta protegida, verificar y refrescar tokens si es necesario
  if (isProtectedRoute) {
    // Si no hay ningún tipo de sesión, redirigir a login
    if (!hasSession && !hasRefreshToken) {
      // console.log('� Redirigiendo a /auth - no hay sesión para ruta protegida');
      return NextResponse.redirect(new URL('/auth?error=session_required', request.url));
    }
    
    // Si tiene refresh token pero no access token, intentar refrescar
    if (hasRefreshToken && !hasAccessToken) {
      // console.log('🔄 Intentando refrescar access token expirado');
      try {
        const sessionInfo = await RefreshTokenService.refreshSession(request);
        // console.log('✅ Access token refrescado exitosamente');
        
        // Crear nueva respuesta con cookies actualizadas
        response = NextResponse.next();
        
        // Las cookies ya fueron establecidas por RefreshTokenService.refreshSession()
        // Solo necesitamos continuar con la request
        
      } catch (error) {
        // console.log('❌ Error refrescando token:', error);
        // console.log('🔒 Redirigiendo a /auth - token refresh falló');
        
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
    // console.log('🔐 Validando permisos de rol para:', pathname);
    
    let roleValidationResponse: NextResponse | null = null;

    if (isAdminRoute) {
      // console.log('🔐 Validando acceso de Administrador');
      roleValidationResponse = await validateAdminAccess(request);
    } else if (isInstructorRoute) {
      // console.log('🔐 Validando acceso de Instructor');
      roleValidationResponse = await validateInstructorAccess(request);
    } else if (isBusinessRoute) {
      // console.log('🔐 Validando acceso de Business');
      roleValidationResponse = await validateBusinessAccess(request);
    } else if (isUserRoute) {
      // console.log('🔐 Validando acceso de Usuario');
      roleValidationResponse = await validateUserAccess(request);
    }

    // Si la validación de rol devuelve una respuesta, significa que el acceso fue denegado
    if (roleValidationResponse) {
      // console.log('❌ Acceso denegado por validación de rol');
      return roleValidationResponse;
    }
    
    // console.log('✅ Validación de rol exitosa');
  }
  
  // Si es una ruta de auth y hay sesión válida, redirigir al dashboard
  if (isAuthRoute && hasSession) {
    // console.log('✅ Redirigiendo a /dashboard - usuario autenticado en ruta auth');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // console.log('➡️ Continuando sin redirección');
  
  // Agregar headers de rate limit a la respuesta si están disponibles
  const rateLimitInfo = request.headers.get('X-Rate-Limit-Info');
  if (rateLimitInfo) {
    try {
      const { limit, remaining, reset } = JSON.parse(rateLimitInfo);
      response = addRateLimitHeaders(response, limit, remaining, new Date(reset));
    } catch (error) {
      // console.warn('Error agregando headers de rate limit:', error);
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
