'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Shield, Camera, Briefcase, MapPin, Phone, FileText, Sparkles, Edit3 } from 'lucide-react'
import { BusinessUser } from '../services/businessUsers.service'
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Theme Colors
  const primaryColor = panelStyles?.primary_button_color || '#0EA5E9'
  const accentColor = panelStyles?.accent_color || '#10B981'

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
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

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

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de archivo no válido. Solo se permiten PNG, JPEG, JPG y GIF.')
      return
    }

    // Validate size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError('El archivo es demasiado grande. Máximo 10MB.')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewImage(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload image
    try {
      setIsUploadingImage(true)
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const response = await fetch('/api/profile/upload-picture', {
        method: 'POST',
        body: formDataUpload,
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
      setIsUploadingImage(false)
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

  const displayName = formData.display_name || `${formData.first_name || ''} ${formData.last_name || ''}`.trim() || user.username
  const initials = (formData.first_name?.[0] || user.username[0] || 'U').toUpperCase() + (formData.last_name?.[0] || '').toUpperCase()

  const roleLabels = {
    member: { label: 'Miembro', desc: 'Acceso básico a cursos y contenido' },
    admin: { label: 'Administrador', desc: 'Gestión de usuarios y configuración' },
    owner: { label: 'Propietario', desc: 'Control total de la organización' }
  }

  const statusLabels = {
    active: { label: 'Activo', color: '#10B981' },
    invited: { label: 'Invitado', color: '#F59E0B' },
    suspended: { label: 'Suspendido', color: '#EF4444' },
    removed: { label: 'Removido', color: '#6B7280' }
  }

  return (
    <AnimatePresence>
      {/* Container - transparent backdrop */}
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ zIndex: 99999 }}
      >
        {/* Backdrop - transparent, just for closing */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl mx-4 max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="rounded-2xl shadow-2xl overflow-hidden border border-white/10"
            style={{ backgroundColor: 'var(--org-card-background, #1a1f2e)' }}
          >
            {/* Two Column Layout */}
            <div className="flex flex-col lg:flex-row min-h-[400px] lg:min-h-[550px] max-h-[85vh]">

              {/* Left Side - Preview (Sticky) */}
              <div
                className="lg:w-80 w-full p-6 lg:p-8 flex flex-col border-b lg:border-b-0 lg:border-r border-white/5 lg:sticky lg:top-0 lg:self-start lg:h-auto shrink-0"
                style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)` }}
              >
                <div className="flex-1 flex flex-col items-center justify-center">
                  {/* Avatar Preview with Upload */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative mb-6"
                  >
                    <div
                      className="w-28 h-28 rounded-2xl flex items-center justify-center text-3xl font-bold text-white overflow-hidden"
                      style={{
                        background: previewImage ? 'transparent' : `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                        boxShadow: `0 8px 30px ${primaryColor}40`
                      }}
                    >
                      {previewImage ? (
                        <Image
                          src={previewImage}
                          alt="Preview"
                          fill
                          className="object-cover"
                          sizes="112px"
                        />
                      ) : (
                        initials
                      )}
                    </div>

                    {/* Camera button */}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/20 shadow-lg disabled:opacity-50"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {isUploadingImage ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5 text-white" />
                      )}
                    </motion.button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif"
                      onChange={handleImageChange}
                      className="hidden"
                    />

                    {/* Edit badge */}
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Edit3 className="w-4 h-4 text-white" />
                    </motion.div>
                  </motion.div>

                  {/* User Info Preview */}
                  <h2 className="text-xl font-bold text-white mb-1 text-center">
                    {displayName}
                  </h2>
                  <p className="text-sm text-white/50 text-center mb-3">
                    {formData.email || user.email}
                  </p>

                  {/* Role Badge */}
                  <div
                    className="px-3 py-1.5 rounded-full text-xs font-medium mb-2"
                    style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                  >
                    {roleLabels[formData.org_role].label}
                  </div>

                  {/* Status Badge */}
                  <div
                    className="px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${statusLabels[formData.org_status].color}20`,
                      color: statusLabels[formData.org_status].color
                    }}
                  >
                    {statusLabels[formData.org_status].label}
                  </div>

                  {/* Type Role Badge */}
                  {formData.type_rol && (
                    <div className="mt-4 flex items-center gap-2 text-white/50 text-sm">
                      <Briefcase className="w-4 h-4" />
                      <span>{formData.type_rol}</span>
                    </div>
                  )}

                  {/* Location Badge */}
                  {formData.location && (
                    <div className="mt-2 flex items-center gap-2 text-white/40 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>{formData.location}</span>
                    </div>
                  )}
                </div>

                {/* Info Note */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white/50">
                  <p>Los cambios realizados se guardarán y el usuario recibirá una notificación si es necesario.</p>
                </div>
              </div>

              {/* Right Side - Form */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 lg:p-6 border-b border-white/5 shrink-0">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Editar Usuario</h3>
                    <p className="text-sm text-white/40 mt-0.5">Modificar información del miembro</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/40" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                    {/* Error */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                      >
                        <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <span className="text-sm text-red-400 flex-1">{error}</span>
                      </motion.div>
                    )}

                    {/* First Name & Last Name */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Nombre</label>
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                          placeholder="Juan"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Apellido</label>
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                          placeholder="Pérez"
                        />
                      </div>
                    </div>

                    {/* Display Name & Email */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Nombre Completo</label>
                        <input
                          type="text"
                          name="display_name"
                          value={formData.display_name}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                          placeholder="Juan Pérez"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                            placeholder="usuario@ejemplo.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Type Rol & Type Rol (Puesto) */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Cargo / Rol</label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input
                            type="text"
                            name="cargo_rol"
                            value={formData.cargo_rol}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                            placeholder="Desarrollador, Diseñador, etc."
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Tipo de Rol</label>
                        <input
                          type="text"
                          name="type_rol"
                          value={formData.type_rol}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                          placeholder="Freelancer, Empleado, etc."
                        />
                      </div>
                    </div>

                    {/* Phone & Location */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Teléfono</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                            placeholder="+1 234 567 8900"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Ubicación</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                            placeholder="Ciudad, País"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Biografía</label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 w-4 h-4 text-white/30" />
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          rows={3}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors resize-none"
                          placeholder="Escribe una breve biografía..."
                        />
                      </div>
                    </div>

                    {/* Org Role */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Rol en la Organización
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 lg:gap-3">
                        {(['member', 'admin', 'owner'] as const).map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, org_role: role }))}
                            className={`p-2 lg:p-3 rounded-xl border text-left transition-all ${formData.org_role === role
                              ? 'border-transparent'
                              : 'border-white/10 hover:border-white/20 bg-white/5'
                              }`}
                            style={formData.org_role === role ? {
                              background: `linear-gradient(135deg, ${primaryColor}30, ${accentColor}20)`,
                              borderColor: primaryColor
                            } : {}}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Shield className="w-4 h-4" style={{ color: formData.org_role === role ? primaryColor : 'rgba(255,255,255,0.5)' }} />
                              <span className={`text-xs lg:text-sm font-medium ${formData.org_role === role ? 'text-white' : 'text-white/70'}`}>
                                {roleLabels[role].label}
                              </span>
                            </div>
                            <p className="text-xs text-white/40 hidden sm:block">{roleLabels[role].desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Org Status */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Estado
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-3">
                        {(['active', 'invited', 'suspended', 'removed'] as const).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, org_status: status }))}
                            className={`p-2 lg:p-3 rounded-xl border text-center transition-all ${formData.org_status === status
                              ? 'border-transparent'
                              : 'border-white/10 hover:border-white/20 bg-white/5'
                              }`}
                            style={formData.org_status === status ? {
                              background: `${statusLabels[status].color}20`,
                              borderColor: statusLabels[status].color
                            } : {}}
                          >
                            <span className={`text-xs lg:text-sm font-medium ${formData.org_status === status ? 'text-white' : 'text-white/70'}`}>
                              {statusLabels[status].label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 lg:p-6 border-t border-white/5 flex items-center justify-end gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isLoading}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isLoading || isUploadingImage}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2 disabled:opacity-50"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                        boxShadow: `0 4px 15px ${primaryColor}40`
                      }}
                    >
                      {isLoading || isUploadingImage ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {isUploadingImage ? 'Subiendo...' : 'Guardando...'}
                        </>
                      ) : (
                        'Guardar Cambios'
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
