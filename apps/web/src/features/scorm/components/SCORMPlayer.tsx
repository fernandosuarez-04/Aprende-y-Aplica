'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { initializeSCORMAPI, cleanupSCORMAPI } from '@/lib/scorm/adapter';
import { createClient } from '@/lib/supabase/client';
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

  // Obtener URL firmada del contenido
  useEffect(() => {
    async function getContentUrl() {
      try {
        const supabase = createClient();

        const { data, error: urlError } = await supabase.storage
          .from('scorm-packages')
          .createSignedUrl(`${storagePath}/${entryPoint}`, 3600);

        if (urlError || !data) {
          setError('Failed to load content');
          onError?.('Failed to load content');
          return;
        }

        setContentUrl(data.signedUrl);
      } catch (err) {
        setError('Failed to load content');
        onError?.('Failed to load content');
      }
    }

    getContentUrl();
  }, [storagePath, entryPoint, onError]);

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
    <div className={`relative bg-neutral-100 rounded-lg overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-neutral-600 text-sm">Cargando curso...</p>
          </div>
        </div>
      )}

      {contentUrl && (
        <iframe
          ref={iframeRef}
          src={contentUrl}
          className="w-full h-full min-h-[600px] border-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          allow="autoplay; fullscreen"
          title="SCORM Content"
        />
      )}
    </div>
  );
}
