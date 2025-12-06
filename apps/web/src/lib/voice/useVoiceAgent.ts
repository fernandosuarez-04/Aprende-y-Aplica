/**
 * Hook unificado para agentes de voz
 * Soporta tanto ElevenLabs como Gemini Live API
 */

import { useState, useCallback, useRef } from 'react';
import { useGeminiLive } from '../gemini-live';
import { selectVoiceAgent, getGeminiConfig } from './config';
import type { VoiceAgentConfig } from './types';

export interface UseVoiceAgentOptions extends VoiceAgentConfig {
  context?: 'conversational' | 'announcement';
  onError?: (error: Error) => void;
}

/**
 * Hook principal para usar agentes de voz
 * Selecciona automáticamente entre ElevenLabs y Gemini según configuración
 */
export function useVoiceAgent(options: UseVoiceAgentOptions = { mode: 'hybrid' }) {
  const context = options.context || 'announcement';
  const selectedAgent = selectVoiceAgent(context);

  // Estado compartido
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Referencias para ElevenLabs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);

  // Hook de Gemini (siempre inicializado pero solo usado si es necesario)
  const gemini = useGeminiLive(
    selectedAgent === 'gemini'
      ? {
          apiKey: getGeminiConfig().apiKey,
          config: {
            model: getGeminiConfig().model,
            voice: getGeminiConfig().voice,
            language: options.language,
            systemInstruction: options.systemInstruction,
          },
          onError: options.onError,
        }
      : undefined
  );

  /**
   * Conectar al agente de voz
   */
  const connect = useCallback(async () => {
    if (selectedAgent === 'gemini') {
      await gemini.connect();
    }
    // ElevenLabs no requiere conexión previa
  }, [selectedAgent, gemini]);

  /**
   * Desconectar del agente de voz
   */
  const disconnect = useCallback(() => {
    if (selectedAgent === 'gemini') {
      gemini.disconnect();
    }
    stopAllAudio();
  }, [selectedAgent, gemini]);

  /**
   * Hablar texto (TTS)
   */
  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      // Detener audio anterior
      stopAllAudio();

      if (selectedAgent === 'gemini') {
        // Usar Gemini Live API
        try {
          setIsSpeaking(true);
          await gemini.sendText(text);
        } catch (error) {
          console.error('Error al hablar con Gemini:', error);
          options.onError?.(error as Error);
          setIsSpeaking(false);
        }
      } else {
        // Usar ElevenLabs
        await speakWithElevenLabs(text);
      }
    },
    [selectedAgent, gemini, options]
  );

  /**
   * Hablar con ElevenLabs (implementación actual)
   */
  const speakWithElevenLabs = async (text: string) => {
    if (typeof window === 'undefined') return;

    try {
      setIsSpeaking(true);

      const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
      const voiceId = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID;
      const modelId = process.env.NEXT_PUBLIC_ELEVENLABS_MODEL_ID || 'eleven_turbo_v2_5';

      if (!apiKey || !voiceId) {
        console.warn('⚠️ ElevenLabs credentials not found, using fallback Web Speech API');
        speakWithWebSpeechAPI(text);
        return;
      }

      const controller = new AbortController();
      ttsAbortRef.current = controller;

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        signal: controller.signal,
        method: 'POST',
        headers: {
          Accept: 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: modelId,
          voice_settings: {
            stability: 0.4,
            similarity_boost: 0.65,
            style: 0.3,
            use_speaker_boost: false,
          },
          optimize_streaming_latency: 4,
          output_format: 'mp3_22050_32',
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBlob = await response.blob();

      if (ttsAbortRef.current?.signal.aborted) {
        ttsAbortRef.current = null;
        return;
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        if (audioRef.current === audio) audioRef.current = null;
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        if (audioRef.current === audio) audioRef.current = null;
      };

      await audio.play();
      if (ttsAbortRef.current === controller) ttsAbortRef.current = null;
    } catch (error: any) {
      if (error?.name === 'AbortError' || error.message?.includes('aborted')) {
        console.log('TTS aborted');
      } else {
        console.error('Error en síntesis de voz con ElevenLabs:', error);
        options.onError?.(error);
      }
      setIsSpeaking(false);
    }
  };

  /**
   * Fallback a Web Speech API
   */
  const speakWithWebSpeechAPI = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.language || 'es-ES';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  /**
   * Detener todo el audio
   */
  const stopAllAudio = useCallback(() => {
    try {
      // Abortar request de ElevenLabs
      if (ttsAbortRef.current) {
        try {
          ttsAbortRef.current.abort();
        } catch (e) {
          // ignore
        }
        ttsAbortRef.current = null;
      }

      // Detener audio HTML
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Detener Web Speech API
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
      }

      // Detener Gemini
      if (selectedAgent === 'gemini') {
        gemini.stopAudio();
      }

      setIsSpeaking(false);
    } catch (err) {
      console.warn('Error deteniendo audio:', err);
    }
  }, [selectedAgent, gemini]);

  /**
   * Iniciar escucha (solo para Gemini en modo conversacional)
   */
  const startListening = useCallback(async () => {
    if (selectedAgent === 'gemini') {
      await gemini.startListening();
    } else {
      console.warn('startListening solo disponible con Gemini Live API');
    }
  }, [selectedAgent, gemini]);

  /**
   * Detener escucha
   */
  const stopListening = useCallback(() => {
    if (selectedAgent === 'gemini') {
      gemini.stopListening();
    }
  }, [selectedAgent, gemini]);

  return {
    // Estado
    selectedAgent,
    isConnected: selectedAgent === 'gemini' ? gemini.isConnected : true,
    isSpeaking: selectedAgent === 'gemini' ? gemini.isSpeaking : isSpeaking,
    isListening: selectedAgent === 'gemini' ? gemini.isListening : false,
    isProcessing,
    connectionState: selectedAgent === 'gemini' ? gemini.connectionState : 'connected',

    // Acciones
    connect,
    disconnect,
    speak,
    stopAllAudio,
    startListening,
    stopListening,
    setIsProcessing,
  };
}
