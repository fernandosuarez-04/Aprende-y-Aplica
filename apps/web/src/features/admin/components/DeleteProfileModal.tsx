'use client'

import { useState } from 'react'
import { X, Trash2, AlertTriangle, User } from 'lucide-react'

interface DeleteProfileModalProps {
  profile: {
    id: string
    user_id: string
    cargo_titulo: string
    pais: string
    users?: {
      id: string
      username: string
      profile_picture_url?: string
      email?: string
    }
  }
  isOpen: boolean
  onClose: () => void
  onDelete: (profileId: string) => Promise<void>
}

export function DeleteProfileModal({ profile, isOpen, onClose, onDelete }: DeleteProfileModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const expectedConfirmText = 'ELIMINAR'

  const handleDelete = async () => {
    if (confirmText !== expectedConfirmText) return

    setIsLoading(true)
    try {
      await onDelete(profile.id)
      onClose()
    } catch (error) {
      // console.error('Error deleting profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setConfirmText('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
        
        <div className="relative w-full max-w-md bg-gray-800 rounded-xl border border-gray-700 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Eliminar Perfil
                </h2>
                <p className="text-sm text-gray-400">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Warning */}
            <div className="flex items-start space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-400 mb-1">
                  Advertencia
                </h3>
                <p className="text-sm text-gray-300">
                  Esta acción eliminará permanentemente el perfil del usuario y todos sus datos asociados.
                </p>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex items-center space-x-4 p-4 bg-gray-700/50 rounded-lg">
              {profile.users?.profile_picture_url ? (
                <img 
                  src={profile.users.profile_picture_url} 
                  alt={profile.users.username || 'Usuario'}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">
                  {profile.users?.username || 'Usuario'}
                </h3>
                <p className="text-sm text-gray-400">{profile.cargo_titulo}</p>
                <p className="text-sm text-gray-400">{profile.pais}</p>
              </div>
            </div>

            {/* Confirmation */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Para confirmar, escribe <span className="text-red-400 font-bold">ELIMINAR</span>:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="ELIMINAR"
                autoComplete="off"
              />
            </div>

            {/* Impact Info */}
            <div className="p-4 bg-gray-700/30 rounded-lg">
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                Datos que se eliminarán:
              </h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Perfil de usuario completo</li>
                <li>• Información profesional</li>
                <li>• Respuestas a cuestionarios</li>
                <li>• Estadísticas asociadas</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-700">
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={confirmText !== expectedConfirmText || isLoading}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Eliminando...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar Perfil</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
