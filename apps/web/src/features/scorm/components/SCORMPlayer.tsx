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
  className = ''
}: SCORMPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentUrl, setContentUrl] = useState<string | null>(null);
  const adapterRef = useRef<ReturnType<typeof initializeSCORMAPI> | null>(null);

  // Construir URL del proxy para el contenido SCORM
  useEffect(() => {
    // Use proxy URL to serve content with proper headers
    // This avoids Supabase Storage's restrictive CSP headers
    const proxyUrl = `/api/scorm/content/${storagePath}/${entryPoint}`;
    setContentUrl(proxyUrl);
  }, [storagePath, entryPoint]);

  // Inicializar SCORM API
  useEffect(() => {
    if (!contentUrl) return;

    const adapter = initializeSCORMAPI({
      packageId,
      version,
      onError: (err) => {
        setError(err);
        onError?.(err);
      },
      onComplete: (status, score) => {
        onComplete?.(status, score);
      }
    });

    adapterRef.current = adapter;

    return () => {
      if (adapterRef.current && !adapterRef.current.isTerminated()) {
        adapterRef.current.LMSFinish('');
      }
      cleanupSCORMAPI();
    };
  }, [contentUrl, packageId, version, onComplete, onError]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    
    // Intentar inyectar estilos CSS en el iframe para mejorar el contraste
    // Esto solo funciona si el iframe está en el mismo origen o permite acceso
    try {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentDocument) {
        const iframeDoc = iframe.contentDocument;
        const iframeHead = iframeDoc.head || iframeDoc.getElementsByTagName('head')[0];
        
        // Verificar si ya existe el estilo para evitar duplicados
        if (iframeHead && !iframeDoc.getElementById('scorm-contrast-fix')) {
          // Crear un elemento style para mejorar el contraste
          const style = iframeDoc.createElement('style');
          style.type = 'text/css';
          style.id = 'scorm-contrast-fix';
          style.innerHTML = `
            /* Mejorar contraste del texto para mejor legibilidad */
            body {
              color: #1a1a1a !important;
              background-color: #ffffff !important;
            }
            
            /* Mejorar contraste de elementos comunes de texto que no tengan color definido */
            body p:not([style*="color"]):not([class*="no-contrast"]),
            body h1:not([style*="color"]):not([class*="no-contrast"]),
            body h2:not([style*="color"]):not([class*="no-contrast"]),
            body h3:not([style*="color"]):not([class*="no-contrast"]),
            body h4:not([style*="color"]):not([class*="no-contrast"]),
            body h5:not([style*="color"]):not([class*="no-contrast"]),
            body h6:not([style*="color"]):not([class*="no-contrast"]),
            body div:not([style*="color"]):not([class*="no-contrast"]),
            body span:not([style*="color"]):not([class*="no-contrast"]),
            body li:not([style*="color"]):not([class*="no-contrast"]),
            body td:not([style*="color"]):not([class*="no-contrast"]),
            body th:not([style*="color"]):not([class*="no-contrast"]) {
              color: #1a1a1a !important;
            }
            
            /* Asegurar fondo blanco para mejor contraste */
            html, body {
              background-color: #ffffff !important;
            }
          `;
          
          iframeHead.appendChild(style);
        }
      }
    } catch (error) {
      // Si hay errores de CORS o seguridad, simplemente continuar
      // Esto es normal si el iframe tiene restricciones de seguridad o está en otro dominio
      // En ese caso, el filtro CSS aplicado al iframe mismo ayudará con el contraste
    }
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
