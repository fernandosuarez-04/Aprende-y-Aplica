'use client';

/**
 * Hook para agregar marcadores de contexto automáticamente
 * Se integra con el sistema de navegación para marcar cambios de página
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Importación dinámica para evitar problemas en el servidor
let contextMarkersModule: typeof import('./context-markers') | null = null;

async function getContextMarkers() {
  if (typeof window === 'undefined') return null;
  
  if (!contextMarkersModule) {
    contextMarkersModule = await import('./context-markers');
  }
  
  return contextMarkersModule;
}

/**
 * Hook que marca automáticamente los cambios de página
 */
export function useContextMarkers() {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Solo en el cliente
    if (typeof window === 'undefined') return;
    
    // Evitar marcar la misma página dos veces
    if (pathname === previousPathRef.current) return;
    
    previousPathRef.current = pathname;
    
    getContextMarkers().then((module) => {
      if (!module) return;
      
      // Obtener título de la página si está disponible
      const title = document.title || pathname;
      
      module.markPageChange(pathname, title);
      console.log(`[ContextMarkers] 📍 Marcado cambio de página: ${pathname}`);
    }).catch((error) => {
      console.error('[ContextMarkers] Error marcando página:', error);
    });
  }, [pathname]);
}

/**
 * Hook para marcar la apertura de un modal
 */
export function useModalMarker(modalName: string, isOpen: boolean) {
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Detectar cuando el modal se abre
    if (isOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;
      
      getContextMarkers().then((module) => {
        if (!module) return;
        module.markModalOpen(modalName);
      }).catch(() => {});
    }
    
    // Detectar cuando el modal se cierra
    if (!isOpen && wasOpenRef.current) {
      wasOpenRef.current = false;
      
      getContextMarkers().then((module) => {
        if (!module) return;
        module.markModalClose(modalName);
      }).catch(() => {});
    }
  }, [isOpen, modalName]);
}

/**
 * Función helper para marcar acciones de usuario manualmente
 */
export async function markUserAction(action: string, details?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  
  const module = await getContextMarkers();
  if (!module) return;
  
  module.markUserAction(action, details);
}

/**
 * Función helper para marcar errores manualmente
 */
export async function markError(errorMessage: string, details?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  
  const module = await getContextMarkers();
  if (!module) return;
  
  module.markError(errorMessage, details);
}
