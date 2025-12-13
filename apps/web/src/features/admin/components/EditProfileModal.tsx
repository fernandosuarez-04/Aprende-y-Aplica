'use client'

import { useState, useEffect } from 'react'
import { X, Save, User } from 'lucide-react'

interface EditProfileModalProps {
  profile: {
    id: string
    user_id: string
    cargo_titulo: string
    pais: string
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
  onSave: (data: any) => Promise<void>
}

export function EditProfileModal({ profile, isOpen, onClose, onSave }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    cargo_titulo: '',
    pais: '',
    rol_id: '',
    nivel_id: '',
    area_id: '',
    relacion_id: '',
    tamano_id: '',
    sector_id: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (profile && isOpen) {
      setFormData({
        cargo_titulo: profile.cargo_titulo || '',
        pais: profile.pais || '',
        rol_id: profile.rol_id?.toString() || '',
        nivel_id: profile.nivel_id?.toString() || '',
        area_id: profile.area_id?.toString() || '',
        relacion_id: profile.relacion_id?.toString() || '',
        tamano_id: profile.tamano_id?.toString() || '',
        sector_id: profile.sector_id?.toString() || ''
      })
    }
  }, [profile, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const updateData = {
        cargo_titulo: formData.cargo_titulo,
        pais: formData.pais,
        rol_id: formData.rol_id ? parseInt(formData.rol_id) : null,
        nivel_id: formData.nivel_id ? parseInt(formData.nivel_id) : null,
        area_id: formData.area_id ? parseInt(formData.area_id) : null,
        relacion_id: formData.relacion_id ? parseInt(formData.relacion_id) : null,
        tamano_id: formData.tamano_id ? parseInt(formData.tamano_id) : null,
        sector_id: formData.sector_id ? parseInt(formData.sector_id) : null
      }

      await onSave(updateData)
      onClose()
    } catch (error) {
      // console.error('Error updating profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-2xl bg-gray-800 rounded-xl border border-gray-700 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <User className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Editar Perfil
                </h2>
                <p className="text-sm text-gray-400">
                  Modificar información del usuario
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* User Info Display */}
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
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {profile.users?.username || 'Usuario'}
                </h3>
                <p className="text-sm text-gray-400">
                  {profile.users?.email || 'Sin email'}
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white">Información Básica</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Cargo / Título
                  </label>
                  <input
                    type="text"
                    name="cargo_titulo"
                    value={formData.cargo_titulo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Ej: Desarrollador Senior"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    País
                  </label>
                  <input
                    type="text"
                    name="pais"
                    value={formData.pais}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Ej: México"
                    required
                  />
                </div>
              </div>

              {/* IDs */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white">Identificadores</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Rol ID
                  </label>
                  <input
                    type="number"
                    name="rol_id"
                    value={formData.rol_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nivel ID
                  </label>
                  <input
                    type="number"
                    name="nivel_id"
                    value={formData.nivel_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Área ID
                  </label>
                  <input
                    type="number"
                    name="area_id"
                    value={formData.area_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Relación ID
                  </label>
                  <input
                    type="number"
                    name="relacion_id"
                    value={formData.relacion_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tamaño ID
                  </label>
                  <input
                    type="number"
                    name="tamano_id"
                    value={formData.tamano_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sector ID
                  </label>
                  <input
                    type="number"
                    name="sector_id"
                    value={formData.sector_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="1"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
