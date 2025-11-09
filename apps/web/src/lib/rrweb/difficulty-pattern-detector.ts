/**
 * 🔍 Difficulty Pattern Detector
 * 
 * Analiza eventos de sesión rrweb en tiempo real para detectar patrones
 * que indican que el usuario está teniendo dificultades.
 * 
 * Patrones detectados:
 * - ⏱️ Inactividad prolongada
 * - 🔄 Ciclos repetitivos (volver atrás)
 * - ❌ Intentos fallidos consecutivos
 * - 📜 Scroll excesivo
 * - ⌨️ Borrado frecuente
 * - 🖱️ Clicks erróneos
 */

import type { eventWithTime } from '@rrweb/types';

export interface DifficultyPattern {
  type: 'inactivity' | 'repetitive_cycles' | 'failed_attempts' | 'excessive_scroll' | 'frequent_deletion' | 'erroneous_clicks';
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface DetectionThresholds {
  inactivityThreshold: number; // ms (default: 120000 = 2 min)
  scrollRepeatThreshold: number; // times (default: 4)
  failedAttemptsThreshold: number; // times (default: 3)
  deleteKeysThreshold: number; // times (default: 10)
  erroneousClicksThreshold: number; // times (default: 5)
  analysisWindow: number; // ms (default: 180000 = 3 min)
}

export interface DifficultyAnalysis {
  overallScore: number; // 0-1
  patterns: DifficultyPattern[];
  shouldIntervene: boolean;
  interventionMessage: string;
  detectedAt: number;
}

const DEFAULT_THRESHOLDS: DetectionThresholds = {
  inactivityThreshold: 120000, // 2 minutos
  scrollRepeatThreshold: 4,
  failedAttemptsThreshold: 3,
  deleteKeysThreshold: 10,
  erroneousClicksThreshold: 5,
  analysisWindow: 180000 // 3 minutos
};

export class DifficultyPatternDetector {
  private thresholds: DetectionThresholds;
  private lastActivityTimestamp: number = Date.now();
  private scrollPositions: number[] = [];
  private clickTargets: string[] = [];
  private deleteKeyPresses: number = 0;
  private submitAttempts: number = 0;

  constructor(thresholds: Partial<DetectionThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * Analiza eventos recientes para detectar patrones de dificultad
   */
  public detect(events: eventWithTime[]): DifficultyAnalysis {
    const now = Date.now();
    const patterns: DifficultyPattern[] = [];
    
    // Filtrar eventos dentro de la ventana de análisis
    const recentEvents = this.filterRecentEvents(events, this.thresholds.analysisWindow);
    
    if (recentEvents.length === 0) {
      return this.createAnalysis(0, [], false, '');
    }

    // Detectar diferentes patrones
    const inactivityPattern = this.detectInactivity(recentEvents);
    if (inactivityPattern) patterns.push(inactivityPattern);

    const repetitiveCyclesPattern = this.detectRepetitiveCycles(recentEvents);
    if (repetitiveCyclesPattern) patterns.push(repetitiveCyclesPattern);

    const failedAttemptsPattern = this.detectFailedAttempts(recentEvents);
    if (failedAttemptsPattern) patterns.push(failedAttemptsPattern);

    const excessiveScrollPattern = this.detectExcessiveScroll(recentEvents);
    if (excessiveScrollPattern) patterns.push(excessiveScrollPattern);

    const frequentDeletionPattern = this.detectFrequentDeletion(recentEvents);
    if (frequentDeletionPattern) patterns.push(frequentDeletionPattern);

    const erroneousClicksPattern = this.detectErroneousClicks(recentEvents);
    if (erroneousClicksPattern) patterns.push(erroneousClicksPattern);

    // Calcular score general de dificultad
    const overallScore = this.calculateOverallScore(patterns);
    
    // Determinar si se debe intervenir
    const shouldIntervene = overallScore >= 0.6;
    
    // Generar mensaje de intervención
    const interventionMessage = shouldIntervene 
      ? this.generateInterventionMessage(patterns)
      : '';

    return this.createAnalysis(overallScore, patterns, shouldIntervene, interventionMessage);
  }

  /**
   * Filtra eventos dentro de la ventana de tiempo especificada
   */
  private filterRecentEvents(events: eventWithTime[], windowMs: number): eventWithTime[] {
    const now = Date.now();
    return events.filter(event => (now - event.timestamp) <= windowMs);
  }

  /**
   * Detecta inactividad prolongada
   * Solo considera eventos de INTERACCIÓN real del usuario (clicks, input, scroll)
   */
  private detectInactivity(events: eventWithTime[]): DifficultyPattern | null {
    if (events.length === 0) return null;

    // Filtrar solo eventos de interacción REAL del usuario
    const interactionEvents = events.filter(e => {
      // IncrementalSnapshot (type=3) con source específicos
      if (e.type === 3 && e.data && typeof e.data === 'object' && 'source' in e.data) {
        const source = (e.data as any).source;
        // source: 2=MouseInteraction (clicks), 3=Scroll, 5=Input
        return [2, 3, 5].includes(source);
      }
      return false;
    });

    const now = Date.now();
    
    // 🐛 DEBUG: Ver cuántas interacciones reales hay
    console.log('🐛 [DEBUG] Interacciones reales:', {
      total: interactionEvents.length,
      ultimaInteraccion: interactionEvents.length > 0 
        ? `hace ${Math.floor((now - interactionEvents[interactionEvents.length - 1].timestamp) / 1000)}s`
        : 'ninguna',
      tiposDeEvento: interactionEvents.slice(-3).map(e => ({
        source: (e.data as any)?.source,
        timestamp: new Date(e.timestamp).toLocaleTimeString()
      }))
    });

    if (interactionEvents.length === 0) {
      // Si no hay eventos de interacción en toda la ventana (3 min), usuario está MUY inactivo
      const oldestEventTime = events[0].timestamp;
      const timeSinceOldest = now - oldestEventTime;
      
      if (timeSinceOldest > this.thresholds.inactivityThreshold) {
        const minutes = Math.floor(timeSinceOldest / 60000);
        const seconds = Math.floor((timeSinceOldest % 60000) / 1000);
        console.log('⚠️ INACTIVIDAD DETECTADA: Sin interacciones por', minutes, 'min', seconds, 's');
        return {
          type: 'inactivity',
          severity: timeSinceOldest > 180000 ? 'high' : 'medium',
          description: `Usuario inactivo por ${minutes} minuto${minutes !== 1 ? 's' : ''} y ${seconds} segundo${seconds !== 1 ? 's' : ''}`,
          timestamp: now,
          metadata: {
            inactivityDuration: timeSinceOldest,
            totalEvents: events.length,
            interactionEvents: 0,
            reason: 'no_interactions_in_window'
          }
        };
      }
      return null;
    }

    // Hay interacciones, verificar cuándo fue la última
    const lastInteraction = interactionEvents[interactionEvents.length - 1];
    const timeSinceLastActivity = now - lastInteraction.timestamp;

    if (timeSinceLastActivity > this.thresholds.inactivityThreshold) {
      const minutes = Math.floor(timeSinceLastActivity / 60000);
      const seconds = Math.floor((timeSinceLastActivity % 60000) / 1000);
      console.log('⚠️ INACTIVIDAD DETECTADA: Última interacción hace', minutes, 'min', seconds, 's');
      return {
        type: 'inactivity',
        severity: timeSinceLastActivity > 180000 ? 'high' : 'medium',
        description: `Usuario inactivo por ${minutes} minuto${minutes !== 1 ? 's' : ''} y ${seconds} segundo${seconds !== 1 ? 's' : ''}`,
        timestamp: now,
        metadata: {
          inactivityDuration: timeSinceLastActivity,
          lastInteractionType: (lastInteraction.data as any)?.source,
          lastInteractionTime: new Date(lastInteraction.timestamp).toLocaleTimeString(),
          totalEvents: events.length,
          interactionEvents: interactionEvents.length,
          reason: 'long_time_since_last_interaction'
        }
      };
    }

    return null;
  }

  /**
   * Detecta ciclos repetitivos (usuario vuelve atrás repetidamente)
   */
  private detectRepetitiveCycles(events: eventWithTime[]): DifficultyPattern | null {
    // Contar eventos de navegación hacia atrás o clicks en "anterior"
    const backNavigationEvents = events.filter(event => {
      if (event.type === 3) { // MouseInteraction
        const data = event.data as any;
        // Detectar clicks en botones de navegación
        if (data.source === 2) { // Click
          const target = data.id?.toString() || '';
          return target.includes('back') || target.includes('prev') || target.includes('anterior');
        }
      }
      return false;
    });

    if (backNavigationEvents.length >= 3) {
      return {
        type: 'repetitive_cycles',
        severity: 'medium',
        description: `Usuario ha vuelto atrás ${backNavigationEvents.length} veces`,
        timestamp: Date.now(),
        metadata: {
          backNavigationCount: backNavigationEvents.length
        }
      };
    }

    return null;
  }

  /**
   * Detecta intentos fallidos consecutivos
   */
  private detectFailedAttempts(events: eventWithTime[]): DifficultyPattern | null {
    // Contar eventos de submit/enviar
    const submitEvents = events.filter(event => {
      if (event.type === 3) { // MouseInteraction
        const data = event.data as any;
        if (data.source === 2) { // Click
          const target = data.id?.toString() || '';
          return target.includes('submit') || target.includes('enviar') || target.includes('verify');
        }
      }
      return false;
    });

    // Si hay múltiples submits en poco tiempo, probablemente están fallando
    if (submitEvents.length >= this.thresholds.failedAttemptsThreshold) {
      // Verificar que no hay navegación exitosa después (eso indicaría éxito)
      const lastSubmit = submitEvents[submitEvents.length - 1];
      const eventsAfterLastSubmit = events.filter(e => e.timestamp > lastSubmit.timestamp);
      
      // Si hay pocos eventos después del último submit, probablemente sigue intentando
      if (eventsAfterLastSubmit.length < 10) {
        return {
          type: 'failed_attempts',
          severity: 'high',
          description: `${submitEvents.length} intentos fallidos detectados`,
          timestamp: Date.now(),
          metadata: {
            attemptCount: submitEvents.length
          }
        };
      }
    }

    return null;
  }

  /**
   * Detecta scroll excesivo (usuario busca información repetidamente)
   */
  private detectExcessiveScroll(events: eventWithTime[]): DifficultyPattern | null {
    const scrollEvents = events.filter(event => event.type === 3 && (event.data as any).source === 0);
    
    if (scrollEvents.length < 10) return null;

    // Detectar patrones de scroll repetitivo (arriba-abajo-arriba)
    let scrollPatternCount = 0;
    let lastScrollY = 0;
    let scrollDirection = 0; // 1 = down, -1 = up
    let directionChanges = 0;

    scrollEvents.forEach(event => {
      const data = event.data as any;
      const currentY = data.y || 0;
      
      if (currentY > lastScrollY) {
        if (scrollDirection === -1) directionChanges++;
        scrollDirection = 1;
      } else if (currentY < lastScrollY) {
        if (scrollDirection === 1) directionChanges++;
        scrollDirection = -1;
      }
      
      lastScrollY = currentY;
    });

    if (directionChanges >= this.thresholds.scrollRepeatThreshold) {
      return {
        type: 'excessive_scroll',
        severity: 'medium',
        description: `Patrón de scroll repetitivo detectado (${directionChanges} cambios de dirección)`,
        timestamp: Date.now(),
        metadata: {
          scrollEventCount: scrollEvents.length,
          directionChanges
        }
      };
    }

    return null;
  }

  /**
   * Detecta borrado frecuente (usuario escribe y borra muchas veces)
   */
  private detectFrequentDeletion(events: eventWithTime[]): DifficultyPattern | null {
    // Contar eventos de teclado (backspace/delete)
    const keyboardEvents = events.filter(event => event.type === 3 && (event.data as any).source === 5);
    
    let deleteCount = 0;
    
    keyboardEvents.forEach(event => {
      const data = event.data as any;
      if (data.key === 'Backspace' || data.key === 'Delete') {
        deleteCount++;
      }
    });

    if (deleteCount >= this.thresholds.deleteKeysThreshold) {
      return {
        type: 'frequent_deletion',
        severity: 'medium',
        description: `Usuario ha borrado contenido ${deleteCount} veces`,
        timestamp: Date.now(),
        metadata: {
          deleteCount
        }
      };
    }

    return null;
  }

  /**
   * Detecta clicks erróneos (clicks en elementos que no responden)
   */
  private detectErroneousClicks(events: eventWithTime[]): DifficultyPattern | null {
    const clickEvents = events.filter(event => 
      event.type === 3 && (event.data as any).source === 2
    );

    if (clickEvents.length < 5) return null;

    // Detectar clicks en el mismo lugar repetidamente (probablemente elemento no responde)
    const clickPositions = clickEvents.map(event => {
      const data = event.data as any;
      return `${data.x || 0},${data.y || 0}`;
    });

    const repeatedClicks = clickPositions.filter((pos, idx) => 
      clickPositions.indexOf(pos) !== idx
    );

    if (repeatedClicks.length >= this.thresholds.erroneousClicksThreshold) {
      return {
        type: 'erroneous_clicks',
        severity: 'low',
        description: `${repeatedClicks.length} clicks repetidos en misma posición`,
        timestamp: Date.now(),
        metadata: {
          repeatedClickCount: repeatedClicks.length
        }
      };
    }

    return null;
  }

  /**
   * Calcula score general de dificultad (0-1)
   */
  private calculateOverallScore(patterns: DifficultyPattern[]): number {
    if (patterns.length === 0) return 0;

    const severityWeights = {
      low: 0.3,
      medium: 0.6,
      high: 1.0
    };

    const totalWeight = patterns.reduce((sum, pattern) => {
      return sum + severityWeights[pattern.severity];
    }, 0);

    // Normalizar entre 0 y 1
    const maxPossibleWeight = patterns.length * 1.0; // Todos high
    return Math.min(totalWeight / maxPossibleWeight, 1);
  }

  /**
   * Genera mensaje de intervención contextual
   */
  private generateInterventionMessage(patterns: DifficultyPattern[]): string {
    if (patterns.length === 0) return '';

    // Priorizar el patrón más severo
    const sortedPatterns = [...patterns].sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    const primaryPattern = sortedPatterns[0];

    const messages: Record<DifficultyPattern['type'], string> = {
      inactivity: '¡Hola! Noto que llevas un rato sin actividad. ¿Te gustaría que te dé algunas pistas sobre esta actividad?',
      repetitive_cycles: 'Veo que has vuelto atrás varias veces. ¿Te gustaría que revisemos juntos esta sección?',
      failed_attempts: 'He notado varios intentos. ¿Quieres que analice qué podría estar faltando en tu respuesta?',
      excessive_scroll: 'Parece que estás buscando información específica. ¿Puedo ayudarte a encontrar lo que necesitas?',
      frequent_deletion: 'Veo que estás ajustando tu respuesta varias veces. ¿Te gustaría revisar un ejemplo similar?',
      erroneous_clicks: 'Noto algunos clicks que no parecen estar funcionando. ¿Necesitas ayuda con la interfaz?'
    };

    return messages[primaryPattern.type];
  }

  /**
   * Crea objeto de análisis
   */
  private createAnalysis(
    score: number,
    patterns: DifficultyPattern[],
    shouldIntervene: boolean,
    message: string
  ): DifficultyAnalysis {
    return {
      overallScore: score,
      patterns,
      shouldIntervene,
      interventionMessage: message,
      detectedAt: Date.now()
    };
  }

  /**
   * Reset internal state (útil para testing)
   */
  public reset(): void {
    this.lastActivityTimestamp = Date.now();
    this.scrollPositions = [];
    this.clickTargets = [];
    this.deleteKeyPresses = 0;
    this.submitAttempts = 0;
  }
}

export const difficultyDetector = new DifficultyPatternDetector();
