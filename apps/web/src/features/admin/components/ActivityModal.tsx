'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle } from 'lucide-react'
import { AdminActivity } from '../services/adminActivities.service'

interface ActivityModalProps {
  activity?: AdminActivity | null
  lessonId: string
  onClose: () => void
  onSave: (data: any) => Promise<void>
}

export function ActivityModal({ activity, lessonId, onClose, onSave }: ActivityModalProps) {
  const [formData, setFormData] = useState({
    activity_title: '',
    activity_description: '',
    activity_type: 'reflection' as 'reflection' | 'exercise' | 'quiz' | 'discussion' | 'ai_chat',
    activity_content: '',
    ai_prompts: '',
    is_required: false
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (activity) {
      setFormData({
        activity_title: activity.activity_title,
        activity_description: activity.activity_description || '',
        activity_type: activity.activity_type,
        activity_content: activity.activity_content,
        ai_prompts: activity.ai_prompts || '',
        is_required: activity.is_required
      })
    }
  }, [activity])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving activity:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-white">
            {activity ? 'Editar Actividad' : 'Crear Actividad'}
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
              Título de la Actividad *
            </label>
            <input
              type="text"
              required
              value={formData.activity_title}
              onChange={(e) => setFormData(prev => ({ ...prev, activity_title: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Reflexión sobre IA"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              rows={2}
              value={formData.activity_description}
              onChange={(e) => setFormData(prev => ({ ...prev, activity_description: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción de la actividad..."
            />
          </div>

          {/* Tipo de Actividad */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo de Actividad *
            </label>
            <select
              value={formData.activity_type}
              onChange={(e) => setFormData(prev => ({ ...prev, activity_type: e.target.value as any }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="reflection">Reflexión</option>
              <option value="exercise">Ejercicio</option>
              <option value="quiz">Quiz</option>
              <option value="discussion">Discusión</option>
              <option value="ai_chat">Chat con IA</option>
            </select>
          </div>

          {/* Contenido */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contenido de la Actividad *
            </label>
            <textarea
              rows={6}
              required
              value={formData.activity_content}
              onChange={(e) => setFormData(prev => ({ ...prev, activity_content: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Instrucciones o contenido de la actividad..."
            />
          </div>

          {/* AI Prompts (opcional) */}
          {formData.activity_type === 'ai_chat' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Prompts de IA (Opcional)
              </label>
              <textarea
                rows={3}
                value={formData.ai_prompts}
                onChange={(e) => setFormData(prev => ({ ...prev, ai_prompts: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Prompts personalizados para la IA..."
              />
            </div>
          )}

          {/* Requerida */}
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_required}
              onChange={(e) => setFormData(prev => ({ ...prev, is_required: e.target.checked }))}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-300">Actividad Requerida</span>
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

