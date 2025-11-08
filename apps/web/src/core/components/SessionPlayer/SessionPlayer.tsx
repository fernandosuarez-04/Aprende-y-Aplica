/**
 * Componente para reproducir sesiones grabadas con rrweb
 */
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import rrwebPlayer from 'rrweb-player';
import type { RecordingSession } from '../../../lib/rrweb/session-recorder';

interface SessionPlayerProps {
  session: RecordingSession;
  width?: string | number;
  height?: string | number;
  autoPlay?: boolean;
  showController?: boolean;
  skipInactive?: boolean;
  speed?: number;
}

export function SessionPlayer({
  session,
  width = '100%',
  height = '600px',
  autoPlay = false,
  showController = true,
  skipInactive = true,
  speed = 1,
}: SessionPlayerProps) {
  const playerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  // Callback ref que se ejecuta cuando el div se monta
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      console.log('✅ Contenedor montado correctamente');
      setContainer(node);
    }
  }, []);

  useEffect(() => {
    if (!container) {
      console.log('⏳ Esperando contenedor...');
      return;
    }
    
    if (!session.events.length) {
      console.warn('⚠️ SessionPlayer: No hay eventos para reproducir')
      setError('No hay eventos para reproducir');
      setIsLoading(false);
      return;
    }

    try {
      // Limpiar player anterior si existe
      if (playerRef.current) {
        playerRef.current.pause();
        container.innerHTML = '';
      }

      console.log('🎬 Inicializando player con', session.events.length, 'eventos');
      console.log('📋 Primeros 5 eventos:', session.events.slice(0, 5).map(e => ({
        type: e.type,
        timestamp: e.timestamp
      })));

      // Crear nuevo player
      playerRef.current = new rrwebPlayer({
        target: container,
        props: {
          events: session.events,
          width: typeof width === 'number' ? width : undefined,
          height: typeof height === 'number' ? height : undefined,
          autoPlay: autoPlay,
          showController: showController,
          skipInactive: skipInactive,
          speed: speed,
          UNSAFE_replayCanvas: false, // No reproducir canvas por seguridad
        },
      });

      console.log('✅ Player inicializado correctamente');
      setIsLoading(false);
      setError(null);
    } catch (err) {
      console.error('❌ Error inicializando player:', err);
      setError('Error al cargar la reproducción');
      setIsLoading(false);
    }

    // Cleanup
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.pause();
        } catch (err) {
          console.error('Error al pausar player:', err);
        }
      }
    };
  }, [container, session, width, height, autoPlay, showController, skipInactive, speed]);

  if (isLoading) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center bg-gray-100 rounded-lg"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reproducción...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center bg-red-50 rounded-lg border-2 border-red-200"
      >
        <div className="text-center px-4">
          <svg
            className="w-12 h-12 text-red-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="session-player-wrapper">
      <div ref={containerRef} style={{ width, height }} />
    </div>
  );
}

/**
 * Componente compacto para mostrar info de la sesión
 */
interface SessionInfoProps {
  session: RecordingSession;
  showSize?: boolean;
}

export function SessionInfo({ session, showSize = true }: SessionInfoProps) {
  const duration = session.endTime
    ? session.endTime - session.startTime
    : 0;

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getSize = () => {
    const json = JSON.stringify(session);
    const bytes = new Blob([json]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-gray-600">Eventos grabados:</span>
        <span className="font-medium">{session.events.length}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-600">Duración:</span>
        <span className="font-medium">{formatDuration(duration)}</span>
      </div>
      {showSize && (
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Tamaño:</span>
          <span className="font-medium">{getSize()}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-gray-600">Inicio:</span>
        <span className="font-medium text-xs">
          {new Date(session.startTime).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
