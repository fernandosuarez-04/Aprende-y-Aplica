'use client'

import { useState, useEffect } from 'react'
import { AdminPrompt, PromptStats } from '../services/adminPrompts.service'

export function useAdminPrompts() {
  const [prompts, setPrompts] = useState<AdminPrompt[]>([])
  const [stats, setStats] = useState<PromptStats>({
    totalPrompts: 0,
    activePrompts: 0,
    featuredPrompts: 0,
    totalLikes: 0,
    totalViews: 0,
    totalDownloads: 0,
    averageRating: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrompts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🔄 useAdminPrompts: Cargando prompts...')
      
      const response = await fetch('/api/admin/prompts')
      const data = await response.json()
      
      console.log('📡 Respuesta de API prompts:', data)
      
      if (data.success) {
        setPrompts(data.prompts || [])
        setStats(data.stats || {
          totalPrompts: 0,
          activePrompts: 0,
          featuredPrompts: 0,
          totalLikes: 0,
          totalViews: 0,
          totalDownloads: 0,
          averageRating: 0
        })
        console.log('✅ Prompts cargados exitosamente:', data.prompts?.length || 0)
      } else {
        console.error('❌ Error en respuesta:', data.error)
        setError(data.error || 'Error al cargar prompts')
      }
    } catch (err) {
      console.error('💥 Error loading prompts:', err)
      setError('Error de conexión al cargar prompts')
    } finally {
      setIsLoading(false)
    }
  }

  const createPrompt = async (promptData: Partial<AdminPrompt>) => {
    try {
      console.log('🔄 useAdminPrompts: Creando prompt...', promptData)
      
      const response = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(promptData)
      })
      
      const data = await response.json()
      console.log('📡 Respuesta de API crear prompt:', data)
      
      if (!response.ok) {
        // Si la respuesta no es OK, hay un error
        const errorMessage = data.message || data.error || `Error al crear prompt (${response.status})`
        
        // Si hay errores de validación, formatearlos
        if (data.errors && Array.isArray(data.errors)) {
          const validationErrors = data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ')
          throw new Error(`${errorMessage}: ${validationErrors}`)
        }
        
        throw new Error(errorMessage)
      }
      
      if (data.success) {
        await fetchPrompts() // Recargar la lista
        console.log('✅ Prompt creado exitosamente')
        return { success: true, prompt: data.prompt }
      } else {
        const errorMessage = data.message || data.error || 'Error al crear prompt'
        
        // Si hay errores de validación, formatearlos
        if (data.errors && Array.isArray(data.errors)) {
          const validationErrors = data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ')
          throw new Error(`${errorMessage}: ${validationErrors}`)
        }
        
        throw new Error(errorMessage)
      }
    } catch (err) {
      console.error('💥 Error creating prompt:', err)
      throw err
    }
  }

  const updatePrompt = async (promptId: string, promptData: Partial<AdminPrompt>) => {
    try {
      console.log('🔄 useAdminPrompts: Actualizando prompt...', promptData)
      
      const response = await fetch(`/api/admin/prompts/${promptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(promptData)
      })
      
      const data = await response.json()
      console.log('📡 Respuesta de API actualizar prompt:', data)
      
      if (!response.ok) {
        // Si la respuesta no es OK, hay un error
        const errorMessage = data.message || data.error || `Error al actualizar prompt (${response.status})`
        
        // Si hay errores de validación, formatearlos
        if (data.errors && Array.isArray(data.errors)) {
          const validationErrors = data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ')
          throw new Error(`${errorMessage}: ${validationErrors}`)
        }
        
        throw new Error(errorMessage)
      }
      
      if (data.success) {
        await fetchPrompts() // Recargar la lista
        console.log('✅ Prompt actualizado exitosamente')
        return { success: true, prompt: data.prompt }
      } else {
        const errorMessage = data.message || data.error || 'Error al actualizar prompt'
        
        // Si hay errores de validación, formatearlos
        if (data.errors && Array.isArray(data.errors)) {
          const validationErrors = data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ')
          throw new Error(`${errorMessage}: ${validationErrors}`)
        }
        
        throw new Error(errorMessage)
      }
    } catch (err) {
      console.error('💥 Error updating prompt:', err)
      throw err
    }
  }

  const deletePrompt = async (promptId: string) => {
    try {
      console.log('🔄 useAdminPrompts: Eliminando prompt...')
      
      const response = await fetch(`/api/admin/prompts/${promptId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchPrompts() // Recargar la lista
        console.log('✅ Prompt eliminado exitosamente')
        return { success: true }
      } else {
        throw new Error(data.error || 'Error al eliminar prompt')
      }
    } catch (err) {
      console.error('💥 Error deleting prompt:', err)
      throw err
    }
  }

  const togglePromptStatus = async (promptId: string, isActive: boolean) => {
    try {
      console.log('🔄 useAdminPrompts: Cambiando estado del prompt...')
      
      const response = await fetch(`/api/admin/prompts/${promptId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Actualizar localmente sin recargar toda la lista
        setPrompts(prev => prev.map(prompt => 
          prompt.prompt_id === promptId 
            ? { ...prompt, is_active: isActive }
            : prompt
        ))
        console.log('✅ Estado del prompt actualizado')
        return { success: true, prompt: data.prompt }
      } else {
        throw new Error(data.error || 'Error al cambiar estado del prompt')
      }
    } catch (err) {
      console.error('💥 Error toggling prompt status:', err)
      throw err
    }
  }

  const togglePromptFeatured = async (promptId: string, isFeatured: boolean) => {
    try {
      console.log('🔄 useAdminPrompts: Cambiando estado destacado del prompt...')
      
      const response = await fetch(`/api/admin/prompts/${promptId}/toggle-featured`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isFeatured })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Actualizar localmente sin recargar toda la lista
        setPrompts(prev => prev.map(prompt => 
          prompt.prompt_id === promptId 
            ? { ...prompt, is_featured: isFeatured }
            : prompt
        ))
        console.log('✅ Estado destacado del prompt actualizado')
        return { success: true, prompt: data.prompt }
      } else {
        throw new Error(data.error || 'Error al cambiar estado destacado del prompt')
      }
    } catch (err) {
      console.error('💥 Error toggling prompt featured:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchPrompts()
  }, [])

  return {
    prompts,
    stats,
    isLoading,
    error,
    refetch: fetchPrompts,
    createPrompt,
    updatePrompt,
    deletePrompt,
    togglePromptStatus,
    togglePromptFeatured
  }
}
