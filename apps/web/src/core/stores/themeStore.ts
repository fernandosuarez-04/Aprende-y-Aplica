'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  initializeTheme: () => void;
  cleanup?: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'dark',

      setTheme: (theme: Theme) => {
        set({ theme });
        
        // Resolver el tema basado en la selección
        let resolved: 'light' | 'dark' = 'dark';
        
        if (theme === 'system') {
          resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } else {
          resolved = theme;
        }
        
        set({ resolvedTheme: resolved });
        
        // Aplicar el tema al documento - solo si estamos en el cliente
        if (typeof window !== 'undefined') {
          if (resolved === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
            document.documentElement.style.colorScheme = 'dark';
          } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
            document.documentElement.style.colorScheme = 'light';
          }
        }
      },

      initializeTheme: () => {
        // Solo ejecutar en el cliente
        if (typeof window === 'undefined') return;
        
        const { theme, cleanup } = get();
        
        // Limpiar listener anterior si existe
        if (cleanup) {
          cleanup();
        }
        
        get().setTheme(theme);
        
        // Escuchar cambios en las preferencias del sistema
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
          if (get().theme === 'system') {
            get().setTheme('system');
          }
        };
        
        mediaQuery.addEventListener('change', handleChange);
        
        // Guardar función de limpieza
        set({
          cleanup: () => {
            mediaQuery.removeEventListener('change', handleChange);
          }
        });
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
);
