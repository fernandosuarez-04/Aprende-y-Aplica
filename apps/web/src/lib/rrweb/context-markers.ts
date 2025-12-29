/**
 * Context Markers para rrweb
 * Agrega marcadores de contexto (página, modal, acciones) a las grabaciones
 */

'use client';

export interface ContextMarker {
  type: 'page_change' | 'modal_open' | 'modal_close' | 'user_action' | 'error' | 'custom';
  timestamp: number;
  label: string;
  details?: Record<string, unknown>;
}

// Buffer de marcadores de contexto
const MAX_MARKERS = 100;
let markerBuffer: ContextMarker[] = [];

/**
 * Agrega un marcador de contexto
 */
export function addContextMarker(marker: Omit<ContextMarker, 'timestamp'>) {
  const fullMarker: ContextMarker = {
    ...marker,
    timestamp: Date.now()
  };
  
  markerBuffer.push(fullMarker);
  
  if (markerBuffer.length > MAX_MARKERS) {
    markerBuffer = markerBuffer.slice(-MAX_MARKERS);
  }
}

/**
 * Marca un cambio de página
 */
export function markPageChange(path: string, title?: string) {
  addContextMarker({
    type: 'page_change',
    label: title || `Navegó a ${path}`,
    details: { path, title }
  });
}

/**
 * Marca apertura de modal
 */
export function markModalOpen(modalName: string, context?: Record<string, unknown>) {
  addContextMarker({
    type: 'modal_open',
    label: `Abrió modal: ${modalName}`,
    details: { modalName, ...context }
  });
}

/**
 * Marca cierre de modal
 */
export function markModalClose(modalName: string, action?: 'submit' | 'cancel' | 'close') {
  addContextMarker({
    type: 'modal_close',
    label: `Cerró modal: ${modalName} (${action || 'close'})`,
    details: { modalName, action }
  });
}

/**
 * Marca una acción del usuario
 */
export function markUserAction(action: string, details?: Record<string, unknown>) {
  addContextMarker({
    type: 'user_action',
    label: action,
    details
  });
}

/**
 * Marca un error
 */
export function markError(errorMessage: string, details?: Record<string, unknown>) {
  addContextMarker({
    type: 'error',
    label: `Error: ${errorMessage}`,
    details
  });
}

/**
 * Obtiene todos los marcadores
 */
export function getContextMarkers(): ContextMarker[] {
  return [...markerBuffer];
}

/**
 * Obtiene marcadores desde un timestamp específico
 */
export function getMarkersSince(timestamp: number): ContextMarker[] {
  return markerBuffer.filter(m => m.timestamp >= timestamp);
}

/**
 * Limpia el buffer de marcadores
 */
export function clearMarkers() {
  markerBuffer = [];
}

/**
 * Genera un resumen de la sesión basado en marcadores
 */
export function getSessionSummary(): {
  totalMarkers: number;
  pageVisits: string[];
  modalsOpened: string[];
  actionsCount: number;
  errorsCount: number;
  timeline: ContextMarker[];
} {
  const pageVisits: string[] = [];
  const modalsOpened: string[] = [];
  let actionsCount = 0;
  let errorsCount = 0;
  
  for (const marker of markerBuffer) {
    switch (marker.type) {
      case 'page_change':
        pageVisits.push(marker.details?.path as string || marker.label);
        break;
      case 'modal_open':
        modalsOpened.push(marker.details?.modalName as string || marker.label);
        break;
      case 'user_action':
        actionsCount++;
        break;
      case 'error':
        errorsCount++;
        break;
    }
  }
  
  return {
    totalMarkers: markerBuffer.length,
    pageVisits: [...new Set(pageVisits)],
    modalsOpened: [...new Set(modalsOpened)],
    actionsCount,
    errorsCount,
    timeline: markerBuffer.slice(-20) // Últimos 20 marcadores
  };
}
