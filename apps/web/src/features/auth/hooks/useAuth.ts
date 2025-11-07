'use client'

import { useRouter } from 'next/navigation'
import useSWR from 'swr'

interface User {
  id: string
  email: string
  username: string
  first_name?: string
  last_name?: string
  display_name?: string
  cargo_rol?: string
  type_rol?: string
  profile_picture_url?: string
}

// Fetcher optimizado para autenticación
const authFetcher = async (url: string): Promise<User | null> => {
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    // Si no está autenticado, no es un error - simplemente no hay usuario
    if (response.status === 401 || response.status === 403) {
      return null
    }
    throw new Error('Error fetching user')
  }

  const data = await response.json()
  return data.success && data.user ? data.user : null
}

export function useAuth() {
  const router = useRouter()

  // SWR maneja el estado global, deduplicación y caché automáticamente
  const { data: user, error, isLoading, mutate } = useSWR<User | null>(
    '/api/auth/me',
    authFetcher,
    {
      // Configuración optimizada para autenticación
      revalidateOnFocus: false, // No revalidar al cambiar de pestaña (el usuario no cambia constantemente)
      revalidateOnReconnect: true, // Sí revalidar al reconectar (podría haber cambiado la sesión)
      dedupingInterval: 5000, // Deduplicar solicitudes dentro de 5 segundos - CLAVE para evitar múltiples llamadas
      refreshInterval: 0, // No hacer polling automático
      shouldRetryOnError: false, // No reintentar en errores (si no está autenticado, no hay que reintentar)
      errorRetryCount: 0, // No reintentar
      fallbackData: null, // Valor por defecto mientras carga
    }
  )

  const logout = async () => {
    try {
      // Llamar a la API de logout
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Limpiar caché de SWR inmediatamente
      await mutate(null, false)

      // SECURITY FIX: Redirigir a home page y forzar recarga completa
      // Usar window.location.href para asegurar limpieza total del estado
      window.location.href = '/'
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error during logout:', error)
      }
      // Fallback: limpiar caché y redirigir a home con recarga completa
      await mutate(null, false)
      window.location.href = '/'
    }
  }

  const refreshUser = async () => {
    try {
      // mutate() revalida y devuelve los nuevos datos
      const updatedUser = await mutate()
      return updatedUser ?? null
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error refreshing user:', error)
      }
      return null
    }
  }

  return {
    user: user ?? null,
    loading: isLoading,
    isLoading, // Alias para compatibilidad
    logout,
    refreshUser,
    isAuthenticated: !!user && !error,
  }
}