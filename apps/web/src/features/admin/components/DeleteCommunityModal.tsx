'use client'

import { useState } from 'react'
import { 
  XMarkIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  UserPlusIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline'
import { AdminCommunity } from '../services/adminCommunities.service'

interface DeleteCommunityModalProps {
  community: AdminCommunity | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function DeleteCommunityModal({ community, isOpen, onClose, onConfirm }: DeleteCommunityModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar comunidad')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen || !community) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-600">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-red-600 to-orange-600 rounded-t-2xl p-6">
            <div className="absolute inset-0 bg-black/20 rounded-t-2xl"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Eliminar Comunidad
                  </h3>
                  <p className="text-red-100 text-sm">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-all duration-200 text-white hover:scale-105"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 mb-6">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Warning Message */}
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-xl">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-400 mt-0.5" />
                <div>
                  <h4 className="text-lg font-semibold text-red-400 mb-2">
                    ¿Estás seguro de que quieres eliminar esta comunidad?
                  </h4>
                  <p className="text-red-300 text-sm leading-relaxed">
                    Esta acción eliminará permanentemente la comunidad <strong>"{community.name}"</strong> y todos sus datos asociados. 
                    Esta operación no se puede deshacer.
                  </p>
                </div>
              </div>
            </div>

            {/* Community Info */}
            <div className="mb-6 p-4 bg-gray-700/50 rounded-xl border border-gray-600">
              <h5 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                <UserGroupIcon className="h-4 w-4 mr-2 text-blue-400" />
                Información de la Comunidad
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Nombre:</span>
                  <span className="text-white font-medium">{community.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Descripción:</span>
                  <span className="text-white text-right max-w-xs">{community.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Estado:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    community.is_active 
                      ? 'bg-green-900/30 text-green-400 border border-green-800' 
                      : 'bg-red-900/30 text-red-400 border border-red-800'
                  }`}>
                    {community.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Visibilidad:</span>
                  <span className="text-white capitalize">{community.visibility}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tipo de Acceso:</span>
                  <span className="text-white capitalize">{community.access_type}</span>
                </div>
              </div>
            </div>

            {/* Data to be Deleted */}
            <div className="mb-6 p-4 bg-orange-900/20 border border-orange-800 rounded-xl">
              <h5 className="text-sm font-semibold text-orange-400 mb-3 flex items-center">
                <ShieldExclamationIcon className="h-4 w-4 mr-2" />
                Datos que se eliminarán
              </h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <UserGroupIcon className="h-4 w-4 text-orange-400" />
                  <span className="text-orange-300">
                    {community.member_count || 0} miembros
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <DocumentTextIcon className="h-4 w-4 text-orange-400" />
                  <span className="text-orange-300">
                    {community.posts_count || 0} posts
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <ChatBubbleLeftRightIcon className="h-4 w-4 text-orange-400" />
                  <span className="text-orange-300">
                    {community.comments_count || 0} comentarios
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <VideoCameraIcon className="h-4 w-4 text-orange-400" />
                  <span className="text-orange-300">
                    {community.videos_count || 0} videos
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <UserPlusIcon className="h-4 w-4 text-orange-400" />
                  <span className="text-orange-300">
                    {community.access_requests_count || 0} solicitudes
                  </span>
                </div>
              </div>
            </div>

            {/* Data Protection Notice */}
            <div className="mb-6 p-4 bg-blue-900/20 border border-blue-800 rounded-xl">
              <div className="flex items-start space-x-3">
                <ShieldExclamationIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <h5 className="text-sm font-semibold text-blue-400 mb-2">
                    Aviso de Protección de Datos
                  </h5>
                  <p className="text-xs text-blue-300 leading-relaxed">
                    Esta eliminación será registrada en el log de auditoría para cumplir con la Ley Federal de Protección de Datos Personales (LFPDPPP) y las normas ISO 27001. 
                    Se registrará la información del administrador, timestamp, y datos eliminados.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-300 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl transition-all duration-200 hover:scale-105 border border-gray-600"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 hover:scale-105 shadow-lg"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Eliminando...</span>
                  </div>
                ) : (
                  'Eliminar Comunidad'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
