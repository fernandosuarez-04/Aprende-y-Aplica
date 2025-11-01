'use client'

import { useState } from 'react'
import { X, User, Mail, Shield } from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'

interface BusinessAddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (userData: {
    username: string
    email: string
    password?: string
    first_name?: string
    last_name?: string
    display_name?: string
    org_role?: 'owner' | 'admin' | 'member'
    send_invitation?: boolean
  }) => Promise<void>
}

export function BusinessAddUserModal({ isOpen, onClose, onSave }: BusinessAddUserModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    display_name: '',
    org_role: 'member' as 'owner' | 'admin' | 'member',
    send_invitation: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await onSave({
        ...formData,
        password: formData.password || undefined
      })
      // Reset form
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        display_name: '',
        org_role: 'member',
        send_invitation: false
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-carbon-800 to-carbon-900 rounded-2xl shadow-2xl border border-carbon-600 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-carbon-600">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <User className="w-6 h-6 text-primary" />
            Agregar Usuario a la Organización
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

          {/* Username & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="group">
              <label className="block text-sm font-medium text-carbon-300 mb-2">
                Nombre de Usuario *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-carbon-400" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-carbon-700/50 border border-carbon-600 rounded-xl text-white placeholder-carbon-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="usuario123"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-carbon-300 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-carbon-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-carbon-700/50 border border-carbon-600 rounded-xl text-white placeholder-carbon-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="usuario@empresa.com"
                />
              </div>
            </div>
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

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-carbon-300 mb-2">
              Contraseña (opcional)
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-carbon-700/50 border border-carbon-600 rounded-xl text-white placeholder-carbon-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              placeholder="Dejar vacío para enviar invitación"
            />
            <p className="mt-2 text-sm text-carbon-400">
              Si dejas esto vacío, se enviará una invitación por email
            </p>
          </div>

          {/* Role */}
          <div className="group">
            <label className="block text-sm font-medium text-carbon-300 mb-2">
              Rol en la Organización *
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-carbon-400" />
              <select
                name="org_role"
                value={formData.org_role}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 bg-carbon-700/50 border border-carbon-600 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none"
              >
                <option value="member">Miembro</option>
                <option value="admin">Administrador</option>
                <option value="owner">Propietario</option>
              </select>
            </div>
          </div>

          {/* Send Invitation */}
          {!formData.password && (
            <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/20 rounded-xl">
              <input
                type="checkbox"
                name="send_invitation"
                checked={formData.send_invitation}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-primary bg-carbon-700 border-carbon-600 rounded focus:ring-primary"
              />
              <div>
                <label className="block text-sm font-medium text-white">
                  Enviar invitación por email
                </label>
                <p className="text-sm text-carbon-400 mt-1">
                  El usuario recibirá un email con instrucciones para activar su cuenta
                </p>
              </div>
            </div>
          )}

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
              {isLoading ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

