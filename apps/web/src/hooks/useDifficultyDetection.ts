/**
 * 🔍 useDifficultyDetection Hook
 * 
 * Hook de React que monitorea continuamente la sesión rrweb del usuario
 * para detectar patrones de dificultad y disparar intervenciones proactivas de LIA.
 * 
 * Uso:
 * ```tsx
 * const { analysis, shouldShowHelp, dismissHelp } = useDifficultyDetection({
 *   workshopId: 'workshop-123',
 *   enabled: true,
 *   checkInterval: 30000, // 30 segundos
 *   onDifficultyDetected: (analysis) => {
 *     console.log('Dificultad detectada:', analysis);
 *   }
 * });
 * ```
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { sessionRecorder } from '../lib/rrweb/session-recorder';
import { 
  DifficultyPatternDetector,
  type DifficultyAnalysis,
  type DetectionThresholds 
} from '../lib/rrweb/difficulty-pattern-detector';

export interface UseDifficultyDetectionOptions {
  /** ID del taller actual (opcional, para contexto) */
  workshopId?: string;
  
  /** ID de la actividad actual (opcional, para contexto) */
  activityId?: string;
  
  /** Si está habilitada la detección (default: true) */
  enabled?: boolean;
  
  /** Intervalo de chequeo en ms (default: 30000 = 30s) */
  checkInterval?: number;
  
  /** Umbrales personalizados de detección */
  thresholds?: Partial<DetectionThresholds>;
  
  /** Callback cuando se detecta dificultad */
  onDifficultyDetected?: (analysis: DifficultyAnalysis) => void;
  
  /** Callback cuando usuario acepta ayuda */
  onHelpAccepted?: (analysis: DifficultyAnalysis) => void;
  
  /** Callback cuando usuario rechaza ayuda */
  onHelpDismissed?: (analysis: DifficultyAnalysis) => void;
}

export interface UseDifficultyDetectionReturn {
  /** Análisis actual de dificultad (null si no hay problemas) */
  analysis: DifficultyAnalysis | null;
  
  /** Si se debe mostrar el diálogo de ayuda proactiva */
  shouldShowHelp: boolean;
  
  /** Función para aceptar la ayuda ofrecida */
  acceptHelp: () => void;
  
  /** Función para rechazar/dismissar la ayuda */
  dismissHelp: () => void;
  
  /** Función para resetear el detector */
  reset: () => void;
  
  /** Si el detector está activo */
  isActive: boolean;
}

export function useDifficultyDetection(
  options: UseDifficultyDetectionOptions = {}
): UseDifficultyDetectionReturn {
  const {
    workshopId,
    activityId,
    enabled = true,
    checkInterval = 30000, // 30 segundos
    thresholds,
    onDifficultyDetected,
    onHelpAccepted,
    onHelpDismissed
  } = options;

  const [analysis, setAnalysis] = useState<DifficultyAnalysis | null>(null);
  const [shouldShowHelp, setShouldShowHelp] = useState(false);
  const [isActive, setIsActive] = useState(false);
  
  const detectorRef = useRef<DifficultyPatternDetector | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastInterventionTimeRef = useRef<number>(0);

  // Inicializar detector
  useEffect(() => {
    if (enabled) {
      detectorRef.current = new DifficultyPatternDetector(thresholds);
      setIsActive(true);
      console.log('🔍 Detector de dificultad inicializado', {
        workshopId,
        activityId,
        checkInterval,
        thresholds
      });
    } else {
      setIsActive(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, thresholds, workshopId, activityId, checkInterval]);

  // Función de análisis
  const analyzeSession = useCallback(() => {
    if (!enabled || !detectorRef.current) return;

    try {
      // Capturar snapshot de la sesión actual
      const snapshot = sessionRecorder.captureSnapshot();
      
      if (!snapshot || snapshot.events.length === 0) {
        console.log('⚠️ No hay eventos para analizar');
        return;
      }

      // Analizar patrones de dificultad
      const currentAnalysis = detectorRef.current.detect(snapshot.events);
      
      console.log('📊 Análisis de dificultad:', {
        score: currentAnalysis.overallScore.toFixed(2),
        patterns: currentAnalysis.patterns.length,
        shouldIntervene: currentAnalysis.shouldIntervene,
        totalEvents: snapshot.events.length,
        patternDetails: currentAnalysis.patterns.map(p => ({
          type: p.type,
          severity: p.severity,
          description: p.description,
          metadata: p.metadata
        }))
      });

      // Si se debe intervenir y han pasado al menos 2 minutos desde última intervención (reducido para testing)
      const timeSinceLastIntervention = Date.now() - lastInterventionTimeRef.current;
      const minTimeBetweenInterventions = 2 * 60 * 1000; // 2 minutos (reducido de 5 para testing)

      if (currentAnalysis.shouldIntervene && timeSinceLastIntervention > minTimeBetweenInterventions) {
        console.log('🚨 Dificultad detectada! Ofreciendo ayuda proactiva', {
          score: currentAnalysis.overallScore,
          patterns: currentAnalysis.patterns,
          timeSinceLastIntervention: `${Math.floor(timeSinceLastIntervention / 1000)}s`
        });
        setAnalysis(currentAnalysis);
        setShouldShowHelp(true);
        lastInterventionTimeRef.current = Date.now();
        
        // Llamar callback si existe
        if (onDifficultyDetected) {
          onDifficultyDetected(currentAnalysis);
        }
      } else if (currentAnalysis.shouldIntervene) {
        console.log('⏳ Dificultad detectada pero esperando cooldown de intervención', {
          score: currentAnalysis.overallScore,
          patternsCount: currentAnalysis.patterns.length,
          timeSinceLastIntervention: `${Math.floor(timeSinceLastIntervention / 1000)}s`,
          cooldownRemaining: `${Math.floor((minTimeBetweenInterventions - timeSinceLastIntervention) / 1000)}s`
        });
      } else {
        console.log('✅ Sesión normal - sin patrones de dificultad significativos', {
          score: currentAnalysis.overallScore,
          patternsCount: currentAnalysis.patterns.length,
          threshold: 0.5
        });
      }
    } catch (error) {
      console.error('❌ Error al analizar sesión:', error);
    }
  }, [enabled, onDifficultyDetected]);

  // Iniciar análisis periódico
  useEffect(() => {
    if (!enabled) return;

    // Análisis inicial después de 30 segundos
    const initialTimeout = setTimeout(() => {
      analyzeSession();
    }, checkInterval);

    // Análisis periódico
    intervalRef.current = setInterval(() => {
      analyzeSession();
    }, checkInterval);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, checkInterval, analyzeSession]);

  // Función para aceptar ayuda
  const acceptHelp = useCallback(() => {
    console.log('✅ Usuario aceptó ayuda proactiva');
    setShouldShowHelp(false);
    
    if (analysis && onHelpAccepted) {
      onHelpAccepted(analysis);
    }
  }, [analysis, onHelpAccepted]);

  // Función para rechazar ayuda
  const dismissHelp = useCallback(() => {
    console.log('❌ Usuario rechazó ayuda proactiva');
    setShouldShowHelp(false);
    setAnalysis(null);
    
    if (analysis && onHelpDismissed) {
      onHelpDismissed(analysis);
    }
  }, [analysis, onHelpDismissed]);

  // Función para resetear detector
  const reset = useCallback(() => {
    console.log('🔄 Reseteando detector de dificultad');
    if (detectorRef.current) {
      detectorRef.current.reset();
    }
    setAnalysis(null);
    setShouldShowHelp(false);
    lastInterventionTimeRef.current = 0;
  }, []);

  return {
    analysis,
    shouldShowHelp,
    acceptHelp,
    dismissHelp,
    reset,
    isActive
  };
}
