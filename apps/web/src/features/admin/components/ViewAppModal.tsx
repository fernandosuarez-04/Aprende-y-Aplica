'use client'

import { XMarkIcon, ArrowTopRightOnSquareIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { AdminApp } from '../services/adminApps.service'

interface ViewAppModalProps {
  isOpen: boolean
  onClose: () => void
  app: AdminApp | null
}

export function ViewAppModal({ isOpen, onClose, app }: ViewAppModalProps) {
  if (!isOpen || !app) return null

  const getPricingColor = (model: string) => {
    switch (model.toLowerCase()) {
      case 'free': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'freemium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'paid': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'subscription': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getPricingLabel = (model: string) => {
    switch (model.toLowerCase()) {
      case 'free': return 'Gratuito'
      case 'freemium': return 'Freemium'
      case 'paid': return 'De Pago'
      case 'subscription': return 'Suscripción'
      default: return model
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-gray-600/75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detalles de la App</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header con logo y título */}
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
              {app.logo_url ? (
                <img
                  src={app.logo_url}
                  alt={`${app.name} logo`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {app.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{app.name}</h3>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getPricingColor(app.pricing_model)}`}>
                  {getPricingLabel(app.pricing_model)}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <span>Categoría: {app.ai_categories?.name || 'Sin categoría'}</span>
                <span>•</span>
                <span>Creada: {new Date(app.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>Actualizada: {new Date(app.updated_at).toLocaleDateString()}</span>
              </div>

              {/* Estados */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                  app.is_active 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                }`}>
                  {app.is_active ? 'Activa' : 'Inactiva'}
                </span>
                
                {app.is_featured && (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full border bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                    Destacada
                  </span>
                )}
                
                {app.is_verified && (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full border bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                    Verificada
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Descripción</h4>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{app.description}</p>
            {app.long_description && (
              <div className="mt-4">
                <h5 className="text-md font-medium text-gray-900 dark:text-white mb-2">Descripción Detallada</h5>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{app.long_description}</p>
              </div>
            )}
          </div>

          {/* URLs */}
          {(app.website_url || app.logo_url) && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Enlaces</h4>
              <div className="space-y-2">
                {app.website_url && (
                  <div className="flex items-center gap-2">
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <a
                      href={app.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
                    >
                      Sitio Web Oficial
                    </a>
                  </div>
                )}
                {app.logo_url && (
                  <div className="flex items-center gap-2">
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <a
                      href={app.logo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
                    >
                      Logo
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Características */}
          {app.features && app.features.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Características Principales</h4>
              <div className="flex flex-wrap gap-2">
                {app.features.map((feature, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Casos de Uso */}
          {app.use_cases && app.use_cases.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Casos de Uso</h4>
              <div className="flex flex-wrap gap-2">
                {app.use_cases.map((useCase, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                  >
                    {useCase}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Plataformas */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Disponibilidad en Plataformas</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                {app.api_available ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                )}
                <span className="text-gray-700 dark:text-gray-300">API</span>
              </div>
              
              <div className="flex items-center gap-2">
                {app.mobile_app ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                )}
                <span className="text-gray-700 dark:text-gray-300">Móvil</span>
              </div>
              
              <div className="flex items-center gap-2">
                {app.desktop_app ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                )}
                <span className="text-gray-700 dark:text-gray-300">Desktop</span>
              </div>
              
              <div className="flex items-center gap-2">
                {app.browser_extension ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                )}
                <span className="text-gray-700 dark:text-gray-300">Extensión</span>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Estadísticas</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{app.view_count.toLocaleString()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Vistas</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{app.like_count.toLocaleString()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Likes</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{app.rating.toFixed(1)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Rating</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{app.rating_count.toLocaleString()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Reseñas</div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {app.tags && app.tags.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {app.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
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
