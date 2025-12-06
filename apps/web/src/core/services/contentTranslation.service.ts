import { SupportedLanguage } from '../i18n/i18n';
import { createClient } from '@/lib/supabase/client';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

/**
 * Servicio para manejar traducciones de contenido dinámico desde la base de datos
 * Usa la tabla content_translations con JSONB
 */

type EntityType = 'course' | 'module' | 'lesson' | 'activity' | 'material';

interface ContentTranslations {
  [key: string]: string | string[]; // Cualquier campo traducido (soporta strings y arrays)
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
   * @param supabaseClient Cliente opcional de Supabase (para uso en servidor)
   */
  static async loadTranslations(
    entityType: EntityType,
    entityId: string,
    language: SupportedLanguage,
    supabaseClient?: any
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
      // Usar el cliente proporcionado (servidor) o crear uno nuevo (cliente)
      // IMPORTANTE: No importar createServerClient directamente aquí porque tiene 'server-only'
      // En su lugar, siempre usar createClient del cliente, o pasar el cliente del servidor como parámetro
      const supabase = supabaseClient || createClient();
      
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
      console.log(`[ContentTranslationService] ✅ Traducciones obtenidas para ${entityType}:${entityId}:${language}:`, Object.keys(translations));
      this.cache.set(cacheKey, translations);
      return translations;
    } catch (error) {
      console.error(`[ContentTranslationService] ❌ Error loading translations for ${entityType}:${entityId}:`, error);
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
   * @param supabaseClient Cliente opcional de Supabase (para uso en servidor)
   */
  static async translateArray<T extends Record<string, any>>(
    entityType: EntityType,
    array: T[],
    fields: string[],
    language: SupportedLanguage,
    supabaseClient?: any
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

      // Usar el cliente proporcionado (servidor) o crear uno nuevo (cliente)
      // IMPORTANTE: No importar createServerClient directamente aquí porque tiene 'server-only'
      // En su lugar, siempre usar createClient del cliente, o pasar el cliente del servidor como parámetro
      const supabase = supabaseClient || createClient();
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
   * @param supabaseClient - Cliente de Supabase opcional (para uso en servidor)
   */
  static async saveTranslation(
    entityType: EntityType,
    entityId: string,
    language: SupportedLanguage,
    translations: ContentTranslations,
    userId?: string,
    supabaseClient?: any // Cliente de Supabase opcional (para uso en servidor)
  ): Promise<boolean> {
    if (language === 'es') {
      console.log('[ContentTranslationService] No se guardan traducciones para español');
      return false; // No guardar traducciones para español
    }

    try {
      // Validar que tenemos traducciones para guardar
      if (!translations || Object.keys(translations).length === 0) {
        console.warn(`[ContentTranslationService] No hay traducciones para guardar para ${entityType}:${entityId}:${language}`);
        return false;
      }

      console.log(`[ContentTranslationService] Guardando traducción para ${entityType}:${entityId}:${language}`, {
        fields: Object.keys(translations),
        hasClient: !!supabaseClient,
        userId
      });

      // IMPORTANTE: Siempre usar SERVICE_ROLE_KEY para guardar traducciones
      // Esto bypassa RLS y permite escribir independientemente de los permisos del usuario
      console.log('[ContentTranslationService] Creando cliente con SERVICE_ROLE_KEY para bypass RLS...');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('[ContentTranslationService] ❌ No se puede crear cliente: faltan variables de entorno');
        console.error('[ContentTranslationService] Requerido:', {
          hasSupabaseUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey,
          supabaseUrl: supabaseUrl ? '✅' : '❌',
          serviceKey: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 7)}...` : '❌'
        });
        return false;
      }
      
      const supabase = createServiceClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      console.log('[ContentTranslationService] ✅ Cliente con SERVICE_ROLE_KEY creado exitosamente');

      const upsertData = {
        entity_type: entityType,
        entity_id: entityId,
        language_code: language,
        translations: translations,
        created_by: userId || null,
        updated_at: new Date().toISOString()
      };

      console.log(`[ContentTranslationService] Datos a insertar/actualizar:`, {
        entity_type: upsertData.entity_type,
        entity_id: upsertData.entity_id,
        language_code: upsertData.language_code,
        translations_keys: Object.keys(upsertData.translations),
        created_by: upsertData.created_by
      });

      console.log(`[ContentTranslationService] Ejecutando upsert en Supabase...`);
      console.log(`[ContentTranslationService] Tabla: content_translations`);
      console.log(`[ContentTranslationService] Datos completos:`, JSON.stringify(upsertData, null, 2));
      
      const { data, error } = await supabase
        .from('content_translations')
        .upsert(upsertData, {
          onConflict: 'entity_type,entity_id,language_code'
        })
        .select();

      console.log(`[ContentTranslationService] Respuesta de Supabase:`, {
        hasData: !!data,
        dataLength: data?.length || 0,
        hasError: !!error,
        errorMessage: error?.message,
        errorCode: error?.code
      });

      if (error) {
        console.error(`[ContentTranslationService] ❌ Error guardando traducción para ${entityType}:${entityId}:${language}:`, error);
        console.error(`[ContentTranslationService] Detalles del error:`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        console.error(`[ContentTranslationService] Stack completo del error:`, JSON.stringify(error, null, 2));
        return false;
      }

      console.log(`[ContentTranslationService] ✅ Traducción guardada exitosamente para ${entityType}:${entityId}:${language}`);
      console.log(`[ContentTranslationService] Datos guardados:`, JSON.stringify(data, null, 2));

      // Limpiar caché
      const cacheKey = this.getCacheKey(entityType, entityId, language);
      this.cache.delete(cacheKey);

      return true;
    } catch (error) {
      console.error(`[ContentTranslationService] ❌ Excepción al guardar traducción para ${entityType}:${entityId}:${language}:`, error);
      if (error instanceof Error) {
        console.error(`[ContentTranslationService] Stack trace:`, error.stack);
      }
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
