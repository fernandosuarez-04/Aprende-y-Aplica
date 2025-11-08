/**
 * Hook personalizado para integrar rrweb en el sistema de reportes
 */

import { useState, useEffect, useCallback } from 'react';
import { sessionRecorder } from '@/lib/rrweb/session-recorder';
import type { RecordingSession } from '@/lib/rrweb/session-recorder';

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
      if (sessionRecorder.isActive()) {
        stopRecording();
      }
    };
  }, [autoStart, enableOnProduction]);

  // Actualizar tamaño y sesión cada 5 segundos mientras graba
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      const session = sessionRecorder.getCurrentSession();
      if (session) {
        setCurrentSession(session);
        const size = sessionRecorder.getSessionSizeFormatted(session);
        setRecordingSize(size);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = useCallback(() => {
    if (sessionRecorder.isActive()) {
      console.warn('⚠️ Ya hay una grabación activa');
      return;
    }

    try {
      sessionRecorder.startRecording(maxDuration);
      setIsRecording(true);
      console.log('✅ Grabación iniciada');
    } catch (error) {
      console.error('❌ Error al iniciar grabación:', error);
    }
  }, [maxDuration]);

  const stopRecording = useCallback(() => {
    if (!sessionRecorder.isActive()) {
      console.warn('⚠️ No hay grabación activa');
      return null;
    }

    try {
      const session = sessionRecorder.stop();
      setIsRecording(false);
      setCurrentSession(session);
      console.log('✅ Grabación detenida');
      return session;
    } catch (error) {
      console.error('❌ Error al detener grabación:', error);
      return null;
    }
  }, []);

  const getSession = useCallback(() => {
    return currentSession || sessionRecorder.getCurrentSession();
  }, [currentSession]);

  const exportSessionBase64 = useCallback(() => {
    const session = getSession();
    if (!session) return null;
    return sessionRecorder.exportSessionBase64(session);
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
