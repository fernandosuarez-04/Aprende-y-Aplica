'use client'

import { useState, useEffect } from 'react'
import { X, User, Mail, Shield } from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'
import { BusinessUser } from '../services/businessUsers.service'

interface BusinessEditUserModalProps {
  user: BusinessUser | null
  isOpen: boolean
  onClose: () => void
  onSave: (userId: string, userData: {
    first_name?: string
    last_name?: string
    display_name?: string
    org_role?: 'owner' | 'admin' | 'member'
    org_status?: 'active' | 'invited' | 'suspended' | 'removed'
  }) => Promise<void>
}

export function BusinessEditUserModal({ user, isOpen, onClose, onSave }: BusinessEditUserModalProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    display_name: '',
    org_role: 'member' as 'owner' | 'admin' | 'member',
    org_status: 'active' as 'active' | 'invited' | 'suspended' | 'removed'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        display_name: user.display_name || '',
        org_role: user.org_role || 'member',
        org_status: user.org_status || 'active'
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      await onSave(user.id, formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar usuario')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-carbon-800 to-carbon-900 rounded-2xl shadow-2xl border border-carbon-600 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-carbon-600">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <User className="w-6 h-6 text-primary" />
            Editar Usuario
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-carbon-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-carbon-400 hover:text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-400">
              {error}
            </div>
          )}

          {/* User Info */}
          <div className="p-4 bg-carbon-700/30 rounded-xl border border-carbon-600/50">
            <p className="text-sm text-carbon-400 mb-1">Nombre de usuario</p>
            <p className="text-white font-medium">{user.username}</p>
            <p className="text-sm text-carbon-400 mb-1 mt-2">Email</p>
            <p className="text-white font-medium">{user.email}</p>
          </div>

          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-carbon-300 mb-2">
                Nombre
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-carbon-700/50 border border-carbon-600 rounded-xl text-white placeholder-carbon-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="Juan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-carbon-300 mb-2">
                Apellido
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-carbon-700/50 border border-carbon-600 rounded-xl text-white placeholder-carbon-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="Pérez"
              />
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-carbon-300 mb-2">
              Nombre Completo
            </label>
            <input
              type="text"
              name="display_name"
              value={formData.display_name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-carbon-700/50 border border-carbon-600 rounded-xl text-white placeholder-carbon-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              placeholder="Juan Pérez"
            />
          </div>

          {/* Role */}
          <div className="group">
            <label className="block text-sm font-medium text-carbon-300 mb-2">
              Rol en la Organización
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-carbon-400" />
              <select
                name="org_role"
                value={formData.org_role}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-carbon-700/50 border border-carbon-600 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none"
              >
                <option value="member">Miembro</option>
                <option value="admin">Administrador</option>
                <option value="owner">Propietario</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div className="group">
            <label className="block text-sm font-medium text-carbon-300 mb-2">
              Estado
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-carbon-400" />
              <select
                name="org_status"
                value={formData.org_status}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-carbon-700/50 border border-carbon-600 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none"
              >
                <option value="active">Activo</option>
                <option value="invited">Invitado</option>
                <option value="suspended">Suspendido</option>
                <option value="removed">Removido</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-carbon-600">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

