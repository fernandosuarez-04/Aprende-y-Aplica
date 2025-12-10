/**
 * Session Recorder usando rrweb
 * Graba sesiones del usuario para debugging y reportes de problemas
 */

// ⚠️ CRÍTICO: Importar el patch ANTES de importar rrweb
// Esto asegura que el MutationObserver esté parcheado antes de que rrweb lo use
import './mutation-record-patch';

import type { eventWithTime } from '@rrweb/types';
import { loadRrweb, type RrwebModule, type RrwebRecordOptions } from './rrweb-loader';

/**
 * Verifica que el patch de MutationRecord esté aplicado
 * El patch se aplica automáticamente al cargar el módulo, pero esta función
 * puede ser llamada para asegurar que esté activo antes de iniciar la grabación
 */
function setupMutationRecordErrorHandler() {
  if (typeof window === 'undefined') return;
  
  // El patch ya se aplicó automáticamente al cargar el módulo
  // Esta función solo verifica que esté activo
  if (!(window as any).__mutationRecordPatchApplied) {
    console.warn('[SessionRecorder] ⚠️ El patch de MutationRecord no está aplicado. Esto puede causar errores.');
  }
}

export interface RecordingSession {
  events: eventWithTime[];
  startTime: number;
  endTime?: number;
}

// Tipo para el objeto sessionRecorder exportado (para usar en hooks sin typeof import)
export interface SessionRecorderInstance {
  startRecording(maxDuration?: number): Promise<void>;
  stop(): RecordingSession | null;
  captureSnapshot(): RecordingSession | null;
  getCurrentSession(): RecordingSession | null;
  isActive(): boolean;
  isRrwebAvailable(): boolean;
  exportSession(session: RecordingSession): string;
  exportSessionBase64(session: RecordingSession): string;
  getSessionSize(session: RecordingSession): number;
  getSessionSizeFormatted(session: RecordingSession): string;
}

export class SessionRecorder {
  private static instance: SessionRecorder;
  private events: eventWithTime[] = [];
  private stopRecording: (() => void) | undefined | null = null;
  private isRecording = false;
  private maxEvents = 20000; // Aumentado a 20000 para capturar ~3 minutos de contexto
  private maxDuration = 60000; // 60 segundos máximo
  private initialSnapshot: eventWithTime | null = null; // Guardar snapshot inicial
  private rrwebAvailable = false; // Flag para verificar si rrweb está disponible

  private constructor() {
    // No hacer nada en el constructor para evitar ejecución en el servidor
    // La verificación de rrweb se hará cuando se necesite (en startRecording)
  }

  static getInstance(): SessionRecorder {
    if (!SessionRecorder.instance) {
      SessionRecorder.instance = new SessionRecorder();
    }
    return SessionRecorder.instance;
  }

  /**
   * Verifica si rrweb está disponible en el entorno actual
   */
  private async checkRrwebAvailability(): Promise<boolean> {
    // Solo verificar en el cliente
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const rrweb = await loadRrweb();
      const isAvailable = rrweb !== null && typeof rrweb?.record === 'function';
      this.rrwebAvailable = isAvailable;
      return isAvailable;
    } catch (error) {
      console.error('❌ Error verificando disponibilidad de rrweb:', error);
      this.rrwebAvailable = false;
      return false;
    }
  }

  /**
   * Inicia la grabación de la sesión
   * @param maxDuration Duración máxima en ms (por defecto 60 segundos)
   */
  async startRecording(maxDuration?: number): Promise<void> {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') {
      console.warn('⚠️ SessionRecorder solo funciona en el cliente');
      return;
    }

    if (this.isRecording) {
      console.warn('⚠️ Ya hay una grabación en curso');
      return;
    }

    // Verificar disponibilidad de rrweb
    const isAvailable = await this.checkRrwebAvailability();
    if (!isAvailable) {
      console.error('❌ rrweb no está disponible. La grabación no puede iniciarse.');
      return;
    }

    if (maxDuration) {
      this.maxDuration = maxDuration;
    }

    // Aplicar handler de errores antes de iniciar la grabación
    // Esto previene que errores de MutationRecord rompan la aplicación
    setupMutationRecordErrorHandler();

    console.log('🎬 Iniciando grabación de sesión...');
    this.events = [];
    this.initialSnapshot = null;
    this.isRecording = true;

    try {
      // Cargar rrweb dinámicamente (ya verificado arriba, pero lo cargamos de nuevo para asegurar)
      const rrweb = await loadRrweb();
      
      // Validación estricta con verificación de tipo en tiempo de ejecución
      if (!rrweb) {
        throw new Error('rrweb module no se pudo cargar');
      }
      
      // Verificar que record existe y es una función ANTES de crear recordOptions
      if (typeof rrweb.record !== 'function') {
        console.error('[SessionRecorder] rrweb.record no es una función:', {
          rrweb: rrweb,
          hasRecord: 'record' in rrweb,
          recordType: typeof rrweb.record,
          rrwebKeys: Object.keys(rrweb),
        });
        throw new Error('rrweb.record no está disponible o no es una función');
      }

      // Extraer la función record de forma segura ANTES de usarla
      const recordFunction = rrweb.record;
      if (typeof recordFunction !== 'function') {
        throw new Error('rrweb.record no es una función después de extraerla');
      }

      // Wrapper para capturar errores de MutationRecord
      const originalEmit = (event: any) => {
        try {
          // Guardar el snapshot inicial (tipo 2) por separado
          if (event.type === 2 && !this.initialSnapshot) {
            this.initialSnapshot = event;
            console.log('📸 Snapshot inicial capturado');
          }
          
          // Agregar evento a la lista
          this.events.push(event);

          // Limitar número de eventos (rolling buffer)
          // PERO siempre mantener el snapshot inicial
          if (this.events.length > this.maxEvents) {
            // Mantener snapshot inicial + últimos N-1 eventos
            const snapshot = this.initialSnapshot || this.events.find(e => e.type === 2);
            const recentEvents = this.events.slice(-this.maxEvents + 1);
            
            // Si el snapshot no está en los eventos recientes, agregarlo al inicio
            if (snapshot && !recentEvents.some(e => e.type === 2)) {
              this.events = [snapshot, ...recentEvents];
            } else {
              this.events = recentEvents;
            }
          }
        } catch (error) {
          // Ignorar errores de MutationRecord (propiedades de solo lectura)
          if (error instanceof TypeError && error.message.includes('MutationRecord')) {
            console.warn('[SessionRecorder] Error ignorado en MutationRecord:', error.message);
            return;
          }
          // Re-lanzar otros errores
          throw error;
        }
      };

      // Configuración de rrweb balanceada según entorno
      // En desarrollo: más eventos para mejor debugging
      // En producción: optimizado para reducir tamaño
      const isDev = process.env.NODE_ENV === 'development';
      
      const recordOptions: RrwebRecordOptions = {
        emit: originalEmit,
        // Configuración optimizada para reducir eventos sin perder contexto importante
        checkoutEveryNms: isDev ? 10000 : 15000, // Checkpoint más frecuente en dev
        checkoutEveryNth: isDev ? 200 : 300, // Checkpoint más frecuente en dev
        recordCanvas: false, // No grabar canvas (muy pesado)
        recordCrossOriginIframes: false, // No grabar iframes externos
        collectFonts: false, // No recolectar fuentes (reduce tamaño)
        inlineStylesheet: false, // No inline CSS (reduce eventos)
        // Sampling balanceado: más detallado en dev, optimizado en prod
        sampling: {
          mousemove: true,
          mousemoveCallback: isDev ? 200 : 500, // Más frecuente en dev para mejor debugging
          mouseInteraction: {
            // En dev, capturar más eventos para mejor debugging
            MouseUp: isDev, // Capturar mouse up en dev
            MouseDown: isDev, // Capturar mouse down en dev
            Click: true, // Siempre capturar clicks (importante para reproducir acciones)
            ContextMenu: false, // No menu contextual
            DblClick: true, // Siempre capturar double clicks (importante)
            Focus: isDev, // Capturar focus en dev para debugging
            Blur: false, // No blur events (menos importante)
            TouchStart: false, // No touch start
            TouchEnd: false, // No touch end
          },
          scroll: isDev ? 150 : 300, // Más frecuente en dev
          media: isDev ? 500 : 800, // Más frecuente en dev
          input: isDev ? true : 'last', // En dev capturar todos los cambios, en prod solo el último
        },
        // Ignorar ciertos elementos que generan mucho ruido
        ignoreClass: 'rr-ignore',
        maskTextClass: 'rr-mask',
        maskAllInputs: false, // No enmascarar inputs para mejor debugging
        // Deshabilitar grabación de mutaciones de atributos para evitar errores de MutationRecord
        // Esto previene el error "Cannot set property attributeName"
        blockClass: 'rr-block',
        blockSelector: null, // No bloquear selectores específicos
        // NOTA: ignoreCSSAttributes no existe en la API oficial de rrweb, se elimina
        slimDOMOptions: {
          script: true, // Remover scripts del DOM
          comment: true, // Remover comentarios
          headFavicon: true, // Remover favicon
          headWhitespace: true, // Remover whitespace del head
          headMetaDescKeywords: true, // Remover meta keywords
          headMetaSocial: true, // Remover meta social
          headMetaRobots: true, // Remover meta robots
          headMetaHttpEquiv: true, // Remover meta http-equiv
          headMetaAuthorship: true, // Remover meta authorship
          headMetaVerification: true, // Remover meta verification
        },
        // Protección adicional: deshabilitar grabación de mutaciones problemáticas
        maskInputOptions: {
          password: true,
          email: true,
          tel: true,
        },
      };

      // Llamar a record con la función extraída (ya validada arriba)
      try {
        this.stopRecording = recordFunction(recordOptions);
        
        // Verificar que stopRecording es una función
        if (typeof this.stopRecording !== 'function') {
          throw new Error('rrweb.record no retornó una función de detención');
        }
      } catch (recordError) {
        console.error('[SessionRecorder] Error al inicializar record:', recordError);
        // Si falla la inicialización, deshabilitar el recorder
        this.isRecording = false;
        this.stopRecording = null;
        throw recordError;
      }

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
      this.stopRecording = null;
      this.rrwebAvailable = false;
      // Reintentar verificar disponibilidad después de un error
      setTimeout(() => {
        this.checkRrwebAvailability().catch(() => {
          // Ignorar errores en la verificación
        });
      }, 5000);
    }
  }

  /**
   * Captura una copia de la sesión actual SIN detener la grabación.
   * Ideal para reportes donde queremos capturar el momento pero seguir grabando.
   */
  captureSnapshot(): RecordingSession | null {
    if (!this.isRecording) {
      console.warn('⚠️ No hay grabación activa para capturar');
      return null;
    }

    // Verificar que tengamos eventos
    if (this.events.length === 0) {
      console.error('❌ No hay eventos para capturar');
      return null;
    }

    console.log('📸 Capturando snapshot de la sesión sin detener grabación...');

    // Crear copia de los eventos actuales
    const eventsCopy = [...this.events];

    // Verificar que tengamos el snapshot inicial (tipo 2)
    const hasSnapshot = eventsCopy.some(e => e.type === 2);
    if (!hasSnapshot && this.initialSnapshot) {
      console.log('➕ Agregando snapshot inicial a la copia');
      eventsCopy.unshift(this.initialSnapshot);
    }

    const session: RecordingSession = {
      events: eventsCopy,
      startTime: eventsCopy[0]?.timestamp || Date.now(),
      endTime: eventsCopy[eventsCopy.length - 1]?.timestamp || Date.now(),
    };

    const duration = session.endTime && session.startTime 
      ? Math.round((session.endTime - session.startTime) / 1000)
      : 0;
    console.log(`✅ Snapshot capturado: ${session.events.length} eventos (${duration}s de grabación)`);
    
    // NO limpiamos eventos, la grabación continúa
    return session;
  }

  /**
   * Detiene la grabación y retorna la sesión final
   */
  stop(): RecordingSession | null {
    if (!this.isRecording) {
      console.warn('⚠️ No hay grabación activa');
      return null;
    }

    console.log('🛑 Deteniendo grabación...');
    this.stopRecording?.();
    this.isRecording = false;

    // Verificar que tengamos eventos
    if (this.events.length === 0) {
      console.error('❌ No se capturaron eventos');
      return null;
    }

    // Verificar que tengamos el snapshot inicial (tipo 2)
    const hasSnapshot = this.events.some(e => e.type === 2);
    if (!hasSnapshot) {
      console.warn('⚠️ No se encontró snapshot inicial (tipo 2), intentando recuperar...');
      // Si tenemos el snapshot guardado, agregarlo al inicio
      if (this.initialSnapshot) {
        this.events.unshift(this.initialSnapshot);
        console.log('✅ Snapshot inicial recuperado');
      } else {
        console.error('❌ No se puede reproducir sin snapshot inicial');
      }
    }

    const session: RecordingSession = {
      events: [...this.events],
      startTime: this.events[0]?.timestamp || Date.now(),
      endTime: this.events[this.events.length - 1]?.timestamp || Date.now(),
    };

    console.log(`✅ Grabación detenida. ${session.events.length} eventos capturados (Snapshot: ${hasSnapshot ? 'Sí' : 'No'})`);

    // Limpiar eventos
    this.events = [];
    this.initialSnapshot = null;
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
   * Verifica si rrweb está disponible
   */
  isRrwebAvailable(): boolean {
    return this.rrwebAvailable;
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

// Función helper para obtener el singleton de forma segura
function getSessionRecorderInstance(): SessionRecorder {
  // Solo inicializar en el cliente
  if (typeof window === 'undefined') {
    // Retornar un objeto mock en el servidor que no hace nada
    return {
      startRecording: async () => {},
      stop: () => null,
      captureSnapshot: () => null,
      getCurrentSession: () => null,
      isActive: () => false,
      isRrwebAvailable: () => false,
      exportSession: () => '',
      exportSessionBase64: () => '',
      getSessionSize: () => 0,
      getSessionSizeFormatted: () => '0 B',
    } as unknown as SessionRecorder;
  }
  
  return SessionRecorder.getInstance();
}

// Export singleton con métodos proxy para mantener compatibilidad
export const sessionRecorder = {
  async startRecording(maxDuration?: number): Promise<void> {
    return getSessionRecorderInstance().startRecording(maxDuration);
  },
  
  stop(): RecordingSession | null {
    return getSessionRecorderInstance().stop();
  },
  
  captureSnapshot(): RecordingSession | null {
    return getSessionRecorderInstance().captureSnapshot();
  },
  
  getCurrentSession(): RecordingSession | null {
    return getSessionRecorderInstance().getCurrentSession();
  },
  
  isActive(): boolean {
    return getSessionRecorderInstance().isActive();
  },
  
  isRrwebAvailable(): boolean {
    return getSessionRecorderInstance().isRrwebAvailable();
  },
  
  exportSession(session: RecordingSession): string {
    return getSessionRecorderInstance().exportSession(session);
  },
  
  exportSessionBase64(session: RecordingSession): string {
    return getSessionRecorderInstance().exportSessionBase64(session);
  },
  
  getSessionSize(session: RecordingSession): number {
    return getSessionRecorderInstance().getSessionSize(session);
  },
  
  getSessionSizeFormatted(session: RecordingSession): string {
    return getSessionRecorderInstance().getSessionSizeFormatted(session);
  },
};
