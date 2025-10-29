'use client'

import { X, FileText, Hash, Tag, Globe, BarChart3, CheckCircle, Calendar } from 'lucide-react'

interface ViewQuestionModalProps {
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
    created_at: string
    respuesta_correcta: string
  }
  isOpen: boolean
  onClose: () => void
}

export function ViewQuestionModal({ question, isOpen, onClose }: ViewQuestionModalProps) {
  if (!isOpen) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getQuestionTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'multiple_choice':
        return <CheckCircle className="w-6 h-6 text-blue-400" />
      case 'text':
        return <FileText className="w-6 h-6 text-green-400" />
      case 'scale':
        return <BarChart3 className="w-6 h-6 text-purple-400" />
      default:
        return <FileText className="w-6 h-6 text-gray-400" />
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

  const renderOptions = () => {
    if (!question.opciones || !Array.isArray(question.opciones)) return null
    
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-300">Opciones de Respuesta:</h4>
        <div className="grid grid-cols-1 gap-2">
          {question.opciones.map((opcion: string, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-blue-300">{index + 1}</span>
              </div>
              <span className="text-white">{opcion}</span>
              {question.respuesta_correcta === opcion && (
                <CheckCircle className="w-4 h-4 text-green-400" />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderScale = () => {
    if (!question.escala) return null
    
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-300">Configuración de Escala:</h4>
        <div className="bg-gray-700/50 rounded-lg p-4">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap">
            {JSON.stringify(question.escala, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  const renderScoring = () => {
    if (!question.scoring) return null
    
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-300">Sistema de Puntuación:</h4>
        <div className="bg-gray-700/50 rounded-lg p-4">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap">
            {JSON.stringify(question.scoring, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                {getQuestionTypeIcon(question.tipo)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Detalles de la Pregunta</h2>
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
          <div className="p-6 space-y-8">
            {/* Información Básica */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Hash className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Información Básica</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Código</span>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                    <span className="text-blue-300 font-medium font-mono">{question.codigo}</span>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Sección</span>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                    <span className="text-green-300 font-medium">{question.section}</span>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Bloque</span>
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
                    <span className="text-purple-300 font-medium">{question.bloque || 'No especificado'}</span>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Tipo</span>
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
                    <span className="text-orange-300 font-medium">{getQuestionTypeLabel(question.tipo)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenido de la Pregunta */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <FileText className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Contenido</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Texto de la Pregunta</span>
                  <div className="bg-gray-700/50 rounded-lg px-4 py-3">
                    <p className="text-white text-lg leading-relaxed">{question.texto}</p>
                  </div>
                </div>
                
                {question.respuesta_correcta && (
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Respuesta Correcta</span>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                      <span className="text-green-300 font-medium">{question.respuesta_correcta}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Opciones de Respuesta */}
            {question.tipo === 'multiple_choice' && renderOptions()}

            {/* Configuración de Escala */}
            {question.tipo === 'scale' && renderScale()}

            {/* Sistema de Puntuación */}
            {question.tipo === 'scale' && renderScoring()}

            {/* Configuración Adicional */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Tag className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Configuración Adicional</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Área ID</span>
                  <div className="bg-gray-700/50 rounded-lg px-3 py-2">
                    <span className="text-white">{question.area_id || 'No especificado'}</span>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Rol Exclusivo ID</span>
                  <div className="bg-gray-700/50 rounded-lg px-3 py-2">
                    <span className="text-white">{question.exclusivo_rol_id || 'No especificado'}</span>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Idioma</span>
                  <div className="bg-gray-700/50 rounded-lg px-3 py-2">
                    <span className="text-white">{question.locale}</span>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Peso</span>
                  <div className="bg-gray-700/50 rounded-lg px-3 py-2">
                    <span className="text-white">{question.peso || 'No especificado'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fecha de Creación */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Calendar className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Información de Creación</h3>
              </div>
              
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Creado</span>
                <div className="bg-gray-700/50 rounded-lg px-4 py-3">
                  <span className="text-white font-medium">
                    {formatDate(question.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-800/50 border-t border-gray-700 p-6">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all hover:scale-105 shadow-lg"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
