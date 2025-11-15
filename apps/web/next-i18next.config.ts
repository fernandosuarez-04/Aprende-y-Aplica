import path from 'path';
import type { UserConfig } from 'next-i18next';

const i18nConfig: UserConfig = {
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', 'pt'],
    localeDetection: true,
  },
  defaultNS: 'common',
  fallbackLng: 'es',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  localePath: path.resolve('./public/locales'),
};

export default i18nConfig;

