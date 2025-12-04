/**
 * Servicio de Detección de Intenciones
 * 
 * Detecta la intención del usuario en sus mensajes usando un enfoque híbrido:
 * 1. Detección local rápida con regex (sin API calls)
 * 2. Detección avanzada con OpenAI para casos ambiguos
 */

export type Intent =
  | 'create_prompt'
  | 'nanobana'
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
    nanobananaDomain?: 'ui' | 'photo' | 'diagram';
    outputFormat?: 'wireframe' | 'mockup' | 'render' | 'diagram';
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

// Patrones para detectar intención de usar NanoBanana (generación visual/imágenes)
const NANOBANA_PATTERNS = [
  // Mención directa de NanoBanana
  /\bnanobana(na)?\b/i,
  /\bnano\s*banana\b/i,
  
  // Generación de imágenes con JSON
  /\b(json|esquema)\b.*\b(imagen|diseño|ui|interfaz)\b/i,
  /\b(imagen|diseño|ui|interfaz)\b.*\b(json|esquema)\b/i,
  
  // Wireframes y mockups
  /\b(wireframe|mockup|prototipo|boceto)\b.*\b(generar|crear|diseñar|haz)\b/i,
  /\b(generar|crear|diseñar|haz)\b.*\b(wireframe|mockup|prototipo|boceto)\b/i,
  
  // UI/App design - MEJORADO
  /\b(diseñar?|crear|generar|haz(me)?)\b.*\b(app|aplicación|interfaz|ui|ux|pantalla)\b/i,
  /\b(app|aplicación|interfaz|ui|ux|pantalla)\b.*\b(diseñar?|crear|generar|haz)\b/i,
  
  // Diagramas técnicos
  /\b(diagrama|flowchart|arquitectura|flujo|esquema)\b.*\b(generar|crear|diseñar|haz)\b/i,
  /\b(generar|crear|diseñar|haz)\b.*\b(diagrama|flowchart|arquitectura|flujo)\b/i,
  
  // Fotografía de producto
  /\b(foto|fotografía|imagen)\b.*\b(producto|marketing|comercial|publicit)\b/i,
  /\b(producto|marketing|comercial|publicit)\b.*\b(foto|fotografía|imagen)\b/i,
  
  // Render preciso
  /\b(render|renderizar)\b.*\b(preciso|exacto|profesional)\b/i,
  
  // 🎨 NUEVOS: Frases comunes para crear imágenes/diseños
  /\b(crear?|genera[r]?|diseña[r]?|haz(me)?|necesito|quiero|dame)\b.*\b(una?\s*)?(imagen|visual|visualización)\b/i,
  /\b(crear?|genera[r]?|diseña[r]?|haz(me)?)\b.*\b(una?\s*)?(landing|página\s*web|dashboard|panel)\b/i,
  /\b(crear?|genera[r]?|diseña[r]?|haz(me)?)\b.*\b(una?\s*)?(logo|banner|poster|cartel|anuncio)\b/i,
  /\b(diseña(r|me)?|dibuja(r|me)?|crea(r|me)?)\b.*\b(una?\s*)?(app|aplicación|móvil|mobile)\b/i,
  /\b(necesito|quiero|dame)\b.*\b(diseño|imagen|visual|interfaz|wireframe|mockup|prototipo)\b/i,
  
  // Comandos directos de diseño
  /^diseña(me)?\s+/i,
  /^crea(me)?\s+(una?\s*)?(imagen|diseño|app|interfaz|wireframe|mockup|diagrama)/i,
  /^genera(me)?\s+(una?\s*)?(imagen|diseño|visual)/i,
  /^haz(me)?\s+(una?\s*)?(imagen|diseño|app|interfaz|wireframe|mockup)/i,
];

// Keywords específicas de NanoBanana por dominio
const NANOBANA_DOMAIN_KEYWORDS = {
  ui: [
    'app', 'aplicación', 'interfaz', 'ui', 'ux', 'wireframe', 'mockup',
    'pantalla', 'screen', 'dashboard', 'landing', 'mobile', 'web',
    'componente', 'botón', 'formulario', 'navbar', 'sidebar'
  ],
  photo: [
    'foto', 'fotografía', 'imagen', 'producto', 'marketing', 'banner',
    'publicidad', 'anuncio', 'estudio', 'iluminación', 'composición',
    'render', 'escena'
  ],
  diagram: [
    'diagrama', 'flujo', 'flowchart', 'arquitectura', 'esquema',
    'proceso', 'secuencia', 'uml', 'erd', 'organigrama', 'mapa'
  ]
};

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
    
    // 1. Detectar intención de usar NanoBanana (prioridad alta)
    const nanobanaIntent = this.detectNanoBananaIntent(messageLower, message);
    if (nanobanaIntent.confidence >= 0.65) {
      return nanobanaIntent;
    }
    
    // 2. Detectar intención de crear prompt
    const promptIntent = this.detectCreatePromptIntent(messageLower, message);
    if (promptIntent.confidence >= 0.6) {
      return promptIntent;
    }
    
    // 3. Detectar intención de navegar
    const navigateIntent = this.detectNavigateIntent(messageLower);
    if (navigateIntent.confidence >= 0.6) {
      return navigateIntent;
    }
    
    // 4. Detectar si es una pregunta
    if (this.isQuestion(messageLower)) {
      return {
        intent: 'question',
        confidence: 0.7,
      };
    }
    
    // 5. Por defecto, es conversación general
    return {
      intent: 'general',
      confidence: 0.5,
    };
  }

  /**
   * Detecta intención de usar NanoBanana para generación visual
   */
  private static detectNanoBananaIntent(
    messageLower: string,
    originalMessage: string
  ): IntentResult {
    let confidence = 0;
    const entities: IntentResult['entities'] = {};
    
    // Verificar patrones de regex específicos de NanoBanana
    let matchedPatterns = 0;
    for (const pattern of NANOBANA_PATTERNS) {
      if (pattern.test(originalMessage) || pattern.test(messageLower)) {
        matchedPatterns++;
      }
    }
    
    // Mención directa de NanoBanana = alta confianza
    if (/\bnanobana(na)?\b/i.test(messageLower) || /\bnano\s*banana\b/i.test(messageLower)) {
      confidence = 0.95;
    } else if (matchedPatterns >= 2) {
      confidence = 0.8;
    } else if (matchedPatterns === 1) {
      confidence = 0.65;
    }
    
    // Detectar dominio específico
    let detectedDomain: 'ui' | 'photo' | 'diagram' | undefined;
    let domainScore = { ui: 0, photo: 0, diagram: 0 };
    
    for (const [domain, keywords] of Object.entries(NANOBANA_DOMAIN_KEYWORDS)) {
      const matches = keywords.filter(k => messageLower.includes(k)).length;
      domainScore[domain as keyof typeof domainScore] = matches;
    }
    
    const maxDomainScore = Math.max(domainScore.ui, domainScore.photo, domainScore.diagram);
    if (maxDomainScore > 0) {
      if (domainScore.ui === maxDomainScore) detectedDomain = 'ui';
      else if (domainScore.photo === maxDomainScore) detectedDomain = 'photo';
      else if (domainScore.diagram === maxDomainScore) detectedDomain = 'diagram';
      
      // Aumentar confianza si hay keywords de dominio
      confidence += 0.1;
    }
    
    // Detectar formato de salida preferido
    let outputFormat: 'wireframe' | 'mockup' | 'render' | 'diagram' | undefined;
    if (messageLower.includes('wireframe') || messageLower.includes('esquema') || messageLower.includes('boceto')) {
      outputFormat = 'wireframe';
    } else if (messageLower.includes('mockup') || messageLower.includes('prototipo') || messageLower.includes('alta fidelidad')) {
      outputFormat = 'mockup';
    } else if (messageLower.includes('render') || messageLower.includes('final')) {
      outputFormat = 'render';
    } else if (messageLower.includes('diagrama') || messageLower.includes('flowchart')) {
      outputFormat = 'diagram';
    }
    
    // Asignar entidades detectadas
    if (detectedDomain) {
      entities.nanobananaDomain = detectedDomain;
    }
    if (outputFormat) {
      entities.outputFormat = outputFormat;
    }
    
    // Limitar confianza máxima
    confidence = Math.min(confidence, 0.95);
    
    return {
      intent: 'nanobana',
      confidence,
      entities: Object.keys(entities).length > 0 ? entities : undefined,
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

