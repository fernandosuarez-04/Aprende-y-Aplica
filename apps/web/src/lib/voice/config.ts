/**
 * Configuración de agentes de voz
 */

import type { VoiceAgentMode } from './types';

/**
 * Obtener modo de agente de voz desde variables de entorno
 */
export function getVoiceAgentMode(): VoiceAgentMode {
  const mode = process.env.NEXT_PUBLIC_VOICE_AGENT_MODE as VoiceAgentMode;

  if (!mode || !['elevenlabs', 'gemini', 'hybrid'].includes(mode)) {
    console.warn(`Modo de voz inválido: ${mode}. Usando 'hybrid' por defecto.`);
    return 'hybrid';
  }

  return mode;
}

/**
 * Determinar qué agente usar según el contexto
 */
export function selectVoiceAgent(context: 'conversational' | 'announcement'): 'elevenlabs' | 'gemini' {
  const mode = getVoiceAgentMode();

  // Modo forzado
  if (mode === 'elevenlabs') return 'elevenlabs';
  if (mode === 'gemini') return 'gemini';

  // Modo híbrido (recomendado)
  if (mode === 'hybrid') {
    // Conversaciones largas → Gemini (mejor latencia, VAD, interrupción)
    if (context === 'conversational') return 'gemini';

    // Anuncios cortos → ElevenLabs (mejor calidad de voz)
    if (context === 'announcement') return 'elevenlabs';
  }

  return 'elevenlabs';
}

/**
 * Obtener configuración de ElevenLabs
 */
export function getElevenLabsConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
    voiceId: process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || '',
    modelId: process.env.NEXT_PUBLIC_ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2',
  };
}

/**
 * Obtener configuración de Gemini
 */
export function getGeminiConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
    model: process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash-live-001',
    voice: process.env.NEXT_PUBLIC_GEMINI_VOICE || 'Aoede',
  };
}
