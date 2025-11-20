import { SupportedLanguage } from '../i18n/i18n';

/**
 * Servicio para manejar traducciones de contenido dinámico de base de datos
 * Sin modificar el esquema de la base de datos
 */

type EntityType = 'courses' | 'modules' | 'lessons';

interface ContentTranslations {
  courses: Record<string, Record<string, string>>;
  modules: Record<string, Record<string, string>>;
  lessons: Record<string, Record<string, string>>;
}

export class ContentTranslationService {
  private static translations: Map<SupportedLanguage, ContentTranslations> = new Map();

  /**
   * Carga las traducciones desde los archivos JSON
   */
  static async loadTranslations(language: SupportedLanguage): Promise<void> {
    if (this.translations.has(language)) {
      return; // Ya están cargadas
    }

    try {
      const response = await fetch(`/locales/${language}/content.json`);
      const data = await response.json();
      this.translations.set(language, data);
    } catch (error) {
      console.error(`Error loading translations for ${language}:`, error);
      // Inicializar con estructura vacía
      this.translations.set(language, {
        courses: {},
        modules: {},
        lessons: {},
      });
    }
  }

  /**
   * Obtiene la traducción de un campo específico
   */
  static getTranslation(
    language: SupportedLanguage,
    entityType: EntityType,
    entityId: string,
    field: string,
    fallback: string
  ): string {
    // Si es español, retornar el valor original
    if (language === 'es') {
      return fallback;
    }

    const translations = this.translations.get(language);
    if (!translations) {
      return fallback;
    }

    const entityTranslations = translations[entityType]?.[entityId];
    return entityTranslations?.[field] || fallback;
  }

  /**
   * Traduce un objeto completo
   */
  static translateObject<T extends Record<string, any>>(
    language: SupportedLanguage,
    entityType: EntityType,
    obj: T,
    fields: string[]
  ): T {
    if (language === 'es' || !obj.id) {
      return obj;
    }

    const translated = { ...obj };
    fields.forEach(field => {
      if (obj[field]) {
        translated[field] = this.getTranslation(
          language,
          entityType,
          obj.id,
          field,
          obj[field]
        );
      }
    });

    return translated;
  }

  /**
   * Traduce un array de objetos
   */
  static translateArray<T extends Record<string, any>>(
    language: SupportedLanguage,
    entityType: EntityType,
    array: T[],
    fields: string[]
  ): T[] {
    if (language === 'es') {
      return array;
    }

    return array.map(item => this.translateObject(language, entityType, item, fields));
  }

  /**
   * Verifica si hay traducción disponible para un campo
   */
  static hasTranslation(
    language: SupportedLanguage,
    entityType: EntityType,
    entityId: string,
    field: string
  ): boolean {
    if (language === 'es') {
      return true;
    }

    const translations = this.translations.get(language);
    return !!translations?.[entityType]?.[entityId]?.[field];
  }

  /**
   * Agrega o actualiza una traducción (para admin)
   */
  static async updateTranslation(
    language: SupportedLanguage,
    entityType: EntityType,
    entityId: string,
    field: string,
    value: string
  ): Promise<void> {
    // Cargar traducciones si no están cargadas
    await this.loadTranslations(language);

    const translations = this.translations.get(language);
    if (!translations) {
      return;
    }

    // Actualizar en memoria
    if (!translations[entityType][entityId]) {
      translations[entityType][entityId] = {};
    }
    translations[entityType][entityId][field] = value;

    // Nota: En producción, esto debería guardarse en el servidor
    // Por ahora solo actualiza en memoria
    console.log(`Translation updated: ${language}/${entityType}/${entityId}/${field}`);
  }

  /**
   * Limpia el caché de traducciones
   */
  static clearCache(): void {
    this.translations.clear();
  }
}
