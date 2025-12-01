'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Shield, Lock, UserPlus, ChevronDown } from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'

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
    type_rol: string
    org_role?: 'owner' | 'admin' | 'member'
  }) => Promise<void>
}

export function BusinessAddUserModal({ isOpen, onClose, onSave }: BusinessAddUserModalProps) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  
  // Aplicar colores personalizados
  const modalBg = panelStyles?.card_background || 'rgba(15, 23, 42, 0.95)'
  const modalBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const textColor = panelStyles?.text_color || '#f8fafc'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'
  const sectionBg = `${modalBg}CC`
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    display_name: '',
    type_rol: '',
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
        type_rol: '',
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
        {/* Backdrop con blur premium */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xl"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative rounded-3xl shadow-2xl border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col z-10 backdrop-blur-xl"
          style={{ 
            backgroundColor: modalBg,
            borderColor: modalBorder
          }}
        >
          {/* Header */}
          <div className="relative border-b p-6 backdrop-blur-sm" style={{ 
            backgroundColor: modalBg,
            borderColor: modalBorder
          }}>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  initial={{ scale: 0.9, rotate: -5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{
                    backgroundColor: primaryColor
                  }}
                >
                  <UserPlus className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h2 className="font-heading text-2xl font-bold tracking-tight" style={{ color: textColor }}>
                    Agregar Usuario
                  </h2>
                  <p className="font-body text-sm mt-1" style={{ color: textColor, opacity: 0.7 }}>
                    Invitar nuevo miembro a la organización
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                disabled={isLoading}
                className="p-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${modalBg}80`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <X className="w-5 h-5 transition-colors" style={{ color: textColor, opacity: 0.7 }} />
              </motion.button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 rounded-xl text-red-400 flex items-center gap-3 border backdrop-blur-sm"
                    style={{ 
                      backgroundColor: 'rgba(127, 29, 29, 0.2)',
                      borderColor: 'rgba(220, 38, 38, 0.3)'
                    }}
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-red-500/20">
                      <X className="w-3 h-3" />
                    </div>
                    <span className="text-body text-sm">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Username & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="group"
                >
                  <label className="block font-body text-sm font-heading font-semibold mb-2.5" style={{ color: textColor }}>
                    Nombre de Usuario <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200" style={{ color: textColor, opacity: 0.5 }} />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3.5 border rounded-xl font-body placeholder-carbon-500 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
                      style={{ 
                        borderColor: modalBorder,
                        backgroundColor: sectionBg,
                        color: textColor
                      }}
                      placeholder="usuario123"
                    />
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                  className="group"
                >
                  <label className="block font-body text-sm font-heading font-semibold mb-2.5" style={{ color: textColor }}>
                    Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200" style={{ color: textColor, opacity: 0.5 }} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3.5 border rounded-xl font-body placeholder-carbon-500 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
                      style={{ 
                        borderColor: modalBorder,
                        backgroundColor: sectionBg,
                        color: textColor
                      }}
                      placeholder="usuario@empresa.com"
                    />
                  </div>
                </motion.div>
              </div>

              {/* First Name & Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <label className="block font-body text-sm font-heading font-semibold mb-2.5" style={{ color: textColor }}>
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 border rounded-xl font-body placeholder-carbon-500 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
                    style={{ 
                      borderColor: modalBorder,
                      backgroundColor: sectionBg,
                      color: textColor
                    }}
                    placeholder="Juan"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                >
                  <label className="block font-body text-sm font-heading font-semibold mb-2.5" style={{ color: textColor }}>
                    Apellido
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 border rounded-xl font-body placeholder-carbon-500 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
                    style={{ 
                      borderColor: modalBorder,
                      backgroundColor: sectionBg,
                      color: textColor
                    }}
                    placeholder="Pérez"
                  />
                </motion.div>
              </div>

              {/* Display Name */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <label className="block font-body text-sm font-heading font-semibold mb-2.5" style={{ color: textColor }}>
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 border rounded-xl font-body placeholder-carbon-500 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
                  style={{ 
                    borderColor: modalBorder,
                    backgroundColor: sectionBg,
                    color: textColor
                  }}
                  placeholder="Juan Pérez"
                />
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.3 }}
                className="group"
              >
                <label className="block font-body text-sm font-heading font-semibold mb-2.5" style={{ color: textColor }}>
                  Contraseña <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200" style={{ color: textColor, opacity: 0.5 }} />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="w-full pl-12 pr-4 py-3.5 border rounded-xl font-body placeholder-carbon-500 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
                    style={{ 
                      borderColor: modalBorder,
                      backgroundColor: sectionBg,
                      color: textColor
                    }}
                    placeholder="Ingresa una contraseña segura"
                  />
                </div>
                <p className="mt-2 font-body text-xs" style={{ color: textColor, opacity: 0.6 }}>
                  La contraseña debe tener al menos 6 caracteres
                </p>
              </motion.div>

              {/* Type Role */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <label className="block font-body text-sm font-heading font-semibold mb-2.5" style={{ color: textColor }}>
                  Tipo de Rol <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="type_rol"
                  value={formData.type_rol}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3.5 border rounded-xl font-body placeholder-carbon-500 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
                  style={{ 
                    borderColor: modalBorder,
                    backgroundColor: sectionBg,
                    color: textColor
                  }}
                  placeholder="Ej: Líder de Proyecto, Desarrollador, etc."
                />
                <p className="mt-2 font-body text-xs" style={{ color: textColor, opacity: 0.6 }}>
                  Especifica el tipo de rol del usuario en la organización
                </p>
              </motion.div>

              {/* Role */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.3 }}
                className="group"
              >
                <label className="block font-body text-sm font-heading font-semibold mb-2.5" style={{ color: textColor }}>
                  Rol en la Organización <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 z-10" style={{ color: textColor, opacity: 0.5 }} />
                  <select
                    name="org_role"
                    value={formData.org_role}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-10 py-3.5 border rounded-xl font-body focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200 appearance-none cursor-pointer"
                    style={{ 
                      borderColor: modalBorder,
                      backgroundColor: sectionBg,
                      color: textColor
                    }}
                  >
                    <option value="member" style={{ backgroundColor: modalBg, color: textColor }}>Miembro</option>
                    <option value="admin" style={{ backgroundColor: modalBg, color: textColor }}>Administrador</option>
                    <option value="owner" style={{ backgroundColor: modalBg, color: textColor }}>Propietario</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: textColor, opacity: 0.5 }} />
                </div>
                <p className="mt-2 font-body text-xs" style={{ color: textColor, opacity: 0.6 }}>
                  Los permisos varían según el rol asignado
                </p>
              </motion.div>

            </div>

            {/* Footer con acciones */}
            <div className="border-t p-6 backdrop-blur-sm" style={{ 
              backgroundColor: modalBg,
              borderColor: modalBorder
            }}>
              <div className="flex items-center justify-end gap-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                    className="min-w-[120px] font-heading text-sm transition-all duration-200"
                  >
                    Cancelar
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    variant="gradient"
                    disabled={isLoading}
                    className="min-w-[160px] font-heading text-sm transition-all duration-200"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${panelStyles?.secondary_button_color || '#2563eb'})`,
                      boxShadow: `0 10px 25px -5px ${primaryColor}40`
                    }}
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
                </motion.div>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

