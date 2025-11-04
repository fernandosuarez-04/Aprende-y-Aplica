'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'

interface UseFavoritesReturn {
  favorites: string[]
  loading: boolean
  error: string | null
  toggleFavorite: (courseId: string) => Promise<boolean>
  isFavorite: (courseId: string) => boolean
  refetch: () => Promise<void>
}

export function useFavorites(): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchFavorites = async () => {
    if (!user?.id) {
      setFavorites([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/favorites?userId=${user.id}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        // Si es un error 500, probablemente es un problema de configuración
        if (response.status === 500) {
          const errorData = await response.json().catch(() => ({ error: response.statusText }))
          console.warn('Error 500 en favoritos:', errorData.message || errorData.error)
          setFavorites([]) // Devolver array vacío en lugar de error
          return
        }
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setFavorites(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      
      // Si es un error de configuración, no mostrar error al usuario
      if (errorMessage.includes('Variables de entorno') || errorMessage.includes('500')) {
        console.warn('Supabase no configurado, usando favoritos vacíos')
        setFavorites([])
        setError(null)
      } else {
        setError(errorMessage)
        console.error('Error fetching favorites:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (courseId: string): Promise<boolean> => {
    if (!user?.id) {
      setError('Debes estar autenticado para usar favoritos')
      return false
    }

    try {
      setError(null)
      
      const response = await fetch('/api/favorites', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          courseId
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`)
      }
      
      const { isFavorite: newFavoriteStatus } = await response.json()
      
      // Actualizar el estado local
      if (newFavoriteStatus) {
        setFavorites(prev => [...prev, courseId])
      } else {
        setFavorites(prev => prev.filter(id => id !== courseId))
      }
      
      return newFavoriteStatus
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error toggling favorite:', err)
      return false
    }
  }

  const isFavorite = (courseId: string): boolean => {
    return favorites.includes(courseId)
  }

  useEffect(() => {
    fetchFavorites()
  }, [user?.id])

  return {
    favorites,
    loading,
    error,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites
  }
}
