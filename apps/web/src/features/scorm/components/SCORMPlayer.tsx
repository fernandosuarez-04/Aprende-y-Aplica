'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { initializeSCORMAPI, cleanupSCORMAPI } from '@/lib/scorm/adapter';
import { SCORMPlayerProps } from '@/lib/scorm/types';

export function SCORMPlayer({
  packageId,
  version,
  storagePath,
  entryPoint,
  onComplete,
  onError,
  onExit,
  className = '',
  objectives = []
}: SCORMPlayerProps & { onExit?: () => void }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentUrl, setContentUrl] = useState<string | null>(null);
  const [adapterReady, setAdapterReady] = useState(false);
  const adapterRef = useRef<ReturnType<typeof initializeSCORMAPI> | null>(null);
  const interceptorIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Guardar progreso cuando el usuario intenta salir de la página
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (adapterRef.current && !adapterRef.current.isTerminated()) {
        console.log('[SCORMPlayer] Page unload detected. Saving progress...');
        adapterRef.current.LMSFinish('');
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && adapterRef.current && !adapterRef.current.isTerminated()) {
        console.log('[SCORMPlayer] Page hidden. Committing progress...');
        adapterRef.current.LMSCommit('');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Initialize SCORM API FIRST, before setting content URL
  // This ensures objectives are available when SCORM content loads
  useEffect(() => {
    console.log('[SCORMPlayer] Initializing adapter with objectives:', objectives);
    console.log('[SCORMPlayer] Objectives count:', objectives?.length || 0);
    if (objectives && objectives.length > 0) {
      console.log('[SCORMPlayer] Objective IDs:', objectives.map(obj => obj.id));
    }

    // Interceptar errores de red en la consola principal para suprimir errores comunes del contenido SCORM
    const originalConsoleError = console.error;
    const errorInterceptor = (...args: any[]) => {
      const message = args.join(' ');
      // Filtrar errores comunes del contenido SCORM que no son críticos
      if (
        (message.includes('404') && message.includes('organizations/login')) ||
        (message.includes('401') && message.includes('Unauthorized') && !message.includes('/api/scorm/')) ||
        (message.includes('401') && message.includes('/api/auth/me')) // Suprimir 401 de auth/me (esperado cuando no hay sesión)
      ) {
        return; // No mostrar estos errores
      }
      originalConsoleError.apply(console, args);
    };
    console.error = errorInterceptor;

    const adapter = initializeSCORMAPI({
      packageId,
      version,
      objectives, // Pass objectives for immediate initialization in constructor
      onError: (err) => {
        setError(err);
        onError?.(err);
      },
      onComplete: (status, score) => {
        onComplete?.(status, score);
      }
    });

    // Registrar callback de salida para cuando el contenido SCORM quiera salir
    adapter.setOnExitCallback(() => {
      console.log('[SCORMPlayer] Exit callback triggered, navigating back...');
      if (onExit) {
        onExit();
      } else {
        window.history.back();
      }
    });

    adapterRef.current = adapter;
    setAdapterReady(true);

    return () => {
      // Restaurar console.error original
      console.error = originalConsoleError;
      
      if (adapterRef.current && !adapterRef.current.isTerminated()) {
        adapterRef.current.LMSFinish('');
      }
      cleanupSCORMAPI();
      setAdapterReady(false);
    };
  }, [packageId, version, objectives, onComplete, onError]);

  // Set content URL only AFTER adapter is ready
  useEffect(() => {
    if (!adapterReady) return;

    // Use proxy URL to serve content with proper headers
    const proxyUrl = `/api/scorm/content/${storagePath}/${entryPoint}`;
    setContentUrl(proxyUrl);
  }, [adapterReady, storagePath, entryPoint]);

  // Función para aplicar intercepciones al iframe
  const applyIframeInterceptions = useCallback(() => {
    try {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow || !iframe.contentDocument) return;

      const iframeWindow = iframe.contentWindow as any;
      const iframeDoc = iframe.contentDocument;

      // Marcar que ya se aplicaron las intercepciones para evitar duplicados
      if (iframeWindow.__scormInterceptionsApplied) return;
      iframeWindow.__scormInterceptionsApplied = true;

      // Interceptar window.close()
      iframeWindow.close = function() {
        console.log('[SCORMPlayer] Content attempted to close window. Saving state and exiting...');
        if (adapterRef.current) {
          adapterRef.current.terminateAndExit();
        }
      };

      // Interceptar window.alert() para suprimir errores de objetivos SCORM
      const originalAlert = iframeWindow.alert;
      iframeWindow.alert = function(message: string) {
        if (message && (
          message.includes('could not find objective') ||
          message.includes('ERROR - could not find objective') ||
          message.includes('ERROR -') ||
          (message.includes('objective') && message.includes('not found'))
        )) {
          console.log('[SCORMPlayer] Suppressed objective alert:', message);
          return;
        }
        originalAlert?.call(iframeWindow, message);
      };

      // Interceptar window.confirm() para manejar el botón Exit
      const originalConfirm = iframeWindow.confirm;
      iframeWindow.confirm = function(message: string) {
        if (message && (
          message.toLowerCase().includes('exit') ||
          message.toLowerCase().includes('salir') ||
          message.toLowerCase().includes('leave') ||
          message.toLowerCase().includes('abandonar')
        )) {
          console.log('[SCORMPlayer] Exit confirmation detected. Saving and exiting...');
          if (adapterRef.current) {
            adapterRef.current.terminateAndExit();
          }
          return true;
        }
        return originalConfirm?.call(iframeWindow, message);
      };

      // Suprimir console.error y console.warn para objetivos
      if (iframeWindow.console) {
        const originalError = iframeWindow.console.error;
        const originalWarn = iframeWindow.console.warn;

        iframeWindow.console.error = function(...args: any[]) {
          const message = args.join(' ');
          if (message.includes('could not find objective') ||
              message.includes('ERROR - could not find objective') ||
              (message.includes('404') && message.includes('organizations/login')) ||
              (message.includes('401') && !message.includes('/api/scorm/'))) {
            return;
          }
          originalError?.apply(iframeWindow.console, args);
        };

        iframeWindow.console.warn = function(...args: any[]) {
          const message = args.join(' ');
          if (message.includes('could not find objective') ||
              (message.includes('objective') && message.includes('not found')) ||
              message.includes('scroll-behavior')) {
            return;
          }
          originalWarn?.apply(iframeWindow.console, args);
        };
      }

      // Inyectar estilos CSS
      const iframeHead = iframeDoc.head || iframeDoc.getElementsByTagName('head')[0];
      if (iframeHead && !iframeDoc.getElementById('scorm-contrast-fix')) {
        const style = iframeDoc.createElement('style');
        style.type = 'text/css';
        style.id = 'scorm-contrast-fix';
        style.innerHTML = `
          body { color: #1a1a1a !important; background-color: #ffffff !important; }
          html, body { background-color: #ffffff !important; }
        `;
        iframeHead.appendChild(style);
      }
    } catch (e) {
      // Ignorar errores de CORS
    }
  }, []);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);

    // Aplicar intercepciones al cargar
    applyIframeInterceptions();

    // Limpiar intervalo anterior si existe
    if (interceptorIntervalRef.current) {
      clearInterval(interceptorIntervalRef.current);
    }

    // Re-aplicar periódicamente para capturar navegaciones internas del SCORM
    interceptorIntervalRef.current = setInterval(() => {
      try {
        const iframe = iframeRef.current;
        if (iframe && iframe.contentWindow) {
          const iframeWindow = iframe.contentWindow as any;
          // Si se detecta que las intercepciones se perdieron, re-aplicarlas
          if (!iframeWindow.__scormInterceptionsApplied) {
            applyIframeInterceptions();
          }
        }
      } catch (e) {
        // Ignorar errores de CORS
      }
    }, 500);
  }, [applyIframeInterceptions]);

  // Cleanup del intervalo cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (interceptorIntervalRef.current) {
        clearInterval(interceptorIntervalRef.current);
      }
    };
  }, []);

  const handleIframeError = useCallback(() => {
    setError('Failed to load SCORM content');
    setIsLoading(false);
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg">
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto text-red-400 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-red-600 font-medium">Error al cargar el contenido</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-white dark:bg-neutral-900 rounded-lg overflow-hidden border-2 border-neutral-200 dark:border-neutral-700 shadow-lg ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-neutral-900 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-neutral-700 dark:text-neutral-200 text-sm font-medium">Cargando curso...</p>
          </div>
        </div>
      )}

      {contentUrl && (
        <iframe
          ref={iframeRef}
          src={contentUrl}
          className="w-full h-full min-h-[600px] border-0 bg-white dark:bg-neutral-900"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          allow="autoplay; fullscreen"
          title="SCORM Content"
          style={{
            backgroundColor: '#ffffff',
            colorScheme: 'light',
            filter: 'contrast(1.1) brightness(1.05)'
          }}
        />
      )}
    </div>
  );
}
