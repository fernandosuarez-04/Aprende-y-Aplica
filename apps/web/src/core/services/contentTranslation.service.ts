import { SupportedLanguage } from '../i18n/i18n';
import { createClient } from '@/lib/supabase/client';

/**
 * Servicio para manejar traducciones de contenido dinámico desde la base de datos
 * Usa la tabla content_translations con JSONB
 */

type EntityType = 'course' | 'module' | 'lesson' | 'activity' | 'material';

interface ContentTranslations {
  [key: string]: string; // Cualquier campo traducido
}

export class ContentTranslationService {
  private static cache: Map<string, ContentTranslations> = new Map();

  /**
   * Genera clave de caché
   */
  private static getCacheKey(
    entityType: EntityType,
    entityId: string,
    language: SupportedLanguage
  ): string {
    return `${entityType}:${entityId}:${language}`;
  }

  /**
   * Obtiene las traducciones de una entidad desde la BD
   */
  static async loadTranslations(
    entityType: EntityType,
    entityId: string,
    language: SupportedLanguage
  ): Promise<ContentTranslations> {
    // Si es español, retornar vacío (usar valores originales)
    if (language === 'es') {
      return {};
    }

    // Verificar caché
    const cacheKey = this.getCacheKey(entityType, entityId, language);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('content_translations')
        .select('translations')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('language_code', language)
        .single();

      if (error || !data) {
        console.log(`[ContentTranslationService] No translations found for ${entityType}:${entityId}:${language}`, error);
        // No hay traducciones, guardar objeto vacío en caché
        this.cache.set(cacheKey, {});
        return {};
      }

      // Guardar en caché
      const translations = data.translations as ContentTranslations;
      this.cache.set(cacheKey, translations);
      return translations;
    } catch (error) {
      console.error(`Error loading translations for ${entityType}:${entityId}:`, error);
      return {};
    }
  }

  /**
   * Obtiene la traducción de un campo específico
   */
  static async getTranslation(
    entityType: EntityType,
    entityId: string,
    field: string,
    language: SupportedLanguage,
    fallback: string
  ): Promise<string> {
    if (language === 'es') {
      return fallback;
    }

    const translations = await this.loadTranslations(entityType, entityId, language);
    return translations[field] || fallback;
  }

  /**
   * Traduce un objeto completo
   */
  static async translateObject<T extends Record<string, any>>(
    entityType: EntityType,
    obj: T,
    fields: string[],
    language: SupportedLanguage
  ): Promise<T> {
    if (language === 'es' || !obj.id) {
      return obj;
    }

    const translations = await this.loadTranslations(entityType, obj.id, language);
    
    if (Object.keys(translations).length === 0) {
      return obj;
    }

    const translated = { ...obj } as any;
    fields.forEach(field => {
      if (translations[field]) {
        translated[field] = translations[field];
      }
    });

    return translated;
  }

  /**
   * Traduce un array de objetos (batch)
   */
  static async translateArray<T extends Record<string, any>>(
    entityType: EntityType,
    array: T[],
    fields: string[],
    language: SupportedLanguage
  ): Promise<T[]> {
    if (language === 'es' || array.length === 0) {
      return array;
    }

    try {
      // Obtener todos los IDs
      const entityIds = array.map(item => item.id).filter(Boolean);
      
      console.log(`[translateArray] Translating ${entityIds.length} ${entityType}s to ${language}`, entityIds);
      
      if (entityIds.length === 0) {
        return array;
      }

      // Hacer una sola query para todas las traducciones
      const supabase = createClient();
      const { data, error } = await supabase
        .from('content_translations')
        .select('entity_id, translations')
        .eq('entity_type', entityType)
        .eq('language_code', language)
        .in('entity_id', entityIds);

      console.log('[translateArray] Query result:', { data, error, count: data?.length });

      if (error || !data) {
        console.warn('[translateArray] No translations found or error:', error);
        return array;
      }

      // Crear mapa de traducciones
      const translationsMap = new Map<string, ContentTranslations>();
      data.forEach((item: any) => {
        translationsMap.set(item.entity_id, item.translations as ContentTranslations);
        // Guardar en caché
        const cacheKey = this.getCacheKey(entityType, item.entity_id, language);
        this.cache.set(cacheKey, item.translations as ContentTranslations);
      });

      console.log(`[translateArray] Loaded ${translationsMap.size} translation sets`);

      // Aplicar traducciones
      return array.map(item => {
        if (!item.id) return item;
        
        const translations = translationsMap.get(item.id);
        if (!translations) {
          console.log(`[translateArray] No translation for entity ${item.id}`);
          return item;
        }

        console.log(`[translateArray] Applying translations for ${item.id}:`, translations);

        const translated = { ...item } as any;
        fields.forEach(field => {
          if (translations[field]) {
            translated[field] = translations[field];
          }
        });
        return translated;
      });
    } catch (error) {
      console.error('Error translating array:', error);
      return array;
    }
  }

  /**
   * Guarda o actualiza una traducción (para admin)
   */
  static async saveTranslation(
    entityType: EntityType,
    entityId: string,
    language: SupportedLanguage,
    translations: ContentTranslations,
    userId?: string
  ): Promise<boolean> {
    if (language === 'es') {
      return false; // No guardar traducciones para español
    }

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('content_translations')
        .upsert({
          entity_type: entityType,
          entity_id: entityId,
          language_code: language,
          translations: translations,
          created_by: userId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'entity_type,entity_id,language_code'
        });

      if (error) {
        console.error('Error saving translation:', error);
        return false;
      }

      // Limpiar caché
      const cacheKey = this.getCacheKey(entityType, entityId, language);
      this.cache.delete(cacheKey);

      return true;
    } catch (error) {
      console.error('Error in saveTranslation:', error);
      return false;
    }
  }

  /**
   * Limpia el caché de traducciones
   */
  static clearCache(): void {
    this.cache.clear();
  }
}
