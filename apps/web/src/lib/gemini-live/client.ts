/**
 * Cliente WebSocket para Gemini Live API
 * @see https://ai.google.dev/gemini-api/docs/live
 */

import type {
  GeminiLiveConfig,
  GeminiSetupMessage,
  GeminiClientContentMessage,
  GeminiServerContentMessage,
  GeminiLiveEventHandler,
} from './types';

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private eventHandlers: GeminiLiveEventHandler = {};
  private audioQueue: AudioBuffer[] = [];
  private isPlaying = false;
  private currentSource: AudioBufferSourceNode | null = null;

  constructor(private apiKey: string) {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Conectar a Gemini Live API vía WebSocket
   */
  async connect(config: GeminiLiveConfig, handlers?: GeminiLiveEventHandler): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.warn('WebSocket ya está conectado');
      return;
    }

    this.eventHandlers = handlers || {};
    this.eventHandlers.onConnectionStateChange?.('connecting');

    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.apiKey}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('✅ Gemini Live WebSocket conectado');
        this.eventHandlers.onConnectionStateChange?.('connected');
        this.sendSetup(config);
      };

      this.ws.onmessage = (event) => {
        try {
          const message: GeminiServerContentMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error procesando mensaje:', error);
          this.eventHandlers.onError?.(error as Error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ Error en WebSocket:', error);
        this.eventHandlers.onConnectionStateChange?.('error');
        this.eventHandlers.onError?.(new Error('WebSocket error'));
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket cerrado:', event.code, event.reason);
        this.eventHandlers.onConnectionStateChange?.('disconnected');
        this.ws = null;
      };
    } catch (error) {
      console.error('Error al conectar WebSocket:', error);
      this.eventHandlers.onConnectionStateChange?.('error');
      this.eventHandlers.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Enviar configuración inicial al servidor
   */
  private sendSetup(config: GeminiLiveConfig): void {
    const setupMessage: GeminiSetupMessage = {
      setup: {
        model: `models/${config.model}`,
        generation_config: {
          response_modalities: ['AUDIO'],
          speech_config: {
            voice_config: {
              prebuilt_voice_config: {
                voice_name: config.voice || 'Aoede',
              },
            },
          },
          temperature: config.temperature || 0.7,
        },
      },
    };

    // Añadir instrucción del sistema si existe
    if (config.systemInstruction) {
      setupMessage.setup.system_instruction = {
        parts: [{ text: config.systemInstruction }],
      };
    }

    this.send(setupMessage);
  }

  /**
   * Enviar audio al servidor
   */
  async sendAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket no está conectado');
    }

    const base64Audio = this.arrayBufferToBase64(audioData);

    const message: GeminiClientContentMessage = {
      client_content: {
        turns: [
          {
            role: 'user',
            parts: [
              {
                inline_data: {
                  mime_type: 'audio/pcm;rate=16000',
                  data: base64Audio,
                },
              },
            ],
          },
        ],
        turn_complete: true,
      },
    };

    this.send(message);
  }

  /**
   * Enviar texto al servidor
   */
  async sendText(text: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket no está conectado');
    }

    const message: GeminiClientContentMessage = {
      client_content: {
        turns: [
          {
            role: 'user',
            parts: [{ text }],
          },
        ],
        turn_complete: true,
      },
    };

    this.send(message);
  }

  /**
   * Manejar mensajes del servidor
   */
  private handleMessage(message: GeminiServerContentMessage): void {
    // Setup completado
    if (message.setup_complete) {
      console.log('✅ Setup completado');
      this.eventHandlers.onSetupComplete?.();
      return;
    }

    // Contenido del servidor
    if (message.server_content?.model_turn?.parts) {
      const parts = message.server_content.model_turn.parts;

      parts.forEach((part) => {
        // Audio recibido
        if (part.inline_data?.mime_type?.startsWith('audio/')) {
          const audioData = this.base64ToArrayBuffer(part.inline_data.data);
          this.eventHandlers.onAudioReceived?.(audioData);
          this.queueAudio(audioData);
        }

        // Texto recibido
        if (part.text) {
          console.log('📝 Texto recibido:', part.text);
          this.eventHandlers.onTextReceived?.(part.text);
        }
      });

      // Turn completado
      if (message.server_content.turn_complete) {
        console.log('✅ Turn completado');
        this.eventHandlers.onTurnComplete?.();
      }
    }
  }

  /**
   * Añadir audio a la cola de reproducción
   */
  private async queueAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      console.warn('AudioContext no disponible');
      return;
    }

    try {
      // Convertir PCM a AudioBuffer
      const audioBuffer = await this.pcmToAudioBuffer(audioData);
      this.audioQueue.push(audioBuffer);

      if (!this.isPlaying) {
        this.playNextInQueue();
      }
    } catch (error) {
      console.error('Error al procesar audio:', error);
    }
  }

  /**
   * Reproducir siguiente audio en la cola
   */
  private playNextInQueue(): void {
    if (this.audioQueue.length === 0 || !this.audioContext) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioBuffer = this.audioQueue.shift()!;

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);

    source.onended = () => {
      this.currentSource = null;
      this.playNextInQueue();
    };

    this.currentSource = source;
    source.start();
  }

  /**
   * Detener reproducción de audio actual
   */
  stopAudio(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource = null;
      } catch (error) {
        console.warn('Error deteniendo audio:', error);
      }
    }
    this.audioQueue = [];
    this.isPlaying = false;
  }

  /**
   * Desconectar WebSocket
   */
  disconnect(): void {
    this.stopAudio();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.eventHandlers = {};
  }

  /**
   * Enviar mensaje por WebSocket
   */
  private send(message: GeminiSetupMessage | GeminiClientContentMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('No se puede enviar mensaje: WebSocket no conectado');
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Convertir ArrayBuffer a Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convertir Base64 a ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Convertir PCM 16-bit a AudioBuffer
   */
  private async pcmToAudioBuffer(pcmData: ArrayBuffer): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext no disponible');
    }

    // PCM 16-bit mono a 16kHz
    const pcm16 = new Int16Array(pcmData);
    const float32 = new Float32Array(pcm16.length);

    // Convertir de 16-bit signed int a float32 (-1.0 a 1.0)
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768.0;
    }

    // Crear AudioBuffer
    const audioBuffer = this.audioContext.createBuffer(
      1, // mono
      float32.length,
      16000 // 16kHz
    );

    audioBuffer.getChannelData(0).set(float32);

    return audioBuffer;
  }

  /**
   * Obtener estado de conexión
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
