'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Shield, Send, Sparkles, Briefcase, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { inviteUserAction } from '@/features/auth/actions/invitation'

interface BusinessInviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onInviteSent?: () => void
  organizationId?: string
}

type InviteStatus = 'idle' | 'loading' | 'success' | 'error'

export function BusinessInviteUserModal({ isOpen, onClose, onInviteSent, organizationId }: BusinessInviteUserModalProps) {
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel

  // Theme Colors
  const primaryColor = panelStyles?.primary_button_color || '#0A2540'
  const accentColor = panelStyles?.accent_color || '#00D4B3'

  const [formData, setFormData] = useState({
    email: '',
    role: 'member' as 'owner' | 'admin' | 'member',
    position: '',
    customMessage: ''
  })
  const [status, setStatus] = useState<InviteStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        email: '',
        role: 'member',
        position: '',
        customMessage: ''
      })
      setStatus('idle')
      setError(null)
      setSuccessMessage(null)
    }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setError(null)

    try {
      if (!organizationId) {
        throw new Error('No se encontró la organización')
      }

      const result = await inviteUserAction({
        email: formData.email,
        role: formData.role,
        organizationId,
        position: formData.position || undefined,
        customMessage: formData.customMessage || undefined
      })

      if (result.error) {
        throw new Error(result.error)
      }

      setStatus('success')
      setSuccessMessage(`Invitación enviada exitosamente a ${formData.email}`)

      // Notificar al padre y cerrar después de un breve delay
      setTimeout(() => {
        onInviteSent?.()
        onClose()
      }, 2000)

    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Error al enviar invitación')
    }
  }

  if (!isOpen) return null

  const roleLabels = {
    member: {
      label: t('users.roles.member', 'Miembro'),
      desc: t('users.modals.invite.roleDesc.member', 'Acceso básico a la plataforma')
    },
    admin: {
      label: t('users.roles.admin', 'Administrador'),
      desc: t('users.modals.invite.roleDesc.admin', 'Puede gestionar usuarios y contenido')
    },
    owner: {
      label: t('users.roles.owner', 'Propietario'),
      desc: t('users.modals.invite.roleDesc.owner', 'Control total de la organización')
    }
  }

  return (
    <AnimatePresence>
      {/* Container */}
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: 99999 }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="rounded-2xl shadow-2xl overflow-hidden border border-white/10"
            style={{ backgroundColor: 'var(--org-card-background, #1a1f2e)' }}
          >
            {/* Header */}
            <div
              className="p-6 border-b border-white/5"
              style={{ background: `linear-gradient(135deg, ${primaryColor}20, ${accentColor}10)` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="p-2 rounded-xl"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    <Mail className="w-6 h-6" style={{ color: accentColor }} />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {t('users.modals.invite.title', 'Invitar Usuario')}
                    </h3>
                    <p className="text-sm text-white/50">
                      {t('users.modals.invite.subtitle', 'Envía una invitación por correo electrónico')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5 text-white/40" />
                </button>
              </div>
            </div>

            {/* Content */}
            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 flex flex-col items-center justify-center text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  <CheckCircle className="w-10 h-10" style={{ color: accentColor }} />
                </motion.div>
                <h4 className="text-xl font-bold text-white mb-2">
                  {t('users.modals.invite.success.title', '¡Invitación enviada!')}
                </h4>
                <p className="text-white/60">
                  {successMessage}
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-5">
                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <span className="text-sm text-red-400 flex-1">{error}</span>
                    </motion.div>
                  )}

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      {t('users.modals.invite.fields.email', 'Correo electrónico')} <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={status === 'loading'}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors disabled:opacity-50"
                        placeholder={t('users.modals.invite.placeholders.email', 'usuario@empresa.com')}
                      />
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      {t('users.modals.invite.fields.role', 'Rol en la organización')} <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['member', 'admin', 'owner'] as const).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, role }))}
                          disabled={status === 'loading'}
                          className={`p-3 rounded-xl border text-left transition-all disabled:opacity-50 ${
                            formData.role === role
                              ? 'border-transparent'
                              : 'border-white/10 hover:border-white/20 bg-white/5'
                          }`}
                          style={formData.role === role ? {
                            background: `linear-gradient(135deg, ${primaryColor}30, ${accentColor}20)`,
                            borderColor: primaryColor
                          } : {}}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Shield
                              className="w-4 h-4"
                              style={{ color: formData.role === role ? primaryColor : 'rgba(255,255,255,0.5)' }}
                            />
                            <span className={`text-sm font-medium ${formData.role === role ? 'text-white' : 'text-white/70'}`}>
                              {roleLabels[role].label}
                            </span>
                          </div>
                          <p className="text-xs text-white/40 hidden sm:block">{roleLabels[role].desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Position (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      {t('users.modals.invite.fields.position', 'Cargo / Posición')}
                      <span className="text-white/30 ml-1">({t('common.optional', 'Opcional')})</span>
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        disabled={status === 'loading'}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors disabled:opacity-50"
                        placeholder={t('users.modals.invite.placeholders.position', 'Ej: Gerente de Ventas')}
                        maxLength={100}
                      />
                    </div>
                  </div>

                  {/* Custom Message (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      {t('users.modals.invite.fields.message', 'Mensaje personalizado')}
                      <span className="text-white/30 ml-1">({t('common.optional', 'Opcional')})</span>
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-white/30" />
                      <textarea
                        name="customMessage"
                        value={formData.customMessage}
                        onChange={handleChange}
                        disabled={status === 'loading'}
                        rows={3}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors resize-none disabled:opacity-50"
                        placeholder={t('users.modals.invite.placeholders.message', 'Agrega un mensaje personalizado para el destinatario...')}
                        maxLength={500}
                      />
                    </div>
                    <p className="text-xs text-white/30 mt-1 text-right">
                      {formData.customMessage.length}/500
                    </p>
                  </div>

                  {/* Info Note */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: accentColor }} />
                      <div className="text-sm text-white/50">
                        <p>{t('users.modals.invite.hints.info', 'El usuario recibirá un correo con un enlace para completar su registro. La invitación expira en 7 días.')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={status === 'loading'}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    {t('users.buttons.cancel', 'Cancelar')}
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: status === 'loading' ? 1 : 1.02 }}
                    whileTap={{ scale: status === 'loading' ? 1 : 0.98 }}
                    disabled={status === 'loading'}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium !text-white flex items-center gap-2 disabled:opacity-70"
                    style={{
                      backgroundColor: primaryColor,
                      color: '#FFFFFF',
                      boxShadow: `0 4px 15px ${primaryColor}40`
                    }}
                  >
                    {status === 'loading' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="!text-white" style={{ color: '#FFFFFF' }}>
                          {t('users.buttons.sending', 'Enviando...')}
                        </span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 !text-white" color="#FFFFFF" strokeWidth={2} />
                        <span className="!text-white" style={{ color: '#FFFFFF' }}>
                          {t('users.buttons.sendInvite', 'Enviar Invitación')}
                        </span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
