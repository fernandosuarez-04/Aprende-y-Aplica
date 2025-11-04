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
    summary_content: '',
    is_published: false,
    instructor_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [durationAutoDetected, setDurationAutoDetected] = useState(false)

  useEffect(() => {
    if (lesson) {
      setFormData({
        lesson_title: lesson.lesson_title,
        lesson_description: lesson.lesson_description || '',
        video_provider_id: lesson.video_provider_id,
        video_provider: lesson.video_provider,
        duration_seconds: lesson.duration_seconds,
        transcript_content: lesson.transcript_content || '',
        summary_content: lesson.summary_content || '',
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

    // Validar que duration_seconds sea mayor a 0
    if (!formData.duration_seconds || formData.duration_seconds <= 0) {
      alert('La duración debe ser mayor a 0 segundos. Por favor, ingrese una duración válida.')
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
    <div className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700/50">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {lesson ? 'Editar Lección' : 'Crear Lección'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto scrollbar-thin-dark flex-1">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título de la Lección *
            </label>
            <input
              type="text"
              required
              value={formData.lesson_title}
              onChange={(e) => setFormData(prev => ({ ...prev, lesson_title: e.target.value }))}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
              placeholder="Ej: Introducción al Machine Learning"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              rows={3}
              value={formData.lesson_description}
              onChange={(e) => setFormData(prev => ({ ...prev, lesson_description: e.target.value }))}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 resize-y min-h-[80px] scrollbar-thin-dark"
              placeholder="Descripción de la lección..."
            />
          </div>

          {/* Instructor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Instructor *
            </label>
            <select
              value={formData.instructor_id}
              onChange={(e) => setFormData(prev => ({ ...prev, instructor_id: e.target.value }))}
              required
              className="w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
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
            onProviderChange={(provider) => {
              setFormData(prev => ({ ...prev, video_provider: provider }))
              setDurationAutoDetected(false)
            }}
            onVideoIdChange={(id) => {
              setFormData(prev => ({ ...prev, video_provider_id: id }))
              setDurationAutoDetected(false)
            }}
            onDurationChange={(durationSeconds) => {
              if (durationSeconds && durationSeconds > 0) {
                setFormData(prev => ({ ...prev, duration_seconds: durationSeconds }))
                setDurationAutoDetected(true)
              }
            }}
          />

          {/* Duración */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Duración (mm:ss) *
              </label>
              {durationAutoDetected && (
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  ✓ Detectada automáticamente
                </span>
              )}
            </div>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={formatDuration(formData.duration_seconds)}
                onChange={(e) => {
                  const seconds = parseDuration(e.target.value)
                  setFormData(prev => ({ ...prev, duration_seconds: seconds }))
                  if (seconds > 0) {
                    setDurationAutoDetected(false) // Si el usuario edita manualmente, desactivar el indicador
                  }
                }}
                placeholder="10:30"
                pattern="\d{1,3}:\d{2}"
                className={`w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-700 border ${
                  durationAutoDetected 
                    ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-300 dark:border-gray-600'
                } rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                title={durationAutoDetected ? 'La duración fue detectada automáticamente. Puedes editarla manualmente si es necesario.' : ''}
              />
            </div>
            {durationAutoDetected && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                La duración se detectó automáticamente del video. Puedes editarla manualmente si es necesario.
              </p>
            )}
          </div>

          {/* Transcript */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transcripción (Opcional)
            </label>
            <textarea
              rows={4}
              value={formData.transcript_content}
              onChange={(e) => setFormData(prev => ({ ...prev, transcript_content: e.target.value }))}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 resize-y min-h-[120px] scrollbar-thin-dark"
              placeholder="Transcripción del video..."
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Resumen (Opcional)
            </label>
            <textarea
              rows={4}
              value={formData.summary_content}
              onChange={(e) => setFormData(prev => ({ ...prev, summary_content: e.target.value }))}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 resize-y min-h-[120px] scrollbar-thin-dark"
              placeholder="Resumen del contenido del video..."
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Resumen breve del contenido de la lección. Se mostrará en la pestaña "Resumen" del curso.
            </p>
          </div>

          {/* Publicado */}
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_published}
              onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
              className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Publicado</span>
          </label>

          {/* Botones */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700/50 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium shadow-lg shadow-blue-500/20"
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

