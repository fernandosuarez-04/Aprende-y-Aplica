/**
 * Tipos comunes para agentes de voz
 */

export type VoiceAgentMode = 'elevenlabs' | 'gemini' | 'hybrid';

export interface VoiceAgentConfig {
  mode: VoiceAgentMode;
  language?: string;
  systemInstruction?: string;
}

export interface VoiceAgent {
  connect(): Promise<void>;
  disconnect(): void;
  speak(text: string): Promise<void>;
  startListening(): Promise<void>;
  stopListening(): void;
  isConnected: boolean;
  isSpeaking: boolean;
  isListening: boolean;
}

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
  modelId: string;
}

export interface GeminiConfig {
  apiKey: string;
  model: string;
  voice: string;
}
