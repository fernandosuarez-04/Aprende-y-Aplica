/**
 * Tipos para Gemini Live API
 * @see https://ai.google.dev/gemini-api/docs/live
 */

export interface GeminiLiveConfig {
  model: string;
  voice?: string;
  language?: string;
  systemInstruction?: string;
  temperature?: number;
}

export interface GeminiSetupMessage {
  setup: {
    model: string;
    generation_config?: {
      response_modalities?: string[];
      speech_config?: {
        voice_config?: {
          prebuilt_voice_config?: {
            voice_name: string;
          };
        };
      };
      temperature?: number;
    };
    system_instruction?: {
      parts: Array<{
        text: string;
      }>;
    };
  };
}

export interface GeminiClientContentMessage {
  client_content: {
    turns: Array<{
      role: string;
      parts: Array<{
        text?: string;
        inline_data?: {
          mime_type: string;
          data: string;
        };
      }>;
    }>;
    turn_complete: boolean;
  };
}

export interface GeminiServerContentMessage {
  server_content?: {
    model_turn?: {
      parts: Array<{
        text?: string;
        inline_data?: {
          mime_type: string;
          data: string;
        };
      }>;
    };
    turn_complete?: boolean;
  };
  setup_complete?: boolean;
}

export interface AudioChunk {
  data: ArrayBuffer;
  timestamp: number;
}

export type GeminiLiveEventHandler = {
  onSetupComplete?: () => void;
  onAudioReceived?: (audioData: ArrayBuffer) => void;
  onTextReceived?: (text: string) => void;
  onTurnComplete?: () => void;
  onError?: (error: Error) => void;
  onConnectionStateChange?: (state: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
};

export interface VoiceActivityDetection {
  enabled: boolean;
  threshold?: number; // 0-1, sensibilidad de detección
}

export const GEMINI_VOICES = {
  AOEDE: 'Aoede',
  CHARON: 'Charon',
  FENRIR: 'Fenrir',
  KORE: 'Kore',
  PUCK: 'Puck',
} as const;

export type GeminiVoice = typeof GEMINI_VOICES[keyof typeof GEMINI_VOICES];
