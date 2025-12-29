/**
 * useLessonTracking Hook
 * 
 * Hook para tracking de lecciones durante el estudio.
 * Maneja: inicio de lección, eventos de video, mensajes LIA, y cambio de contexto.
 * 
 * Uso:
 * const { trackStart, trackVideoEnded, trackLiaMessage } = useLessonTracking(lessonId, sessionId);
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface LessonTimeEstimates {
  t_lesson_minutes: number;
  t_video_minutes: number;
  t_materials_minutes: number;
}

interface UseLessonTrackingOptions {
  lessonId: string;
  sessionId?: string;
  planId?: string;
  lessonTimeEstimates?: LessonTimeEstimates;
  /** Habilitar heartbeat de actividad (default: true) */
  enableHeartbeat?: boolean;
  /** Intervalo de heartbeat en segundos (default: 60) */
  heartbeatIntervalSeconds?: number;
  /** Callback cuando se detiene el tracking */
  onTrackingComplete?: (endTrigger: string) => void;
}

interface UseLessonTrackingReturn {
  /** ID del tracking actual */
  trackingId: string | null;
  /** Si hay un tracking activo */
  isTracking: boolean;
  /** Iniciar tracking (llamar en video_play) */
  trackStart: () => Promise<void>;
  /** Registrar que el video terminó */
  trackVideoEnded: () => Promise<void>;
  /** Registrar mensaje enviado a LIA */
  trackLiaMessage: () => Promise<void>;
  /** Registrar actividad general */
  trackActivity: () => Promise<void>;
  /** Completar tracking (quiz, navegación, etc.) */
  trackComplete: (endTrigger: 'quiz_submitted' | 'context_changed' | 'manual') => Promise<void>;
  /** Estado de carga */
  isLoading: boolean;
  /** Error si ocurrió */
  error: string | null;
}

export function useLessonTracking(
  options: UseLessonTrackingOptions
): UseLessonTrackingReturn {
  const {
    lessonId,
    sessionId,
    planId,
    lessonTimeEstimates,
    enableHeartbeat = true,
    heartbeatIntervalSeconds = 60,
    onTrackingComplete
  } = options;

  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedRef = useRef(false);

  // Limpiar heartbeat al desmontar
  useEffect(() => {
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, []);

  // Iniciar tracking (video_play)
  const trackStart = useCallback(async () => {
    if (hasStartedRef.current || !lessonId) return;
    
    hasStartedRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/study-planner/lesson-tracking/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          sessionId,
          planId,
          trigger: 'video_play',
          lessonTimeEstimates
        })
      });

      const data = await response.json();

      if (data.success && data.trackingId) {
        setTrackingId(data.trackingId);
        setIsTracking(true);

        // Iniciar heartbeat
        if (enableHeartbeat) {
          heartbeatRef.current = setInterval(() => {
            trackActivity();
          }, heartbeatIntervalSeconds * 1000);
        }
      } else {
        setError(data.error || 'Error al iniciar tracking');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
      hasStartedRef.current = false; // Permitir reintentar
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, sessionId, planId, lessonTimeEstimates, enableHeartbeat, heartbeatIntervalSeconds]);

  // Registrar evento
  const sendEvent = useCallback(async (eventType: string) => {
    if (!trackingId) return;

    try {
      await fetch('/api/study-planner/lesson-tracking/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingId, eventType })
      });
    } catch (err) {
      console.error(`Error enviando evento ${eventType}:`, err);
    }
  }, [trackingId]);

  // Registrar video terminado
  const trackVideoEnded = useCallback(async () => {
    await sendEvent('video_ended');
  }, [sendEvent]);

  // Registrar mensaje LIA
  const trackLiaMessage = useCallback(async () => {
    await sendEvent('lia_message');
  }, [sendEvent]);

  // Registrar actividad general
  const trackActivity = useCallback(async () => {
    await sendEvent('activity');
  }, [sendEvent]);

  // Completar tracking
  const trackComplete = useCallback(async (
    endTrigger: 'quiz_submitted' | 'context_changed' | 'manual'
  ) => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }

    try {
      const response = await fetch('/api/study-planner/lesson-tracking/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingId,
          lessonId,
          endTrigger
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsTracking(false);
        setTrackingId(null);
        hasStartedRef.current = false;
        onTrackingComplete?.(endTrigger);
      }
    } catch (err: any) {
      console.error('Error completando tracking:', err);
    }
  }, [trackingId, lessonId, onTrackingComplete]);

  // Detectar cambio de lessonId (navegación) y completar tracking anterior
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (trackingId) {
        // Usar sendBeacon para enviar antes de cerrar
        navigator.sendBeacon(
          '/api/study-planner/lesson-tracking/complete',
          JSON.stringify({
            trackingId,
            endTrigger: 'context_changed'
          })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [trackingId]);

  return {
    trackingId,
    isTracking,
    trackStart,
    trackVideoEnded,
    trackLiaMessage,
    trackActivity,
    trackComplete,
    isLoading,
    error
  };
}

export default useLessonTracking;
