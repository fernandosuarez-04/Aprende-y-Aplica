'use client'

import React, { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { 
  XMarkIcon, 
  UserIcon, 
  CalendarIcon,
  PhotoIcon,
  DocumentTextIcon,
  PaperClipIcon,
  LinkIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline'
import { PostAttachment } from '../../components/PostAttachment/PostAttachment'

interface PostDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  post: {
    id: string
    content: string
    created_at: string
    updated_at?: string
    attachment_url?: string | null
    attachment_type?: string | null
    attachment_data?: any
    likes_count?: number
    comment_count?: number
    reaction_count?: number
    is_pinned?: boolean
    is_hidden?: boolean
    is_edited?: boolean
    author?: {
      id: string
      username?: string
      first_name?: string
      last_name?: string
      profile_picture_url?: string
      email?: string
    }
    attachments?: Array<{
      url: string
      type: string
      name?: string
    }>
    links?: Array<{
      url: string
      title?: string
    }>
  } | null
}

export function PostDetailsModal({ isOpen, onClose, post }: PostDetailsModalProps) {
  if (!post) return null

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
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {post.is_pinned && (
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-xs border border-blue-300 dark:border-blue-800">
                          Fijado
                        </span>
                      )}
                      {post.is_hidden && (
                        <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded text-xs border border-red-300 dark:border-red-800">
                          Oculto
                        </span>
                      )}
                      {post.is_edited && (
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded text-xs border border-gray-300 dark:border-gray-600">
                          Editado
                        </span>
                      )}
                    </div>
                    <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-gray-900 dark:text-white mb-2">
                      Detalles del Post Reportado
                    </Dialog.Title>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      {post.author && (
                        <div className="flex items-center space-x-2">
                          {post.author.profile_picture_url ? (
                            <img 
                              src={post.author.profile_picture_url} 
                              alt="Avatar del autor"
                              className="h-6 w-6 rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.nextElementSibling?.classList.remove('hidden')
                              }}
                            />
                          ) : null}
                          <UserIcon className={`h-4 w-4 ${post.author.profile_picture_url ? 'hidden' : ''}`} />
                          <span>
                            {post.author.first_name && post.author.last_name
                              ? `${post.author.first_name} ${post.author.last_name}`
                              : post.author.username || post.author.email || 'Usuario desconocido'}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{new Date(post.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                  {/* Post Content */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
                      Contenido del Post
                    </h4>
                    <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {post.content || 'Sin contenido'}
                    </div>
                  </div>

                  {/* Post Attachments */}
                  {(post.attachment_url || post.attachment_type || (post.attachments && post.attachments.length > 0)) && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <PhotoIcon className="h-5 w-5 mr-2 text-green-500 dark:text-green-400" />
                        Archivos Adjuntos
                      </h4>
                      
                      {/* Usar PostAttachment component si hay attachment_url y attachment_type */}
                      {post.attachment_url && post.attachment_type && (
                        <div className="mb-4">
                          <PostAttachment
                            attachmentType={post.attachment_type}
                            attachmentUrl={post.attachment_url}
                            attachmentData={post.attachment_data}
                          />
                        </div>
                      )}

                      {/* Mostrar attachments adicionales si existen */}
                      {post.attachments && post.attachments.length > 0 && (
                        <div className="space-y-3">
                          {post.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                              <PaperClipIcon className="h-5 w-5 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-900 dark:text-white font-medium truncate">
                                  {attachment.name || `Archivo ${index + 1}`}
                                </p>
                                <p className="text-gray-500 dark:text-gray-400 text-sm truncate">
                                  {attachment.type || 'Tipo desconocido'}
                                </p>
                              </div>
                              <a 
                                href={attachment.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors flex-shrink-0"
                              >
                                Ver
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Links */}
                  {post.links && post.links.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <LinkIcon className="h-5 w-5 mr-2 text-cyan-500 dark:text-cyan-400" />
                        Enlaces
                      </h4>
                      <div className="space-y-2">
                        {post.links.map((link, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <LinkIcon className="h-5 w-5 text-cyan-500 dark:text-cyan-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 dark:text-white font-medium truncate">
                                {link.title || `Enlace ${index + 1}`}
                              </p>
                              <p className="text-gray-500 dark:text-gray-400 text-sm break-all">
                                {link.url}
                              </p>
                            </div>
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors flex-shrink-0"
                            >
                              Abrir
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                        <HeartIcon className="h-5 w-5 text-red-500 dark:text-red-400" />
                        <span className="font-medium">{post.likes_count || 0} Me gusta</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                        <ChatBubbleLeftIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                        <span className="font-medium">{post.comment_count || 0} Comentarios</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                        <EyeIcon className="h-5 w-5 text-green-500 dark:text-green-400" />
                        <span className="font-medium">{post.reaction_count || 0} Reacciones</span>
                      </div>
                    </div>
                  </div>

                  {/* Post Metadata */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Información Técnica
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">ID del Post:</span>
                        <span className="text-gray-900 dark:text-white ml-2 font-mono text-xs">{post.id}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Tipo de adjunto:</span>
                        <span className="text-gray-900 dark:text-white ml-2">{post.attachment_type || 'Ninguno'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Creado:</span>
                        <span className="text-gray-900 dark:text-white ml-2">
                          {new Date(post.created_at).toLocaleString('es-ES')}
                        </span>
                      </div>
                      {post.updated_at && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Actualizado:</span>
                          <span className="text-gray-900 dark:text-white ml-2">
                            {new Date(post.updated_at).toLocaleString('es-ES')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onClose}
                    className="inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}




