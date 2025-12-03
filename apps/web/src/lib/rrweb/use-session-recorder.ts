/**
 * Hook personalizado para integrar rrweb en el sistema de reportes
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { RecordingSession } from './session-recorder';

// Importación dinámica para evitar problemas en el servidor
// Usar tipo genérico en lugar de typeof import para evitar análisis estático
import type { SessionRecorderInstance } from './session-recorder';

let sessionRecorder: SessionRecorderInstance | null = null;

async function getSessionRecorder() {
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!sessionRecorder) {
    const module = await import('./session-recorder');
    sessionRecorder = module.sessionRecorder;
  }
  
  return sessionRecorder;
}

interface UseSessionRecorderOptions {
  autoStart?: boolean;
  maxDuration?: number;
  enableOnProduction?: boolean;
}

export function useSessionRecorder(options: UseSessionRecorderOptions = {}) {
  const {
    autoStart = false,
    maxDuration = 60000,
    enableOnProduction = true,
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [currentSession, setCurrentSession] = useState<RecordingSession | null>(null);
  const [recordingSize, setRecordingSize] = useState<string>('0 KB');

  // Iniciar grabación automática si está habilitado
  useEffect(() => {
    if (autoStart && typeof window !== 'undefined') {
      // Verificar si estamos en producción
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction && !enableOnProduction) {
        console.log('⚠️ Grabación deshabilitada en producción');
        return;
      }

      startRecording().catch((error) => {
        console.error('❌ Error al iniciar grabación automática:', error);
      });
    }

    // Cleanup al desmontar
    return () => {
      getSessionRecorder().then((recorder) => {
        if (recorder && recorder.isActive()) {
          stopRecording();
        }
      });
    };
  }, [autoStart, enableOnProduction, startRecording, stopRecording]);

  // Actualizar tamaño y sesión cada 5 segundos mientras graba
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      getSessionRecorder().then((recorder) => {
        if (!recorder) return;
        const session = recorder.getCurrentSession();
        if (session) {
          setCurrentSession(session);
          const size = recorder.getSessionSizeFormatted(session);
          setRecordingSize(size);
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    const recorder = await getSessionRecorder();
    if (!recorder) {
      console.warn('⚠️ sessionRecorder no está disponible');
      return;
    }

    if (recorder.isActive()) {
      console.warn('⚠️ Ya hay una grabación activa');
      return;
    }

    try {
      await recorder.startRecording(maxDuration);
      setIsRecording(true);
      console.log('✅ Grabación iniciada');
    } catch (error) {
      console.error('❌ Error al iniciar grabación:', error);
      setIsRecording(false);
    }
  }, [maxDuration]);

  const stopRecording = useCallback(async () => {
    const recorder = await getSessionRecorder();
    if (!recorder) {
      console.warn('⚠️ sessionRecorder no está disponible');
      return null;
    }

    if (!recorder.isActive()) {
      console.warn('⚠️ No hay grabación activa');
      return null;
    }

    try {
      const session = recorder.stop();
      setIsRecording(false);
      setCurrentSession(session);
      console.log('✅ Grabación detenida');
      return session;
    } catch (error) {
      console.error('❌ Error al detener grabación:', error);
      return null;
    }
  }, []);

  const getSession = useCallback(async () => {
    if (currentSession) return currentSession;
    const recorder = await getSessionRecorder();
    return recorder?.getCurrentSession() || null;
  }, [currentSession]);

  const exportSessionBase64 = useCallback(async (sessionToExport?: RecordingSession | null) => {
    const session = sessionToExport || await getSession();
    if (!session) return null;
    const recorder = await getSessionRecorder();
    if (!recorder) return null;
    return recorder.exportSessionBase64(session);
  }, [getSession]);

  const clearSession = useCallback(() => {
    setCurrentSession(null);
    setRecordingSize('0 KB');
  }, []);

  return {
    isRecording,
    currentSession,
    recordingSize,
    startRecording,
    stopRecording,
    getSession,
    exportSessionBase64,
    clearSession,
  };
}
