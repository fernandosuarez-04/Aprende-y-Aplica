// Roles del sistema
export type UserRole = 'usuario' | 'instructor' | 'administrador' | 'business' | 'business user' | null;

// Estructura de metadatos de página
export interface PageMetadata {
  path: string;
  title: string;
  description: string;
  category: string;
  keywords: string[];
  availableActions: string[];
  relatedPages: string[];
  // Campos adicionales para mayor detalle
  features?: string[]; // Funcionalidades específicas (búsqueda, filtros, etc.)
  contentSections?: string[]; // Secciones de contenido dentro de la página
  specialNotes?: string; // Notas importantes (ej: "Los reels están en pestaña dentro de noticias")
  // Control de acceso por roles
  allowedRoles?: UserRole[]; // Roles que pueden acceder a esta página. Si no se especifica, todos pueden acceder
  isAdminOnly?: boolean; // Si es true, solo administradores pueden acceder
  isBusinessOnly?: boolean; // Si es true, solo usuarios business pueden acceder
}

// Metadatos de todas las páginas principales de la plataforma
export const PAGE_METADATA: Record<string, PageMetadata> = {
  '/courses/[slug]': {
    path: '/courses/[slug]',
    title: 'Detalle de Curso',
    description: 'Página de detalle de un curso específico donde puedes ver información completa, adquirir el curso o acceder si ya lo tienes',
    category: 'educacion',
    keywords: ['curso', 'detalle', 'información', 'adquirir', 'comprar'],
    availableActions: ['Ver detalles', 'Adquirir curso', 'Agregar al carrito', 'Acceder al curso'],
    relatedPages: ['/dashboard', '/my-courses', '/courses/[slug]/learn'],
    features: ['Vista detallada del curso', 'Adquisición de cursos', 'Información del instructor']
  },
  '/communities': {
    path: '/communities',
    title: 'Comunidades',
    description: 'Espacio para unirse a comunidades, networking y participación grupal',
    category: 'social',
    keywords: ['comunidades', 'networking', 'grupos', 'colaboración', 'miembros'],
    availableActions: ['Buscar comunidades', 'Filtrar por categoría', 'Ver detalles', 'Unirse', 'Solicitar acceso', 'Ver normas'],
    relatedPages: ['/communities/[slug]', '/communities/[slug]/members', '/communities/[slug]/leagues'],
    features: ['Búsqueda de comunidades', 'Filtros por categorías', 'Sistema de unirse/solicitar acceso', 'Estadísticas globales', 'Modal de detalles', 'Modal de normas'],
    contentSections: ['Búsqueda y filtros', 'Cards de comunidades', 'Estadísticas globales', 'Modales de detalles y normas']
  },
  '/dashboard': {
    path: '/dashboard',
    title: 'Dashboard',
    description: 'Panel principal del usuario con catálogo completo de talleres y cursos disponibles. Aquí puedes explorar todos los cursos, filtrar por categoría, agregar a favoritos y al carrito.',
    category: 'navegacion',
    keywords: ['dashboard', 'inicio', 'panel', 'resumen', 'talleres', 'cursos', 'catálogo de cursos', 'cursos disponibles', 'todos los cursos'],
    availableActions: ['Ver talleres', 'Ver todos los cursos', 'Filtrar por categoría', 'Agregar a favoritos', 'Agregar al carrito', 'Ver detalles', 'Acceder a cursos comprados'],
    relatedPages: ['/my-courses', '/courses/[slug]', '/courses/[slug]/learn', '/statistics', '/news', '/cart'],
    features: ['Catálogo completo de cursos/talleres', 'Filtros por categorías dinámicas', 'Sistema de favoritos', 'Estadísticas rápidas', 'Actividad reciente'],
    contentSections: ['Grid de talleres/cursos disponibles', 'Sidebar con estadísticas', 'Actividad reciente', 'Filtros de categorías'],
    specialNotes: 'IMPORTANTE: El Dashboard (/dashboard) es donde se encuentra el CATÁLOGO COMPLETO de todos los cursos y talleres disponibles. Cuando el usuario pregunte sobre "ver todos los cursos" o "cursos disponibles", debe dirigirse al Dashboard, NO a /courses (que no existe como página de catálogo). La ruta /courses/[slug] es solo para ver el detalle de un curso específico.'
  },
  '/my-courses': {
    path: '/my-courses',
    title: 'Mis Cursos',
    description: 'Cursos en los que el usuario está inscrito',
    category: 'educacion',
    keywords: ['mis cursos', 'cursos inscritos', 'progreso', 'aprendizaje'],
    availableActions: ['Buscar cursos', 'Filtrar por estado', 'Ver progreso', 'Continuar aprendizaje', 'Ver detalles del curso'],
    relatedPages: ['/courses/[slug]/learn', '/dashboard', '/statistics', '/certificates'],
    features: ['Estadísticas de progreso', 'Búsqueda de cursos', 'Filtros por estado', 'Indicadores visuales de progreso'],
    contentSections: ['Estadísticas', 'Grid de cursos inscritos', 'Filtros y búsqueda']
  },
  '/news': {
    path: '/news',
    title: 'Noticias',
    description: 'Últimas noticias, actualizaciones y tendencias sobre IA y tecnología',
    category: 'contenido',
    keywords: ['noticias', 'artículos', 'reels', 'actualizaciones', 'tendencias'],
    availableActions: ['Leer artículos', 'Ver reels', 'Buscar', 'Filtrar por categoría', 'Cambiar modo de vista', 'Ver noticias destacadas'],
    relatedPages: ['/news/[slug]', '/reels'],
    features: ['Búsqueda de noticias', 'Filtros por categoría/idioma', 'Modo grid/lista', 'Pestañas Noticias/Reels'],
    contentSections: ['Noticias destacadas', 'Pestaña de Reels', 'Grid/Lista de noticias'],
    specialNotes: 'IMPORTANTE: Esta página tiene dos pestañas principales - "Noticias" para artículos escritos y "Reels" para videos cortos. Los reels están integrados dentro de esta página.'
  },
  /* TEMPORALMENTE OCULTO - Directorio IA no disponible actualmente
  '/prompt-directory': {
    path: '/prompt-directory',
    title: 'Directorio de Prompts',
    description: 'Colección de plantillas de prompts de IA para diferentes casos de uso',
    category: 'herramientas',
    keywords: ['prompts', 'plantillas', 'IA', 'directorio', 'casos de uso', 'directorio ia'],
    availableActions: ['Buscar prompts', 'Filtrar por destacados/favoritos', 'Crear prompt', 'Cambiar modo de vista', 'Ver detalles'],
    relatedPages: ['/prompt-directory/create', '/apps-directory'],
    features: ['Búsqueda de prompts', 'Filtros de destacados/favoritos', 'Modo grid/lista', 'Creación de prompts con IA', 'Paginación'],
    contentSections: ['Búsqueda y filtros', 'Grid/Lista de prompts', 'Botón de creación'],
    specialNotes: 'IMPORTANTE: "Directorio IA" se refiere a DOS páginas: el Directorio de Prompts (/prompt-directory) y el Directorio de Apps (/apps-directory). Cuando el usuario pregunte sobre "Directorio IA", siempre menciona ambas páginas y proporciona ambos enlaces.'
  },
  '/prompt-directory/create': {
    path: '/prompt-directory/create',
    title: 'Crear Prompt con IA',
    description: 'Herramienta especializada para crear prompts profesionales usando inteligencia artificial',
    category: 'herramientas',
    keywords: ['crear prompt', 'generar prompt', 'IA', 'asistente', 'creación'],
    availableActions: ['Crear prompt', 'Generar con IA', 'Guardar prompt', 'Descargar prompt'],
    relatedPages: ['/prompt-directory', '/apps-directory'],
    features: ['Generación de prompts con IA', 'Interfaz guiada', 'Guardado de prompts', 'Descarga de prompts'],
    contentSections: ['Formulario de creación', 'Asistente de IA', 'Vista previa del prompt']
  },
  '/apps-directory': {
    path: '/apps-directory',
    title: 'Directorio de Apps',
    description: 'Catálogo de herramientas y aplicaciones de IA',
    category: 'herramientas',
    keywords: ['apps', 'aplicaciones', 'herramientas', 'IA', 'catálogo', 'directorio ia'],
    availableActions: ['Buscar apps', 'Filtrar por destacados', 'Ver detalles', 'Agregar a favoritos'],
    relatedPages: ['/prompt-directory'],
    features: ['Búsqueda de apps', 'Filtro de destacados', 'Modo grid/lista', 'Sistema de favoritos', 'Paginación'],
    contentSections: ['Búsqueda y filtros', 'Grid/Lista de apps'],
    specialNotes: 'IMPORTANTE: "Directorio IA" se refiere a DOS páginas: el Directorio de Prompts (/prompt-directory) y el Directorio de Apps (/apps-directory). Cuando el usuario pregunte sobre "Directorio IA", siempre menciona ambas páginas y proporciona ambos enlaces.'
  },
  */
  '/profile': {
    path: '/profile',
    title: 'Perfil',
    description: 'Configuración de perfil de usuario, preferencias y datos personales. También conocida como "Editar perfil"',
    category: 'configuracion',
    keywords: ['perfil', 'editar perfil', 'configuración', 'datos personales', 'preferencias', 'cuenta'],
    availableActions: ['Editar información personal', 'Subir foto', 'Subir CV', 'Actualizar enlaces sociales', 'Guardar cambios'],
    relatedPages: ['/certificates', '/account-settings', '/statistics'],
    features: ['Gestión de avatar', 'Información personal y profesional', 'Enlaces sociales', 'Subida de CV', 'Puntos del usuario'],
    contentSections: ['Avatar y foto de perfil', 'Información personal', 'Información profesional', 'Enlaces sociales', 'CV'],
    specialNotes: 'Esta página también se conoce como "Editar perfil". Aquí puedes gestionar toda tu información personal y profesional.'
  },
  '/business-panel': {
    path: '/business-panel',
    title: 'Panel de Negocios',
    description: 'Herramientas empresariales para gestión de equipos y cursos corporativos',
    category: 'negocios',
    keywords: ['negocios', 'empresas', 'equipos', 'corporativo', 'gestión'],
    availableActions: ['Gestionar equipos', 'Ver estadísticas', 'Configurar cursos', 'Gestionar usuarios empresariales'],
    relatedPages: ['/business-panel/courses', '/business-user/dashboard'],
    features: ['Gestión de equipos', 'Estadísticas empresariales', 'Configuración de cursos corporativos'],
    isBusinessOnly: true,
    allowedRoles: ['business', 'administrador']
  },
  '/statistics': {
    path: '/statistics',
    title: 'Estadísticas',
    description: 'Visualización de estadísticas y métricas de aprendizaje',
    category: 'analisis',
    keywords: ['estadísticas', 'métricas', 'progreso', 'análisis', 'aprendizaje'],
    availableActions: ['Ver progreso', 'Analizar datos', 'Ver métricas de aprendizaje'],
    relatedPages: ['/dashboard', '/my-courses', '/profile'],
    features: ['Visualización de métricas', 'Análisis de progreso', 'Estadísticas de aprendizaje']
  },
  '/reels': {
    path: '/reels',
    title: 'Reels',
    description: 'Contenido en formato de video corto sobre IA y tecnología',
    category: 'contenido',
    keywords: ['reels', 'videos', 'cortos', 'IA', 'tecnología'],
    availableActions: ['Ver reels', 'Compartir', 'Interactuar'],
    relatedPages: ['/news', '/dashboard'],
    features: ['Reproducción de videos cortos', 'Sistema de interacción', 'Compartir contenido'],
    specialNotes: 'Los reels también están disponibles dentro de la página de Noticias en una pestaña dedicada'
  },
  '/certificates': {
    path: '/certificates',
    title: 'Certificados',
    description: 'Certificados obtenidos por completar cursos y talleres',
    category: 'logros',
    keywords: ['certificados', 'logros', 'completado', 'diplomas', 'reconocimiento'],
    availableActions: ['Ver certificados', 'Descargar', 'Compartir', 'Ver detalles'],
    relatedPages: ['/my-courses', '/profile', '/courses/[slug]'],
    features: ['Visualización de certificados', 'Descarga de certificados', 'Compartir certificados']
  },
  '/account-settings': {
    path: '/account-settings',
    title: 'Configuración de Cuenta',
    description: 'Configuración de notificaciones y privacidad',
    category: 'configuracion',
    keywords: ['configuración', 'notificaciones', 'privacidad', 'preferencias', 'cuenta'],
    availableActions: ['Configurar notificaciones', 'Ajustar privacidad', 'Guardar cambios'],
    relatedPages: ['/profile'],
    features: ['Configuración de notificaciones', 'Configuración de privacidad', 'Guardado de preferencias'],
    contentSections: ['Notificaciones', 'Privacidad']
  },
  '/cart': {
    path: '/cart',
    title: 'Carrito de Compras',
    description: 'Gestión de items en el carrito antes de comprar',
    category: 'comercio',
    keywords: ['carrito', 'compras', 'checkout', 'pago', 'items'],
    availableActions: ['Ver items', 'Eliminar items', 'Proceder a compra'],
    relatedPages: ['/dashboard', '/my-courses', '/payment-methods'],
    features: ['Gestión de items', 'Eliminación de items', 'Proceso de compra']
  },
  '/purchase-history': {
    path: '/purchase-history',
    title: 'Historial de Compras',
    description: 'Historial de todas las compras realizadas',
    category: 'comercio',
    keywords: ['historial', 'compras', 'facturas', 'transacciones', 'pedidos'],
    availableActions: ['Ver compras pasadas', 'Descargar facturas'],
    relatedPages: ['/my-courses', '/cart'],
    features: ['Visualización de compras', 'Descarga de facturas']
  }
};

/**
 * Función para obtener el contexto de la plataforma completa
 * Genera un string con información de todas las páginas disponibles
 */
export function getPlatformContext(): string {
  const metadataEntries = Object.values(PAGE_METADATA);
  
  let context = '\n\nCONTEXTO DE LA PLATAFORMA - PÁGINAS DISPONIBLES:\n';
  
  metadataEntries.forEach(page => {
    context += `\n- ${page.title} (${page.path}):\n`;
    context += `  Descripción: ${page.description}\n`;
    
    if (page.features && page.features.length > 0) {
      context += `  Funcionalidades: ${page.features.join(', ')}\n`;
    }
    
    if (page.contentSections && page.contentSections.length > 0) {
      context += `  Secciones de contenido: ${page.contentSections.join(', ')}\n`;
    }
    
    context += `  Acciones disponibles: ${page.availableActions.join(', ')}\n`;
    
    if (page.relatedPages.length > 0) {
      context += `  Páginas relacionadas: ${page.relatedPages.join(', ')}\n`;
    }
    
    if (page.specialNotes) {
      context += `  ⚠️ NOTA IMPORTANTE: ${page.specialNotes}\n`;
    }
  });
  
  return context;
}

/**
 * Función para construir URLs dinámicas
 * Reemplaza parámetros en templates de URLs
 */
export function buildDynamicUrl(template: string, params: Record<string, string>): string {
  let url = template;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`[${key}]`, value);
  });
  return url;
}

/**
 * Función para obtener páginas disponibles según el rol del usuario
 * Filtra las páginas que el usuario puede acceder
 */
export function getAvailablePages(userRole: UserRole | null = null): PageMetadata[] {
  const metadataEntries = Object.values(PAGE_METADATA);
  
  return metadataEntries.filter(page => {
    // Si es solo para administradores
    if (page.isAdminOnly) {
      return userRole === 'administrador';
    }
    
    // Si es solo para business
    if (page.isBusinessOnly) {
      return userRole === 'business' || userRole === 'administrador';
    }
    
    // Si tiene roles permitidos específicos
    if (page.allowedRoles && page.allowedRoles.length > 0) {
      return !userRole || page.allowedRoles.includes(userRole);
    }
    
    // Por defecto, todas las páginas son accesibles
    return true;
  });
}

/**
 * Función para obtener links disponibles formateados para LIA
 * Devuelve un string con todos los links disponibles según el rol
 */
export function getAvailableLinksForLIA(userRole: UserRole | null = null): string {
  const availablePages = getAvailablePages(userRole);
  
  let linksText = '\n\nLINKS DISPONIBLES EN LA PLATAFORMA:\n';
  
  availablePages.forEach(page => {
    linksText += `\n- ${page.title}: [${page.title}](${page.path})\n`;
    linksText += `  Descripción: ${page.description}\n`;
    
    if (page.specialNotes) {
      linksText += `  ⚠️ NOTA: ${page.specialNotes}\n`;
    }
  });
  
  /* TEMPORALMENTE OCULTO - Directorio IA no disponible actualmente
  // Agregar nota especial sobre Directorio IA
  linksText += `\n\n⚠️ NOTA IMPORTANTE SOBRE "DIRECTORIO IA":\n`;
  linksText += `Cuando el usuario pregunte sobre "Directorio IA" o "Directorio de IA", se refiere a DOS páginas separadas:\n`;
  linksText += `1. [Directorio de Prompts](/prompt-directory) - Para plantillas de prompts\n`;
  linksText += `2. [Directorio de Apps](/apps-directory) - Para herramientas y aplicaciones de IA\n`;
  linksText += `SIEMPRE menciona ambas páginas y proporciona ambos enlaces cuando el usuario pregunte sobre "Directorio IA".\n`;
  */

  // Agregar nota sobre creación de prompts desde el chat
  linksText += `\n\n💡 NOTA SOBRE CREACIÓN DE PROMPTS:\n`;
  linksText += `Si el usuario quiere crear prompts, ofrécele ayuda directamente desde este chat usando el Modo Prompts.\n`;
  linksText += `Puedes activarlo automáticamente cuando detectes que el usuario quiere crear un prompt.\n`;
  
  // Agregar nota especial sobre ver todos los cursos
  linksText += `\n\n⚠️ NOTA IMPORTANTE SOBRE VER CURSOS:\n`;
  linksText += `Cuando el usuario pregunte sobre "ver todos los cursos", "cursos disponibles", o "catálogo de cursos":\n`;
  linksText += `- Para ver TODOS los cursos disponibles: Usa [Dashboard](/dashboard) - NO uses /courses (que no existe como página de catálogo)\n`;
  linksText += `- Para ver los cursos del usuario: Usa [Mis Cursos](/my-courses)\n`;
  linksText += `- Para ver el detalle de un curso específico: Usa /courses/[slug] donde [slug] es el identificador del curso\n`;
  linksText += `IMPORTANTE: La ruta /courses NO existe como página de catálogo. El catálogo completo está en el Dashboard.\n`;
  
  return linksText;
}

