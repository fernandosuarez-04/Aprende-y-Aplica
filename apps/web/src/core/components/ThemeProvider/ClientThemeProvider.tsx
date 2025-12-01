'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Importar ThemeProvider dinámicamente sin SSR
const ThemeProviderComponent = dynamic(
  () => import('./ThemeProvider').then(mod => ({ default: mod.ThemeProvider })),
  {
    ssr: false,
    loading: () => null
  }
);

export function ClientThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeProviderComponent>{children}</ThemeProviderComponent>;
}
