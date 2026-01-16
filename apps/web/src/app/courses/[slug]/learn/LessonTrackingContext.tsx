/**
 * LessonTrackingContext
 * 
 * Contexto para compartir estado y funciones de tracking de lecciones
 * entre componentes de la página Learn.
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useInactivityLogout } from '../../../../hooks/useInactivityLogout';
import { useLessonTracking } from '../../../../hooks/useLessonTracking';
import { InactivityWarningModal, SessionClosedMessage } from '../../../../components/InactivityWarningModal';

interface LessonTrackingContextType {
  // Tracking state
  trackingId: string | null;
  isTracking: boolean;

  // Tracking functions
  trackVideoPlay: () => Promise<void>;
  trackProgress: (state: { currentTime: number; maxReached: number; totalDuration: number; playbackRate: number }) => Promise<void>;
  trackVideoEnded: () => Promise<void>;
  trackLiaMessage: () => Promise<void>;
  trackQuizCompleted: () => Promise<void>;
  trackLessonChange: () => Promise<void>;

  // Initial state for resume
  initialCheckpoint: number;
  initialPlaybackRate: number;

  // Inactivity state
  isWarningShown: boolean;
  secondsUntilLogout: number;
  resetInactivityTimer: () => void;
}

const LessonTrackingContext = createContext<LessonTrackingContextType | null>(null);

interface LessonTrackingProviderProps {
  children: React.ReactNode;
  lessonId: string | null;
  sessionId?: string;
  planId?: string;
  lessonTimeEstimates?: {
    t_lesson_minutes: number;
    t_video_minutes: number;
    t_materials_minutes: number;
  };
}

export function LessonTrackingProvider({
  children,
  lessonId,
  sessionId,
  planId,
  lessonTimeEstimates
}: LessonTrackingProviderProps) {
  // Hook de inactividad
  const {
    isWarning,
    minutesRemaining,
    secondsRemaining,
    resetTimer,
    showSessionClosedMessage,
    dismissSessionClosedMessage
  } = useInactivityLogout({
    timeoutMinutes: 60,
    warningMinutes: 5,
    enabled: !!lessonId
  });

  // Hook de tracking
  const {
    trackingId,
    isTracking,
    trackStart,
    trackProgress: trackProgressInternal,
    trackVideoEnded: trackVideoEndedInternal,
    trackLiaMessage: trackLiaMessageInternal,
    trackComplete,
    initialCheckpoint,
    initialPlaybackRate
  } = useLessonTracking({
    lessonId: lessonId || '',
    sessionId,
    planId,
    lessonTimeEstimates,
    enableHeartbeat: true,
    heartbeatIntervalSeconds: 60
  });

  // Ref para evitar duplicate calls
  const hasStartedRef = useRef(false);
  const prevLessonIdRef = useRef<string | null>(null);

  // Reset tracking cuando cambia la lección
  useEffect(() => {
    if (lessonId !== prevLessonIdRef.current) {
      if (prevLessonIdRef.current && isTracking) {
        // Cerrar tracking anterior por cambio de contexto
        trackComplete('context_changed');
      }
      hasStartedRef.current = false;
      prevLessonIdRef.current = lessonId;
    }
  }, [lessonId, isTracking, trackComplete]);

  // Tracking functions
  const trackVideoPlay = useCallback(async () => {
    if (!lessonId || hasStartedRef.current) return;
    hasStartedRef.current = true;
    await trackStart();
    resetTimer(); // Reset inactivity on video play
  }, [lessonId, trackStart, resetTimer]);

  const trackVideoEnded = useCallback(async () => {
    await trackVideoEndedInternal();
  }, [trackVideoEndedInternal]);

  const trackProgress = useCallback(async (state: { currentTime: number; maxReached: number; totalDuration: number; playbackRate: number }) => {
    if (!lessonId || !hasStartedRef.current) return;
    await trackProgressInternal(state);
  }, [lessonId, trackProgressInternal]);

  const trackLiaMessage = useCallback(async () => {
    await trackLiaMessageInternal();
    resetTimer(); // Reset inactivity on LIA message
  }, [trackLiaMessageInternal, resetTimer]);

  const trackQuizCompleted = useCallback(async () => {
    await trackComplete('quiz_submitted');
  }, [trackComplete]);

  const trackLessonChange = useCallback(async () => {
    if (isTracking) {
      await trackComplete('context_changed');
    }
  }, [isTracking, trackComplete]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login?reason=inactivity';
    } catch (error) {
      console.error('Error en logout:', error);
      window.location.href = '/login';
    }
  }, []);

  // Context value
  const value: LessonTrackingContextType = {
    trackingId,
    isTracking,
    trackVideoPlay,
    trackProgress,
    trackVideoEnded,
    trackLiaMessage,
    trackQuizCompleted,
    trackLessonChange,
    initialCheckpoint,
    initialPlaybackRate,
    isWarningShown: isWarning,
    secondsUntilLogout: secondsRemaining,
    resetInactivityTimer: resetTimer
  };

  return (
    <LessonTrackingContext.Provider value={value}>
      {children}

      {/* Modal de advertencia de inactividad */}
      <InactivityWarningModal
        isOpen={isWarning}
        minutesRemaining={minutesRemaining}
        secondsRemaining={secondsRemaining}
        onContinue={resetTimer}
        onLogout={handleLogout}
      />

      {/* Mensaje de sesión cerrada por inactividad */}
      <SessionClosedMessage
        isOpen={showSessionClosedMessage}
        onDismiss={dismissSessionClosedMessage}
      />
    </LessonTrackingContext.Provider>
  );
}

// Hook para usar el contexto
export function useLessonTrackingContext() {
  const context = useContext(LessonTrackingContext);
  if (!context) {
    throw new Error('useLessonTrackingContext must be used within LessonTrackingProvider');
  }
  return context;
}

// Hook opcional que no lanza error si no hay provider
export function useLessonTrackingOptional() {
  return useContext(LessonTrackingContext);
}

export default LessonTrackingProvider;
