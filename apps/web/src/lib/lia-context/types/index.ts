/**
 * Tipos para el Sistema de Contexto Dinámico de SofLIA
 * 
 * Este módulo define las interfaces y tipos utilizados por el sistema
 * de contexto dinámico para proporcionar información relevante a SofLIA.
 */

// ============================================================================
// TIPOS PARA METADATA DE PÁGINAS
// ============================================================================

/**
 * Información sobre un componente en una página
 */
export interface ComponentInfo {
  /** Nombre del componente React */
  name: string;
  /** Ruta del archivo del componente */
  path: string;
  /** Descripción breve del componente */
  description: string;
  /** Props principales del componente */
  props?: string[];
  /** Errores comunes asociados a este componente */
  commonErrors?: string[];
}

/**
 * Información sobre una API utilizada en una página
 */
export interface ApiInfo {
  /** Endpoint de la API */
  endpoint: string;
  /** Método HTTP (GET, POST, PUT, DELETE) */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Descripción de la funcionalidad de la API */
  description: string;
  /** Errores comunes de esta API */
  commonErrors?: string[];
}

/**
 * Flujo de usuario en una página
 */
export interface UserFlow {
  /** Nombre del flujo */
  name: string;
  /** Pasos del flujo en orden */
  steps: string[];
  /** Puntos comunes donde los usuarios tienen problemas */
  commonBreakpoints?: string[];
}

/**
 * Problema común en una página
 */
export interface CommonIssue {
  /** Descripción del problema */
  description: string;
  /** Posibles causas del problema */
  possibleCauses: string[];
  /** Soluciones conocidas */
  solutions: string[];
}

/**
 * Metadata completa de una página
 */
export interface PageMetadata {
  /** Ruta exacta o patrón de la ruta */
  route: string;
  /** Patrón de ruta para matching (ej: /{orgSlug}/business-panel/*) */
  routePattern: string;
  /** Tipo de página para categorización */
  pageType: string;
  /** Componentes principales en esta página */
  components: ComponentInfo[];
  /** APIs utilizadas en esta página */
  apis: ApiInfo[];
  /** Flujos de usuario disponibles */
  userFlows: UserFlow[];
  /** Problemas comunes reportados */
  commonIssues: CommonIssue[];
}

// ============================================================================
// TIPOS PARA PROVIDERS DE CONTEXTO
// ============================================================================

/**
 * Fragmento de contexto generado por un provider
 */
export interface ContextFragment {
  /** Tipo de contexto (user, page, bug-report, etc.) */
  type: string;
  /** Contenido del contexto en formato string */
  content: string;
  /** Prioridad del fragmento (mayor = más importante) */
  priority: number;
  /** Estimación de tokens que consume este fragmento */
  tokens: number;
}

/**
 * Opciones para construir contexto
 */
export interface ContextBuildOptions {
  /** ID del usuario actual */
  userId?: string;
  /** Página actual del usuario */
  currentPage?: string;
  /** Tipo de contexto requerido */
  contextType: string;
  /** Metadata enriquecida del cliente */
  enrichedMetadata?: EnrichedMetadata;
  /** Si es un reporte de bug */
  isBugReport?: boolean;
}

/**
 * Metadata enriquecida enviada desde el cliente
 */
export interface EnrichedMetadata {
  /** Información del viewport */
  viewport?: {
    width: number;
    height: number;
  };
  /** Plataforma del usuario */
  platform?: {
    browser?: string;
    version?: string;
    os?: string;
  };
  /** Idioma del navegador */
  language?: string;
  /** Zona horaria */
  timezone?: string;
  /** Información de conexión */
  connection?: string;
  /** Memoria disponible */
  memory?: number;
  /** Duración de la sesión en ms */
  sessionDuration?: number;
  /** Errores capturados */
  errors?: ConsoleError[];
  /** Resumen de errores */
  errorSummary?: string;
  /** Marcadores de contexto */
  contextMarkers?: string[];
  /** Resumen de la sesión */
  sessionSummary?: string;
  /** Información de la grabación */
  recordingInfo?: {
    size?: number;
    events?: number;
  };
  /** Componentes activos detectados */
  activeComponents?: ActiveComponent[];
}

/**
 * Error de consola capturado
 */
export interface ConsoleError {
  /** Tipo de error */
  type: 'error' | 'warn' | 'log';
  /** Mensaje del error */
  message: string;
  /** Stack trace */
  stack?: string;
  /** Timestamp */
  timestamp?: Date;
}

/**
 * Componente activo detectado en la página
 */
export interface ActiveComponent {
  /** Nombre del componente */
  name: string;
  /** Selector CSS o ID */
  selector: string;
  /** Props del componente */
  props?: Record<string, unknown>;
  /** Estado del componente */
  state?: Record<string, unknown>;
}

// ============================================================================
// TIPOS PARA ERRORES Y REPORTES
// ============================================================================

/**
 * Error reciente del usuario o sistema
 */
export interface RecentError {
  /** ID único del error */
  id: string;
  /** Timestamp del error */
  timestamp: Date;
  /** Tipo de error */
  type: 'console' | 'network' | 'component' | 'api';
  /** Mensaje del error */
  message: string;
  /** Stack trace */
  stack?: string;
  /** URL donde ocurrió */
  url?: string;
  /** Componente relacionado */
  component?: string;
  /** ID del usuario afectado */
  userId?: string;
}

/**
 * Bug similar encontrado en la base de datos
 */
export interface SimilarBug {
  /** Título del bug */
  titulo: string;
  /** Descripción del bug */
  descripcion: string;
  /** Categoría */
  categoria: string;
  /** Estado actual */
  estado: string;
  /** Fecha de creación */
  created_at: string;
  /** URL de la página */
  pagina_url?: string;
}

// ============================================================================
// TIPOS PARA ESTADO DE APLICACIÓN
// ============================================================================

/**
 * Estado actual de la aplicación
 */
export interface AppState {
  /** Usuario actual */
  currentUser?: {
    id: string;
    role: string;
    organizationId?: string;
  };
  /** Página actual */
  currentPage: string;
  /** Modales actualmente abiertos */
  activeModals: string[];
  /** Estados de formularios */
  formStates: Record<string, unknown>;
  /** Llamadas a API recientes */
  apiCalls: ApiCall[];
}

/**
 * Registro de una llamada a API
 */
export interface ApiCall {
  /** Endpoint de la API */
  endpoint: string;
  /** Método HTTP */
  method: string;
  /** Código de estado de respuesta */
  status?: number;
  /** Timestamp de la llamada */
  timestamp: Date;
}

// ============================================================================
// TIPOS PARA CACHE
// ============================================================================

/**
 * Entrada en el cache de contexto
 */
export interface CacheEntry<T> {
  /** Datos cacheados */
  data: T;
  /** Timestamp de creación */
  createdAt: number;
  /** TTL en milisegundos */
  ttl: number;
}

/**
 * Opciones de cache
 */
export interface CacheOptions {
  /** TTL para contexto estático (default: infinito) */
  staticTtl?: number;
  /** TTL para contexto de usuario (default: 5 minutos) */
  userTtl?: number;
  /** TTL para contexto de página (default: 1 hora) */
  pageTtl?: number;
  /** Máximo de entradas en cache */
  maxEntries?: number;
}
