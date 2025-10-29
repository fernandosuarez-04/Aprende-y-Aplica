'use client'

import { useState, useEffect } from 'react'
import { AdminModule } from '../services/adminModules.service'

interface UseAdminModulesReturn {
  modules: AdminModule[]
  loading: boolean
  error: string | null
  fetchModules: (courseId: string) => Promise<void>
  createModule: (courseId: string, data: any) => Promise<AdminModule>
  updateModule: (moduleId: string, data: any) => Promise<AdminModule>
  deleteModule: (moduleId: string) => Promise<void>
  togglePublished: (moduleId: string) => Promise<void>
}

export function useAdminModules(): UseAdminModulesReturn {
  const [modules, setModules] = useState<AdminModule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchModules = async (courseId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/courses/${courseId}/modules`)
      if (!response.ok) throw new Error('Error al obtener módulos')

      const data = await response.json()
      setModules(data.modules || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setModules([])
    } finally {
      setLoading(false)
    }
  }

  const createModule = async (courseId: string, moduleData: any): Promise<AdminModule> => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moduleData)
      })

      if (!response.ok) throw new Error('Error al crear módulo')

      const data = await response.json()
      const newModule = data.module

      setModules(prev => [...prev, newModule])
      return newModule
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear módulo')
      throw err
    }
  }

  const updateModule = async (moduleId: string, moduleData: any): Promise<AdminModule> => {
    try {
      const module = modules.find(m => m.module_id === moduleId)
      const courseId = module?.course_id
      
      if (!courseId) throw new Error('ID de curso no encontrado')

      const response = await fetch(`/api/admin/courses/${courseId}/modules/${moduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moduleData)
      })

      if (!response.ok) throw new Error('Error al actualizar módulo')

      const data = await response.json()
      const updatedModule = data.module

      setModules(prev => prev.map(m => m.module_id === moduleId ? updatedModule : m))
      return updatedModule
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar módulo')
      throw err
    }
  }

  const deleteModule = async (moduleId: string): Promise<void> => {
    try {
      const module = modules.find(m => m.module_id === moduleId)
      const courseId = module?.course_id
      
      if (!courseId) throw new Error('ID de curso no encontrado')

      const response = await fetch(`/api/admin/courses/${courseId}/modules/${moduleId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Error al eliminar módulo')

      setModules(prev => prev.filter(m => m.module_id !== moduleId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar módulo')
      throw err
    }
  }

  const togglePublished = async (moduleId: string): Promise<void> => {
    try {
      const module = modules.find(m => m.module_id === moduleId)
      if (!module) throw new Error('Módulo no encontrado')

      await updateModule(moduleId, { is_published: !module.is_published })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado')
      throw err
    }
  }

  return {
    modules,
    loading,
    error,
    fetchModules,
    createModule,
    updateModule,
    deleteModule,
    togglePublished
  }
}

