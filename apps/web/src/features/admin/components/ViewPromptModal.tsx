'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { 
  XMarkIcon, 
  UserIcon, 
  CalendarIcon, 
  TagIcon, 
  ClockIcon, 
  StarIcon,
  HeartIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { AdminPrompt } from '../services/adminPrompts.service'

interface ViewPromptModalProps {
  isOpen: boolean
  onClose: () => void
  prompt: AdminPrompt | null
}

export function ViewPromptModal({ isOpen, onClose, prompt }: ViewPromptModalProps) {
  if (!prompt) {
    return null
  }

  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex-1">
                    <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {prompt.title}
                    </Dialog.Title>
                    <p className="text-gray-600 dark:text-gray-400">{prompt.description}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6 max-h-[80vh] overflow-y-auto">
                  {/* Tags y Estados */}
                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(prompt.is_active)}`}>
                      {prompt.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                    {prompt.is_featured && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full border bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                        <StarIcon className="h-3 w-3 mr-1" />
                        Destacado
                      </span>
                    )}
                    {prompt.is_verified && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full border bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                        Verificado
                      </span>
                    )}
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getDifficultyColor(prompt.difficulty_level)}`}>
                      {prompt.difficulty_level}
                    </span>
                    {prompt.category && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full border bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                        {prompt.category.name}
                      </span>
                    )}
                  </div>

                  {/* Información del Autor y Fecha */}
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-500 mb-6">
                    <div className="flex items-center mr-6">
                      <UserIcon className="h-4 w-4 mr-2" />
                      {prompt.author?.display_name || prompt.author?.first_name || 'Autor desconocido'}
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {new Date(prompt.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>

                  {/* Estadísticas */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                      <EyeIcon className="h-6 w-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{prompt.view_count}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Vistas</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                      <HeartIcon className="h-6 w-6 text-red-600 dark:text-red-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{prompt.like_count}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Likes</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                      <ArrowDownTrayIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{prompt.download_count}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Descargas</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                      <ChartBarIcon className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{prompt.rating.toFixed(1)}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Calificación ({prompt.rating_count})</div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                      <TagIcon className="h-4 w-4 mr-2" />
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {prompt.tags && Array.isArray(prompt.tags) && prompt.tags.length > 0 ? (
                        prompt.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full"
                          >
                            {tag}
                          </span>
                        ))
                      ) : prompt.tags && typeof prompt.tags === 'string' && prompt.tags.trim() ? (
                        prompt.tags.split(',').map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full"
                          >
                            {tag.trim()}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 text-sm">Sin tags</span>
                      )}
                    </div>
                  </div>

                  {/* Información Adicional */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Última Actualización
                      </h4>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(prompt.updated_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Creado
                      </h4>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(prompt.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Contenido del Prompt */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Contenido del Prompt
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <pre className="text-gray-800 dark:text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                        {prompt.content}
                      </pre>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
