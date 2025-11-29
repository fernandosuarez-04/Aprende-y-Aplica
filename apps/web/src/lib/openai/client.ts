/**
 * 🤖 OpenAI Client Configuration
 *
 * Cliente centralizado de OpenAI con:
 * - Configuración singleton
 * - Integración con sistema de monitoreo de uso
 * - Rate limiting
 * - Error handling
 */

import OpenAI from 'openai';
import { logOpenAIUsage, calculateCost, checkUsageLimit } from './usage-monitor';

// Singleton instance
let openaiClient: OpenAI | null = null;

/**
 * Obtiene o crea la instancia del cliente de OpenAI
 */
export function getOpenAIClient(): OpenAI {
  if (openaiClient) {
    return openaiClient;
  }

  // 🔍 Debug: Verificar variables de entorno
  console.log('🔍 [DEBUG] Variables de entorno:', {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Configurada' : 'No configurada',
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY ? 'Configurada' : 'No configurada',
    has_OPENAI: !!process.env.OPENAI_API_KEY,
    has_NEXT_PUBLIC: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY
  });

  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  if (!apiKey) {
    console.error('❌ [ERROR] No se encontró ninguna API key de OpenAI');
    console.error('process.env:', Object.keys(process.env).filter(k => k.includes('OPENAI')));
    throw new Error(
      'OPENAI_API_KEY no está configurada. ' +
      'Por favor, agrega OPENAI_API_KEY a tu archivo .env.local'
    );
  }

  openaiClient = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true // Solo para desarrollo, en producción usar API routes
  });

  console.log('✅ [OPENAI] Cliente inicializado correctamente');

  return openaiClient;
}

/**
 * Wrapper para chat completions con monitoreo integrado
 */
export async function createChatCompletion(
  params: {
    model?: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature?: number;
    max_tokens?: number;
    response_format?: { type: 'json_object' | 'text' };
  },
  userId: string = 'anonymous'
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  const client = getOpenAIClient();

  // Verificar límites de uso
  const usageCheck = checkUsageLimit(userId);
  if (!usageCheck.allowed) {
    throw new Error(usageCheck.reason || 'Límite de uso excedido');
  }

  try {
    const response = await client.chat.completions.create({
      model: params.model || 'gpt-4o-mini',
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.max_tokens ?? 1000,
      response_format: params.response_format
    });

    // Registrar uso
    const usage = response.usage;
    if (usage) {
      const cost = calculateCost(
        usage.prompt_tokens,
        usage.completion_tokens,
        params.model || 'gpt-4o-mini'
      );

      logOpenAIUsage({
        userId,
        timestamp: new Date(),
        model: params.model || 'gpt-4o-mini',
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        estimatedCost: cost
      });

      console.log('💰 [OPENAI] Uso registrado:', {
        model: params.model || 'gpt-4o-mini',
        tokens: usage.total_tokens,
        cost: `$${cost.toFixed(4)}`
      });
    }

    return response;

  } catch (error: any) {
    console.error('❌ [OPENAI] Error en la llamada:', error);

    // Manejar errores específicos de OpenAI
    if (error.status === 429) {
      throw new Error('Rate limit excedido. Por favor, intenta de nuevo en unos momentos.');
    } else if (error.status === 401) {
      throw new Error('API key inválida. Por favor, verifica tu configuración.');
    } else if (error.status === 500) {
      throw new Error('Error en el servidor de OpenAI. Por favor, intenta de nuevo.');
    }

    throw error;
  }
}

/**
 * Resetea el cliente (útil para testing)
 */
export function resetOpenAIClient(): void {
  openaiClient = null;
  console.log('🔄 [OPENAI] Cliente reseteado');
}
