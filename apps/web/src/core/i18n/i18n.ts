'use client';

import i18n, { Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';

import commonEs from '../../../public/locales/es/common.json';
import commonEn from '../../../public/locales/en/common.json';
import commonPt from '../../../public/locales/pt/common.json';
import dashboardEs from '../../../public/locales/es/dashboard.json';
import dashboardEn from '../../../public/locales/en/dashboard.json';
import dashboardPt from '../../../public/locales/pt/dashboard.json';
import contentEs from '../../../public/locales/es/content.json';
import contentEn from '../../../public/locales/en/content.json';
import contentPt from '../../../public/locales/pt/content.json';
import learnEs from '../../../public/locales/es/learn.json';
import learnEn from '../../../public/locales/en/learn.json';
import learnPt from '../../../public/locales/pt/learn.json';

export type SupportedLanguage = 'es' | 'en' | 'pt';

const resources: Resource = {
  es: {
    common: commonEs,
    dashboard: dashboardEs,
    content: contentEs,
    learn: learnEs,
  },
  en: {
    common: commonEn,
    dashboard: dashboardEn,
    content: contentEn,
    learn: learnEn,
  },
  pt: {
    common: commonPt,
    dashboard: dashboardPt,
    content: contentPt,
    learn: learnPt,
  },
};

let initialized = false;

export const initI18n = () => {
  if (!initialized && !i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      resources,
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
    });
    initialized = true;
  }

  return i18n;
};

