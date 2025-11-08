/**
 * Session Recorder usando rrweb
 * Graba sesiones del usuario para debugging y reportes de problemas
 */

import { record, EventType } from 'rrweb';
import type { eventWithTime } from '@rrweb/types';

export interface RecordingSession {
  events: eventWithTime[];
  startTime: number;
  endTime?: number;
}

export class SessionRecorder {
  private static instance: SessionRecorder;
  private events: eventWithTime[] = [];
  private stopRecording: (() => void) | undefined | null = null;
  private isRecording = false;
  private maxEvents = 500; // Limitar eventos para no consumir mucha memoria
  private maxDuration = 60000; // 60 segundos máximo

  private constructor() {}

  static getInstance(): SessionRecorder {
    if (!SessionRecorder.instance) {
      SessionRecorder.instance = new SessionRecorder();
    }
    return SessionRecorder.instance;
  }

  /**
   * Inicia la grabación de la sesión
   * @param maxDuration Duración máxima en ms (por defecto 60 segundos)
   */
  startRecording(maxDuration?: number): void {
    if (this.isRecording) {
      console.warn('⚠️ Ya hay una grabación en curso');
      return;
    }

    if (maxDuration) {
      this.maxDuration = maxDuration;
    }

    console.log('🎬 Iniciando grabación de sesión...');
    this.events = [];
    this.isRecording = true;

    try {
      this.stopRecording = record({
        emit: (event) => {
          // Agregar evento a la lista
          this.events.push(event);

          // Limitar número de eventos (rolling buffer)
          if (this.events.length > this.maxEvents) {
            // Mantener solo los últimos N eventos
            this.events = this.events.slice(-this.maxEvents);
          }
        },
        // Configuración para optimizar tamaño
        checkoutEveryNms: 10000, // Checkpoint cada 10 segundos
        checkoutEveryNth: 200, // Checkpoint cada 200 eventos
        recordCanvas: false, // No grabar canvas (pesado)
        recordCrossOriginIframes: false, // No grabar iframes externos
        collectFonts: false, // No recolectar fuentes
        // Sampling para reducir eventos de mouse
        sampling: {
          mousemove: true,
          mouseInteraction: {
            MouseUp: false,
            MouseDown: false,
            Click: true, // Solo clicks importantes
            ContextMenu: false,
            DblClick: true,
            Focus: false,
            Blur: false,
            TouchStart: false,
            TouchEnd: false,
          },
          scroll: 150, // Sample scroll cada 150ms
          input: 'last', // Solo el último valor de inputs
        },
      });

      // Auto-detener después de maxDuration
      setTimeout(() => {
        if (this.isRecording) {
          console.log('⏱️ Duración máxima alcanzada, deteniendo grabación');
          this.stopRecording?.();
          this.isRecording = false;
        }
      }, this.maxDuration);

      console.log('✅ Grabación iniciada correctamente');
    } catch (error) {
      console.error('❌ Error iniciando grabación:', error);
      this.isRecording = false;
    }
  }

  /**
   * Detiene la grabación
   */
  stop(): RecordingSession | null {
    if (!this.isRecording) {
      console.warn('⚠️ No hay grabación activa');
      return null;
    }

    console.log('🛑 Deteniendo grabación...');
    this.stopRecording?.();
    this.isRecording = false;

    const session: RecordingSession = {
      events: [...this.events],
      startTime: this.events[0]?.timestamp || Date.now(),
      endTime: this.events[this.events.length - 1]?.timestamp || Date.now(),
    };

    console.log(`✅ Grabación detenida. ${session.events.length} eventos capturados`);

    // Limpiar eventos
    this.events = [];
    this.stopRecording = null;

    return session;
  }

  /**
   * Obtiene la sesión actual sin detener la grabación
   */
  getCurrentSession(): RecordingSession | null {
    if (!this.isRecording || this.events.length === 0) {
      return null;
    }

    return {
      events: [...this.events],
      startTime: this.events[0]?.timestamp || Date.now(),
      endTime: this.events[this.events.length - 1]?.timestamp || Date.now(),
    };
  }

  /**
   * Verifica si hay una grabación activa
   */
  isActive(): boolean {
    return this.isRecording;
  }

  /**
   * Exporta la sesión a JSON
   */
  exportSession(session: RecordingSession): string {
    return JSON.stringify(session);
  }

  /**
   * Exporta la sesión a base64 (para enviar en requests)
   * Usa Buffer para manejar correctamente caracteres UTF-8
   */
  exportSessionBase64(session: RecordingSession): string {
    const json = this.exportSession(session);
    
    // Convertir a base64 manejando correctamente UTF-8
    if (typeof window !== 'undefined') {
      // En el navegador, usar TextEncoder y btoa con escape
      const encoder = new TextEncoder();
      const data = encoder.encode(json);
      const binaryString = Array.from(data, byte => String.fromCharCode(byte)).join('');
      return btoa(binaryString);
    } else {
      // En Node.js, usar Buffer
      return Buffer.from(json, 'utf-8').toString('base64');
    }
  }

  /**
   * Calcula el tamaño aproximado de la sesión en bytes
   */
  getSessionSize(session: RecordingSession): number {
    const json = this.exportSession(session);
    return new Blob([json]).size;
  }

  /**
   * Calcula el tamaño aproximado en formato legible
   */
  getSessionSizeFormatted(session: RecordingSession): string {
    const bytes = this.getSessionSize(session);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

// Export singleton
export const sessionRecorder = SessionRecorder.getInstance();
