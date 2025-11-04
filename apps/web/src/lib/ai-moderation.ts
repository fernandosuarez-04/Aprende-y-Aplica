import OpenAI from 'openai';
import { createClient } from './supabase/server';

// Tipos
export interface AIModerationResult {
  isInappropriate: boolean;
  confidence: number; // 0.0 a 1.0
  categories: string[];
  reasoning: string;
  requiresHumanReview: boolean;
  processingTimeMs: number;
}

export interface ModerationCategory {
  hate: boolean;
  'hate/threatening': boolean;
  harassment: boolean;
  'harassment/threatening': boolean;
  'self-harm': boolean;
  'self-harm/intent': boolean;
  'self-harm/instructions': boolean;
  sexual: boolean;
  'sexual/minors': boolean;
  violence: boolean;
  'violence/graphic': boolean;
}

// Configuración
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const AI_MODERATION_ENABLED = process.env.OPENAI_MODERATION_ENABLED === 'true';
const CONFIDENCE_THRESHOLD = parseFloat(process.env.AI_MODERATION_CONFIDENCE_THRESHOLD || '0.7');
const AUTO_BAN_THRESHOLD = parseFloat(process.env.AI_MODERATION_AUTO_BAN_THRESHOLD || '0.95');

// Cliente de OpenAI
let openai: OpenAI | null = null;

if (OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });
}

/**
 * Analiza contenido usando la API de Moderación de OpenAI
 */
export async function analyzeContentWithAI(
  content: string,
  context?: {
    contentType: 'post' | 'comment';
    userId: string;
    previousWarnings?: number;
  }
): Promise<AIModerationResult> {
  const startTime = Date.now();

  // Si la moderación AI está desactivada o no hay API key
  if (!AI_MODERATION_ENABLED || !openai) {
    console.log('⚠️ AI Moderation is disabled or API key missing');
    return {
      isInappropriate: false,
      confidence: 0,
      categories: [],
      reasoning: 'AI moderation disabled',
      requiresHumanReview: false,
      processingTimeMs: Date.now() - startTime,
    };
  }

  try {
    // Usar la API de Moderación de OpenAI
    const moderationResponse = await openai.moderations.create({
      input: content,
    });

    const result = moderationResponse.results[0];
    const processingTimeMs = Date.now() - startTime;

    // Extraer categorías flaggeadas
    const flaggedCategories: string[] = [];
    let maxScore = 0;

    Object.entries(result.categories).forEach(([category, isFlagged]) => {
      if (isFlagged) {
        flaggedCategories.push(category);
        const score = result.category_scores[category as keyof typeof result.category_scores];
        if (score > maxScore) {
          maxScore = score;
        }
      }
    });

    // Si hay categorías flaggeadas, usar el score más alto
    const confidence = flaggedCategories.length > 0 ? maxScore : 0;
    const isInappropriate = result.flagged && confidence >= CONFIDENCE_THRESHOLD;

    // Generar razonamiento basado en categorías
    let reasoning = '';
    if (result.flagged && flaggedCategories.length > 0) {
      reasoning = `Contenido flaggeado por: ${flaggedCategories.join(', ')}. Confianza: ${(confidence * 100).toFixed(1)}%`;
    } else {
      reasoning = 'Contenido apropiado según análisis de IA';
    }

    // Determinar si requiere revisión humana
    const requiresHumanReview = 
      isInappropriate && 
      confidence < AUTO_BAN_THRESHOLD &&
      confidence >= CONFIDENCE_THRESHOLD;

    console.log('🤖 AI Moderation Result:', {
      isInappropriate,
      confidence: (confidence * 100).toFixed(1) + '%',
      categories: flaggedCategories,
      requiresHumanReview,
      processingTimeMs,
    });

    return {
      isInappropriate,
      confidence,
      categories: flaggedCategories,
      reasoning,
      requiresHumanReview,
      processingTimeMs,
    };

  } catch (error) {
    console.error('❌ Error in AI moderation:', error);
    
    // En caso de error, ser conservador y permitir el contenido
    // pero registrar para revisión manual
    return {
      isInappropriate: false,
      confidence: 0,
      categories: ['error'],
      reasoning: `Error en moderación AI: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requiresHumanReview: true,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Analiza contenido con análisis contextual avanzado usando GPT
 * (Alternativa más cara pero más precisa)
 */
export async function analyzeContentWithGPT(
  content: string,
  context?: {
    contentType: 'post' | 'comment';
    userId: string;
    previousWarnings?: number;
  }
): Promise<AIModerationResult> {
  const startTime = Date.now();

  if (!AI_MODERATION_ENABLED || !openai) {
    return {
      isInappropriate: false,
      confidence: 0,
      categories: [],
      reasoning: 'AI moderation disabled',
      requiresHumanReview: false,
      processingTimeMs: Date.now() - startTime,
    };
  }

  try {
    const systemPrompt = `Eres un moderador de contenido experto para una comunidad educativa de IA. 
Tu tarea es analizar contenido y determinar si es apropiado.

Debes detectar:
- Lenguaje ofensivo o insultos (directos o indirectos)
- Acoso o bullying
- Discurso de odio (racismo, sexismo, homofobia, etc.)
- Spam o contenido promocional no deseado
- Amenazas o violencia
- Contenido sexual inapropiado

Responde SOLO con un objeto JSON válido con este formato:
{
  "isInappropriate": boolean,
  "confidence": number (0.0 a 1.0),
  "categories": string[],
  "reasoning": string
}`;

    const userPrompt = `Analiza este ${context?.contentType || 'contenido'}:

"${content}"

${context?.previousWarnings ? `Nota: Este usuario tiene ${context.previousWarnings} advertencias previas.` : ''}`;

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const analysis = JSON.parse(responseText);

    const processingTimeMs = Date.now() - startTime;

    return {
      isInappropriate: analysis.isInappropriate || false,
      confidence: analysis.confidence || 0,
      categories: analysis.categories || [],
      reasoning: analysis.reasoning || 'Sin razón proporcionada',
      requiresHumanReview: 
        analysis.isInappropriate && 
        analysis.confidence < AUTO_BAN_THRESHOLD &&
        analysis.confidence >= CONFIDENCE_THRESHOLD,
      processingTimeMs,
    };

  } catch (error) {
    console.error('❌ Error in GPT moderation:', error);
    
    return {
      isInappropriate: false,
      confidence: 0,
      categories: ['error'],
      reasoning: `Error en moderación GPT: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requiresHumanReview: true,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Registra el análisis de IA en la base de datos
 */
export async function logAIModerationAnalysis(
  userId: string,
  contentType: 'post' | 'comment',
  contentId: string | null,
  content: string,
  result: AIModerationResult
): Promise<void> {
  try {
    const supabase = await createClient();
    
    const { error } = await (supabase as any).rpc('register_ai_moderation_analysis', {
      p_user_id: userId,
      p_content_type: contentType,
      p_content_id: contentId,
      p_content_text: content,
      p_is_flagged: result.isInappropriate,
      p_confidence_score: result.confidence,
      p_categories: JSON.stringify(result.categories),
      p_reasoning: result.reasoning,
      p_model_used: OPENAI_MODEL,
      p_api_response: null,
      p_processing_time_ms: result.processingTimeMs,
    });

    if (error) {
      console.error('Error logging AI moderation:', error);
    }
  } catch (error) {
    console.error('Exception logging AI moderation:', error);
  }
}

/**
 * Verifica si el usuario debe ser baneado automáticamente
 * basado en el nivel de confianza de la IA
 */
export function shouldAutoBan(result: AIModerationResult): boolean {
  return result.isInappropriate && result.confidence >= AUTO_BAN_THRESHOLD;
}
