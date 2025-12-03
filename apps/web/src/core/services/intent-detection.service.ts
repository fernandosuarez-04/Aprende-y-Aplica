/**
 * Servicio de Detección de Intenciones
 * 
 * Detecta la intención del usuario en sus mensajes usando un enfoque híbrido:
 * 1. Detección local rápida con regex (sin API calls)
 * 2. Detección avanzada con OpenAI para casos ambiguos
 */

export type Intent =
  | 'create_prompt'
  | 'navigate'
  | 'question'
  | 'feedback'
  | 'general';

export interface IntentResult {
  intent: Intent;
  confidence: number;
  entities?: {
    promptTopic?: string;
    targetPage?: string;
    category?: string;
  };
}

// Patrones para detectar intención de crear prompts
const CREATE_PROMPT_PATTERNS = [
  /\b(crear|generar|hacer|ayuda.*crear|ayúdame.*crear)\b.*\bprompt\b/i,
  /\bprompt\b.*(para|sobre|de)\b/i,
  /\bcómo\b.*(crear|hacer|generar)\b.*\bprompt\b/i,
  /\bnecesito\b.*\bprompt\b/i,
  /\bquiero\b.*\bprompt\b/i,
  /\bprompt\b.*(que|para|de)\b/i,
  /\b(chatgpt|claude|gpt|ia)\b.*\b(instrucciones|instrucción|prompt)\b/i,
  /\b(system prompt|user prompt|assistant prompt)\b/i,
  /\bprompt engineering\b/i,
  /\bplantilla.*ia\b/i,
  /\bprompts?\b.*\b(efectivos?|buenos?|mejores?)\b/i,
];

// Patrones para detectar intención de navegar
const NAVIGATE_PATTERNS = [
  /\b(ir|llevar|mostrar|ver|navegar)\b.*(a|hacia|al)\b/i,
  /\bdónde\b.*(está|encuentro|veo)\b/i,
  /\bcómo\b.*(accedo|llego)\b/i,
  /\b(página|sección)\b.*(de|para)\b/i,
  /\b(quiero|necesito)\b.*(ir|ver|acceder)\b/i,
  // Peticiones directas de navegación (con y sin tildes)
  /\b(ll[eé]vame|llevame|llévame)\b/i,
  /\b(mu[eé]strame|muestrame|muéstrame)\b/i,
  /\b(dame|dime).*(link|enlace|url)\b/i,
  /\b(abre|abrir)\b/i,
  /\b(acceder|acceso)\b.*\b(a|al)\b/i,
  /\b(link|enlace)\b.*\b(de|del|a|al|para)\b/i,
];

// Palabras clave de navegación (secciones del sitio)
const NAVIGATION_KEYWORDS = [
  'noticias', 'noticia', 'news',
  'comunidades', 'comunidad', 'communities',
  'dashboard', 'panel', 'inicio',
  'perfil', 'profile', 'cuenta',
  'cursos', 'curso', 'courses',
  'talleres', 'taller', 'workshops',
  'directorio', 'prompts', 'apps',
  'configuración', 'ajustes', 'settings',
];

// Palabras clave relacionadas con prompts
const PROMPT_KEYWORDS = [
  'prompt',
  'prompts',
  'plantilla',
  'instrucciones',
  'chatgpt',
  'claude',
  'ia',
  'inteligencia artificial',
  'system prompt',
  'user prompt',
  'prompt engineering',
];

// Páginas conocidas del sitio
const SITE_PAGES: Record<string, string[]> = {
  // 'prompt-directory': ['prompts', 'plantillas', 'directorio', 'biblioteca'], // TEMPORALMENTE OCULTO
  // 'apps-directory': ['apps', 'aplicaciones', 'herramientas'], // TEMPORALMENTE OCULTO
  'courses': ['cursos', 'curso', 'formación', 'aprendizaje'],
  'workshops': ['talleres', 'taller', 'workshop', 'eventos'],
  'communities': ['comunidades', 'comunidad', 'grupos', 'networking'],
  'news': ['noticias', 'artículos', 'actualizaciones'],
  'dashboard': ['panel', 'inicio', 'escritorio'],
  'profile': ['perfil', 'cuenta', 'configuración'],
};

export class IntentDetectionService {
  /**
   * Detecta la intención del mensaje del usuario
   * Usa un enfoque híbrido:
   * 1. Primero intenta detección local (rápida, sin API calls)
   * 2. Si la confianza es baja, puede usar OpenAI (opcional, para casos futuros)
   */
  static async detectIntent(message: string): Promise<IntentResult> {
    // Primero intentar detección local
    const localResult = this.detectIntentLocal(message);
    
    // Si la confianza es alta (>= 0.7), devolver resultado local
    if (localResult.confidence >= 0.7) {
      return localResult;
    }
    
    // Para implementación futura: llamar a OpenAI si confianza es baja
    // Por ahora, devolver resultado local
    return localResult;
  }

  /**
   * Detección rápida con regex (sin API calls)
   */
  static detectIntentLocal(message: string): IntentResult {
    const messageLower = message.toLowerCase().trim();
    
    // 1. Detectar intención de crear prompt
    const promptIntent = this.detectCreatePromptIntent(messageLower, message);
    if (promptIntent.confidence >= 0.6) {
      return promptIntent;
    }
    
    // 2. Detectar intención de navegar
    const navigateIntent = this.detectNavigateIntent(messageLower);
    if (navigateIntent.confidence >= 0.6) {
      return navigateIntent;
    }
    
    // 3. Detectar si es una pregunta
    if (this.isQuestion(messageLower)) {
      return {
        intent: 'question',
        confidence: 0.7,
      };
    }
    
    // 4. Por defecto, es conversación general
    return {
      intent: 'general',
      confidence: 0.5,
    };
  }

  /**
   * Detecta intención de crear prompts
   */
  private static detectCreatePromptIntent(
    messageLower: string,
    originalMessage: string
  ): IntentResult {
    let confidence = 0;
    const entities: IntentResult['entities'] = {};
    
    // Verificar patrones de regex
    let matchedPatterns = 0;
    for (const pattern of CREATE_PROMPT_PATTERNS) {
      if (pattern.test(originalMessage)) {
        matchedPatterns++;
      }
    }
    
    // Calcular confianza base según patrones encontrados
    if (matchedPatterns > 0) {
      confidence = Math.min(0.6 + (matchedPatterns * 0.15), 0.95);
    }
    
    // Verificar palabras clave
    let keywordMatches = 0;
    for (const keyword of PROMPT_KEYWORDS) {
      if (messageLower.includes(keyword.toLowerCase())) {
        keywordMatches++;
      }
    }
    
    // Aumentar confianza si hay múltiples keywords
    if (keywordMatches > 0) {
      confidence += keywordMatches * 0.05;
    }
    
    // Buscar el tema del prompt (texto después de "para", "sobre", "de")
    const topicMatch = originalMessage.match(
      /prompt\s+(para|sobre|de|que)\s+([^.!?]+)/i
    );
    if (topicMatch) {
      entities.promptTopic = topicMatch[2].trim();
      confidence += 0.1;
    }
    
    // Limitar confianza máxima a 0.95
    confidence = Math.min(confidence, 0.95);
    
    return {
      intent: 'create_prompt',
      confidence,
      entities: Object.keys(entities).length > 0 ? entities : undefined,
    };
  }

  /**
   * Detecta intención de navegar
   */
  private static detectNavigateIntent(messageLower: string): IntentResult {
    let confidence = 0;
    const entities: IntentResult['entities'] = {};
    
    // Verificar patrones de navegación
    let matchedPatterns = 0;
    for (const pattern of NAVIGATE_PATTERNS) {
      if (pattern.test(messageLower)) {
        matchedPatterns++;
      }
    }
    
    if (matchedPatterns > 0) {
      confidence = Math.min(0.6 + (matchedPatterns * 0.15), 0.85);
    }
    
    // Verificar palabras clave de navegación (secciones del sitio)
    let navigationKeywordMatches = 0;
    for (const keyword of NAVIGATION_KEYWORDS) {
      if (messageLower.includes(keyword.toLowerCase())) {
        navigationKeywordMatches++;
      }
    }
    
    // Si hay palabras clave de navegación, aumentar confianza
    if (navigationKeywordMatches > 0) {
      confidence += navigationKeywordMatches * 0.1;
      // Si hay patrón de navegación + keyword, es muy probable que sea navegación
      if (matchedPatterns > 0) {
        confidence = Math.max(confidence, 0.8);
      }
    }
    
    // Detectar página destino
    for (const [page, keywords] of Object.entries(SITE_PAGES)) {
      for (const keyword of keywords) {
        if (messageLower.includes(keyword)) {
          entities.targetPage = page;
          confidence += 0.1;
          break;
        }
      }
      if (entities.targetPage) break;
    }
    
    confidence = Math.min(confidence, 0.9);
    
    return {
      intent: 'navigate',
      confidence,
      entities: Object.keys(entities).length > 0 ? entities : undefined,
    };
  }

  /**
   * Detecta si el mensaje es una pregunta
   */
  private static isQuestion(messageLower: string): boolean {
    // Palabras interrogativas en español
    const questionWords = [
      '¿',
      'qué',
      'cuál',
      'cuáles',
      'cómo',
      'dónde',
      'cuándo',
      'quién',
      'quiénes',
      'por qué',
      'para qué',
      'puedes',
      'podrías',
      'me puedes',
      'me podrías',
    ];
    
    return questionWords.some(word => messageLower.includes(word));
  }

  /**
   * Detección avanzada con OpenAI (para implementación futura)
   * Esta función se puede habilitar cuando sea necesario mayor precisión
   */
  static async detectIntentWithAI(message: string): Promise<IntentResult> {
    try {
      const response = await fetch('/api/ai-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        throw new Error('Error en detección de intención con IA');
      }
      
      const result: IntentResult = await response.json();
      return result;
    } catch (error) {
      console.error('Error detectando intención con IA:', error);
      // Fallback a detección local
      return this.detectIntentLocal(message);
    }
  }
}

