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
  organization_id?: string | null
  organization?: {
    id: string
    name: string
    logo_url?: string
    brand_logo_url?: string
    brand_favicon_url?: string
    favicon_url?: string
    slug?: string
  } | null
}

// Fetcher optimizado para autenticación
const authFetcher = async (url: string): Promise<User | null> => {
  try {
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
  } catch (error) {
    // Manejar errores de red de forma silenciosa
    // "Failed to fetch" puede ocurrir cuando el componente se desmonta durante la navegación
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      // Error de red esperado durante navegación - retornar null silenciosamente
      return null
    }

    if (process.env.NODE_ENV === 'development') {
      // console.warn('useAuth fetcher error:', error)
    }
    return null
  }
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
      onError: (error) => {
        // Ignorar errores de red esperados (Failed to fetch durante navegación)
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          return // No hacer nada, el fetcher ya retorna null
        }
      },
    }
  )

  const logout = async () => {
    try {
      // ⚠️ CRITICAL SECURITY FIX: Limpiar TODO el localStorage de auth PRIMERO
      if (typeof window !== 'undefined') {
        // Limpiar auth-storage (Zustand persist) - CRÍTICO
        localStorage.removeItem('auth-storage');
        // Limpiar tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        // Limpiar carrito
        const { useShoppingCartStore } = await import('@/core/stores/shoppingCartStore')
        useShoppingCartStore.getState().clearCart()
        useShoppingCartStore.getState().setUserId(null)
      }

      // Llamar a la API de logout para destruir cookies del servidor
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Limpiar caché de SWR completamente
      await mutate(null, false)

      // SECURITY FIX: Forzar recarga completa para limpiar todo el estado en memoria
      window.location.href = '/'
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error during logout:', error)
      }

      // ⚠️ CRITICAL: Asegurar limpieza incluso si hay error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        const { useShoppingCartStore } = await import('@/core/stores/shoppingCartStore')
        useShoppingCartStore.getState().clearCart()
        useShoppingCartStore.getState().setUserId(null)
      }

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
        // console.error('Error refreshing user:', error)
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