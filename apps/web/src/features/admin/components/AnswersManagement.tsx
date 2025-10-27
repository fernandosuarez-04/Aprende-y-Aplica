'use client'

import { useState, useEffect } from 'react'
import { 
  Eye, 
  Trash2, 
  FileText,
  User,
  Calendar,
  Search,
  Filter
} from 'lucide-react'
import { useUserStats } from '@/features/admin/hooks/useUserStats'

export function AnswersManagement() {
  const { answers, questions, loading, error, deleteAnswer } = useUserStats()

  const [searchTerm, setSearchTerm] = useState('')
  const [viewingAnswer, setViewingAnswer] = useState<any>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  // Filtrar respuestas
  const filteredAnswers = answers.filter(answer => {
    const questionText = questions.find(q => q.id === answer.pregunta_id)?.texto || ''
    const matchesSearch = questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         answer.user_perfil_id?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const handleViewAnswer = (answer: any) => {
    setViewingAnswer(answer)
    setIsViewModalOpen(true)
  }

  const closeModal = () => {
    setIsViewModalOpen(false)
    setViewingAnswer(null)
  }

  const getQuestionText = (questionId: number) => {
    return questions.find(q => q.id === questionId)?.texto || 'Pregunta no encontrada'
  }

  const getUserInfo = (answer: any) => {
    const userPerfil = answer.user_perfil
    if (!userPerfil) return { name: 'Usuario desconocido', avatar: null, email: null }
    
    const user = userPerfil.users
    if (!user) return { name: 'Usuario desconocido', avatar: null, email: null }
    
    return {
      name: user.username || user.email || 'Usuario',
      avatar: user.profile_picture_url,
      email: user.email
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderAnswerValue = (value: any) => {
    if (typeof value === 'string') return value
    if (typeof value === 'number') return value.toString()
    if (typeof value === 'boolean') return value ? 'Sí' : 'No'
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <p className="text-red-400">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Gestión de Respuestas</h3>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por pregunta o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Tabla de Respuestas */}
      <div className="bg-gray-700 rounded-lg border border-gray-600 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Pregunta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Respuesta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {filteredAnswers.map((answer) => (
                <tr key={answer.id} className="hover:bg-gray-600 transition-colors">
                  <td className="px-6 py-4">
                    <div className="max-w-md">
                      <p className="text-sm text-white truncate">
                        {getQuestionText(answer.pregunta_id)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-300 truncate">
                        {renderAnswerValue(answer.valor)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const userInfo = getUserInfo(answer)
                        return (
                          <>
                            {userInfo.avatar ? (
                              <img 
                                src={userInfo.avatar} 
                                alt={userInfo.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-white">
                                {userInfo.name}
                              </p>
                              {userInfo.email && (
                                <p className="text-xs text-gray-400">
                                  {userInfo.email}
                                </p>
                              )}
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">
                        {formatDate(answer.respondido_en)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewAnswer(answer)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteAnswer(answer.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Eliminar respuesta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAnswers.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No se encontraron respuestas
            </h3>
            <p className="text-gray-400">
              {searchTerm
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'No hay respuestas registradas'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de Vista */}
      {isViewModalOpen && viewingAnswer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-white">Detalles de la Respuesta</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Pregunta</label>
                <p className="text-white">{getQuestionText(viewingAnswer.pregunta_id)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Respuesta</label>
                <div className="bg-gray-700 rounded p-3">
                  <pre className="text-white text-sm whitespace-pre-wrap">
                    {renderAnswerValue(viewingAnswer.valor)}
                  </pre>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Usuario</label>
                {(() => {
                  const userInfo = getUserInfo(viewingAnswer)
                  return (
                    <div className="flex items-center gap-3">
                      {userInfo.avatar ? (
                        <img 
                          src={userInfo.avatar} 
                          alt={userInfo.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium">{userInfo.name}</p>
                        {userInfo.email && (
                          <p className="text-sm text-gray-400">{userInfo.email}</p>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Fecha</label>
                <p className="text-white">{formatDate(viewingAnswer.respondido_en)}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
