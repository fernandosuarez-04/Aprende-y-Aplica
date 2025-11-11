'use client'

import useSWR from 'swr'
import { useAuth } from '../../auth/hooks/useAuth'

interface UseFavoritesReturn {
  favorites: string[]
  loading: boolean
  error: string | null
  toggleFavorite: (courseId: string) => Promise<boolean>
  isFavorite: (courseId: string) => boolean
  refetch: () => Promise<void>
}

// ⚡ Fetcher optimizado para SWR
const favoritesFetcher = async (url: string): Promise<string[]> => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    // Si es un error 500, devolver array vacío (problema de configuración)
    if (response.status === 500) {
      return []
    }
    throw new Error(`Error ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

export function useFavorites(): UseFavoritesReturn {
  const { user } = useAuth()

  // ⚡ SWR con cache y deduplicación
  const url = user?.id ? `/api/favorites?userId=${user.id}` : null

  const { data: favorites = [], error, isLoading, mutate } = useSWR<string[]>(
    url,
    favoritesFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // 10s deduplication
      refreshInterval: 0,
      shouldRetryOnError: false,
      fallbackData: [],
    }
  )

  const toggleFavorite = async (courseId: string): Promise<boolean> => {
    if (!user?.id) {
      return false
    }

    // Guardar el valor anterior ANTES del optimistic update
    const previousFavorites = [...favorites]

    try {
      // ⚡ Optimistic update
      const isCurrentlyFavorite = favorites.includes(courseId)
      const optimisticFavorites = isCurrentlyFavorite
        ? favorites.filter(id => id !== courseId)
        : [...favorites, courseId]

      // Update UI immediately
      mutate(optimisticFavorites, false)

      const response = await fetch('/api/favorites', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, courseId })
      })

      if (!response.ok) {
        // Rollback usando el valor guardado anteriormente
        mutate(previousFavorites, false)
        throw new Error(`Error ${response.status}`)
      }

      const { isFavorite: newFavoriteStatus } = await response.json()

      // Revalidate to ensure consistency
      await mutate()

      return newFavoriteStatus
    } catch (err) {
      // Rollback usando el valor guardado anteriormente
      mutate(previousFavorites, false)
      return false
    }
  }

  const isFavorite = (courseId: string): boolean => {
    return favorites.includes(courseId)
  }

  return {
    favorites,
    loading: isLoading,
    error: error?.message || null,
    toggleFavorite,
    isFavorite,
    refetch: mutate
  }
}
