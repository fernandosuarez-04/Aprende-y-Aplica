'use client';

import i18n, { Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';

import commonEs from '../../../public/locales/es/common.json';
import commonEn from '../../../public/locales/en/common.json';
import commonPt from '../../../public/locales/pt/common.json';
import dashboardEs from '../../../public/locales/es/dashboard.json';
import dashboardEn from '../../../public/locales/en/dashboard.json';
import dashboardPt from '../../../public/locales/pt/dashboard.json';

export type SupportedLanguage = 'es' | 'en' | 'pt';

const resources: Resource = {
  es: {
    common: commonEs,
    dashboard: dashboardEs,
  },
  en: {
    common: commonEn,
    dashboard: dashboardEn,
  },
  pt: {
    common: commonPt,
    dashboard: dashboardPt,
  },
};

let initialized = false;

export const initI18n = () => {
  if (!initialized && !i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      resources,
      lng: 'es',
      fallbackLng: 'es',
      ns: ['common', 'dashboard'],
      defaultNS: 'common',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
    initialized = true;
  }

  return i18n;
};

