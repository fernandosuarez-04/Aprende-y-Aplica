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
  repetitiveCyclesThreshold: number; // times (default: 5)
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
  // ⚡ SISTEMA MÁGICO: Umbrales optimizados para detección temprana
  inactivityThreshold: 90000, // 1.5 minutos (reducido de 3 para detección más rápida)
  scrollRepeatThreshold: 6, // Reducido de 12 a 6 (más sensible)
  repetitiveCyclesThreshold: 5, // Reducido de 10 a 5 (detecta confusión más rápido)
  failedAttemptsThreshold: 2, // Reducido de 4 a 2 (detecta problemas al segundo intento)
  deleteKeysThreshold: 8, // Reducido de 15 a 8 (detecta correcciones frecuentes)
  erroneousClicksThreshold: 4, // Reducido de 7 a 4 (detecta clicks sin respuesta)
  analysisWindow: 120000 // 2 minutos (reducido de 3 para análisis más frecuente)
};

export class DifficultyPatternDetector {
  private thresholds: DetectionThresholds;
  private lastActivityTimestamp: number = Date.now();
  private scrollPositions: number[] = [];
  private clickTargets: string[] = [];
  private deleteKeyPresses: number = 0;
  private submitAttempts: number = 0;

  // 🆕 Nuevas propiedades para detección avanzada
  private sessionStartTime: number = Date.now();
  private lastInterventionTime: number = 0;
  private progressEvents: number = 0; // Cuenta eventos que indican progreso
  private falsePositiveCount: number = 0; // Cuenta falsos positivos para ajuste dinámico

  constructor(thresholds: Partial<DetectionThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * Analiza eventos recientes para detectar patrones de dificultad
   */
  public detect(events: eventWithTime[]): DifficultyAnalysis {
    const now = Date.now();
    const patterns: DifficultyPattern[] = [];

    // 🆕 FASE 1: Validación de Warm-Up (no intervenir en el primer minuto)
    // ⚡ REDUCIDO: 1 minuto para detección más rápida y "mágica"
    const sessionDuration = now - this.sessionStartTime;
    const warmUpPeriod = 1 * 60 * 1000; // 1 minuto (reducido de 3)

    if (sessionDuration < warmUpPeriod) {
      const remainingWarmUp = Math.ceil((warmUpPeriod - sessionDuration) / 1000);
      console.log(`🔥 [WARM-UP] Fase de calibración inicial. ${remainingWarmUp}s restantes para activar sistema de detección inteligente.`);
      return this.createAnalysis(0, [], false, '');
    }

    // Filtrar eventos dentro de la ventana de análisis
    const recentEvents = this.filterRecentEvents(events, this.thresholds.analysisWindow);

    console.log('🔍 [DEBUG] Analizando eventos:', {
      totalEvents: events.length,
      recentEvents: recentEvents.length,
      analysisWindow: this.thresholds.analysisWindow,
      sessionDuration: `${Math.floor(sessionDuration / 60000)}m ${Math.floor((sessionDuration % 60000) / 1000)}s`
    });

    if (recentEvents.length === 0) {
      return this.createAnalysis(0, [], false, '');
    }

    // 🆕 FASE 2: Detectar señales de progreso (usuario avanzando)
    const progressSignals = this.detectProgressSignals(recentEvents);
    this.progressEvents += progressSignals;

    console.log('📈 [PROGRESO] Señales de progreso:', {
      progressSignals,
      totalProgressEvents: this.progressEvents,
      progressRatio: (progressSignals / recentEvents.length).toFixed(3)
    });

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

    // 🆕 FASE 3: Calcular score con lógica multi-patrón mejorada
    const overallScore = this.calculateAdvancedScore(patterns, progressSignals, recentEvents.length);

    // 🆕 FASE 4: Validación inteligente de intervención
    const shouldIntervene = this.shouldInterveneSmart(overallScore, patterns, progressSignals, recentEvents.length);

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
   * Detecta ciclos repetitivos (usuario vuelve atrás repetidamente o cambia entre secciones)
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

    // NUEVO: Detectar cambios frecuentes entre tabs/secciones
    // En rrweb, los IDs son numéricos internos, no IDs del DOM
    // Estrategia: detectar clicks repetidos alternando entre un conjunto pequeño de IDs
    const clickEvents = events.filter(event => {
      if (event.type === 3) { // MouseInteraction
        const data = event.data as any;
        return data.source === 2; // Solo clicks
      }
      return false;
    });

    // Extraer secuencia de IDs clickeados
    const clickedIds = clickEvents.map(e => (e.data as any).id);
    
    console.log('🖱️ [DEBUG] Secuencia de clicks:', {
      total: clickedIds.length,
      ids: clickedIds,
      uniqueIds: [...new Set(clickedIds)].length
    });
    
    // Detectar patrón de ciclos: si hay muchos clicks alternando entre pocos IDs únicos
    // Ejemplo: [177, 184, 192, 177, 184, 192] = cambio entre tabs
    const uniqueIds = new Set(clickedIds);
    let tabClickEvents: eventWithTime[] = [];
    let alternations = 0;
    
    // Si hay 5+ clicks alternando entre 3-15 elementos únicos = probable navegación entre tabs
    // (aumentado a 15 para capturar interfaces con múltiples tabs y botones)
    if (clickedIds.length >= 5 && uniqueIds.size >= 3 && uniqueIds.size <= 15) {
      // Verificar que hay alternancia real (no clicks en el mismo elemento)
      for (let i = 1; i < clickedIds.length; i++) {
        if (clickedIds[i] !== clickedIds[i - 1]) {
          alternations++;
          tabClickEvents.push(clickEvents[i]);
        }
      }
      
      console.log('🔄 [DEBUG] Análisis de alternancia:', {
        clicksTotal: clickedIds.length,
        idsUnicos: uniqueIds.size,
        alternancias: alternations,
        ratio: (alternations / clickedIds.length).toFixed(2)
      });
    }

    // Si hay suficientes cambios de tab/sección en la ventana de análisis, es un ciclo repetitivo
    const totalNavigationEvents = backNavigationEvents.length + alternations;
    const repetitionThreshold = this.thresholds.repetitiveCyclesThreshold ?? 5;

    console.log('🔄 [DEBUG] Ciclos repetitivos:', {
      backNavigation: backNavigationEvents.length,
      tabChanges: alternations,
      total: totalNavigationEvents,
      threshold: repetitionThreshold
    });
    
    if (totalNavigationEvents >= repetitionThreshold) {
      return {
        type: 'repetitive_cycles',
        severity: alternations >= (repetitionThreshold + 2) ? 'high' : 'medium',
        description: `Usuario ha cambiado entre secciones ${totalNavigationEvents} veces`,
        timestamp: Date.now(),
        metadata: {
          navigationCount: totalNavigationEvents,
          backNavigationCount: backNavigationEvents.length,
          tabChanges: alternations
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
    // rrweb scroll events pueden ser:
    // - Type 3, source 0 (Scroll) - PERO en práctica son mutaciones
    // - Type 3, source 6 (ViewportResize) 
    // - Necesitamos buscar cambios en la posición del scroll de otra forma
    
    // CRÍTICO: Solo analizar si hay interacciones reales del usuario
    // Si no hay suficientes interacciones, el usuario está AFK y los eventos son solo ruido del DOM
    const interactionEvents = events.filter(event => {
      if (event.type !== 3) return false;
      const data = event.data as any;
      // Solo MouseMove, Click, o Input
      return data.source === 1 || data.source === 2 || data.source === 5;
    });
    
    // ⚡ ULTRA SENSIBLE: Solo 2 interacciones necesarias (de 10)
    // Detecta búsqueda activa inmediatamente
    if (interactionEvents.length < 2) {
      console.log('⚠️ [DEBUG] Pocas interacciones:', interactionEvents.length, '< 2. Usuario leyendo o explorando.');
      return null;
    }
    
    // Estrategia alternativa: contar eventos de mutación frecuentes como indicador de scroll
    const incrementalSnapshots = events.filter(event => event.type === 3);
    
    console.log('📜 [DEBUG] Análisis de scroll alternativo:', {
      totalIncrementalSnapshots: incrementalSnapshots.length,
      interaccionesReales: interactionEvents.length,
      primeros5Tipos: incrementalSnapshots.slice(0, 5).map(e => ({
        type: e.type,
        source: (e.data as any).source,
        timestamp: e.timestamp
      }))
    });
    
    // ⚡ ULTRA SENSIBLE: Solo 50 snapshots necesarios (de 150)
    // Detecta búsqueda activa inmediatamente
    if (incrementalSnapshots.length < 50) {
      console.log('⚠️ [DEBUG] Analizando actividad de scroll:', incrementalSnapshots.length, '< 50 eventos');
      return null;
    }
    
    // Estrategia simplificada: detectar períodos de actividad intensa
    // Dividir los eventos en ventanas de 1 segundo y contar cuántas ventanas tienen actividad
    const timeWindows = new Map<number, number>(); // segundo -> cantidad de eventos
    
    incrementalSnapshots.forEach(event => {
      const second = Math.floor(event.timestamp / 1000);
      timeWindows.set(second, (timeWindows.get(second) || 0) + 1);
    });
    
    // Filtrar ventanas con actividad significativa (50+ eventos por segundo = scroll activo)
    const activeWindows = Array.from(timeWindows.entries())
      .filter(([_, count]) => count >= 50)
      .map(([second, count]) => ({ second, count }))
      .sort((a, b) => a.second - b.second);
    
    // Detectar "cambios de dirección" = silencios entre períodos activos
    let directionChanges = 0;
    for (let i = 1; i < activeWindows.length; i++) {
      const gap = activeWindows[i].second - activeWindows[i - 1].second;
      // Si hay más de 2 segundos de silencio, considerarlo un cambio de dirección
      if (gap > 2) {
        directionChanges++;
      }
    }
    
    console.log('📜 [DEBUG] Ráfagas de scroll:', {
      ventanasActivas: activeWindows.length,
      cambiosDireccion: directionChanges,
      interaccionesReales: interactionEvents.length,
      threshold: this.thresholds.scrollRepeatThreshold,
      detectadoPorCambios: directionChanges >= this.thresholds.scrollRepeatThreshold,
      detectadoPorVolumen: activeWindows.length >= 25, // 🆕 AUMENTADO de 15 a 25
      primeras5Ventanas: activeWindows.slice(0, 5)
    });

    // ⚡ ULTRA SENSIBLE: Solo 3 interacciones necesarias (de 8)
    // Detecta búsqueda intencional inmediatamente
    if (interactionEvents.length < 3) {
      console.log('⚠️ [DEBUG] Scroll sin suficiente intención:', interactionEvents.length, '< 3 interacciones');
      return null;
    }

    // ⚡ ULTRA SENSIBLE: Detectar de dos formas (UMBRALES ULTRA REDUCIDOS)
    // 1. Cambios de dirección (scroll arriba-abajo-arriba)
    // 2. Volumen (4+ segundos de scroll continuo = usuario buscando)
    //    🔥 REDUCIDO de 12 a 4 para detección INMEDIATA
    const detectedByChanges = directionChanges >= this.thresholds.scrollRepeatThreshold;
    const detectedByVolume = activeWindows.length >= 4;

    if (detectedByChanges || detectedByVolume) {
      return {
        type: 'excessive_scroll',
        severity: 'medium',
        description: detectedByChanges 
          ? `Patrón de scroll repetitivo detectado (${directionChanges} cambios de dirección)`
          : `Scroll excesivo detectado (${activeWindows.length} segundos de actividad)`,
        timestamp: Date.now(),
        metadata: {
          scrollEventCount: incrementalSnapshots.length,
          directionChanges,
          activeWindows: activeWindows.length,
          detectionMethod: detectedByChanges ? 'direction_changes' : 'volume'
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
   * 🆕 Detecta señales de progreso (indica que el usuario está avanzando)
   */
  private detectProgressSignals(events: eventWithTime[]): number {
    let progressCount = 0;

    // Buscar patrones que indican progreso:
    // 1. Clicks en botones de "siguiente", "continuar", "enviar respuesta"
    // 2. Cambios de página/sección hacia adelante
    // 3. Completar inputs/formularios
    // 4. Navegación secuencial (no aleatoria)

    const clickEvents = events.filter(event => {
      if (event.type === 3 && (event.data as any).source === 2) {
        return true;
      }
      return false;
    });

    // Detectar clicks de progreso
    clickEvents.forEach(event => {
      const data = event.data as any;
      const targetId = data.id?.toString() || '';

      // Indicadores de progreso positivo
      if (
        targetId.includes('next') ||
        targetId.includes('siguiente') ||
        targetId.includes('continue') ||
        targetId.includes('continuar') ||
        targetId.includes('submit') ||
        targetId.includes('enviar') ||
        targetId.includes('completar') ||
        targetId.includes('finish') ||
        targetId.includes('check') ||
        targetId.includes('verificar')
      ) {
        progressCount++;
      }
    });

    // Detectar inputs completados (señal de engagement productivo)
    const inputEvents = events.filter(event =>
      event.type === 3 && (event.data as any).source === 5
    );

    // Si hay muchos eventos de input, es señal de engagement activo
    if (inputEvents.length >= 20) {
      progressCount += Math.floor(inputEvents.length / 20);
    }

    console.log('📈 [PROGRESO] Análisis:', {
      clicksDeProgreso: progressCount,
      eventosDeInput: inputEvents.length,
      clicksTotales: clickEvents.length
    });

    return progressCount;
  }

  /**
   * 🆕 Calcula score avanzado con consideración de progreso y contexto
   */
  private calculateAdvancedScore(
    patterns: DifficultyPattern[],
    progressSignals: number,
    totalEvents: number
  ): number {
    if (patterns.length === 0) return 0;

    // Calcular score base
    const baseScore = this.calculateOverallScore(patterns);

    // 🎯 AJUSTE 1: Penalizar score si hay señales de progreso
    // Si el usuario está progresando, reducir el score de dificultad
    const progressRatio = totalEvents > 0 ? progressSignals / totalEvents : 0;
    const progressPenalty = progressRatio * 0.4; // Hasta 40% de reducción

    // 🎯 AJUSTE 2: Requiere múltiples patrones para scores altos
    // Un solo patrón = score máximo 0.7
    // Dos patrones = score máximo 0.85
    // Tres+ patrones = sin límite
    let patternMultiplier = 1.0;
    if (patterns.length === 1) {
      patternMultiplier = 0.7; // Limitar a 70%
    } else if (patterns.length === 2) {
      patternMultiplier = 0.85; // Limitar a 85%
    }

    // 🎯 AJUSTE 3: Ponderar según severidad de patrones
    const hasHighSeverity = patterns.some(p => p.severity === 'high');
    const severityBoost = hasHighSeverity ? 1.1 : 1.0;

    // Calcular score final
    const adjustedScore = Math.max(0, Math.min(1,
      (baseScore * patternMultiplier * severityBoost) - progressPenalty
    ));

    console.log('🧮 [SCORING AVANZADO]:', {
      baseScore: baseScore.toFixed(3),
      progressPenalty: progressPenalty.toFixed(3),
      patternMultiplier: patternMultiplier.toFixed(3),
      severityBoost: severityBoost.toFixed(3),
      finalScore: adjustedScore.toFixed(3),
      patterns: patterns.length,
      progressSignals
    });

    return adjustedScore;
  }

  /**
   * 🆕 Validación inteligente para decidir si se debe intervenir
   * ⚡ SISTEMA MÁGICO: Más permisivo pero con inteligencia contextual
   */
  private shouldInterveneSmart(
    score: number,
    patterns: DifficultyPattern[],
    progressSignals: number,
    totalEvents: number
  ): boolean {
    // ⚡ REGLA 1: Score mínimo REDUCIDO (0.5 en lugar de 0.75)
    // Más sensible para detectar dificultades tempranas
    if (score < 0.5) {
      console.log('❌ [DETECCIÓN] Score bajo:', score.toFixed(3), '< 0.5 - Usuario navegando normalmente');
      return false;
    }

    // ⚡ REGLA 2: MÁS PERMISIVO - Solo requiere 1 patrón si tiene severidad medium o high
    const hasHighSeverity = patterns.some(p => p.severity === 'high');
    const hasMediumSeverity = patterns.some(p => p.severity === 'medium');

    if (patterns.length === 0) {
      console.log('❌ [DETECCIÓN] Sin patrones detectados');
      return false;
    }

    // Permitir 1 patrón si es medium o high
    if (patterns.length === 1 && !hasMediumSeverity && !hasHighSeverity) {
      console.log('❌ [DETECCIÓN] Solo 1 patrón low severity:', patterns[0].type);
      return false;
    }

    // ⚡ REGLA 3: Más permisivo con progreso (25% en lugar de 15%)
    const progressRatio = totalEvents > 0 ? progressSignals / totalEvents : 0;
    if (progressRatio > 0.25) {
      console.log('❌ [DETECCIÓN] Usuario avanzando activamente:', (progressRatio * 100).toFixed(1), '%');
      return false;
    }

    // ⚡ REGLA 4: Menos eventos requeridos (15 en lugar de 30)
    if (totalEvents < 15) {
      console.log('❌ [DETECCIÓN] Analizando comportamiento inicial:', totalEvents, '< 15 eventos');
      return false;
    }

    // ⚡ REGLA 5: ELIMINADA - Permitir patrones de bajo impacto si tienen score suficiente
    // El sistema es más inteligente y confía en el score combinado

    // ✅ SISTEMA INTELIGENTE ACTIVADO
    console.log('✅ 🎯 [INTERVENCIÓN INTELIGENTE ACTIVADA]:', {
      score: score.toFixed(3),
      confidence: score >= 0.7 ? '🔥 ALTA' : score >= 0.6 ? '⚡ MEDIA' : '💡 BAJA',
      patterns: patterns.length,
      progressRatio: (progressRatio * 100).toFixed(1) + '%',
      totalEvents,
      patternTypes: patterns.map(p => `${p.type}:${p.severity}`).join(', '),
      recommendation: score >= 0.7 ? 'Ayuda inmediata' : 'Sugerencia suave'
    });

    return true;
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
    // 🆕 Reset nuevas propiedades
    this.sessionStartTime = Date.now();
    this.lastInterventionTime = 0;
    this.progressEvents = 0;
    this.falsePositiveCount = 0;
  }
}

export const difficultyDetector = new DifficultyPatternDetector();
