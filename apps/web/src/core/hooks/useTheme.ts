'use client'

import { useThemeStore, Theme } from '@/core/stores/themeStore'

export function useTheme() {
  const { theme, resolvedTheme, setTheme, initializeTheme } = useThemeStore()

  const isDark = resolvedTheme === 'dark'
  const isLight = resolvedTheme === 'light'
  const isSystem = theme === 'system'

  const toggleTheme = () => {
    if (isSystem) {
      setTheme('light')
    } else if (isLight) {
      setTheme('dark')
    } else {
      setTheme('system')
    }
  }

  return {
    theme,
    resolvedTheme,
    isDark,
    isLight,
    isSystem,
    toggleTheme,
    setTheme: (t: Theme) => setTheme(t),
    initializeTheme,
  }
}
