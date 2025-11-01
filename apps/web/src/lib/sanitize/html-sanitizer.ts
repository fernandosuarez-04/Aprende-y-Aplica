/**
 * 🔒 HTML Sanitization Library
 * 
 * Previene ataques XSS sanitizando contenido HTML de usuarios antes de renderizar.
 * Usa DOMPurify con configuraciones específicas para diferentes contextos.
 * 
 * @package dompurify
 * @see https://github.com/cure53/DOMPurify
 */

import DOMPurify from 'dompurify';

/**
 * Configuraciones de sanitización por contexto
 */

// Configuración ESTRICTA - Solo texto plano, sin HTML
const STRICT_CONFIG = {
  ALLOWED_TAGS: [], // No permite ninguna etiqueta HTML
  ALLOWED_ATTR: [], // No permite ningún atributo
  KEEP_CONTENT: true, // Mantiene el contenido de texto, solo remueve tags
};

// Configuración BÁSICA - Formato de texto simple
const BASIC_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'b', 'i'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
};

// Configuración RICH TEXT - Contenido enriquecido (posts, comentarios)
const RICH_TEXT_CONFIG = {
  ALLOWED_TAGS: [
    // Texto
    'p', 'br', 'span', 'div',
    // Formato
    'strong', 'em', 'u', 'b', 'i', 's', 'del', 'mark',
    // Listas
    'ul', 'ol', 'li',
    // Encabezados
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Citas
    'blockquote', 'pre', 'code',
    // Enlaces
    'a',
  ],
  ALLOWED_ATTR: [
    'href', // Para links
    'title', // Para tooltips
    'class', // Para estilos (limitado a clases específicas)
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|sms):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
};

// Configuración COMPLETA - Contenido multimedia (cursos, posts avanzados)
const FULL_CONFIG = {
  ALLOWED_TAGS: [
    // Todo lo de RICH_TEXT
    'p', 'br', 'span', 'div',
    'strong', 'em', 'u', 'b', 'i', 's', 'del', 'mark',
    'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'pre', 'code',
    'a',
    // Multimedia
    'img', 'video', 'audio', 'source',
    // Tablas
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'class',
    // Multimedia
    'src', 'alt', 'width', 'height',
    'controls', 'autoplay', 'loop', 'muted',
    // Tablas
    'colspan', 'rowspan',
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|sms):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  KEEP_CONTENT: true,
};

/**
 * Tipos de contextos de sanitización
 */
export type SanitizationLevel = 'strict' | 'basic' | 'rich' | 'full';

/**
 * Opciones de sanitización
 */
export interface SanitizeOptions {
  level?: SanitizationLevel;
  customConfig?: any;
  maxLength?: number; // Longitud máxima del texto
}

/**
 * 🛡️ Sanitiza contenido HTML según el nivel de permisividad
 * 
 * @param dirtyHtml - Contenido HTML potencialmente peligroso
 * @param options - Opciones de sanitización
 * @returns HTML sanitizado y seguro
 * 
 * @example
 * ```typescript
 * // Biografía de usuario - solo texto básico
 * const safeBio = sanitizeHtml(userBio, { level: 'basic' });
 * 
 * // Post de comunidad - formato enriquecido
 * const safePost = sanitizeHtml(postContent, { level: 'rich' });
 * 
 * // Contenido de curso - multimedia permitido
 * const safeContent = sanitizeHtml(lessonContent, { level: 'full' });
 * ```
 */
export function sanitizeHtml(
  dirtyHtml: string | null | undefined,
  options: SanitizeOptions = {}
): string {
  // Si no hay contenido, retornar string vacío
  if (!dirtyHtml) return '';

  const { level = 'basic', customConfig, maxLength } = options;

  // Truncar si excede longitud máxima
  let content = dirtyHtml;
  if (maxLength && content.length > maxLength) {
    content = content.substring(0, maxLength) + '...';
  }

  // Seleccionar configuración según nivel
  let config: any;
  switch (level) {
    case 'strict':
      config = STRICT_CONFIG;
      break;
    case 'basic':
      config = BASIC_CONFIG;
      break;
    case 'rich':
      config = RICH_TEXT_CONFIG;
      break;
    case 'full':
      config = FULL_CONFIG;
      break;
    default:
      config = BASIC_CONFIG;
  }

  // Aplicar config personalizado si existe
  if (customConfig) {
    config = { ...config, ...customConfig };
  }

  // Sanitizar contenido
  try {
    const clean = DOMPurify.sanitize(content, config);
    return typeof clean === 'string' ? clean : String(clean);
  } catch (error) {
    console.error('❌ Error sanitizando HTML:', error);
    // En caso de error, retornar texto plano sin HTML
    return content.replace(/<[^>]*>/g, '');
  }
}

/**
 * 🛡️ Sanitización específica para biografías de usuario
 * Solo permite formato básico de texto
 */
export function sanitizeBio(bio: string | null | undefined, maxLength = 500): string {
  return sanitizeHtml(bio, { level: 'basic', maxLength });
}

/**
 * 🛡️ Sanitización específica para posts de comunidad
 * Permite formato enriquecido sin multimedia
 */
export function sanitizePost(content: string | null | undefined): string {
  return sanitizeHtml(content, { level: 'rich' });
}

/**
 * 🛡️ Sanitización específica para comentarios
 * Permite formato básico con links
 */
export function sanitizeComment(comment: string | null | undefined, maxLength = 1000): string {
  return sanitizeHtml(comment, { level: 'rich', maxLength });
}

/**
 * 🛡️ Sanitización específica para contenido de cursos
 * Permite multimedia y formato completo
 */
export function sanitizeCourseContent(content: string | null | undefined): string {
  return sanitizeHtml(content, { level: 'full' });
}

/**
 * 🛡️ Sanitización ESTRICTA - Solo texto plano
 * Útil para nombres, títulos, etc.
 */
export function sanitizeText(text: string | null | undefined, maxLength?: number): string {
  return sanitizeHtml(text, { level: 'strict', maxLength });
}

/**
 * 🔍 Verifica si un string contiene HTML potencialmente peligroso
 * Útil para logging o validación
 */
export function containsDangerousHtml(input: string): boolean {
  const dangerous = [
    /<script/i,
    /<iframe/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick, onerror, etc.
    /<embed/i,
    /<object/i,
  ];

  return dangerous.some(pattern => pattern.test(input));
}

/**
 * 📊 Estadísticas de sanitización (útil para debugging)
 */
export function getSanitizationStats(original: string, sanitized: string) {
  return {
    originalLength: original.length,
    sanitizedLength: sanitized.length,
    removedChars: original.length - sanitized.length,
    containedDangerousHtml: containsDangerousHtml(original),
    wasSanitized: original !== sanitized,
  };
}

// Re-exportar DOMPurify para casos avanzados
export { DOMPurify };
