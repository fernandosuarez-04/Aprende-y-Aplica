'use client';

/**
 * useLiaEnrichedContext
 * 
 * Hook que combina todos los hooks de contexto de LIA y proporciona
 * un método para obtener metadata enriquecida lista para enviar al API.
 * 
 * Este hook está diseñado para usarse con useLiaGeneralChat o similar,
 * enriqueciendo la metadata que se envía al servidor.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { getEnrichedMetadata, hasErrors, addContextMarker } = useLiaEnrichedContext();
 *   
 *   const handleSendMessage = async (message: string) => {
 *     // Agregar marcador de contexto
 *     addContextMarker('Usuario envió mensaje desde modal de asignación');
 *     
 *     // Obtener metadata para enviar
 *     const metadata = getEnrichedMetadata();
 *     
 *     // Enviar a LIA con metadata
 *     await sendToLia(message, metadata);
 *   };
 * }
 * ```
 */

import { useCallback, useState, useMemo, useEffect } from 'react';
import { useErrorCapture, CapturedError } from './useErrorCapture';
import { useActiveComponents, ActiveComponent } from './useActiveComponents';
import { useApiTracking, ApiCall } from './useApiTracking';

export interface LiaEnrichedContextMetadata {
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
  /** Resumen de la sesión */
  sessionSummary?: string;
}

interface UseLiaEnrichedContextOptions {
  /** Si debe capturar errores */
  captureErrors?: boolean;
  /** Si debe detectar componentes */
  detectComponents?: boolean;
  /** Si debe rastrear API calls */
  trackApiCalls?: boolean;
}

const DEFAULT_OPTIONS: UseLiaEnrichedContextOptions = {
  captureErrors: true,
  detectComponents: true,
  trackApiCalls: true,
};

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

export function useLiaEnrichedContext(options: UseLiaEnrichedContextOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // Hooks individuales
  const errorCapture = useErrorCapture({ 
    captureConsole: config.captureErrors,
    captureExceptions: config.captureErrors,
    capturePromises: config.captureErrors,
  });
  
  const componentDetection = useActiveComponents({ 
    observe: config.detectComponents,
  });
  
  const apiTracking = useApiTracking({ 
    interceptFetch: config.trackApiCalls,
  });

  // Estado
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

  /**
   * Agrega un marcador de contexto
   */
  const addContextMarker = useCallback((marker: string) => {
    const timestamp = new Date().toISOString();
    setContextMarkers(prev => {
      const newMarkers = [...prev, `${timestamp}: ${marker}`];
      return newMarkers.slice(-20); // Mantener solo los últimos 20
    });
  }, []);

  /**
   * Limpia marcadores de contexto
   */
  const clearContextMarkers = useCallback(() => {
    setContextMarkers([]);
  }, []);

  /**
   * Limpia todo el estado
   */
  const clearAll = useCallback(() => {
    errorCapture.clearErrors();
    apiTracking.clearCalls();
    clearContextMarkers();
  }, [errorCapture, apiTracking, clearContextMarkers]);

  /**
   * Obtiene metadata enriquecida para enviar a LIA
   */
  const getEnrichedMetadata = useCallback((): LiaEnrichedContextMetadata => {
    const sessionDuration = Date.now() - sessionStart;
    const errors = errorCapture.getErrorsForLia();
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
      activeComponents: componentDetection.getComponentsForLia(),
      apiCalls: apiTracking.getCallsForLia(),
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

  /**
   * Genera un resumen de sesión legible
   */
  const getSessionSummary = useCallback(() => {
    const duration = Math.floor((Date.now() - sessionStart) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    const parts: string[] = [];
    parts.push(`Sesión: ${minutes}m ${seconds}s`);
    
    if (errorCapture.errorCount > 0) {
      parts.push(`Errores: ${errorCapture.errorCount}`);
    }
    
    if (componentDetection.componentCount > 0) {
      parts.push(`Componentes: ${componentDetection.getComponentNames().join(', ')}`);
    }
    
    const errorCalls = apiTracking.getErrorCalls();
    if (errorCalls.length > 0) {
      parts.push(`APIs con error: ${errorCalls.length}`);
    }
    
    return parts.join(' | ');
  }, [sessionStart, errorCapture, componentDetection, apiTracking]);

  // Valores memoizados
  const hasErrors = useMemo(() => 
    errorCapture.hasErrors || apiTracking.getErrorCalls().length > 0,
    [errorCapture.hasErrors, apiTracking]
  );

  return {
    // Estado
    errors: errorCapture.errors,
    components: componentDetection.components,
    apiCalls: apiTracking.apiCalls,
    contextMarkers,
    currentPage,
    
    // Contadores
    errorCount: errorCapture.errorCount,
    componentCount: componentDetection.componentCount,
    apiCallCount: apiTracking.callCount,
    
    // Flags
    hasErrors,
    hasComponents: componentDetection.hasComponents,
    
    // Métodos principales
    getEnrichedMetadata,
    getSessionSummary,
    addContextMarker,
    
    // Limpieza
    clearErrors: errorCapture.clearErrors,
    clearContextMarkers,
    clearAll,
    
    // Acceso directo a hooks
    errorCapture,
    componentDetection,
    apiTracking,
  };
}

export default useLiaEnrichedContext;






