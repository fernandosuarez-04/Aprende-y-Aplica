import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log('🚀 Middleware ejecutándose para:', pathname);
  
  // Rutas protegidas que requieren autenticación
  const protectedRoutes = ['/dashboard'];
  const authRoutes = ['/auth'];
  
  // Verificar si es una ruta protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  console.log('📍 Ruta protegida:', isProtectedRoute, 'Ruta auth:', isAuthRoute);
  
  // Verificar si hay cookie de sesión personalizada
  const sessionCookie = request.cookies.get('aprende-y-aplica-session');
  const hasSession = !!sessionCookie?.value;
  
  // Para debugging: mostrar cookies
  console.log('🍪 Cookies en middleware:', request.cookies.getAll().map(c => `${c.name}=${c.value?.substring(0, 10)}...`));
  console.log('🔐 Tiene sesión:', hasSession, 'Valor:', sessionCookie?.value?.substring(0, 10) + '...');
  
  // Si es una ruta protegida y no hay sesión, redirigir a login
  if (isProtectedRoute && !hasSession) {
    console.log('🔒 Redirigiendo a /auth - no hay sesión para ruta protegida');
    return NextResponse.redirect(new URL('/auth', request.url));
  }
  
  // Si es una ruta de auth y hay sesión, redirigir al dashboard
  if (isAuthRoute && hasSession) {
    console.log('✅ Redirigiendo a /dashboard - usuario autenticado en ruta auth');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  console.log('➡️ Continuando sin redirección');
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
