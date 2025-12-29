/**
 * rrweb - Sistema de Grabación de Sesiones v2.0
 * 
 * Este módulo proporciona grabación de sesiones para debugging y reportes de problemas.
 * 
 * CARACTERÍSTICAS:
 * - Grabación continua con buffer circular de 3 minutos
 * - Compresión de sesiones (reduce 60-80% el tamaño)
 * - Captura automática de errores de consola y network
 * - Detector de inactividad (pausa cuando el usuario está AFK)
 * - Marcadores de contexto para cambios de página y modales
 * - Metadata enriquecida del entorno del usuario
 * 
 * USO:
 * - El GlobalRecorderProvider inicia automáticamente la grabación
 * - Para reportar bugs, basta con que el usuario escriba palabras clave como "error", "bug", etc.
 * - LIA capturará automáticamente el snapshot y lo adjuntará al reporte
 */

// Exportar session recorder principal
export { sessionRecorder, SessionRecorder } from './session-recorder';
export type { RecordingSession, SessionRecorderInstance, EnrichedMetadata } from './session-recorder';

// Exportar herramientas de compresión
export { 
  compressSession, 
  decompressSession, 
  compressString,
  decompressString,
  formatBytes,
  getSessionSize,
  trimSessionToSize,
  isSessionTooLarge,
  MAX_SESSION_SIZE 
} from './session-compressor';

// Exportar error interceptor
export {
  startErrorInterceptor,
  stopErrorInterceptor,
  getRecentErrors,
  getErrorSummary,
  clearErrorBuffer
} from './error-interceptor';
export type { ErrorEvent } from './error-interceptor';

// Exportar context markers
export {
  addContextMarker,
  markPageChange,
  markModalOpen,
  markModalClose,
  markUserAction,
  markError,
  getContextMarkers,
  getMarkersSince,
  clearMarkers,
  getSessionSummary
} from './context-markers';
export type { ContextMarker } from './context-markers';

// Exportar inactivity detector
export {
  startInactivityDetector,
  stopInactivityDetector,
  isUserActive,
  getTimeSinceLastActivity,
  getTimeSinceLastActivityFormatted,
  resetActivityTimer
} from './inactivity-detector';
export type { InactivityConfig } from './inactivity-detector';

// Exportar hooks
export { useGlobalRecorder } from './useGlobalRecorder';
export { useSessionRecorder } from './use-session-recorder';
// Temporarily disabled due to HMR issues
// export { useContextMarkers, useModalMarker, markUserAction as markAction, markError as markErrorAction } from './use-context-markers';
