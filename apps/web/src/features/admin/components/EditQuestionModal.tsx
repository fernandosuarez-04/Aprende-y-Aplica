'use client'

import { useState, useEffect } from 'react'
import { X, Save, FileText, Hash, Tag, Globe, BarChart3, CheckCircle } from 'lucide-react'

interface EditQuestionModalProps {
  question: {
    id: string
    codigo: string
    section: string
    bloque: string
    area_id: number
    exclusivo_rol_id: number
    texto: string
    tipo: string
    opciones: any
    locale: string
    peso: number
    escala: any
    scoring: any
    respuesta_correcta: string
  }
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
}

export function EditQuestionModal({ question, isOpen, onClose, onSave }: EditQuestionModalProps) {
  const [formData, setFormData] = useState({
    codigo: '',
    section: '',
    bloque: '',
    area_id: '',
    exclusivo_rol_id: '',
    texto: '',
    tipo: 'multiple_choice',
    opciones: '',
    locale: 'es',
    peso: '',
    escala: '',
    scoring: '',
    respuesta_correcta: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (question && isOpen) {
      setFormData({
        codigo: question.codigo || '',
        section: question.section || '',
        bloque: question.bloque || '',
        area_id: question.area_id?.toString() || '',
        exclusivo_rol_id: question.exclusivo_rol_id?.toString() || '',
        texto: question.texto || '',
        tipo: question.tipo || 'multiple_choice',
        opciones: question.opciones ? JSON.stringify(question.opciones, null, 2) : '',
        locale: question.locale || 'es',
        peso: question.peso?.toString() || '',
        escala: question.escala ? JSON.stringify(question.escala, null, 2) : '',
        scoring: question.scoring ? JSON.stringify(question.scoring, null, 2) : '',
        respuesta_correcta: question.respuesta_correcta || ''
      })
    }
  }, [question, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const questionData = {
        codigo: formData.codigo,
        section: formData.section,
        bloque: formData.bloque,
        area_id: formData.area_id ? parseInt(formData.area_id) : null,
        exclusivo_rol_id: formData.exclusivo_rol_id ? parseInt(formData.exclusivo_rol_id) : null,
        texto: formData.texto,
        tipo: formData.tipo,
        opciones: formData.opciones ? JSON.parse(formData.opciones) : null,
        locale: formData.locale,
        peso: formData.peso ? parseFloat(formData.peso) : null,
        escala: formData.escala ? JSON.parse(formData.escala) : null,
        scoring: formData.scoring ? JSON.parse(formData.scoring) : null,
        respuesta_correcta: formData.respuesta_correcta
      }

      await onSave(questionData)
      onClose()
    } catch (error) {
      console.error('Error updating question:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 p-6">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Editar Pregunta</h2>
                <p className="text-white/80 text-sm">{question.codigo}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all hover:scale-110"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Información Básica */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Hash className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Información Básica</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-300">Código *</label>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => handleChange('codigo', e.target.value)}
                    placeholder="Ej: Q001, TECH_001"
                    className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-300">Sección *</label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => handleChange('section', e.target.value)}
                    placeholder="Ej: Tecnología, Liderazgo"
                    className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-300">Bloque</label>
                  <input
                    type="text"
                    value={formData.bloque}
                    onChange={(e) => handleChange('bloque', e.target.value)}
                    placeholder="Ej: Bloque A, Fundamentos"
                    className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-300">Área ID</label>
                  <input
                    type="number"
                    value={formData.area_id}
                    onChange={(e) => handleChange('area_id', e.target.value)}
                    placeholder="ID del área"
                    className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Contenido de la Pregunta */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <FileText className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Contenido de la Pregunta</h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-300">Texto de la Pregunta *</label>
                  <textarea
                    value={formData.texto}
                    onChange={(e) => handleChange('texto', e.target.value)}
                    placeholder="Escribe aquí el texto completo de la pregunta..."
                    rows={4}
                    className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-gray-300">Tipo de Pregunta *</label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => handleChange('tipo', e.target.value)}
                      className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="multiple_choice">Opción Múltiple</option>
                      <option value="text">Texto Libre</option>
                      <option value="scale">Escala</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-gray-300">Idioma</label>
                    <select
                      value={formData.locale}
                      onChange={(e) => handleChange('locale', e.target.value)}
                      className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Opciones y Configuración */}
            {formData.tipo === 'multiple_choice' && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Opciones de Respuesta</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-gray-300">Opciones (JSON)</label>
                    <textarea
                      value={formData.opciones}
                      onChange={(e) => handleChange('opciones', e.target.value)}
                      placeholder='["Opción 1", "Opción 2", "Opción 3", "Opción 4"]'
                      rows={3}
                      className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    />
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-gray-300">Respuesta Correcta</label>
                    <input
                      type="text"
                      value={formData.respuesta_correcta}
                      onChange={(e) => handleChange('respuesta_correcta', e.target.value)}
                      placeholder="Texto de la respuesta correcta"
                      className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.tipo === 'scale' && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Configuración de Escala</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-gray-300">Escala (JSON)</label>
                    <textarea
                      value={formData.escala}
                      onChange={(e) => handleChange('escala', e.target.value)}
                      placeholder='{"min": 1, "max": 5, "labels": ["Muy malo", "Malo", "Regular", "Bueno", "Excelente"]}'
                      rows={3}
                      className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    />
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-gray-300">Scoring (JSON)</label>
                    <textarea
                      value={formData.scoring}
                      onChange={(e) => handleChange('scoring', e.target.value)}
                      placeholder='{"1": 0, "2": 25, "3": 50, "4": 75, "5": 100}'
                      rows={3}
                      className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Configuración Adicional */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Tag className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Configuración Adicional</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-300">Peso</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.peso}
                    onChange={(e) => handleChange('peso', e.target.value)}
                    placeholder="1.0"
                    className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-300">Rol Exclusivo ID</label>
                  <input
                    type="number"
                    value={formData.exclusivo_rol_id}
                    onChange={(e) => handleChange('exclusivo_rol_id', e.target.value)}
                    placeholder="ID del rol específico"
                    className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-800/50 border-t border-gray-700 p-6">
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-medium rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
