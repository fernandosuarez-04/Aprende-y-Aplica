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
import { ProactiveLIAAssistant } from '../ProactiveLIAAssistant';
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
      console.log('🚨 Dificultad detectada por WorkshopLearningProvider:', {
        workshopId,
        activityId,
        score: detectedAnalysis.overallScore,
        patterns: detectedAnalysis.patterns.length
      });
      
      if (onDifficultyDetected) {
        onDifficultyDetected(detectedAnalysis);
      }
    },
    onHelpAccepted: (acceptedAnalysis) => {
      console.log('✅ Usuario aceptó ayuda en WorkshopLearningProvider');
      
      if (onHelpAccepted) {
        onHelpAccepted(acceptedAnalysis);
      }
    }
  });

  // Manejar aceptación de ayuda
  const handleAcceptHelp = useCallback(async () => {
    if (!analysis) return;

    console.log('📞 Solicitando ayuda proactiva a LIA...');
    setIsLoadingHelp(true);

    try {
      // Capturar snapshot de sesión
      const snapshot = sessionRecorder.captureSnapshot();
      
      // Llamar a API de ayuda proactiva
      const response = await fetch('/api/lia/proactive-help', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          analysis,
          sessionEvents: snapshot?.events.slice(-200) || [], // Últimos 200 eventos
          workshopId,
          activityId
        })
      });

      if (!response.ok) {
        throw new Error('Error al solicitar ayuda proactiva');
      }

      const data = await response.json();
      
      console.log('✅ Respuesta de LIA recibida:', {
        responseLength: data.response?.length,
        suggestions: data.suggestions?.length,
        resources: data.resources?.length
      });

      // TODO: Aquí podrías abrir el chat de LIA automáticamente con la respuesta
      // o mostrar la respuesta en un modal/drawer
      
      // Por ahora, simplemente loggeamos la respuesta
      console.log('💬 Respuesta de LIA:', data.response);
      
      if (data.suggestions) {
        console.log('💡 Sugerencias:', data.suggestions);
      }

      // Llamar al handler del padre
      acceptHelp();

    } catch (error) {
      console.error('❌ Error al solicitar ayuda proactiva:', error);
      
      // Aún así aceptar la ayuda localmente
      acceptHelp();
    } finally {
      setIsLoadingHelp(false);
    }
  }, [analysis, workshopId, activityId, acceptHelp]);

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
        />
      )}

      {/* Debug info (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && isActive && (
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
      )}
    </>
  );
}
