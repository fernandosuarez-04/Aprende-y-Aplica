'use client'

import { X, User, Mail, MapPin, Briefcase, Building, Calendar } from 'lucide-react'

interface ViewProfileModalProps {
  profile: {
    id: string
    user_id: string
    cargo_titulo: string
    pais: string
    creado_en: string
    actualizado_en: string
    rol_id?: number
    nivel_id?: number
    area_id?: number
    relacion_id?: number
    tamano_id?: number
    sector_id?: number
    users?: {
      id: string
      username: string
      profile_picture_url?: string
      email?: string
    }
    roles?: {
      id: number
      nombre: string
      slug: string
    }
    niveles?: {
      id: number
      nombre: string
      slug: string
    }
    areas?: {
      id: number
      nombre: string
      slug: string
    }
    relaciones?: {
      id: number
      nombre: string
      slug: string
    }
    tamanos_empresa?: {
      id: number
      nombre: string
      slug: string
      min_empleados: number
      max_empleados: number
    }
    sectores?: {
      id: number
      nombre: string
      slug: string
    }
  }
  isOpen: boolean
  onClose: () => void
}

export function ViewProfileModal({ profile, isOpen, onClose }: ViewProfileModalProps) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
        {/* Header con gradiente */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Detalles del Perfil</h2>
                <p className="text-white/80 text-sm">Información completa del usuario</p>
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

        {/* Contenido principal con scroll */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-8">
            {/* Información del Usuario */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center space-x-4">
                {profile.users?.profile_picture_url ? (
                  <img 
                    src={profile.users.profile_picture_url} 
                    alt={profile.users.username || 'Usuario'}
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-blue-500">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {profile.users?.username || 'Usuario'}
                  </h3>
                  {profile.users?.email && (
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{profile.users.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Grid de información */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Información Profesional */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Briefcase className="w-6 h-6 text-blue-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white">Información Profesional</h4>
                </div>
                
                <div className="space-y-4">
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Cargo</span>
                    <span className="text-white font-medium text-lg">{profile.cargo_titulo}</span>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">País</span>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-white">{profile.pais}</span>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Rol</span>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                      <span className="text-blue-300 font-medium">
                        {profile.roles?.nombre || 'No especificado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Nivel</span>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                      <span className="text-green-300 font-medium">
                        {profile.niveles?.nombre || 'No especificado'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información Adicional */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Building className="w-6 h-6 text-purple-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white">Información Adicional</h4>
                </div>
                
                <div className="space-y-4">
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Área</span>
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
                      <span className="text-purple-300 font-medium">
                        {profile.areas?.nombre || 'No especificado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Relación</span>
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
                      <span className="text-orange-300 font-medium">
                        {profile.relaciones?.nombre || 'No especificado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Tamaño de Empresa</span>
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2">
                      <span className="text-indigo-300 font-medium">
                        {profile.tamanos_empresa?.nombre || 'No especificado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Sector</span>
                    <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg px-3 py-2">
                      <span className="text-pink-300 font-medium break-words">
                        {profile.sectores?.nombre || 'No especificado'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fechas */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Calendar className="w-6 h-6 text-yellow-400" />
                </div>
                <h4 className="text-lg font-semibold text-white">Fechas</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Creado</span>
                  <div className="bg-gray-700/50 rounded-lg px-4 py-3">
                    <span className="text-white font-medium">
                      {formatDate(profile.creado_en)}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Actualizado</span>
                  <div className="bg-gray-700/50 rounded-lg px-4 py-3">
                    <span className="text-white font-medium">
                      {formatDate(profile.actualizado_en)}
                    </span>
                  </div>
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