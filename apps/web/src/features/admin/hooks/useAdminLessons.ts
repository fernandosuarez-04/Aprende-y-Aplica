'use client'

import { useState } from 'react'
import { AdminLesson } from '../services/adminLessons.service'

interface UseAdminLessonsReturn {
  lessons: AdminLesson[]
  loading: boolean
  error: string | null
  fetchLessons: (moduleId: string) => Promise<void>
  createLesson: (moduleId: string, data: any) => Promise<AdminLesson>
  updateLesson: (lessonId: string, data: any) => Promise<AdminLesson>
  deleteLesson: (lessonId: string) => Promise<void>
  togglePublished: (lessonId: string) => Promise<void>
}

export function useAdminLessons(): UseAdminLessonsReturn {
  const [lessons, setLessons] = useState<AdminLesson[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadedModules = new Set<string>()

  const fetchLessons = async (moduleId: string) => {
    try {
      if (loadedModules.has(moduleId) && lessons.some(l => l.module_id === moduleId)) {
        return
      }
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/courses/0/modules/${moduleId}/lessons`)
      if (!response.ok) throw new Error('Error al obtener lecciones')

      const data = await response.json()
      // mezclamos con otras lecciones ya cargadas de otros módulos
      const other = lessons.filter(l => l.module_id !== moduleId)
      setLessons([...(data.lessons || []), ...other])
      loadedModules.add(moduleId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setLessons([])
    } finally {
      setLoading(false)
    }
  }

  const createLesson = async (moduleId: string, lessonData: any): Promise<AdminLesson> => {
    try {
      const response = await fetch(`/api/admin/courses/0/modules/${moduleId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lessonData)
      })

      if (!response.ok) throw new Error('Error al crear lección')

      const data = await response.json()
      const newLesson = data.lesson

      setLessons(prev => [...prev, newLesson])
      return newLesson
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear lección')
      throw err
    }
  }

  const updateLesson = async (lessonId: string, lessonData: any): Promise<AdminLesson> => {
    try {
      const lesson = lessons.find(l => l.lesson_id === lessonId)
      const moduleId = lesson?.module_id
      
      if (!moduleId) throw new Error('ID de módulo no encontrado')

      const response = await fetch(`/api/admin/courses/0/modules/${moduleId}/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lessonData)
      })

      if (!response.ok) throw new Error('Error al actualizar lección')

      const data = await response.json()
      const updatedLesson = data.lesson

      setLessons(prev => prev.map(l => l.lesson_id === lessonId ? updatedLesson : l))
      return updatedLesson
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar lección')
      throw err
    }
  }

  const deleteLesson = async (lessonId: string): Promise<void> => {
    try {
      const lesson = lessons.find(l => l.lesson_id === lessonId)
      const moduleId = lesson?.module_id
      
      if (!moduleId) throw new Error('ID de módulo no encontrado')

      const response = await fetch(`/api/admin/courses/0/modules/${moduleId}/lessons/${lessonId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Error al eliminar lección')

      setLessons(prev => prev.filter(l => l.lesson_id !== lessonId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar lección')
      throw err
    }
  }

  const togglePublished = async (lessonId: string): Promise<void> => {
    try {
      const lesson = lessons.find(l => l.lesson_id === lessonId)
      if (!lesson) throw new Error('Lección no encontrada')

      await updateLesson(lessonId, { is_published: !lesson.is_published })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado')
      throw err
    }
  }

  return {
    lessons,
    loading,
    error,
    fetchLessons,
    createLesson,
    updateLesson,
    deleteLesson,
    togglePublished
  }
}

