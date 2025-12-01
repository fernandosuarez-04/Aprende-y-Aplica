'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export type SupportedLanguage = 'es' | 'en' | 'pt';

let initialized = false;

// Función para cargar recursos dinámicamente
const loadResources = async (language: string, namespace: string) => {
  try {
    const module = await import(`../../../public/locales/${language}/${namespace}.json`);
    return module.default || module;
  } catch (error) {
    console.error(`Error loading translation ${language}/${namespace}:`, error);
    return {};
  }
};

export const initI18n = () => {
  if (typeof window === 'undefined') {
    // No inicializar en el servidor
    return i18n;
  }

  if (!initialized && !i18n.isInitialized) {
    i18n
      .use(initReactI18next)
      .init({
        lng: 'es',
        fallbackLng: 'es',
        ns: ['common', 'dashboard', 'content', 'learn'],
        defaultNS: 'common',
        interpolation: {
          escapeValue: false,
        },
        react: {
          useSuspense: false,
        },
        resources: {}, // Iniciar con recursos vacíos
      });

    // Cargar recursos iniciales para español
    const loadInitialResources = async () => {
      const namespaces = ['common', 'dashboard', 'content', 'learn'];
      const languages: SupportedLanguage[] = ['es', 'en', 'pt'];

      for (const lang of languages) {
        for (const ns of namespaces) {
          const resources = await loadResources(lang, ns);
          i18n.addResourceBundle(lang, ns, resources, true, true);
        }
      }
    };

    loadInitialResources().catch(console.error);
    initialized = true;
  }

  return i18n;
};

