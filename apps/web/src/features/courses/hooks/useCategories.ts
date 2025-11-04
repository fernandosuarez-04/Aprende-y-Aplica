'use client'

import { useState, useEffect } from 'react'

interface Category {
  id: string
  name: string
  active: boolean
}

interface UseCategoriesReturn {
  categories: Category[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/categories', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }
      
      const data: string[] = await response.json()
      
      // Crear categorías dinámicas basadas en los datos de la API
      const dynamicCategories: Category[] = [
        { id: 'all', name: 'Todos', active: true },
        { id: 'favorites', name: 'Favoritos', active: false },
        ...data.map(category => ({
          id: category.toLowerCase(),
          name: category,
          active: false
        }))
      ]
      
      setCategories(dynamicCategories)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error fetching categories:', err)
      
      // Fallback a categorías por defecto si hay error
      setCategories([
        { id: 'all', name: 'Todos', active: true },
        { id: 'favorites', name: 'Favoritos', active: false },
        { id: 'ia', name: 'IA', active: false },
        { id: 'datos', name: 'Datos', active: false },
        { id: 'desarrollo', name: 'Desarrollo', active: false },
        { id: 'diseno', name: 'Diseño', active: false },
        { id: 'it', name: 'IT & Software', active: false },
        { id: 'marketing', name: 'Marketing', active: false },
        { id: 'negocios', name: 'Negocios', active: false },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories
  }
}
