/**
 * Hook para usar Gemini Live API en componentes React
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { GeminiLiveClient } from './client';
import type { GeminiLiveConfig } from './types';

export interface UseGeminiLiveOptions {
  apiKey: string;
  config: GeminiLiveConfig;
  systemInstruction?: string;
  onError?: (error: Error) => void;
}

export function useGeminiLive(options?: UseGeminiLiveOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  const clientRef = useRef<GeminiLiveClient | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  /**
   * Conectar a Gemini Live API
   */
  const connect = useCallback(
    async (apiKey?: string, config?: GeminiLiveConfig) => {
      if (clientRef.current?.isConnected) {
        console.warn('Ya está conectado a Gemini Live API');
        return;
      }

      const finalApiKey = apiKey || options?.apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      const finalConfig = config || options?.config || {
        model: process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash-live-001',
        voice: process.env.NEXT_PUBLIC_GEMINI_VOICE || 'Aoede',
        systemInstruction: options?.systemInstruction,
      };

      if (!finalApiKey) {
        throw new Error('API Key de Gemini no proporcionada');
      }

      try {
        clientRef.current = new GeminiLiveClient(finalApiKey);

        await clientRef.current.connect(finalConfig, {
          onSetupComplete: () => {
            console.log('✅ Setup completado');
            setIsConnected(true);
          },
          onAudioReceived: () => {
            setIsSpeaking(true);
          },
          onTurnComplete: () => {
            setIsSpeaking(false);
          },
          onError: (error) => {
            console.error('Error en Gemini Live:', error);
            options?.onError?.(error);
          },
          onConnectionStateChange: (state) => {
            setConnectionState(state);
            setIsConnected(state === 'connected');
          },
        });
      } catch (error) {
        console.error('Error al conectar a Gemini Live:', error);
        options?.onError?.(error as Error);
        throw error;
      }
    },
    [options]
  );

  /**
   * Iniciar escucha del micrófono
   */
  const startListening = useCallback(async () => {
    if (!clientRef.current?.isConnected) {
      throw new Error('Cliente no conectado. Llama a connect() primero.');
    }

    if (isListening) {
      console.warn('Ya está escuchando');
      return;
    }

    try {
      // Solicitar permisos de micrófono
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1, // mono
          sampleRate: 16000, // 16kHz
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      audioStreamRef.current = stream;

      // Crear MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);

          // Convertir a ArrayBuffer y enviar
          const audioBlob = new Blob([event.data], { type: 'audio/webm' });
          const arrayBuffer = await audioBlob.arrayBuffer();

          // Convertir a PCM 16-bit
          const pcmData = await convertToPCM(arrayBuffer);

          if (clientRef.current && pcmData) {
            await clientRef.current.sendAudio(pcmData);
          }
        }
      };

      // Enviar chunks cada 250ms
      mediaRecorderRef.current.start(250);
      setIsListening(true);

      console.log('🎤 Micrófono iniciado');
    } catch (error) {
      console.error('Error al iniciar micrófono:', error);
      options?.onError?.(error as Error);
      throw error;
    }
  }, [isListening, options]);

  /**
   * Detener escucha del micrófono
   */
  const stopListening = useCallback(() => {
    if (!isListening) return;

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    audioChunksRef.current = [];
    setIsListening(false);

    console.log('🔇 Micrófono detenido');
  }, [isListening]);

  /**
   * Enviar texto a Gemini
   */
  const sendText = useCallback(
    async (text: string) => {
      if (!clientRef.current?.isConnected) {
        throw new Error('Cliente no conectado');
      }

      await clientRef.current.sendText(text);
    },
    []
  );

  /**
   * Detener audio actual
   */
  const stopAudio = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.stopAudio();
      setIsSpeaking(false);
    }
  }, []);

  /**
   * Desconectar de Gemini Live API
   */
  const disconnect = useCallback(() => {
    stopListening();

    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }

    setIsConnected(false);
    setIsSpeaking(false);
    setConnectionState('disconnected');

    console.log('🔌 Desconectado de Gemini Live');
  }, [stopListening]);

  /**
   * Limpiar al desmontar
   */
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // Estado
    isConnected,
    isSpeaking,
    isListening,
    connectionState,

    // Acciones
    connect,
    disconnect,
    startListening,
    stopListening,
    sendText,
    stopAudio,
  };
}

/**
 * Convertir audio WebM a PCM 16-bit
 * (Simplificado - en producción usar Web Audio API completo)
 */
async function convertToPCM(audioData: ArrayBuffer): Promise<ArrayBuffer | null> {
  try {
    // Crear AudioContext temporal
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Decodificar audio
    const audioBuffer = await audioContext.decodeAudioData(audioData.slice(0));

    // Obtener datos del canal (mono)
    const channelData = audioBuffer.getChannelData(0);

    // Convertir a PCM 16-bit
    const pcm16 = new Int16Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
      // Convertir de float32 (-1.0 a 1.0) a int16 (-32768 a 32767)
      const s = Math.max(-1, Math.min(1, channelData[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    // Cerrar contexto
    await audioContext.close();

    return pcm16.buffer;
  } catch (error) {
    console.error('Error al convertir a PCM:', error);
    return null;
  }
}
