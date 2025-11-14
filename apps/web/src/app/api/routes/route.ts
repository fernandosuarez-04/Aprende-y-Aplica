import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint que devuelve todas las rutas públicas disponibles de la plataforma
 * 
 * Esto permite que LIA conozca automáticamente todas las páginas disponibles
 * sin necesidad de actualizar manualmente el prompt cada vez que se agrega una nueva página
 */

// Tipo para información de acceso a rutas
interface RouteAccessInfo {
  path: string;
  name: string;
  description: string;
  accessMethods?: string[]; // Métodos de acceso: 'menu-superior', 'menu-inferior', 'dropdown-directorio', 'dropdown-usuario', 'url-directa', 'búsqueda'
  menuLocation?: string; // Ubicación específica en el menú
  dropdownLocation?: string; // Si está en un dropdown, dónde
}

// Rutas públicas principales de la plataforma
// ✅ VENTAJA: Solo necesitas agregar nuevas rutas aquí cuando las crees
// ✅ MEJORADO: Incluye información sobre cómo acceder a cada ruta
const PUBLIC_ROUTES: RouteAccessInfo[] = [
  // Páginas principales
  { path: '/', name: 'Inicio', description: 'Página principal de la plataforma', accessMethods: ['url-directa'] },
  { path: '/dashboard', name: 'Dashboard', description: 'Panel principal del usuario', accessMethods: ['menu-superior', 'menu-inferior'], menuLocation: 'Talleres' },
  
  // Cursos y aprendizaje
  { path: '/courses', name: 'Cursos', description: 'Catálogo de cursos disponibles', accessMethods: ['menu-superior', 'url-directa'] },
  
  // Comunidades
  { path: '/communities', name: 'Comunidades', description: 'Comunidades disponibles para unirse', accessMethods: ['menu-superior', 'menu-inferior'], menuLocation: 'Comunidad' },
  
  // Talleres
  { path: '/workshops', name: 'Talleres', description: 'Talleres y eventos disponibles', accessMethods: ['menu-superior', 'menu-inferior'], menuLocation: 'Talleres' },
  
  // Noticias
  { path: '/news', name: 'Noticias', description: 'Últimas noticias y artículos', accessMethods: ['menu-superior', 'menu-inferior'], menuLocation: 'Noticias' },
  { path: '/reels', name: 'Reels', description: 'Contenido multimedia corto', accessMethods: ['url-directa', 'búsqueda'] },
  
  // Directorios
  { path: '/prompt-directory', name: 'Directorio de Prompts', description: 'Colección de prompts de IA', accessMethods: ['menu-superior', 'dropdown-directorio'], dropdownLocation: 'Directorio IA > Prompt Directory' },
  { path: '/apps-directory', name: 'Directorio de Apps', description: 'Catálogo de herramientas de IA', accessMethods: ['menu-superior', 'dropdown-directorio'], dropdownLocation: 'Directorio IA > Apps Directory' },
  
  // Perfil y cuenta (accesibles desde el menú de usuario)
  { path: '/statistics', name: 'Mis Estadísticas', description: 'Estadísticas de aprendizaje y progreso', accessMethods: ['dropdown-usuario', 'url-directa'], dropdownLocation: 'Menú de usuario > Mis Estadísticas' },
  { path: '/my-courses', name: 'Mi aprendizaje', description: 'Cursos en los que estás inscrito', accessMethods: ['dropdown-usuario', 'url-directa', 'búsqueda'], dropdownLocation: 'Menú de usuario > Mi aprendizaje' },
  { path: '/certificates', name: 'Mis Certificados', description: 'Certificados obtenidos', accessMethods: ['dropdown-usuario', 'url-directa'], dropdownLocation: 'Menú de usuario > Mis Certificados' },
  { path: '/profile', name: 'Editar perfil', description: 'Editar información del perfil de usuario', accessMethods: ['dropdown-usuario', 'url-directa'], dropdownLocation: 'Menú de usuario > Editar perfil' },
  { path: '/account-settings', name: 'Configuración de la cuenta', description: 'Ajustes de cuenta y preferencias', accessMethods: ['dropdown-usuario', 'url-directa'], dropdownLocation: 'Menú de usuario > Configuración de la cuenta' },
  
  // Compras y suscripciones (accesibles desde el menú de usuario)
  { path: '/cart', name: 'Carrito', description: 'Carrito de compras', accessMethods: ['url-directa', 'búsqueda'] },
  { path: '/subscriptions', name: 'Suscripciones', description: 'Gestionar suscripciones', accessMethods: ['dropdown-usuario', 'url-directa'], dropdownLocation: 'Menú de usuario > Suscripciones' },
  { path: '/purchase-history', name: 'Historial de compras', description: 'Historial de compras realizadas', accessMethods: ['dropdown-usuario', 'url-directa'], dropdownLocation: 'Menú de usuario > Historial de compras' },
  { path: '/payment-methods', name: 'Métodos de pago', description: 'Gestionar métodos de pago', accessMethods: ['dropdown-usuario', 'url-directa'], dropdownLocation: 'Menú de usuario > Métodos de pago' },
  
  // Cuestionarios
  { path: '/questionnaire', name: 'Cuestionario', description: 'Cuestionarios disponibles', accessMethods: ['url-directa', 'búsqueda'] },
  
  // Business
  { path: '/business', name: 'Business', description: 'Información para empresas', accessMethods: ['url-directa', 'búsqueda'] },
  { path: '/business-panel', name: 'Panel Business', description: 'Panel de gestión empresarial', accessMethods: ['url-directa'] },
  
  // Paneles de administración (accesibles desde el menú de usuario según rol)
  { path: '/admin/dashboard', name: 'Panel de Administración', description: 'Panel de administración del sistema', accessMethods: ['dropdown-usuario', 'url-directa'], dropdownLocation: 'Menú de usuario > Panel de Administración (solo administradores)' },
  { path: '/instructor/dashboard', name: 'Panel de Instructor', description: 'Panel de gestión para instructores', accessMethods: ['dropdown-usuario', 'url-directa'], dropdownLocation: 'Menú de usuario > Panel de Instructor (solo instructores)' },
  
  // Páginas de prueba (incluir para que LIA las conozca)
  { path: '/test-metadata', name: 'Test Metadata', description: 'Página de prueba para metadata', accessMethods: ['url-directa', 'búsqueda'] },
  { path: '/test-video', name: 'Test Video', description: 'Página de prueba para videos', accessMethods: ['url-directa'] },
  
  // Otras páginas públicas
  { path: '/credits', name: 'Créditos', description: 'Información de créditos' },
  { path: '/welcome', name: 'Bienvenida', description: 'Página de bienvenida' },
];

/**
 * Función helper para buscar rutas por nombre o descripción
 */
function searchRoutes(query: string): RouteAccessInfo[] {
  const lowerQuery = query.toLowerCase();
  return PUBLIC_ROUTES.filter(route => 
    route.path.toLowerCase().includes(lowerQuery) ||
    route.name.toLowerCase().includes(lowerQuery) ||
    route.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Función helper para generar instrucciones de acceso detalladas
 */
function generateAccessInstructions(route: RouteAccessInfo): string {
  const instructions: string[] = [];
  
  if (route.accessMethods?.includes('menu-superior')) {
    if (route.menuLocation) {
      instructions.push(`Haz clic en "${route.menuLocation}" en el menú de navegación superior`);
    } else {
      instructions.push(`Busca "${route.name}" en el menú de navegación superior`);
    }
  }
  
  if (route.accessMethods?.includes('menu-inferior')) {
    if (route.menuLocation) {
      instructions.push(`En móvil, usa la barra de navegación inferior y selecciona "${route.menuLocation}"`);
    } else {
      instructions.push(`En móvil, busca "${route.name}" en la barra de navegación inferior`);
    }
  }
  
  if (route.accessMethods?.includes('dropdown-directorio')) {
    if (route.dropdownLocation) {
      instructions.push(`Haz clic en "Directorio IA" en el menú, luego selecciona "${route.name}"`);
    } else {
      instructions.push(`Abre el menú "Directorio IA" y busca "${route.name}"`);
    }
  }
  
  if (route.accessMethods?.includes('dropdown-usuario')) {
    if (route.dropdownLocation) {
      instructions.push(`Haz clic en tu imagen de perfil (avatar) en la esquina superior derecha, luego selecciona "${route.dropdownLocation.split('> ')[1] || route.name}"`);
    } else {
      instructions.push(`Haz clic en tu imagen de perfil (avatar) en la esquina superior derecha, luego busca "${route.name}"`);
    }
  }
  
  if (route.accessMethods?.includes('url-directa')) {
    instructions.push(`Escribe directamente en la barra de direcciones: ${route.path}`);
  }
  
  if (route.accessMethods?.includes('búsqueda')) {
    instructions.push(`Usa la función de búsqueda de la plataforma y busca "${route.name}"`);
  }
  
  return instructions.join('\n- ');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q'); // Búsqueda opcional
    const includeInstructions = searchParams.get('instructions') === 'true'; // Incluir instrucciones detalladas
    
    let routes = PUBLIC_ROUTES;
    
    // Si hay una búsqueda, filtrar rutas
    if (query) {
      routes = searchRoutes(query);
    }
    
    // Si se solicitan instrucciones, agregarlas
    const routesWithInstructions = includeInstructions
      ? routes.map(route => ({
          ...route,
          accessInstructions: generateAccessInstructions(route)
        }))
      : routes;
    
    return NextResponse.json({
      routes: routesWithInstructions,
      total: routes.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener rutas' },
      { status: 500 }
    );
  }
}

