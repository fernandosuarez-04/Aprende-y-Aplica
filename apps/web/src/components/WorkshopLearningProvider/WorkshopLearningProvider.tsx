/**
 * 🎯 Workshop Learning Provider
 * 
 * Provider/Wrapper que envuelve páginas de talleres para habilitar:
 * - Detección proactiva de dificultades
 * - Intervenciones automáticas de LIA
 * - Integración con chat de LIA
 * 
 * Uso en una página de taller:
 * ```tsx
 * export default function WorkshopPage({ params }: { params: { id: string } }) {
 *   return (
 *     <WorkshopLearningProvider workshopId={params.id}>
 *       <TuContenidoDeTaller />
 *     </WorkshopLearningProvider>
 *   );
 * }
 * ```
 */

'use client';

import { useState, useCallback, ReactNode } from 'react';
import { useDifficultyDetection } from '../../hooks/useDifficultyDetection';
import { ProactiveLIAAssistant, type OrganizationColors } from '../ProactiveLIAAssistant';
import { sessionRecorder } from '../../lib/rrweb/session-recorder';
import type { DifficultyAnalysis } from '../../lib/rrweb/difficulty-pattern-detector';

export interface WorkshopLearningProviderProps {
  /** ID del taller actual */
  workshopId: string;

  /** ID de la actividad actual (opcional) */
  activityId?: string;

  /** Si está habilitada la detección proactiva (default: true) */
  enabled?: boolean;

  /** Intervalo de chequeo en ms (default: 30000 = 30s) */
  checkInterval?: number;

  /** Posición del asistente proactivo */
  assistantPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  /** Modo compacto del asistente */
  assistantCompact?: boolean;

  /** Callback cuando se detecta dificultad */
  onDifficultyDetected?: (analysis: DifficultyAnalysis) => void;

  /** Callback cuando usuario acepta ayuda */
  onHelpAccepted?: (analysis: DifficultyAnalysis) => void;

  /** Colores personalizados de la organización */
  colors?: OrganizationColors;

  /** Contenido hijo */
  children: ReactNode;
}

export function WorkshopLearningProvider({
  workshopId,
  activityId,
  enabled = true,
  checkInterval = 30000,
  assistantPosition = 'bottom-right',
  assistantCompact = false,
  onDifficultyDetected,
  onHelpAccepted,
  colors,
  children
}: WorkshopLearningProviderProps) {
  const [isLoadingHelp, setIsLoadingHelp] = useState(false);

  // Hook de detección de dificultades
  const {
    analysis,
    shouldShowHelp,
    acceptHelp,
    dismissHelp,
    reset,
    isActive
  } = useDifficultyDetection({
    workshopId,
    activityId,
    enabled,
    checkInterval,
    onDifficultyDetected: (detectedAnalysis) => {

      if (onDifficultyDetected) {
        onDifficultyDetected(detectedAnalysis);
      }
    }
    // NO pasar onHelpAccepted aquí - se maneja en handleAcceptHelp para evitar duplicados
  });

  // Manejar aceptación de ayuda
  const handleAcceptHelp = useCallback(async () => {
    if (!analysis) return;

    setIsLoadingHelp(true);

    try {
      // Notificar al componente padre que el usuario aceptó ayuda
      // El componente padre manejará el envío del mensaje a LIA con el contexto completo
      if (onHelpAccepted) {
        await onHelpAccepted(analysis);
      }

      // Aceptar ayuda localmente (cierra el modal y limpia el estado)
      acceptHelp();

    } catch (error) {
      console.error('❌ Error al procesar ayuda proactiva:', error);
      // Aún así aceptar la ayuda localmente para cerrar el modal
      acceptHelp();
    } finally {
      setIsLoadingHelp(false);
    }
  }, [analysis, onHelpAccepted, acceptHelp]);

  return (
    <>
      {/* Contenido del taller */}
      {children}

      {/* Asistente proactivo de LIA */}
      {enabled && (
        <ProactiveLIAAssistant
          analysis={analysis}
          show={shouldShowHelp}
          onAccept={handleAcceptHelp}
          onDismiss={dismissHelp}
          position={assistantPosition}
          compact={assistantCompact}
          colors={colors}
        />
      )}

      {/* Debug info - DESHABILITADO */}
      {/* {process.env.NODE_ENV === 'development' && isActive && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-2 rounded-lg font-mono z-50 max-w-xs">
          <div className="font-bold mb-1">🔍 Detector Activo</div>
          <div>Workshop: {workshopId}</div>
          {activityId && <div>Activity: {activityId}</div>}
          <div>Check interval: {checkInterval / 1000}s</div>
          {analysis && (
            <>
              <div className="mt-2 pt-2 border-t border-gray-600">
              <div className="font-bold">📊 Análisis:</div>
                <div>Score: {(analysis.overallScore * 100).toFixed(0)}%</div>
                <div>Patterns: {analysis.patterns.length}</div>
              </div>
            </>
          )}
        </div>
      )} */}
    </>
  );
}
