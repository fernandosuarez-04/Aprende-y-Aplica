/**
 * Sistema de Contexto Dinámico para LIA
 * 
 * Este módulo proporciona un sistema modular y escalable para construir
 * contexto relevante para LIA (Learning Intelligence Assistant).
 * 
 * Características principales:
 * - Metadata de páginas con componentes, APIs y flujos de usuario
 * - Sistema de providers modulares para diferentes tipos de contexto
 * - Hooks de frontend para captura de errores y estado
 * - Provider de React para integración sencilla
 * - Priorización inteligente de contexto
 * - Optimización de tokens
 * 
 * @example
 * ```typescript
 * // Backend: Construir contexto completo
 * import { buildLiaContext, PageContextService } from '@/lib/lia-context';
 * 
 * const context = await buildLiaContext({
 *   userId: 'user-123',
 *   currentPage: '/acme/business-panel/courses',
 *   contextType: 'general'
 * });
 * 
 * // Frontend: Usar el provider y hooks
 * import { LiaContextProvider, useLiaContext } from '@/lib/lia-context/client';
 * 
 * function App() {
 *   return (
 *     <LiaContextProvider>
 *       <MyComponent />
 *     </LiaContextProvider>
 *   );
 * }
 * 
 * function MyComponent() {
 *   const { metadata, hasErrors } = useLiaContext();
 *   // Usar metadata para enviar contexto a LIA
 * }
 * ```
 */

// Tipos
export * from './types';

// Servicios
export {
  PageContextService,
  ContextBuilderService,
  getContextBuilder,
  buildLiaContext
} from './services';

// Servicio de métricas
export {
  ContextMetricsService,
  recordContextUsage,
  getContextStats,
  getProviderPerformance
} from './services/context-metrics.service';

// Providers (Server-side)
export {
  BaseContextProvider,
  PageContextProvider
} from './providers';
export type { ContextProviderConstructor } from './providers';

// Providers adicionales
export { UserContextProvider } from './providers/user/UserContextProvider';
export { PlatformContextProvider } from './providers/platform/PlatformContextProvider';

// Configuración
export { PAGE_METADATA, getRegisteredRoutes, hasPageMetadata } from './config/page-metadata';

// Contexto de base de datos (existente)
export { DATABASE_SCHEMA_CONTEXT } from './database-schema';

// Utilidades de componentes LIA
export {
  liaComponent,
  liaMarker,
  liaModal,
  liaForm,
  liaDataTable,
  liaErrorBoundary,
  parseLiaElement,
  findAllLiaComponents,
  findVisibleLiaComponents,
  LIA_DATA_ATTRIBUTES
} from './utils/lia-component';

// ============================================================================
// CLIENTE (exportar separadamente para evitar SSR issues)
// ============================================================================

// Los hooks y el provider de cliente se exportan desde:
// - '@/lib/lia-context/client' - LiaContextProvider, useLiaContext
// - '@/lib/lia-context/hooks' - useErrorCapture, useActiveComponents, useApiTracking
//
// Esto evita problemas de SSR al importar el módulo en el servidor.

