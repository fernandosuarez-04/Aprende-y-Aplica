/**
 * Servicio de traducción automática usando OpenAI
 * Traduce contenido educativo de español a inglés y portugués
 */

import { SupportedLanguage } from '../i18n/i18n';

type TargetLanguage = 'en' | 'pt';

interface TranslationOptions {
  context?: string;
  preserveFormatting?: boolean;
}

export class AutoTranslationService {
  private static readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  private static readonly OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  private static readonly OPENAI_BASE_URL = 'https://api.openai.com/v1/chat/completions';

  /**
   * Verifica si el servicio está configurado correctamente
   */
  private static isConfigured(): boolean {
    const isConfigured = !!this.OPENAI_API_KEY;
    console.log('[AutoTranslationService] Verificando configuración:', {
      hasApiKey: !!this.OPENAI_API_KEY,
      apiKeyLength: this.OPENAI_API_KEY?.length || 0,
      apiKeyPrefix: this.OPENAI_API_KEY ? `${this.OPENAI_API_KEY.substring(0, 7)}...` : 'N/A',
      model: this.OPENAI_MODEL,
      baseUrl: this.OPENAI_BASE_URL
    });
    
    if (!isConfigured) {
      console.error('[AutoTranslationService] ❌ OPENAI_API_KEY no está configurada en las variables de entorno');
      console.error('[AutoTranslationService] Variables de entorno disponibles:', {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasOpenAIModel: !!process.env.OPENAI_MODEL,
        nodeEnv: process.env.NODE_ENV
      });
    } else {
      console.log('[AutoTranslationService] ✅ OPENAI_API_KEY configurada correctamente');
    }
    return isConfigured;
  }

  /**
   * Traduce un texto individual de español a otro idioma
   */
  static async translateText(
    text: string,
    targetLanguage: TargetLanguage,
    options: TranslationOptions = {}
  ): Promise<string> {
    if (!text || text.trim().length === 0) {
      return text;
    }

    if (!this.isConfigured()) {
      console.warn('[AutoTranslationService] ⚠️ OPENAI_API_KEY no configurada, retornando texto original sin traducir');
      return text;
    }

    console.log(`[AutoTranslationService] Iniciando traducción de texto a ${targetLanguage} (longitud: ${text.length} caracteres)`);

    const languageNames = {
      en: 'inglés',
      pt: 'portugués brasileño'
    };

    const contextPrompt = options.context 
      ? `\n\nContexto: ${options.context}`
      : '';

    const systemPrompt = `Eres un traductor profesional especializado en contenido educativo y tecnológico. 
Tu tarea es traducir texto del español al ${languageNames[targetLanguage]} manteniendo:
- El tono profesional y preciso
- La terminología técnica correcta
- El formato y estructura original
- La claridad y precisión del contenido educativo

${options.preserveFormatting ? 'IMPORTANTE: Mantén todos los saltos de línea, numeración, listas y formato del texto original.' : ''}

Responde ÚNICAMENTE con la traducción, sin explicaciones ni comentarios adicionales.`;

    const userPrompt = `Traduce el siguiente texto de español a ${languageNames[targetLanguage]}.${contextPrompt}

Texto original:
${text}

Traducción:`;

    try {
      console.log(`[AutoTranslationService] Enviando solicitud a OpenAI API (modelo: ${this.OPENAI_MODEL})`);
      
      const response = await fetch(this.OPENAI_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: this.OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: 0.3, // Baja temperatura para traducciones más precisas
          max_tokens: Math.min(4000, Math.ceil(text.length * 2)), // Aproximadamente 2x el texto original
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = `OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`;
        console.error(`[AutoTranslationService] ❌ ${errorMessage}`);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const translatedText = data.choices[0]?.message?.content?.trim() || text;

      if (translatedText === text) {
        console.warn(`[AutoTranslationService] ⚠️ La traducción retornada es igual al texto original (posible error silencioso)`);
      } else {
        console.log(`[AutoTranslationService] ✅ Traducción exitosa: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}" → "${translatedText.substring(0, 50)}${translatedText.length > 50 ? '...' : ''}" (${targetLanguage})`);
      }
      
      return translatedText;
    } catch (error) {
      console.error(`[AutoTranslationService] ❌ Error traduciendo texto a ${targetLanguage}:`, error);
      if (error instanceof Error) {
        console.error(`[AutoTranslationService] Stack trace:`, error.stack);
      }
      // Retornar texto original en caso de error
      return text;
    }
  }

  /**
   * Traduce múltiples campos de un objeto
   */
  static async translateObject(
    obj: Record<string, any>,
    fields: string[],
    targetLanguage: TargetLanguage,
    options: TranslationOptions = {}
  ): Promise<Record<string, any>> {
    console.log(`[AutoTranslationService] translateObject: Iniciando traducción de ${fields.length} campos a ${targetLanguage}`, {
      fields,
      objKeys: Object.keys(obj)
    });

    const translations: Record<string, any> = {};

    // Traducir cada campo en paralelo para mejor rendimiento
    const translationPromises = fields.map(async (field) => {
      const value = obj[field];
      console.log(`[AutoTranslationService] translateObject: Procesando campo "${field}"`, {
        hasValue: value !== undefined && value !== null,
        type: typeof value,
        isString: typeof value === 'string',
        isArray: Array.isArray(value),
        stringLength: typeof value === 'string' ? value.length : 'N/A'
      });
      
      // Solo traducir si el campo existe y tiene contenido
      if (value === null || value === undefined || value === '') {
        return { field, translated: value };
      }

      // Si es un array, traducir cada elemento
      if (Array.isArray(value)) {
        const translatedArray = await Promise.all(
          value.map(async (item: any) => {
            if (typeof item === 'string' && item.trim().length > 0) {
              return await this.translateText(item, targetLanguage, options);
            }
            return item;
          })
        );
        return { field, translated: translatedArray };
      }

      // Si es un string, traducirlo
      if (typeof value === 'string' && value.trim().length > 0) {
        const translated = await this.translateText(value, targetLanguage, options);
        return { field, translated };
      }

      // Para otros tipos, mantener el valor original
      return { field, translated: value };
    });

    const results = await Promise.all(translationPromises);
    
    results.forEach(({ field, translated }) => {
      translations[field] = translated;
      console.log(`[AutoTranslationService] translateObject: Campo "${field}" traducido`, {
        original: typeof obj[field] === 'string' ? obj[field].substring(0, 50) : obj[field],
        translated: typeof translated === 'string' ? translated.substring(0, 50) : translated
      });
    });

    console.log(`[AutoTranslationService] translateObject: ✅ Traducción completada para ${Object.keys(translations).length} campos a ${targetLanguage}`);
    return translations;
  }

  /**
   * Traduce una entidad completa (objeto con múltiples campos)
   * Útil para traducir cursos, módulos, lecciones, etc.
   */
  static async translateEntity<T extends Record<string, any>>(
    entity: T,
    fields: string[],
    targetLanguage: TargetLanguage,
    entityType?: string,
    options: TranslationOptions = {}
  ): Promise<Record<string, any>> {
    console.log(`[AutoTranslationService] translateEntity: Iniciando traducción de entidad ${entityType || 'desconocida'} a ${targetLanguage}`, {
      entityType,
      fields,
      entityKeys: Object.keys(entity)
    });

    const context = entityType 
      ? `Este es un ${entityType} de una plataforma educativa sobre inteligencia artificial.`
      : options.context;

    const result = await this.translateObject(entity, fields, targetLanguage, {
      ...options,
      context,
      preserveFormatting: true, // Preservar formato para contenido educativo
    });

    console.log(`[AutoTranslationService] translateEntity: ✅ Traducción de entidad ${entityType || 'desconocida'} completada`, {
      translatedFields: Object.keys(result)
    });

    return result;
  }

  /**
   * Traduce a múltiples idiomas simultáneamente
   */
  static async translateToMultipleLanguages(
    text: string,
    targetLanguages: TargetLanguage[],
    options: TranslationOptions = {}
  ): Promise<Record<TargetLanguage, string>> {
    const translations = await Promise.all(
      targetLanguages.map(async (lang) => {
        const translated = await this.translateText(text, lang, options);
        return { lang, translated };
      })
    );

    const result: Record<TargetLanguage, string> = {} as Record<TargetLanguage, string>;
    translations.forEach(({ lang, translated }) => {
      result[lang] = translated;
    });

    return result;
  }

  /**
   * Traduce un objeto a múltiples idiomas simultáneamente
   */
  static async translateObjectToMultipleLanguages(
    obj: Record<string, any>,
    fields: string[],
    targetLanguages: TargetLanguage[],
    options: TranslationOptions = {}
  ): Promise<Record<TargetLanguage, Record<string, any>>> {
    const translations = await Promise.all(
      targetLanguages.map(async (lang) => {
        const translated = await this.translateObject(obj, fields, lang, options);
        return { lang, translated };
      })
    );

    const result: Record<TargetLanguage, Record<string, any>> = {} as Record<TargetLanguage, Record<string, any>>;
    translations.forEach(({ lang, translated }) => {
      result[lang] = translated;
    });

    return result;
  }
}

