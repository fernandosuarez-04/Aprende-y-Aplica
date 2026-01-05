'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Shield, Lock, UserPlus, Camera, Sparkles, Briefcase } from 'lucide-react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
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
    profile_picture_url?: string
  }) => Promise<void>
}

export function BusinessAddUserModal({ isOpen, onClose, onSave }: BusinessAddUserModalProps) {
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Theme Colors
  const primaryColor = panelStyles?.primary_button_color || '#0A2540'
  const accentColor = panelStyles?.accent_color || '#00D4B3'

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    display_name: '',
    type_rol: '',
    org_role: 'member' as 'owner' | 'admin' | 'member',
    profile_picture_url: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  // Auto-fill display_name
  useEffect(() => {
    // Actualizar siempre el display_name al cambiar nombre o apellido
    const fullName = `${formData.first_name} ${formData.last_name}`.trim()
    setFormData(prev => {
      // Solo actualizar si cambia para evitar rerenders innecesarios
      if (prev.display_name === fullName) return prev
      return { ...prev, display_name: fullName }
    })
  }, [formData.first_name, formData.last_name])

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        display_name: '',
        type_rol: '',
        org_role: 'member',
        profile_picture_url: ''
      })
      setError(null)
      setPreviewImage(null)
      setPendingFile(null)
    }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
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
    setPendingFile(file)
    setError(null)
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setIsUploadingImage(true)
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      // Use a general upload endpoint that doesn't require user session
      const response = await fetch('/api/business/users/upload-picture', {
        method: 'POST',
        body: formDataUpload,
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al subir imagen')
      }

      const { imageUrl } = await response.json()
      return imageUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir imagen')
      return null
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      let profilePictureUrl = formData.profile_picture_url

      // Upload pending image first if exists
      if (pendingFile) {
        const uploadedUrl = await uploadImage(pendingFile)
        if (uploadedUrl) {
          profilePictureUrl = uploadedUrl
        }
      }

      await onSave({
        ...formData,
        profile_picture_url: profilePictureUrl || undefined
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
    member: { label: t('users.roles.member'), desc: t('users.modals.add.roleDesc.member') },
    admin: { label: t('users.roles.admin'), desc: t('users.modals.add.roleDesc.admin') },
    owner: { label: t('users.roles.owner'), desc: t('users.modals.add.roleDesc.owner') }
  }

  const getInitials = () => {
    if (formData.first_name && formData.last_name) {
      return `${formData.first_name[0]}${formData.last_name[0]}`.toUpperCase()
    }
    if (formData.username) {
      return formData.username[0].toUpperCase()
    }
    return null
  }

  return (
    <AnimatePresence>
      {/* Container - transparent backdrop */}
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
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
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="rounded-2xl shadow-2xl overflow-hidden border border-white/10"
            style={{ backgroundColor: 'var(--org-card-background, #1a1f2e)' }}
          >
            {/* Two Column Layout - Scrollable container */}
            <div className="flex flex-col lg:flex-row max-h-[85vh] overflow-y-auto lg:overflow-hidden">

              {/* Left Side - Preview */}
              <div
                className="lg:w-80 w-full p-4 lg:p-8 flex flex-col border-b lg:border-b-0 lg:border-r border-white/5 shrink-0"
                style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)` }}
              >
                <div className="flex-1 flex flex-col items-center justify-center py-2 lg:py-0">
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
                      ) : getInitials() ? (
                        getInitials()
                      ) : (
                        <UserPlus className="w-12 h-12" />
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
                        <Camera className="w-5 h-5 !text-white" color="#FFFFFF" strokeWidth={2} />
                      )}
                    </motion.button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif"
                      onChange={handleImageChange}
                      className="hidden"
                    />

                    {/* Sparkle badge */}
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                    </motion.div>
                  </motion.div>

                  {/* User Info Preview */}
                  <h2 className="text-xl font-bold text-white mb-1 text-center">
                    {formData.display_name || formData.username || t('users.modals.add.title')}
                  </h2>
                  <p className="text-sm text-white/50 text-center mb-2">
                    {formData.email || 'email@ejemplo.com'}
                  </p>

                  {/* Role Badge */}
                  <div
                    className="px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                  >
                    {roleLabels[formData.org_role].label}
                  </div>

                  {/* Type Role Badge */}
                  {formData.type_rol && (
                    <div className="mt-3 flex items-center gap-2 text-white/50 text-sm">
                      <Briefcase className="w-4 h-4" />
                      <span>{formData.type_rol}</span>
                    </div>
                  )}

                  {/* Image hint */}
                  <p className="mt-6 text-xs text-white/30 text-center">
                    {t('users.modals.add.hints.photo')}
                  </p>
                </div>

                {/* Info Note */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white/50">
                  <p>{t('users.modals.add.hints.creds')}</p>
                </div>
              </div>

              {/* Right Side - Form */}
              <div className="flex-1 flex flex-col min-w-0 max-h-[85vh] lg:max-h-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 lg:p-6 border-b border-white/5 shrink-0">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{t('users.modals.add.userInfoTitle')}</h3>
                    <p className="text-sm text-white/40 mt-0.5">{t('users.modals.add.userInfoSubtitle')}</p>
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
                  <div className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
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

                    {/* Username & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                          {t('users.modals.add.fields.username')} <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                            placeholder={t('users.modals.add.placeholders.username')}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                          {t('users.modals.add.fields.email')} <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                            placeholder={t('users.modals.add.placeholders.email')}
                          />
                        </div>
                      </div>
                    </div>

                    {/* First Name & Last Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">{t('users.modals.add.fields.firstName')}</label>
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                          placeholder={t('users.modals.add.placeholders.firstName')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">{t('users.modals.add.fields.lastName')}</label>
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                          placeholder={t('users.modals.add.placeholders.lastName')}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        {t('users.modals.add.fields.password')} <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          minLength={6}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                          placeholder={t('users.modals.add.placeholders.password')}
                        />
                      </div>
                    </div>

                    {/* Type Role */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        {t('users.modals.add.fields.position')} <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="text"
                          name="type_rol"
                          value={formData.type_rol}
                          onChange={handleChange}
                          required
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                          placeholder={t('users.modals.add.placeholders.position')}
                        />
                      </div>
                    </div>

                    {/* Org Role */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                       {t('users.modals.add.fields.orgRole')} <span className="text-red-400">*</span>
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
                  </div>

                  {/* Footer */}
                  <div className="p-4 lg:p-6 border-t border-white/5 flex items-center justify-end gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isLoading}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                      {t('users.buttons.cancel')}
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isLoading || isUploadingImage}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium !text-white flex items-center gap-2 disabled:opacity-50"
                      style={{
                        backgroundColor: primaryColor,
                        color: '#FFFFFF',
                        boxShadow: `0 4px 15px ${primaryColor}40`
                      }}
                    >
                      {isLoading || isUploadingImage ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span className="!text-white" style={{ color: '#FFFFFF' }}>
                            {isUploadingImage ? t('users.buttons.uploading') : t('users.buttons.creating')}
                          </span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 !text-white" color="#FFFFFF" strokeWidth={2} />
                          <span className="!text-white" style={{ color: '#FFFFFF' }}>{t('users.buttons.create')}</span>
                        </>
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
