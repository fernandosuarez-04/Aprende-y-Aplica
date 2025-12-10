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
import myCoursesEs from '../../../public/locales/es/my-courses.json';
import myCoursesEn from '../../../public/locales/en/my-courses.json';
import myCoursesPt from '../../../public/locales/pt/my-courses.json';
import statisticsResultsEs from '../../../public/locales/es/statistics-results.json';
import statisticsResultsEn from '../../../public/locales/en/statistics-results.json';
import statisticsResultsPt from '../../../public/locales/pt/statistics-results.json';
import communitiesEs from '../../../public/locales/es/communities.json';
import communitiesEn from '../../../public/locales/en/communities.json';
import communitiesPt from '../../../public/locales/pt/communities.json';
import newsEs from '../../../public/locales/es/news.json';
import newsEn from '../../../public/locales/en/news.json';
import newsPt from '../../../public/locales/pt/news.json';

export type SupportedLanguage = 'es' | 'en' | 'pt';

const resources: Resource = {
  es: {
    common: commonEs,
    dashboard: dashboardEs,
    content: contentEs,
    learn: learnEs,
    'my-courses': myCoursesEs,
    'statistics-results': statisticsResultsEs,
    communities: communitiesEs,
    news: newsEs,
  },
  en: {
    common: commonEn,
    dashboard: dashboardEn,
    content: contentEn,
    learn: learnEn,
    'my-courses': myCoursesEn,
    'statistics-results': statisticsResultsEn,
    communities: communitiesEn,
    news: newsEn,
  },
  pt: {
    common: commonPt,
    dashboard: dashboardPt,
    content: contentPt,
    learn: learnPt,
    'my-courses': myCoursesPt,
    'statistics-results': statisticsResultsPt,
    communities: communitiesPt,
    news: newsPt,
  },
};

let initialized = false;

export const initI18n = () => {
  if (!initialized && !i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      resources,
      lng: 'es',
      fallbackLng: 'es',
      ns: ['common', 'dashboard', 'content', 'learn', 'my-courses', 'statistics-results', 'communities', 'news'],
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

