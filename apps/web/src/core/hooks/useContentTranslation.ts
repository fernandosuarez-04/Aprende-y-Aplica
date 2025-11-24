import { useTranslation } from 'react-i18next';
import { SupportedLanguage } from '../i18n/i18n';

/**
 * Hook para traducir contenido dinámico de la base de datos
 * Usa el namespace 'content' que mapea IDs de BD a traducciones
 */
export function useContentTranslation() {
  const { t, i18n } = useTranslation('content');
  const currentLanguage = i18n.language as SupportedLanguage;

  /**
   * Traduce un campo de una entidad (curso, módulo, lección)
   * @param entityType Tipo de entidad: 'courses', 'modules', 'lessons'
   * @param entityId ID de la entidad en la base de datos
   * @param field Campo a traducir: 'title', 'description', etc.
   * @param fallbackValue Valor por defecto si no hay traducción
   */
  const translateField = (
    entityType: 'courses' | 'modules' | 'lessons',
    entityId: string,
    field: string,
    fallbackValue: string
  ): string => {
    // Si el idioma es español, retornar el valor original
    if (currentLanguage === 'es') {
      return fallbackValue;
    }

    // Intentar obtener la traducción
    const translationKey = `${entityType}.${entityId}.${field}`;
    const translation = t(translationKey, { defaultValue: '' });

    // Si no hay traducción, retornar el valor original
    return translation || fallbackValue;
  };

  /**
   * Traduce un objeto completo (curso, módulo, lección)
   * @param entityType Tipo de entidad
   * @param entity Objeto con los datos originales
   * @param fields Campos a traducir
   */
  const translateEntity = <T extends Record<string, any>>(
    entityType: 'courses' | 'modules' | 'lessons',
    entity: T,
    fields: string[]
  ): T => {
    // Si el idioma es español, retornar el objeto original
    if (currentLanguage === 'es' || !entity.id) {
      return entity;
    }

    const translated = { ...entity };

    fields.forEach(field => {
      if (entity[field]) {
        translated[field] = translateField(
          entityType,
          entity.id,
          field,
          entity[field]
        );
      }
    });

    return translated;
  };

  /**
   * Traduce un array de objetos
   * @param entityType Tipo de entidad
   * @param entities Array de objetos
   * @param fields Campos a traducir
   */
  const translateEntities = <T extends Record<string, any>>(
    entityType: 'courses' | 'modules' | 'lessons',
    entities: T[],
    fields: string[]
  ): T[] => {
    if (currentLanguage === 'es') {
      return entities;
    }

    return entities.map(entity => translateEntity(entityType, entity, fields));
  };

  return {
    translateField,
    translateEntity,
    translateEntities,
    currentLanguage,
  };
}
