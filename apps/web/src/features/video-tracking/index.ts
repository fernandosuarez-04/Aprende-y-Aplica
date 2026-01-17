/**
 * Video Tracking Feature
 * 
 * Sistema de tracking de progreso de videos para cursos/talleres.
 * Permite rastrear la posición actual, punto máximo alcanzado, y velocidad de reproducción.
 */

export { useVideoTracking } from './hooks/useVideoTracking';
export type {
    VideoTrackingOptions,
    VideoResumeData,
    UpdateProgressPayload,
    UpdateProgressResponse
} from './types';
