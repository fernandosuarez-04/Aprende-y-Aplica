'use client';

import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  initializeTheme: () => void;
  getSystemTheme: () => 'light' | 'dark';
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

  // Guardar en localStorage manualmente
  try {
    localStorage.setItem('theme-storage', JSON.stringify({ theme: resolvedTheme }));
  } catch (error) {
    console.error('Error saving theme:', error);
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
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

    // Intentar cargar tema guardado
    try {
      const saved = localStorage.getItem('theme-storage');
      if (saved) {
        const { theme } = JSON.parse(saved);
        if (theme) {
          get().setTheme(theme);
          return;
        }
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }

    // Si no hay tema guardado, usar 'system'
    get().setTheme('system');

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
  },
}));
