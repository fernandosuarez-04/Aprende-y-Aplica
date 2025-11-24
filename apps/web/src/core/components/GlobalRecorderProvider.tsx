'use client';

import { useGlobalRecorder } from '../../lib/rrweb/useGlobalRecorder';

/**
 * Componente cliente que inicia la grabación global automáticamente
 * al cargar la aplicación. Mantiene un buffer circular de 60 segundos
 * para capturar el contexto previo a cualquier reporte de bug.
 */
export function GlobalRecorderProvider({ children }: { children: React.ReactNode }) {
  // Inicia grabación automática en background
  useGlobalRecorder();
  
  return <>{children}</>;
}
