'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, Clock } from 'lucide-react'
import { AdminLesson } from '../services/adminLessons.service'
import { VideoProviderSelector } from './VideoProviderSelector'

interface LessonModalProps {
  lesson?: AdminLesson | null
  moduleId: string
  onClose: () => void
  onSave: (data: any) => Promise<void>
  instructors?: Array<{ id: string, name: string }>
}

export function LessonModal({ lesson, moduleId, onClose, onSave, instructors = [] }: LessonModalProps) {
  const [formData, setFormData] = useState({
    lesson_title: '',
    lesson_description: '',
    video_provider_id: '',
    video_provider: 'youtube' as 'youtube' | 'vimeo' | 'direct' | 'custom',
    duration_seconds: 0,
    transcript_content: '',
    is_published: false,
    instructor_id: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (lesson) {
      setFormData({
        lesson_title: lesson.lesson_title,
        lesson_description: lesson.lesson_description || '',
        video_provider_id: lesson.video_provider_id,
        video_provider: lesson.video_provider,
        duration_seconds: lesson.duration_seconds,
        transcript_content: lesson.transcript_content || '',
        is_published: lesson.is_published,
        instructor_id: lesson.instructor_id
      })
    } else {
      // Si no hay lección (crear nueva) y hay instructores, seleccionar el primero
      if (instructors.length > 0 && !formData.instructor_id) {
        setFormData(prev => ({ ...prev, instructor_id: instructors[0].id }))
      }
    }
  }, [lesson, instructors])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.instructor_id) {
      alert('Debe seleccionar un instructor')
      return
    }

    setLoading(true)

    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving lesson:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const parseDuration = (duration: string) => {
    const [mins, secs] = duration.split(':').map(Number)
    return (mins * 60) + (secs || 0)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-white">
            {lesson ? 'Editar Lección' : 'Crear Lección'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Título de la Lección *
            </label>
            <input
              type="text"
              required
              value={formData.lesson_title}
              onChange={(e) => setFormData(prev => ({ ...prev, lesson_title: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Introducción al Machine Learning"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              rows={3}
              value={formData.lesson_description}
              onChange={(e) => setFormData(prev => ({ ...prev, lesson_description: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción de la lección..."
            />
          </div>

          {/* Instructor */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Instructor *
            </label>
            <select
              value={formData.instructor_id}
              onChange={(e) => setFormData(prev => ({ ...prev, instructor_id: e.target.value }))}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {instructors.length === 0 ? (
                <option value="">No hay instructores disponibles</option>
              ) : (
                <>
                  <option value="">Seleccionar instructor...</option>
                  {instructors.map(instructor => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Video Provider */}
          <VideoProviderSelector
            provider={formData.video_provider}
            videoProviderId={formData.video_provider_id}
            onProviderChange={(provider) => setFormData(prev => ({ ...prev, video_provider: provider }))}
            onVideoIdChange={(id) => setFormData(prev => ({ ...prev, video_provider_id: id }))}
          />

          {/* Duración */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Duración (mm:ss) *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={formatDuration(formData.duration_seconds)}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_seconds: parseDuration(e.target.value) }))}
                placeholder="10:30"
                pattern="\d{1,3}:\d{2}"
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Transcript */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Transcripción (Opcional)
            </label>
            <textarea
              rows={4}
              value={formData.transcript_content}
              onChange={(e) => setFormData(prev => ({ ...prev, transcript_content: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Transcripción del video..."
            />
          </div>

          {/* Publicado */}
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_published}
              onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-300">Publicado</span>
          </label>

          {/* Botones */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-600">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Guardar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

