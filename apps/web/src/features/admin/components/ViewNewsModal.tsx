'use client'

import { XMarkIcon, ClockIcon, CheckCircleIcon, ArchiveBoxIcon, EyeIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline'
import { AdminNews } from '../services/adminNews.service'

interface ViewNewsModalProps {
  isOpen: boolean
  onClose: () => void
  news: AdminNews
}

export function ViewNewsModal({ isOpen, onClose, news }: ViewNewsModalProps) {
  if (!isOpen) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
      case 'draft':
        return <ClockIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      case 'archived':
        return <ArchiveBoxIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-gray-600/75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Detalles de la Noticia</h2>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header con título y estado */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{news.title}</h1>
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(news.status)}`}>
                  {getStatusIcon(news.status)}
                  <span className="capitalize">{news.status}</span>
                </span>
                <span className="text-gray-600 dark:text-gray-400 text-sm">{news.language}</span>
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  {new Date(news.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Imagen hero si existe */}
          {news.hero_image_url && (
            <div className="w-full">
              <img
                src={news.hero_image_url}
                alt={news.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Introducción */}
          {news.intro && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Introducción</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{news.intro}</p>
            </div>
          )}

          {/* Subtítulo */}
          {news.subtitle && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Subtítulo</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{news.subtitle}</p>
            </div>
          )}

          {/* Secciones */}
          {news.sections && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Secciones</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <pre className="text-gray-800 dark:text-gray-300 text-sm overflow-x-auto">
                  {typeof news.sections === 'string' ? news.sections : JSON.stringify(news.sections, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* TLDR */}
          {news.tldr && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">TLDR</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <pre className="text-gray-800 dark:text-gray-300 text-sm overflow-x-auto">
                  {typeof news.tldr === 'string' ? news.tldr : JSON.stringify(news.tldr, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Estadísticas */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Estadísticas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{news.view_count?.toLocaleString() || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Vistas</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{news.comment_count?.toLocaleString() || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Comentarios</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{news.language.toUpperCase()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Idioma</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {news.published_at ? new Date(news.published_at).toLocaleDateString() : 'No publicado'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Fecha de publicación</div>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Información Técnica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">ID:</span>
                <span className="text-gray-900 dark:text-white ml-2 font-mono">{news.id}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Slug:</span>
                <span className="text-gray-900 dark:text-white ml-2 font-mono">{news.slug}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Creada:</span>
                <span className="text-gray-900 dark:text-white ml-2">{new Date(news.created_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Actualizada:</span>
                <span className="text-gray-900 dark:text-white ml-2">{new Date(news.updated_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Creada por:</span>
                <span className="text-gray-900 dark:text-white ml-2 font-mono">{news.created_by}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
