'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState, createContext, useContext } from 'react';
import { I18nextProvider } from 'react-i18next';
import type { i18n as I18nType } from 'i18next';

import { initI18n, SupportedLanguage } from '../i18n/i18n';

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'app-language';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [i18nInstance, setI18nInstance] = useState<I18nType | null>(null);
  const [language, setLanguageState] = useState<SupportedLanguage>('es');

  // Inicializar i18n solo en el cliente
  useEffect(() => {
    const instance = initI18n();
    setI18nInstance(instance);

    // Cargar idioma guardado
    const savedLanguage = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
    const initialLang = savedLanguage || 'es';
    setLanguageState(initialLang);
    document.documentElement.lang = initialLang;
    instance.changeLanguage(initialLang).catch(() => {});
  }, []);

  const changeLanguage = useCallback(
    (lang: SupportedLanguage) => {
      if (!i18nInstance) return;

      setLanguageState(lang);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, lang);
        document.documentElement.lang = lang;
      }
      i18nInstance.changeLanguage(lang).catch(() => {});
    },
    [i18nInstance]
  );

  const contextValue = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: changeLanguage,
    }),
    [language, changeLanguage]
  );

  // Siempre proporcionar el LanguageContext, pero solo I18nextProvider cuando i18n esté listo
  if (!i18nInstance) {
    return (
      <LanguageContext.Provider value={contextValue}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={contextValue}>
      <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within an I18nProvider');
  }
  return ctx;
}


