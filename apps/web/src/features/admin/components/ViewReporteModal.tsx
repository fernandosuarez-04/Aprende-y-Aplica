'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, UserIcon, ComputerDesktopIcon, PhotoIcon, LinkIcon, CalendarIcon, PencilIcon } from '@heroicons/react/24/outline'
import { AdminReporte } from '../services/adminReportes.service'

interface ViewReporteModalProps {
  reporte: AdminReporte
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
}

export function ViewReporteModal({ reporte, isOpen, onClose, onEdit }: ViewReporteModalProps) {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'en_revision':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'en_progreso':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'resuelto':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'rechazado':
      case 'duplicado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'critica':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700'
      case 'alta':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-700'
      case 'media':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700'
      case 'baja':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      'bug': 'Bug',
      'sugerencia': 'Sugerencia',
      'contenido': 'Contenido',
      'performance': 'Performance',
      'ui-ux': 'UI/UX',
      'otro': 'Otro'
    }
    return labels[categoria] || categoria
  }

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      'pendiente': 'Pendiente',
      'en_revision': 'En Revisión',
      'en_progreso': 'En Progreso',
      'resuelto': 'Resuelto',
      'rechazado': 'Rechazado',
      'duplicado': 'Duplicado'
    }
    return labels[estado] || estado
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
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                  <Dialog.Title className="text-xl font-bold text-white">
                    Detalles del Reporte
                  </Dialog.Title>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onEdit}
                      className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                      title="Editar reporte"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={onClose}
                      className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {/* Título y badges */}
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      {reporte.titulo}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getPrioridadColor(reporte.prioridad)}`}>
                        Prioridad: {reporte.prioridad.toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getEstadoColor(reporte.estado)}`}>
                        {getEstadoLabel(reporte.estado)}
                      </span>
                      <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                        {getCategoriaLabel(reporte.categoria)}
                      </span>
                    </div>
                  </div>

                  {/* Descripción */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Descripción</h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {reporte.descripcion}
                    </p>
                  </div>

                  {/* Información del usuario */}
                  {reporte.usuario && (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <UserIcon className="h-5 w-5" />
                        Usuario que reportó
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Nombre:</span>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {reporte.usuario.display_name || reporte.usuario.username}
                          </p>
                        </div>
                        {reporte.usuario.email && (
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                            <p className="text-gray-900 dark:text-white font-medium">{reporte.usuario.email}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Información técnica */}
                  {(reporte.navegador || reporte.screen_resolution || reporte.user_agent || reporte.pagina_url) && (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <ComputerDesktopIcon className="h-5 w-5" />
                        Información Técnica
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {reporte.pagina_url && (
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <LinkIcon className="h-4 w-4" />
                              URL:
                            </span>
                            <a
                              href={reporte.pagina_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                            >
                              {reporte.pagina_url}
                            </a>
                          </div>
                        )}
                        {reporte.navegador && (
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Navegador:</span>
                            <p className="text-gray-900 dark:text-white font-medium">{reporte.navegador}</p>
                          </div>
                        )}
                        {reporte.screen_resolution && (
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Resolución:</span>
                            <p className="text-gray-900 dark:text-white font-medium">{reporte.screen_resolution}</p>
                          </div>
                        )}
                        {reporte.user_agent && (
                          <div className="md:col-span-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">User Agent:</span>
                            <p className="text-gray-900 dark:text-white font-medium text-sm break-all">
                              {reporte.user_agent}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pasos para reproducir */}
                  {reporte.pasos_reproducir && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Pasos para Reproducir
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {reporte.pasos_reproducir}
                      </p>
                    </div>
                  )}

                  {/* Comportamiento esperado */}
                  {reporte.comportamiento_esperado && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Comportamiento Esperado
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {reporte.comportamiento_esperado}
                      </p>
                    </div>
                  )}

                  {/* Screenshot */}
                  {reporte.screenshot_url && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <PhotoIcon className="h-5 w-5" />
                        Captura de Pantalla
                      </h3>
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={reporte.screenshot_url}
                          alt="Screenshot del reporte"
                          className="w-full h-auto max-h-96 object-contain bg-gray-50 dark:bg-gray-800"
                          onError={(e) => {
                            // Si la imagen falla al cargar, mostrar un mensaje
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = `
                                <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                                  <p>No se pudo cargar la imagen</p>
                                  <p class="text-sm mt-2">URL: ${reporte.screenshot_url}</p>
                                </div>
                              `
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Notas del admin */}
                  {reporte.notas_admin && (
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Notas del Administrador
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {reporte.notas_admin}
                      </p>
                    </div>
                  )}

                  {/* Admin asignado */}
                  {reporte.admin_asignado_info && (
                    <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Administrador Asignado
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        {reporte.admin_asignado_info.display_name || reporte.admin_asignado_info.username}
                        {reporte.admin_asignado_info.email && (
                          <span className="text-gray-500 dark:text-gray-400"> ({reporte.admin_asignado_info.email})</span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Fechas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Creado: {new Date(reporte.created_at).toLocaleString('es-ES')}</span>
                    </div>
                    {reporte.updated_at && (
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Actualizado: {new Date(reporte.updated_at).toLocaleString('es-ES')}</span>
                      </div>
                    )}
                    {reporte.resuelto_at && (
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Resuelto: {new Date(reporte.resuelto_at).toLocaleString('es-ES')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={onEdit}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Editar Reporte
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

