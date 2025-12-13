/**
 * Session Analyzer para rrweb
 * Analiza eventos de sesión y extrae información contextual útil para LIA
 */

import type { eventWithTime } from '@rrweb/types';

export interface SessionContext {
  // Información de la actividad actual
  currentPage: string;
  timeOnPage: number; // milisegundos
  
  // Patrones de interacción
  clickCount: number;
  scrollEvents: number;
  inputEvents: number;
  navigationEvents: number;
  
  // Indicadores de dificultad
  strugglingIndicators: string[];
  difficultyScore: number; // 0-1
  
  // Comportamiento específico
  attemptsMade: number;
  backtrackCount: number; // veces que volvió atrás
  resourcesViewed: string[];
  
  // Tiempo
  sessionDuration: number;
  inactivityPeriods: number[];
  
  // Contenido de inputs (si disponible)
  lastInputValues: Record<string, string>;
}

export class SessionAnalyzer {
  /**
   * Analiza eventos de una sesión y extrae contexto útil
   */
  analyzeSession(events: eventWithTime[], timeWindowMs: number = 120000): SessionContext {
    const now = Date.now();
    const cutoffTime = now - timeWindowMs;
    
    // Filtrar eventos del window de tiempo
    const recentEvents = events.filter(e => e.timestamp >= cutoffTime);
    
    if (recentEvents.length === 0) {
      return this.getEmptyContext();
    }

    const context: SessionContext = {
      currentPage: this.extractCurrentPage(recentEvents),
      timeOnPage: this.calculateTimeOnPage(recentEvents),
      clickCount: this.countEventType(recentEvents, 'click'),
      scrollEvents: this.countEventType(recentEvents, 'scroll'),
      inputEvents: this.countEventType(recentEvents, 'input'),
      navigationEvents: this.countEventType(recentEvents, 'navigation'),
      strugglingIndicators: this.detectStrugglingIndicators(recentEvents),
      difficultyScore: 0,
      attemptsMade: this.countAttempts(recentEvents),
      backtrackCount: this.countBacktracks(recentEvents),
      resourcesViewed: this.extractResourcesViewed(recentEvents),
      sessionDuration: this.calculateDuration(recentEvents),
      inactivityPeriods: this.detectInactivityPeriods(recentEvents),
      lastInputValues: this.extractInputValues(recentEvents),
    };

    // Calcular score de dificultad
    context.difficultyScore = this.calculateDifficultyScore(context);

    return context;
  }

  /**
   * Genera un resumen textual del contexto para LIA
   */
  generateContextSummary(context: SessionContext): string {
    const parts: string[] = [];

    // Página actual
    parts.push(`📍 Ubicación: ${context.currentPage || 'Página principal'}`);
    
    // Tiempo en página
    const minutes = Math.floor(context.timeOnPage / 60000);
    const seconds = Math.floor((context.timeOnPage % 60000) / 1000);
    parts.push(`⏱️ Tiempo en esta página: ${minutes}m ${seconds}s`);

    // Actividad
    if (context.clickCount > 0) {
      parts.push(`🖱️ Clicks realizados: ${context.clickCount}`);
    }
    if (context.inputEvents > 0) {
      parts.push(`⌨️ Interacciones con campos: ${context.inputEvents}`);
    }

    // Intentos
    if (context.attemptsMade > 0) {
      parts.push(`🔄 Intentos realizados: ${context.attemptsMade}`);
    }

    // Recursos consultados
    if (context.resourcesViewed.length > 0) {
      parts.push(`📚 Recursos consultados: ${context.resourcesViewed.join(', ')}`);
    } else {
      parts.push(`⚠️ No ha consultado recursos adicionales`);
    }

    // Navegación
    if (context.backtrackCount > 0) {
      parts.push(`🔙 Volvió atrás ${context.backtrackCount} veces`);
    }

    // Indicadores de dificultad
    if (context.strugglingIndicators.length > 0) {
      parts.push(`\n⚠️ Indicadores de dificultad detectados:`);
      context.strugglingIndicators.forEach(indicator => {
        parts.push(`   • ${indicator}`);
      });
    }

    // Inputs capturados
    if (Object.keys(context.lastInputValues).length > 0) {
      parts.push(`\n📝 Últimos valores ingresados:`);
      Object.entries(context.lastInputValues).forEach(([field, value]) => {
        const truncated = value.length > 50 ? value.substring(0, 50) + '...' : value;
        parts.push(`   • ${field}: "${truncated}"`);
      });
    }

    // Score de dificultad
    const difficultyLevel = 
      context.difficultyScore > 0.7 ? '🔴 Alta' :
      context.difficultyScore > 0.4 ? '🟡 Media' :
      '🟢 Baja';
    parts.push(`\n📊 Dificultad estimada: ${difficultyLevel} (${Math.round(context.difficultyScore * 100)}%)`);

    return parts.join('\n');
  }

  // ========== MÉTODOS PRIVADOS DE ANÁLISIS ==========

  private getEmptyContext(): SessionContext {
    return {
      currentPage: '',
      timeOnPage: 0,
      clickCount: 0,
      scrollEvents: 0,
      inputEvents: 0,
      navigationEvents: 0,
      strugglingIndicators: [],
      difficultyScore: 0,
      attemptsMade: 0,
      backtrackCount: 0,
      resourcesViewed: [],
      sessionDuration: 0,
      inactivityPeriods: [],
      lastInputValues: {},
    };
  }

  private extractCurrentPage(events: eventWithTime[]): string {
    // Buscar el último evento de navegación
    const navEvents = events.filter(e => this.isNavigationEvent(e));
    if (navEvents.length > 0) {
      const lastNav = navEvents[navEvents.length - 1];
      return this.extractPageFromEvent(lastNav);
    }
    return 'Página actual';
  }

  private calculateTimeOnPage(events: eventWithTime[]): number {
    if (events.length < 2) return 0;
    const first = events[0].timestamp;
    const last = events[events.length - 1].timestamp;
    return last - first;
  }

  private countEventType(events: eventWithTime[], type: string): number {
    return events.filter(e => this.matchesEventType(e, type)).length;
  }

  private matchesEventType(event: eventWithTime, type: string): boolean {
    // Tipo 3 = IncrementalSnapshot (mutaciones, clicks, inputs, etc.)
    if (event.type !== 3) return false;

    const data = (event as any).data;
    
    switch (type) {
      case 'click':
        return data?.source === 2 && data?.type === 2; // MouseInteraction - Click
      case 'scroll':
        return data?.source === 3; // Scroll
      case 'input':
        return data?.source === 5; // Input
      case 'navigation':
        return this.isNavigationEvent(event);
      default:
        return false;
    }
  }

  private isNavigationEvent(event: eventWithTime): boolean {
    // Detectar cambios de URL o navegación
    const data = (event as any).data;
    return data?.href !== undefined || event.type === 4; // Meta event (navegación)
  }

  private extractPageFromEvent(event: eventWithTime): string {
    const data = (event as any).data;
    if (data?.href) {
      try {
        const url = new URL(data.href);
        return url.pathname;
      } catch {
        return data.href;
      }
    }
    return 'Página desconocida';
  }

  private detectStrugglingIndicators(events: eventWithTime[]): string[] {
    const indicators: string[] = [];
    
    // Inactividad prolongada
    const inactivity = this.detectInactivityPeriods(events);
    if (inactivity.some(period => period > 120000)) { // >2 min
      indicators.push('Inactividad prolongada (>2 min)');
    }

    // Muchos clicks (frustración)
    const clicks = this.countEventType(events, 'click');
    if (clicks > 20) {
      indicators.push(`Muchos clicks en poco tiempo (${clicks})`);
    }

    // Scroll excesivo (buscando información)
    const scrolls = this.countEventType(events, 'scroll');
    if (scrolls > 15) {
      indicators.push('Scroll excesivo (posiblemente buscando info)');
    }

    // Borrado frecuente de inputs
    const inputs = this.extractInputValues(events);
    const shortInputs = Object.values(inputs).filter(v => v.length < 10).length;
    if (shortInputs > 3) {
      indicators.push('Múltiples inputs cortos (borrado frecuente)');
    }

    // Volver atrás repetidamente
    const backtracks = this.countBacktracks(events);
    if (backtracks > 2) {
      indicators.push(`Volvió atrás ${backtracks} veces`);
    }

    return indicators;
  }

  private calculateDifficultyScore(context: SessionContext): number {
    let score = 0;

    // Tiempo excesivo (peso: 0.3)
    if (context.timeOnPage > 180000) score += 0.3; // >3 min
    else if (context.timeOnPage > 120000) score += 0.15; // >2 min

    // Intentos múltiples (peso: 0.2)
    if (context.attemptsMade > 5) score += 0.2;
    else if (context.attemptsMade > 3) score += 0.1;

    // Volver atrás (peso: 0.2)
    if (context.backtrackCount > 3) score += 0.2;
    else if (context.backtrackCount > 1) score += 0.1;

    // No consultar recursos (peso: 0.15)
    if (context.resourcesViewed.length === 0 && context.timeOnPage > 60000) {
      score += 0.15;
    }

    // Inactividad (peso: 0.15)
    const longInactivity = context.inactivityPeriods.filter(p => p > 120000).length;
    if (longInactivity > 0) score += 0.15;

    return Math.min(score, 1); // Cap at 1.0
  }

  private countAttempts(events: eventWithTime[]): number {
    // Contar eventos de submit, click en botón "enviar", etc.
    const submitEvents = events.filter(e => {
      const data = (event as any).data;
      return data?.source === 2 && data?.type === 2; // Clicks
    });
    
    // Heurística: cada 3-5 clicks podría ser un intento
    return Math.floor(submitEvents.length / 4);
  }

  private countBacktracks(events: eventWithTime[]): number {
    // Detectar navegación hacia atrás (back button o cambio de página a anterior)
    let backCount = 0;
    let lastPage = '';
    
    events.forEach(event => {
      if (this.isNavigationEvent(event)) {
        const currentPage = this.extractPageFromEvent(event);
        if (currentPage === lastPage) {
          backCount++;
        }
        lastPage = currentPage;
      }
    });
    
    return backCount;
  }

  private extractResourcesViewed(events: eventWithTime[]): string[] {
    const resources = new Set<string>();
    
    events.forEach(event => {
      const data = (event as any).data;
      
      // Detectar clicks en links de recursos
      if (data?.source === 2 && data?.type === 2) { // Click
        // Extraer información del click si es en un link o recurso
        // Esto requeriría acceso al DOM snapshot
      }
    });
    
    // Por ahora retornar placeholder
    return Array.from(resources);
  }

  private calculateDuration(events: eventWithTime[]): number {
    if (events.length < 2) return 0;
    return events[events.length - 1].timestamp - events[0].timestamp;
  }

  private detectInactivityPeriods(events: eventWithTime[]): number[] {
    const periods: number[] = [];
    const threshold = 30000; // 30 segundos
    
    for (let i = 1; i < events.length; i++) {
      const gap = events[i].timestamp - events[i - 1].timestamp;
      if (gap > threshold) {
        periods.push(gap);
      }
    }
    
    return periods;
  }

  private extractInputValues(events: eventWithTime[]): Record<string, string> {
    const inputs: Record<string, string> = {};
    
    events.forEach(event => {
      const data = (event as any).data;
      
      if (data?.source === 5) { // Input event
        const text = data?.text || '';
        const id = data?.id || `input_${Object.keys(inputs).length}`;
        
        if (text && text.length > 0) {
          inputs[id] = text;
        }
      }
    });
    
    return inputs;
  }
}

// Singleton instance
export const sessionAnalyzer = new SessionAnalyzer();
