'use client'

import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'system'

// Función helper para obtener el tema del sistema
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Función helper para resolver el tema
const resolveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return getSystemTheme()
  }
  return theme
}

export function useTheme() {
  // Inicializar con el tema correcto desde el principio
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system'
    const savedTheme = localStorage.getItem('theme') as Theme
    return savedTheme || 'system'
  })
  
  // Inicializar resolvedTheme correctamente desde el principio
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    const savedTheme = localStorage.getItem('theme') as Theme
    return resolveTheme(savedTheme || 'system')
  })

  useEffect(() => {
    // Resolver el tema cuando cambia
    const newResolvedTheme = resolveTheme(theme)
    setResolvedTheme(newResolvedTheme)
  }, [theme])

  // Escuchar cambios en las preferencias del sistema cuando el tema es 'system'
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const newResolvedTheme = getSystemTheme()
      setResolvedTheme(newResolvedTheme)
    }

    // Agregar listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      // Fallback para navegadores antiguos
      mediaQuery.addListener(handleChange)
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [theme])

  useEffect(() => {
    // Aplicar el tema al DOM solo cuando resolvedTheme cambie
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
