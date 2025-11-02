'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Shield, Lock, UserPlus, ChevronDown } from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'

interface BusinessAddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (userData: {
    username: string
    email: string
    password: string
    first_name?: string
    last_name?: string
    display_name?: string
    org_role?: 'owner' | 'admin' | 'member'
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
    org_role: 'member' as 'owner' | 'admin' | 'member'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-completar display_name cuando cambian first_name o last_name
  useEffect(() => {
    if (formData.first_name || formData.last_name) {
      const fullName = `${formData.first_name} ${formData.last_name}`.trim()
      if (fullName && !formData.display_name) {
        setFormData(prev => ({ ...prev, display_name: fullName }))
      }
    }
  }, [formData.first_name, formData.last_name])

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
        password: formData.password
      })
      // Reset form
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        display_name: '',
        org_role: 'member'
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const roleLabels = {
    member: 'Miembro',
    admin: 'Administrador',
    owner: 'Propietario'
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop con blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-carbon-900/80 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="relative rounded-2xl shadow-2xl border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col z-10"
          style={{ 
            backgroundColor: '#1e293b',
            borderColor: '#334155'
          }}
        >
          {/* Header */}
          <div className="relative border-b p-6" style={{ 
            backgroundColor: '#0f172a',
            borderColor: '#334155'
          }}>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-success flex items-center justify-center shadow-lg">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Agregar Usuario
                  </h2>
                  <p className="text-sm text-gray-300 mt-0.5">
                    Invitar nuevo miembro a la organización
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="p-2 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-xl text-red-400 flex items-center gap-3 border"
                    style={{ 
                      backgroundColor: '#7f1d1d',
                      borderColor: '#dc2626'
                    }}
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#991b1b' }}>
                      <X className="w-3 h-3" />
                    </div>
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Username & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="group"
                >
                  <label className="block text-sm font-semibold text-white mb-2">
                    Nombre de Usuario <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      style={{ 
                        backgroundColor: '#0f172a',
                        borderColor: '#334155'
                      }}
                      placeholder="usuario123"
                    />
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="group"
                >
                  <label className="block text-sm font-semibold text-white mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      style={{ 
                        backgroundColor: '#0f172a',
                        borderColor: '#334155'
                      }}
                      placeholder="usuario@empresa.com"
                    />
                  </div>
                </motion.div>
              </div>

              {/* First Name & Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-sm font-semibold text-white mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    style={{ 
                      backgroundColor: '#0f172a',
                      borderColor: '#334155'
                    }}
                    placeholder="Juan"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <label className="block text-sm font-semibold text-white mb-2">
                    Apellido
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    style={{ 
                      backgroundColor: '#0f172a',
                      borderColor: '#334155'
                    }}
                    placeholder="Pérez"
                  />
                </motion.div>
              </div>

              {/* Display Name */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-semibold text-white mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  style={{ 
                    backgroundColor: '#0f172a',
                    borderColor: '#334155'
                  }}
                  placeholder="Juan Pérez"
                />
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="group"
              >
                <label className="block text-sm font-semibold text-white mb-2">
                  Contraseña <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    style={{ 
                      backgroundColor: '#0f172a',
                      borderColor: '#334155'
                    }}
                    placeholder="Ingresa una contraseña segura"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  La contraseña debe tener al menos 6 caracteres
                </p>
              </motion.div>

              {/* Role */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="group"
              >
                <label className="block text-sm font-semibold text-white mb-2">
                  Rol en la Organización <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors z-10" />
                  <select
                    name="org_role"
                    value={formData.org_role}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-10 py-3 border rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none cursor-pointer"
                    style={{ 
                      backgroundColor: '#0f172a',
                      borderColor: '#334155'
                    }}
                  >
                    <option value="member">Miembro</option>
                    <option value="admin">Administrador</option>
                    <option value="owner">Propietario</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  Los permisos varían según el rol asignado
                </p>
              </motion.div>

            </div>

            {/* Footer con acciones */}
            <div className="border-t p-6" style={{ 
              backgroundColor: '#1e293b',
              borderColor: '#334155'
            }}>
              <div className="flex items-center justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="min-w-[120px]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={isLoading}
                  className="min-w-[160px]"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Crear Usuario
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

