'use client'

import { X, Play, Clock, Globe, Tag, Eye, Heart, Share2, MessageCircle, Star, Calendar, ExternalLink } from 'lucide-react'
import { AdminReel } from '../services/adminReels.service'

interface ViewReelModalProps {
  reel: AdminReel
  onClose: () => void
}

export function ViewReelModal({ reel, onClose }: ViewReelModalProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-white">Detalles del Reel</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Video Preview */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={reel.thumbnail_url}
                  alt={reel.title}
                  className="w-32 h-32 rounded-lg object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <Play className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">{reel.title}</h3>
                <p className="text-gray-400 mb-4">{reel.description}</p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-300">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatDuration(reel.duration_seconds)}
                  </div>
                  <div className="flex items-center">
                    <Tag className="w-4 h-4 mr-1" />
                    {reel.category}
                  </div>
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-1" />
                    {reel.language.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <Eye className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{reel.view_count.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Vistas</p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{reel.like_count.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Likes</p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <Share2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{reel.share_count.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Compartidos</p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <MessageCircle className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{reel.comment_count.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Comentarios</p>
            </div>
          </div>

          {/* Estado y Configuración */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-4">Estado</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Estado:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    reel.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {reel.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Destacado:</span>
                  <div className="flex items-center">
                    <Star className={`w-4 h-4 mr-1 ${reel.is_featured ? 'text-yellow-500' : 'text-gray-400'}`} />
                    <span className="text-gray-300">
                      {reel.is_featured ? 'Sí' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-4">Información</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Creado:</span>
                  <span className="text-gray-300">{formatDate(reel.created_at)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Actualizado:</span>
                  <span className="text-gray-300">{formatDate(reel.updated_at)}</span>
                </div>
                
                {reel.published_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Publicado:</span>
                    <span className="text-gray-300">{formatDate(reel.published_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* URLs */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-4">Enlaces</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  URL del Video:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={reel.video_url}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm"
                  />
                  <a
                    href={reel.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  URL del Thumbnail:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={reel.thumbnail_url}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm"
                  />
                  <a
                    href={reel.thumbnail_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de cerrar */}
          <div className="flex justify-end pt-4 border-t border-gray-600">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
