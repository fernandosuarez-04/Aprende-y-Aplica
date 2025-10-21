'use client'

import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'system'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    // Obtener tema guardado del localStorage
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    const root = window.document.documentElement

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      setResolvedTheme(systemTheme)
    } else {
      setResolvedTheme(theme)
    }
  }, [theme])

  useEffect(() => {
    const root = window.document.documentElement

    // Remover clases anteriores
    root.classList.remove('light', 'dark')

    // Agregar clase actual
    root.classList.add(resolvedTheme)

    // Guardar en localStorage
    localStorage.setItem('theme', theme)
  }, [theme, resolvedTheme])

  const toggleTheme = () => {
    setTheme(prev => {
      switch (prev) {
        case 'light':
          return 'dark'
        case 'dark':
          return 'system'
        case 'system':
          return 'light'
        default:
          return 'dark'
      }
    })
  }

  const setThemeMode = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  return {
    theme,
    resolvedTheme,
    toggleTheme,
    setTheme: setThemeMode,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isSystem: theme === 'system'
  }
}
