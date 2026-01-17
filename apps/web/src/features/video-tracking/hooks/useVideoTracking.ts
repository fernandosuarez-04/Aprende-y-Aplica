import { useCallback, useRef, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';

/**
 * Opciones de configuración para el hook de tracking de video
 */
interface VideoTrackingOptions {
    /** ID de la lección que se está viendo */
    lessonId: string;
    /** ID del tracking activo (opcional) */
    trackingId?: string;
    /** Callback para manejar errores */
    onError?: (error: Error) => void;
}

/**
 * Hook personalizado para tracking de progreso de video
 * 
 * Maneja el registro de eventos de video (play, pause, ended, etc.) y
 * actualiza el progreso en la base de datos con debouncing inteligente.
 * 
 * @example
 * ```tsx
 * const tracking = useVideoTracking({
 *   lessonId: 'lesson-123',
 *   trackingId: 'tracking-456',
 *   onError: (error) => console.error('Tracking error:', error)
 * });
 * 
 * // En el video element
 * video.addEventListener('play', () => 
 *   tracking.handlePlay(video.currentTime, video.duration, video.playbackRate)
 * );
 * ```
 */
export function useVideoTracking({
    lessonId,
    trackingId,
    onError
}: VideoTrackingOptions) {
    // 🐛 DEBUG: Log when hook is initialized
    useEffect(() => {
        console.log('[useVideoTracking] Hook initialized with:', { lessonId, trackingId });

        if (!lessonId) {
            console.warn('[useVideoTracking] ⚠️ No lessonId provided - tracking will NOT work');
        } else {
            console.log('[useVideoTracking] ✅ Tracking is ACTIVE for lesson:', lessonId);
        }
    }, [lessonId, trackingId]);

    // Ref para rastrear la última actualización de progreso
    const lastProgressUpdate = useRef(0);
    // Ref para rastrear el punto máximo alcanzado en el video
    const maxSecondsReached = useRef(0);

    /**
     * Función para actualizar el progreso del video en la base de datos
     */
    const updateProgress = async (
        currentTime: number,
        duration: number,
        playbackRate: number
    ) => {
        try {
            // Actualizar el máximo alcanzado
            maxSecondsReached.current = Math.max(maxSecondsReached.current, currentTime);

            const response = await fetch('/api/lesson-tracking/update-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId,
                    trackingId,
                    checkpoint: Math.floor(currentTime),
                    maxReached: Math.floor(maxSecondsReached.current),
                    totalDuration: Math.floor(duration),
                    playbackRate
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to update progress: ${response.status}`);
            }

            const data = await response.json();

            // Si el servidor devuelve un trackingId nuevo, podríamos guardarlo
            // (útil para la primera vez que se crea el tracking)
            if (data.trackingId && !trackingId) {
                console.log('[VideoTracking] New tracking ID received:', data.trackingId);
            }

            lastProgressUpdate.current = currentTime;
        } catch (error) {
            console.error('[VideoTracking] Error updating progress:', error);
            onError?.(error as Error);
        }
    };

    /**
     * Versión con debouncing para actualizaciones frecuentes (timeupdate)
     * Se ejecuta máximo cada 5 segundos
     */
    const debouncedUpdate = useDebouncedCallback(updateProgress, 5000);

    /**
     * Handler para evento 'play'
     * Actualiza inmediatamente cuando el usuario da play
     */
    const handlePlay = useCallback((
        currentTime: number,
        duration: number,
        playbackRate: number
    ) => {
        if (process.env.NODE_ENV === 'development') {
            console.log('[VideoTracking] Play event', { currentTime, duration, playbackRate });
        }
        // Actualizar inmediatamente al dar play
        updateProgress(currentTime, duration, playbackRate);
    }, [lessonId, trackingId]);

    /**
     * Handler para evento 'pause'
     * Actualiza inmediatamente y cancela cualquier update pendiente
     */
    const handlePause = useCallback((
        currentTime: number,
        duration: number,
        playbackRate: number
    ) => {
        if (process.env.NODE_ENV === 'development') {
            console.log('[VideoTracking] Pause event', { currentTime, duration, playbackRate });
        }
        // Actualizar inmediatamente al pausar
        updateProgress(currentTime, duration, playbackRate);
        // Cancelar cualquier debounce pendiente
        debouncedUpdate.cancel();
    }, [lessonId, trackingId]);

    /**
     * Handler para evento 'ended'
     * Actualiza inmediatamente cuando el video termina
     */
    const handleEnded = useCallback((
        currentTime: number,
        duration: number,
        playbackRate: number
    ) => {
        if (process.env.NODE_ENV === 'development') {
            console.log('[VideoTracking] Ended event', { currentTime, duration, playbackRate });
        }
        // Actualizar con la duración completa
        updateProgress(duration, duration, playbackRate);
        debouncedUpdate.cancel();
    }, [lessonId, trackingId]);

    /**
     * Handler para evento 'seeked'
     * Actualiza inmediatamente cuando el usuario salta a otra posición
     */
    const handleSeeked = useCallback((
        currentTime: number,
        duration: number,
        playbackRate: number
    ) => {
        if (process.env.NODE_ENV === 'development') {
            console.log('[VideoTracking] Seeked event', { currentTime, duration, playbackRate });
        }
        // Actualizar inmediatamente al hacer seek
        updateProgress(currentTime, duration, playbackRate);
    }, [lessonId, trackingId]);

    /**
     * Handler para evento 'timeupdate'
     * Usa debouncing para evitar sobrecarga de la BD
     * Solo actualiza si han pasado más de 3 segundos desde la última actualización
     */
    const handleTimeUpdate = useCallback((
        currentTime: number,
        duration: number,
        playbackRate: number
    ) => {
        // Solo actualizar si han pasado más de 3 segundos desde la última actualización
        // Esto evita actualizaciones excesivas incluso con el debouncing
        if (Math.abs(currentTime - lastProgressUpdate.current) >= 3) {
            debouncedUpdate(currentTime, duration, playbackRate);
        }
    }, [debouncedUpdate]);

    /**
     * Handler para evento 'ratechange'
     * Actualiza inmediatamente cuando cambia la velocidad de reproducción
     */
    const handleRateChange = useCallback((
        currentTime: number,
        duration: number,
        playbackRate: number
    ) => {
        if (process.env.NODE_ENV === 'development') {
            console.log('[VideoTracking] Rate change event', { playbackRate });
        }
        // Actualizar inmediatamente al cambiar velocidad
        updateProgress(currentTime, duration, playbackRate);
    }, [lessonId, trackingId]);

    /**
     * Función de limpieza para cancelar debounces pendientes
     * Debe llamarse al desmontar el componente
     */
    const cleanup = useCallback(() => {
        debouncedUpdate.cancel();
    }, [debouncedUpdate]);

    return {
        handlePlay,
        handlePause,
        handleEnded,
        handleSeeked,
        handleTimeUpdate,
        handleRateChange,
        cleanup
    };
}
