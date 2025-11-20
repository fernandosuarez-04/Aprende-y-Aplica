import { useEffect } from 'react';
import { useLanguage } from '../providers/I18nProvider';
import { ContentTranslationService } from '../services/contentTranslation.service';

/**
 * Higher Order Component que automáticamente traduce el contenido
 * Uso: const TranslatedCourses = withContentTranslation(CoursesComponent, 'courses', ['title', 'description'])
 */
export function withContentTranslation<P extends { data?: any[] }>(
  Component: React.ComponentType<P>,
  entityType: 'courses' | 'modules' | 'lessons',
  fieldsToTranslate: string[]
) {
  return function WithContentTranslation(props: P) {
    const { language } = useLanguage();

    // Cargar traducciones cuando cambia el idioma
    useEffect(() => {
      ContentTranslationService.loadTranslations(language);
    }, [language]);

    // Traducir los datos si existen
    const translatedData = props.data
      ? ContentTranslationService.translateArray(
          language,
          entityType,
          props.data,
          fieldsToTranslate
        )
      : props.data;

    return <Component {...props} data={translatedData} />;
  };
}

/**
 * Hook que traduce automáticamente un array de entidades
 */
export function useTranslatedContent<T extends Record<string, any>>(
  entityType: 'courses' | 'modules' | 'lessons',
  data: T[] | null | undefined,
  fields: string[]
): T[] {
  const { language } = useLanguage();

  useEffect(() => {
    ContentTranslationService.loadTranslations(language);
  }, [language]);

  if (!data) {
    return [];
  }

  return ContentTranslationService.translateArray(language, entityType, data, fields);
}

/**
 * Hook que traduce automáticamente un objeto
 */
export function useTranslatedObject<T extends Record<string, any>>(
  entityType: 'courses' | 'modules' | 'lessons',
  data: T | null | undefined,
  fields: string[]
): T | null {
  const { language } = useLanguage();

  useEffect(() => {
    ContentTranslationService.loadTranslations(language);
  }, [language]);

  if (!data) {
    return null;
  }

  return ContentTranslationService.translateObject(language, entityType, data, fields);
}
