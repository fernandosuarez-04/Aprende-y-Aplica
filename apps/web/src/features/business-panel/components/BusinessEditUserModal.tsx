'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Shield, Camera, Upload as UploadIcon, Image as ImageIcon, Briefcase, MapPin, Phone, FileText } from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'
import { BusinessUser } from '../services/businessUsers.service'
import { PremiumSelect } from './PremiumSelect'
import Image from 'next/image'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'

interface BusinessEditUserModalProps {
  user: BusinessUser | null
  isOpen: boolean
  onClose: () => void
  onSave: (userId: string, userData: {
    first_name?: string
    last_name?: string
    display_name?: string
    email?: string
    cargo_rol?: string
    type_rol?: string
    org_role?: 'owner' | 'admin' | 'member'
    org_status?: 'active' | 'invited' | 'suspended' | 'removed'
    profile_picture_url?: string
    bio?: string
    location?: string
    phone?: string
  }) => Promise<void>
}

export function BusinessEditUserModal({ user, isOpen, onClose, onSave }: BusinessEditUserModalProps) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    display_name: '',
    email: '',
    cargo_rol: '',
    type_rol: '',
    org_role: 'member' as 'owner' | 'admin' | 'member',
    org_status: 'active' as 'active' | 'invited' | 'suspended' | 'removed',
    profile_picture_url: '',
    bio: '',
    location: '',
    phone: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        display_name: user.display_name || '',
        email: user.email || '',
        cargo_rol: user.cargo_rol || '',
        type_rol: user.type_rol || '',
        org_role: user.org_role || 'member',
        org_status: user.org_status || 'active',
        profile_picture_url: user.profile_picture_url || '',
        bio: user.bio || '',
        location: user.location || '',
        phone: user.phone || ''
      })
      setPreviewImage(user.profile_picture_url || null)
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de archivo no válido. Solo se permiten PNG, JPEG, JPG y GIF.')
      return
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError('El archivo es demasiado grande. Máximo 10MB.')
      return
    }

    // Crear preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewImage(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Subir imagen
    try {
      setIsLoading(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/profile/upload-picture', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al subir imagen')
      }

      const { imageUrl } = await response.json()
      setFormData(prev => ({
        ...prev,
        profile_picture_url: imageUrl
      }))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir imagen')
      setPreviewImage(user?.profile_picture_url || null)
    } finally {
      setIsLoading(false)
    }
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

  const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
  const initials = (user.first_name?.[0] || user.username[0] || 'U').toUpperCase()

  // Aplicar colores personalizados
  const modalBg = panelStyles?.card_background || 'rgba(15, 23, 42, 0.95)'
  const modalBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const textColor = panelStyles?.text_color || '#f8fafc'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'
  
  // Color para secciones internas (mismo color base con opacidad ligeramente diferente)
  const sectionBg = modalBg.includes('rgba') 
    ? modalBg.replace(/[\d.]+\)$/, '0.4)') 
    : `${modalBg}66`

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
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
          className="relative backdrop-blur-xl rounded-3xl shadow-2xl border w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col z-10"
          style={{ 
            backgroundColor: modalBg,
            borderColor: modalBorder
          }}
        >
          {/* Header */}
          <div className="relative border-b p-6" style={{ 
            backgroundColor: modalBg,
            borderColor: modalBorder
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}30` }}
                >
                  <User className="w-5 h-5" style={{ color: primaryColor }} />
                </motion.div>
                <div>
                  <h2 className="font-heading text-xl font-semibold tracking-tight" style={{ color: textColor }}>
                    Editar Usuario
                  </h2>
                  <p className="font-body text-sm mt-0.5" style={{ color: textColor, opacity: 0.7 }}>
                    Modificar información del miembro
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                disabled={isLoading}
                className="p-2 rounded-xl transition-all duration-200 hover:bg-carbon-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5 text-carbon-400 hover:text-white transition-colors" />
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
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl font-body text-sm text-red-400"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Profile Picture Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="flex flex-col items-center gap-4 pb-6 border-b"
                style={{ borderColor: modalBorder }}
              >
                <div className="relative">
                  {previewImage ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-2" style={{ borderColor: `${primaryColor}40` }}>
                      <Image
                        src={previewImage}
                        alt={displayName}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                  ) : (
                    <div 
                      className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-heading font-bold border-2"
                      style={{ 
                        backgroundColor: `${primaryColor}20`,
                        borderColor: `${primaryColor}40`,
                        color: primaryColor
                      }}
                    >
                      {initials}
                    </div>
                  )}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center border-2 backdrop-blur-sm"
                    style={{ 
                      backgroundColor: primaryColor,
                      borderColor: modalBorder
                    }}
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </motion.button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                <div className="text-center">
                  <p className="font-body text-sm font-medium" style={{ color: textColor }}>
                    {displayName}
                  </p>
                  <p className="font-body text-xs mt-1" style={{ color: textColor, opacity: 0.6 }}>
                    {user.email}
                  </p>
                </div>
              </motion.div>

              {/* User Info Read-only */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="p-4 rounded-2xl border"
                style={{ 
                  backgroundColor: sectionBg,
                  borderColor: modalBorder
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-body text-xs mb-1.5 uppercase tracking-wider" style={{ color: textColor, opacity: 0.6 }}>Nombre de usuario</p>
                    <p className="font-body text-sm font-medium" style={{ color: textColor }}>{user.username}</p>
                  </div>
                </div>
              </motion.div>

              {/* Editable Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <label className="block font-body text-sm font-heading font-semibold mb-2" style={{ color: textColor }}>
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border rounded-xl font-body text-sm placeholder-carbon-500 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
                    style={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.3)',
                      borderColor: modalBorder,
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
                  <label className="block font-body text-sm font-heading font-semibold mb-2" style={{ color: textColor }}>
                    Apellido
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border rounded-xl font-body text-sm placeholder-carbon-500 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
                    style={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.3)',
                      borderColor: modalBorder,
                      color: textColor
                    }}
                    placeholder="Pérez"
                  />
                </motion.div>
              </div>

              {/* Display Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <label className="block font-body text-sm font-heading font-semibold mb-2" style={{ color: textColor }}>
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border rounded-xl font-body text-sm placeholder-carbon-500 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
                    style={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.3)',
                      borderColor: modalBorder,
                      color: textColor
                    }}
                    placeholder="Juan Pérez"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.3 }}
                >
                  <label className="block font-body text-sm font-heading font-semibold mb-2" style={{ color: textColor }}>
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-carbon-500" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border rounded-lg font-body text-sm placeholder-carbon-500 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
                      style={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.3)',
                        borderColor: modalBorder,
                        color: textColor
                      }}
                      placeholder="usuario@ejemplo.com"
                    />
                  </div>
                </motion.div>
              </div>

              {/* Cargo Rol & Type Rol */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <label className="block font-body text-sm font-heading font-semibold mb-2" style={{ color: textColor }}>
                    Cargo / Rol
                  </label>
                  <PremiumSelect
                    value={formData.cargo_rol}
                    onChange={(value) => setFormData(prev => ({ ...prev, cargo_rol: value }))}
                    options={[
                      { value: 'Usuario', label: 'Usuario' },
                      { value: 'Instructor', label: 'Instructor' },
                      { value: 'Administrador', label: 'Administrador' }
                    ]}
                    placeholder="Seleccionar cargo"
                    icon={<Briefcase className="w-4 h-4" />}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.3 }}
                >
                  <label className="block font-body text-sm font-heading font-semibold mb-2" style={{ color: textColor }}>
                    Tipo de Rol
                  </label>
                  <input
                    type="text"
                    name="type_rol"
                    value={formData.type_rol}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border rounded-xl font-body text-sm placeholder-carbon-500 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
                    style={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.3)',
                      borderColor: modalBorder,
                      color: textColor
                    }}
                    placeholder="Ej: Líder de Proyecto"
                  />
                </motion.div>
              </div>

              {/* Phone & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  <label className="block font-body text-sm font-heading font-semibold mb-2" style={{ color: textColor }}>
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-carbon-500" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border rounded-lg font-body text-sm placeholder-carbon-500 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
                      style={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.3)',
                        borderColor: modalBorder,
                        color: textColor
                      }}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.3 }}
                >
                  <label className="block font-body text-sm font-heading font-semibold mb-2" style={{ color: textColor }}>
                    Ubicación
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-carbon-500" />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border rounded-lg font-body text-sm placeholder-carbon-500 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
                      style={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.3)',
                        borderColor: modalBorder,
                        color: textColor
                      }}
                      placeholder="Ciudad, País"
                    />
                  </div>
                </motion.div>
              </div>

              {/* Bio */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                <label className="block font-body text-sm font-heading font-semibold mb-2" style={{ color: textColor }}>
                  Biografía
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-carbon-500" />
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg font-body text-sm placeholder-carbon-500 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200 resize-none"
                    style={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.3)',
                      borderColor: modalBorder,
                      color: textColor
                    }}
                    placeholder="Escribe una breve biografía..."
                  />
                </div>
              </motion.div>

              {/* Organization Role & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65, duration: 0.3 }}
                >
                  <label className="block font-body text-sm font-heading font-semibold mb-2" style={{ color: textColor }}>
                    Rol en la Organización
                  </label>
                  <PremiumSelect
                    value={formData.org_role}
                    onChange={(value) => setFormData(prev => ({ ...prev, org_role: value as 'owner' | 'admin' | 'member' }))}
                    options={[
                      { value: 'member', label: 'Miembro' },
                      { value: 'admin', label: 'Administrador' },
                      { value: 'owner', label: 'Propietario' }
                    ]}
                    placeholder="Seleccionar rol"
                    icon={<Shield className="w-4 h-4" />}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.3 }}
                >
                  <label className="block font-body text-sm font-heading font-semibold mb-2" style={{ color: textColor }}>
                    Estado
                  </label>
                  <PremiumSelect
                    value={formData.org_status}
                    onChange={(value) => setFormData(prev => ({ ...prev, org_status: value as 'active' | 'invited' | 'suspended' | 'removed' }))}
                    options={[
                      { value: 'active', label: 'Activo' },
                      { value: 'invited', label: 'Invitado' },
                      { value: 'suspended', label: 'Suspendido' },
                      { value: 'removed', label: 'Removido' }
                    ]}
                    placeholder="Seleccionar estado"
                    icon={<Shield className="w-4 h-4" />}
                  />
                </motion.div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t p-6" style={{ 
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
                    className="font-heading text-sm transition-all duration-200"
                  >
                    Cancelar
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    variant="gradient"
                    disabled={isLoading}
                    className="font-heading text-sm transition-all duration-200"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Guardando...
                      </span>
                    ) : (
                      'Guardar Cambios'
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
