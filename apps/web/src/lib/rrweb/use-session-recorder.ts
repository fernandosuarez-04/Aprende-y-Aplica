/**
 * Hook personalizado para integrar rrweb en el sistema de reportes
 */

import { useState, useEffect, useCallback } from 'react';
import { sessionRecorderClient, type RecordingSession } from './session-recorder-client';

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

      startRecording();
    }

    // Cleanup al desmontar
    return () => {
      if (sessionRecorderClient.isActive()) {
        stopRecording();
      }
    };
  }, [autoStart, enableOnProduction]);

  // Actualizar tamaño y sesión cada 5 segundos mientras graba
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(async () => {
      const session = await sessionRecorderClient.getCurrentSession();
      if (session) {
        setCurrentSession(session);
        const size = sessionRecorderClient.getSessionSizeFormatted(session);
        setRecordingSize(size);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    if (sessionRecorderClient.isActive()) {
      console.warn('⚠️ Ya hay una grabación activa');
      return;
    }

    try {
      await sessionRecorderClient.startRecording(maxDuration);
      setIsRecording(true);
      console.log('✅ Grabación iniciada');
    } catch (error) {
      console.error('❌ Error al iniciar grabación:', error);
    }
  }, [maxDuration]);

  const stopRecording = useCallback(async () => {
    if (!sessionRecorderClient.isActive()) {
      console.warn('⚠️ No hay grabación activa');
      return null;
    }

    try {
      const session = await sessionRecorderClient.stop();
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
    return currentSession || await sessionRecorderClient.getCurrentSession();
  }, [currentSession]);

  const exportSessionBase64 = useCallback((sessionToExport?: RecordingSession | null) => {
    const session = sessionToExport || currentSession;
    if (!session) return null;
    return sessionRecorderClient.exportSessionBase64(session);
  }, [currentSession]);

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
