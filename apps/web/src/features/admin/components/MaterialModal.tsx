'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle } from 'lucide-react'
import { AdminMaterial } from '../services/adminMaterials.service'
import { PDFUpload } from './PDFUpload'
import { QuizBuilder } from './QuizBuilder'

interface MaterialModalProps {
  material?: AdminMaterial | null
  lessonId: string
  onClose: () => void
  onSave: (data: any) => Promise<void>
}

export function MaterialModal({ material, lessonId, onClose, onSave }: MaterialModalProps) {
  const [formData, setFormData] = useState({
    material_title: '',
    material_description: '',
    material_type: 'pdf' as 'pdf' | 'link' | 'document' | 'quiz' | 'exercise' | 'reading',
    file_url: '',
    external_url: '',
    content_data: null as any,
    is_downloadable: false
  })
  const [quizQuestions, setQuizQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (material) {
      setFormData({
        material_title: material.material_title,
        material_description: material.material_description || '',
        material_type: material.material_type,
        file_url: material.file_url || '',
        external_url: material.external_url || '',
        content_data: material.content_data || null,
        is_downloadable: material.is_downloadable
      })
      // Cargar preguntas del quiz si existe
      if (material.material_type === 'quiz' && material.content_data) {
        setQuizQuestions(material.content_data.questions || [])
      }
    }
  }, [material])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const dataToSave = { ...formData }
      
      // Si es un quiz, incluir las preguntas en content_data
      if (formData.material_type === 'quiz') {
        dataToSave.content_data = {
          questions: quizQuestions,
          totalPoints: quizQuestions.reduce((sum, q) => sum + (q.points || 1), 0)
        }
      }

      await onSave(dataToSave)
      onClose()
    } catch (error) {
      console.error('Error saving material:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-white">
            {material ? 'Editar Material' : 'Crear Material'}
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
              Título del Material *
            </label>
            <input
              type="text"
              required
              value={formData.material_title}
              onChange={(e) => setFormData(prev => ({ ...prev, material_title: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Guía de Python"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              rows={2}
              value={formData.material_description}
              onChange={(e) => setFormData(prev => ({ ...prev, material_description: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción del material..."
            />
          </div>

          {/* Tipo de Material */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo de Material *
            </label>
            <select
              value={formData.material_type}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                material_type: e.target.value as any,
                file_url: '',
                external_url: ''
              }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pdf">PDF</option>
              <option value="document">Documento Word</option>
              <option value="link">Enlace Externo</option>
              <option value="reading">Lectura</option>
              <option value="quiz">Quiz</option>
              <option value="exercise">Ejercicio</option>
            </select>
          </div>

          {/* Contenido según tipo */}
          {['pdf', 'document'].includes(formData.material_type) && (
            <PDFUpload
              value={formData.file_url}
              onChange={(url) => setFormData(prev => ({ ...prev, file_url: url }))}
            />
          )}

          {formData.material_type === 'quiz' && (
            <QuizBuilder
              questions={quizQuestions}
              onChange={setQuizQuestions}
            />
          )}

          {formData.material_type === 'link' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                URL del Enlace *
              </label>
              <input
                type="url"
                required={formData.material_type === 'link'}
                value={formData.external_url}
                onChange={(e) => setFormData(prev => ({ ...prev, external_url: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://ejemplo.com/recurso"
              />
            </div>
          )}

          {/* Descargable */}
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_downloadable}
              onChange={(e) => setFormData(prev => ({ ...prev, is_downloadable: e.target.checked }))}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-300">Permitir Descarga</span>
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

