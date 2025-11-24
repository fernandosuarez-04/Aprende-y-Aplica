'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  initializeTheme: () => void;
  getSystemTheme: () => 'light' | 'dark';
  cleanup?: () => void;
}

// Función helper para obtener el tema del sistema
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Función helper para aplicar el tema al documento
const applyTheme = (resolvedTheme: 'light' | 'dark') => {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolvedTheme);
  root.style.colorScheme = resolvedTheme;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: getSystemTheme(),

      getSystemTheme,

      setTheme: (theme: Theme) => {
        set({ theme });
        
        // Resolver el tema basado en la selección
        let resolved: 'light' | 'dark';
        
        if (theme === 'system') {
          resolved = getSystemTheme();
        } else {
          resolved = theme;
        }
        
        set({ resolvedTheme: resolved });
        applyTheme(resolved);
      },

      initializeTheme: () => {
        // Solo ejecutar en el cliente
        if (typeof window === 'undefined') return;
        
        const { theme, cleanup } = get();
        
        // Limpiar listener anterior si existe
        if (cleanup) {
          cleanup();
        }
        
        // Obtener tema guardado o usar 'system' por defecto
        const savedTheme = theme || 'system';
        
        // Inicializar el tema
        get().setTheme(savedTheme);
        
        // Escuchar cambios en las preferencias del sistema
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
          const currentTheme = get().theme;
          // Solo actualizar si el tema actual es 'system'
          if (currentTheme === 'system') {
            const newResolvedTheme = getSystemTheme();
            set({ resolvedTheme: newResolvedTheme });
            applyTheme(newResolvedTheme);
          }
        };
        
        // Añadir listener para cambios en tiempo real
        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener('change', handleChange);
        } else {
          // Fallback para navegadores antiguos
          mediaQuery.addListener(handleChange);
        }
        
        // Guardar función de limpieza
        set({
          cleanup: () => {
            if (mediaQuery.removeEventListener) {
              mediaQuery.removeEventListener('change', handleChange);
            } else {
              mediaQuery.removeListener(handleChange);
            }
          }
        });
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({
        theme: state.theme,
      }),
      // Hydrate inicial con detección del sistema
      onRehydrateStorage: () => {
        return (state) => {
          if (state && typeof window !== 'undefined') {
            // Si el tema es 'system', detectar el tema actual del sistema
            if (state.theme === 'system') {
              const systemTheme = getSystemTheme();
              state.resolvedTheme = systemTheme;
              applyTheme(systemTheme);
            }
          }
        };
      },
    }
  )
);
