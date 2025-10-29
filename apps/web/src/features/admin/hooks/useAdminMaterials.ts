'use client'

import { useState } from 'react'
import { AdminMaterial } from '../services/adminMaterials.service'

interface UseAdminMaterialsReturn {
  materials: AdminMaterial[]
  loading: boolean
  error: string | null
  fetchMaterials: (lessonId: string) => Promise<void>
  createMaterial: (lessonId: string, data: any) => Promise<AdminMaterial>
  updateMaterial: (materialId: string, data: any) => Promise<AdminMaterial>
  deleteMaterial: (materialId: string) => Promise<void>
}

export function useAdminMaterials(): UseAdminMaterialsReturn {
  const [materials, setMaterials] = useState<AdminMaterial[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMaterials = async (lessonId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/courses/0/modules/0/lessons/${lessonId}/materials`)
      if (!response.ok) throw new Error('Error al obtener materiales')

      const data = await response.json()
      setMaterials(data.materials || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }

  const createMaterial = async (lessonId: string, materialData: any): Promise<AdminMaterial> => {
    try {
      const response = await fetch(`/api/admin/courses/0/modules/0/lessons/${lessonId}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materialData)
      })

      if (!response.ok) throw new Error('Error al crear material')

      const data = await response.json()
      const newMaterial = data.material

      setMaterials(prev => [...prev, newMaterial])
      return newMaterial
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear material')
      throw err
    }
  }

  const updateMaterial = async (materialId: string, materialData: any): Promise<AdminMaterial> => {
    try {
      const response = await fetch(`/api/admin/courses/0/modules/0/lessons/0/materials/${materialId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materialData)
      })

      if (!response.ok) throw new Error('Error al actualizar material')

      const data = await response.json()
      const updatedMaterial = data.material

      setMaterials(prev => prev.map(m => m.material_id === materialId ? updatedMaterial : m))
      return updatedMaterial
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar material')
      throw err
    }
  }

  const deleteMaterial = async (materialId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/admin/courses/0/modules/0/lessons/0/materials/${materialId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Error al eliminar material')

      setMaterials(prev => prev.filter(m => m.material_id !== materialId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar material')
      throw err
    }
  }

  return {
    materials,
    loading,
    error,
    fetchMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial
  }
}

