'use client';

/**
 * LiaContextProvider
 * 
 * Provider de React que integra todos los hooks de captura de contexto
 * y proporciona información enriquecida para SofLIA.
 * 
 * Uso:
 * 1. Envolver la aplicación o sección con <LiaContextProvider>
 * 2. Usar useLiaContext() en componentes hijos para acceder al contexto
 * 3. El contexto se envía automáticamente cuando se usa el chat de SofLIA
 */

import React, { createContext, useContext, useMemo, useCallback, useEffect, useState } from 'react';
import { useErrorCapture, CapturedError } from '../hooks/useErrorCapture';
import { useActiveComponents, ActiveComponent } from '../hooks/useActiveComponents';
import { useApiTracking, ApiCall } from '../hooks/useApiTracking';

// ============================================================================
// TIPOS
// ============================================================================

export interface LiaEnrichedMetadata {
  /** Información de la plataforma/navegador */
  platform: {
    browser: string;
    version: string;
    os: string;
    screenResolution: string;
    language: string;
    timezone: string;
  };
  /** Errores capturados */
  errors: Array<{
    type: string;
    message: string;
    stack?: string;
    timestamp: Date;
  }>;
  /** Resumen de errores */
  errorSummary: string;
  /** Componentes activos detectados */
  activeComponents: Array<{
    name: string;
    selector: string;
    props?: Record<string, unknown>;
    state?: string;
  }>;
  /** Llamadas a API recientes */
  apiCalls: Array<{
    endpoint: string;
    method: string;
    status?: number;
    isError: boolean;
    duration?: number;
    timestamp: string;
  }>;
  /** Información del viewport */
  viewport: {
    width: number;
    height: number;
  };
  /** Duración de la sesión en ms */
  sessionDuration: number;
  /** Marcadores de contexto */
  contextMarkers: string[];
  /** Página actual */
  currentPage: string;
}

interface LiaContextValue {
  /** Metadata enriquecida para enviar a SofLIA */
  metadata: LiaEnrichedMetadata;
  /** Errores capturados */
  errors: CapturedError[];
  /** Componentes activos */
  components: ActiveComponent[];
  /** Llamadas a API */
  apiCalls: ApiCall[];
  /** Si hay errores recientes */
  hasErrors: boolean;
  /** Número de errores */
  errorCount: number;
  /** Limpia todos los datos */
  clearAll: () => void;
  /** Obtiene metadata en formato para enviar al API */
  getMetadataForApi: () => LiaEnrichedMetadata;
  /** Agrega un marcador de contexto personalizado */
  addContextMarker: (marker: string) => void;
  /** Limpia marcadores de contexto */
  clearContextMarkers: () => void;
}

// ============================================================================
// CONTEXTO
// ============================================================================

const LiaContext = createContext<LiaContextValue | null>(null);

// ============================================================================
// HOOK DE ACCESO
// ============================================================================

/**
 * Hook para acceder al contexto de SofLIA
 * Debe usarse dentro de un LiaContextProvider
 */
export function useLiaContext() {
  const context = useContext(LiaContext);
  if (!context) {
    throw new Error('useLiaContext must be used within a LiaContextProvider');
  }
  return context;
}

/**
 * Hook seguro que no lanza error si no hay provider
 * Retorna null si no hay contexto
 */
export function useLiaContextSafe() {
  return useContext(LiaContext);
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Detecta información del navegador y plataforma
 */
function detectPlatformInfo() {
  if (typeof window === 'undefined') {
    return {
      browser: 'unknown',
      version: 'unknown',
      os: 'unknown',
      screenResolution: '0x0',
      language: 'en',
      timezone: 'UTC',
    };
  }

  const ua = navigator.userAgent;
  
  // Detectar navegador
  let browser = 'Unknown';
  let version = '';
  
  if (ua.includes('Firefox/')) {
    browser = 'Firefox';
    version = ua.match(/Firefox\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Chrome/')) {
    browser = 'Chrome';
    version = ua.match(/Chrome\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    browser = 'Safari';
    version = ua.match(/Version\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Edge/')) {
    browser = 'Edge';
    version = ua.match(/Edge\/(\d+)/)?.[1] || '';
  }

  // Detectar OS
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return {
    browser,
    version,
    os,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

// ============================================================================
// PROVIDER
// ============================================================================

interface LiaContextProviderProps {
  children: React.ReactNode;
  /** Si debe iniciar la captura de errores automáticamente */
  captureErrors?: boolean;
  /** Si debe detectar componentes activos */
  detectComponents?: boolean;
  /** Si debe rastrear llamadas a API */
  trackApiCalls?: boolean;
}

export function LiaContextProvider({
  children,
  captureErrors = true,
  detectComponents = true,
  trackApiCalls = true,
}: LiaContextProviderProps) {
  // Hooks de captura
  const errorCapture = useErrorCapture({ 
    captureConsole: captureErrors,
    captureExceptions: captureErrors,
    capturePromises: captureErrors,
  });
  
  const componentDetection = useActiveComponents({ 
    observe: detectComponents,
  });
  
  const apiTracking = useApiTracking({ 
    interceptFetch: trackApiCalls,
  });

  // Estado adicional
  const [sessionStart] = useState(() => Date.now());
  const [contextMarkers, setContextMarkers] = useState<string[]>([]);
  const [platformInfo] = useState(() => detectPlatformInfo());
  const [currentPage, setCurrentPage] = useState('');

  // Actualizar página actual
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentPage(window.location.pathname);

      const handleRouteChange = () => {
        setCurrentPage(window.location.pathname);
      };

      window.addEventListener('popstate', handleRouteChange);
      return () => window.removeEventListener('popstate', handleRouteChange);
    }
  }, []);

  // Agregar marcador de contexto
  const addContextMarker = useCallback((marker: string) => {
    setContextMarkers(prev => {
      const newMarkers = [...prev, `${new Date().toISOString()}: ${marker}`];
      // Mantener solo los últimos 20 marcadores
      return newMarkers.slice(-20);
    });
  }, []);

  // Limpiar marcadores
  const clearContextMarkers = useCallback(() => {
    setContextMarkers([]);
  }, []);

  // Limpiar todo
  const clearAll = useCallback(() => {
    errorCapture.clearErrors();
    apiTracking.clearCalls();
    clearContextMarkers();
  }, [errorCapture, apiTracking, clearContextMarkers]);

  // Construir metadata para API
  const getMetadataForApi = useCallback((): LiaEnrichedMetadata => {
    const sessionDuration = Date.now() - sessionStart;
    const errors = errorCapture.getErrorsForSofLIA();
    const summary = errorCapture.getErrorSummary();

    return {
      platform: platformInfo,
      errors: errors.map(e => ({
        type: e.type,
        message: e.message,
        stack: e.stack,
        timestamp: e.timestamp,
      })),
      errorSummary: summary 
        ? `${summary.total} errores (${summary.byType.console} consola, ${summary.byType.exception} excepciones, ${summary.byType.promise} promesas)`
        : 'Sin errores',
      activeComponents: componentDetection.getComponentsForSofLIA(),
      apiCalls: apiTracking.getCallsForSofLIA(),
      viewport: typeof window !== 'undefined' 
        ? { width: window.innerWidth, height: window.innerHeight }
        : { width: 0, height: 0 },
      sessionDuration,
      contextMarkers,
      currentPage,
    };
  }, [
    sessionStart,
    platformInfo,
    errorCapture,
    componentDetection,
    apiTracking,
    contextMarkers,
    currentPage,
  ]);

  // Metadata actual (memoizada)
  const metadata = useMemo(() => getMetadataForApi(), [getMetadataForApi]);

  // Valor del contexto
  const value: LiaContextValue = useMemo(() => ({
    metadata,
    errors: errorCapture.errors,
    components: componentDetection.components,
    apiCalls: apiTracking.apiCalls,
    hasErrors: errorCapture.hasErrors,
    errorCount: errorCapture.errorCount,
    clearAll,
    getMetadataForApi,
    addContextMarker,
    clearContextMarkers,
  }), [
    metadata,
    errorCapture.errors,
    errorCapture.hasErrors,
    errorCapture.errorCount,
    componentDetection.components,
    apiTracking.apiCalls,
    clearAll,
    getMetadataForApi,
    addContextMarker,
    clearContextMarkers,
  ]);

  return (
    <LiaContext.Provider value={value}>
      {children}
    </LiaContext.Provider>
  );
}

export default LiaContextProvider;









