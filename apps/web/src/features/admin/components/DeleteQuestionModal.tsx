'use client'

import { useState } from 'react'
import { X, AlertTriangle, FileText, Trash2 } from 'lucide-react'

interface DeleteQuestionModalProps {
  question: {
    id: string
    codigo: string
    texto: string
    tipo: string
    section: string
  }
  isOpen: boolean
  onClose: () => void
  onDelete: (questionId: string) => Promise<void>
}

export function DeleteQuestionModal({ question, isOpen, onClose, onDelete }: DeleteQuestionModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(question.id)
      onClose()
    } catch (error) {
      console.error('Error deleting question:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const getQuestionTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'multiple_choice':
        return 'Opción Múltiple'
      case 'text':
        return 'Texto Libre'
      case 'scale':
        return 'Escala'
      default:
        return tipo
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 p-6">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Eliminar Pregunta</h2>
                <p className="text-white/80 text-sm">Esta acción no se puede deshacer</p>
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
        <div className="p-6 space-y-6">
          {/* Advertencia */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-red-300 mb-2">
                  ¿Estás seguro de que quieres eliminar esta pregunta?
                </h3>
                <p className="text-red-200 text-sm">
                  Esta acción eliminará permanentemente la pregunta y todos sus datos asociados. 
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
          </div>

          {/* Información de la pregunta */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-gray-500/20 rounded-lg">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Información de la Pregunta</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Código</span>
                <div className="bg-gray-700/50 rounded-lg px-3 py-2">
                  <span className="text-white font-medium font-mono">{question.codigo}</span>
                </div>
              </div>
              
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Sección</span>
                <div className="bg-gray-700/50 rounded-lg px-3 py-2">
                  <span className="text-white font-medium">{question.section}</span>
                </div>
              </div>
              
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Tipo</span>
                <div className="bg-gray-700/50 rounded-lg px-3 py-2">
                  <span className="text-white font-medium">{getQuestionTypeLabel(question.tipo)}</span>
                </div>
              </div>
              
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Texto</span>
                <div className="bg-gray-700/50 rounded-lg px-3 py-2">
                  <p className="text-white text-sm leading-relaxed">
                    {question.texto.length > 100 
                      ? `${question.texto.substring(0, 100)}...` 
                      : question.texto
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Impacto */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-yellow-300 mb-1">
                  Impacto de la Eliminación
                </h4>
                <ul className="text-yellow-200 text-sm space-y-1">
                  <li>• La pregunta será eliminada permanentemente</li>
                  <li>• Todas las respuestas asociadas también se eliminarán</li>
                  <li>• Los cuestionarios que incluyan esta pregunta podrían verse afectados</li>
                  <li>• Las estadísticas relacionadas se actualizarán automáticamente</li>
                </ul>
              </div>
            </div>
          </div>
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
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-medium rounded-lg hover:from-red-700 hover:to-rose-700 transition-all hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Eliminando...
                </div>
              ) : (
                <div className="flex items-center">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Pregunta
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
