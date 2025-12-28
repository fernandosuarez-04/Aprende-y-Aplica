'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Heart,
  Star,
  User,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Lightbulb,
  Sparkles,
  Send,
  ChevronDown,
  Award
} from 'lucide-react'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { TeamsService, WorkTeamMember, CreateTeamFeedbackRequest } from '../services/teams.service'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useTranslation } from 'react-i18next'

interface TeamFeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  teamId: string
  teamMembers: WorkTeamMember[]
  onFeedbackCreated: () => void
}

const FEEDBACK_TYPES = [
  { value: 'peer_review', icon: Star, color: '#F59E0B' },
  { value: 'achievement', icon: Award, color: '#10B981' },
  { value: 'suggestion', icon: Lightbulb, color: '#F97316' },
  { value: 'question', icon: MessageSquare, color: '#3B82F6' }
]

export function TeamFeedbackModal({
  isOpen,
  onClose,
  teamId,
  teamMembers,
  onFeedbackCreated
}: TeamFeedbackModalProps) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const { user } = useAuth()
  const { t } = useTranslation('business')

  // Colores del tema
  const cardBg = panelStyles?.card_background || '#1a1f2e'
  const textColor = panelStyles?.text_color || '#f8fafc'
  const primaryColor = panelStyles?.primary_button_color || '#0EA5E9'
  const accentColor = panelStyles?.accent_color || '#10B981'
  const secondaryColor = panelStyles?.secondary_button_color || '#8b5cf6'

  const [formData, setFormData] = useState<CreateTeamFeedbackRequest>({
    to_user_id: '',
    feedback_type: 'peer_review',
    content: '',
    rating: undefined,
    is_anonymous: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMemberDropdown, setShowMemberDropdown] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const memberDropdownRef = useRef<HTMLDivElement>(null)
  const typeDropdownRef = useRef<HTMLDivElement>(null)

  // Filtrar miembros (excluir al usuario actual)
  const availableMembers = teamMembers.filter(member => member.user_id !== user?.id)
  const selectedMember = teamMembers.find(m => m.user_id === formData.to_user_id)
  const selectedType = FEEDBACK_TYPES.find(t => t.value === formData.feedback_type)

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(event.target as Node)) {
        setShowMemberDropdown(false)
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.to_user_id) {
      setError(t('teamFeedback.errors.selectRecipient'))
      return
    }

    if (!formData.content || formData.content.trim().length < 10) {
      setError(t('teamFeedback.errors.contentLength'))
      return
    }

    setIsSubmitting(true)

    try {
      await TeamsService.createTeamFeedback(teamId, {
        to_user_id: formData.to_user_id,
        feedback_type: formData.feedback_type,
        content: formData.content.trim(),
        rating: formData.rating,
        is_anonymous: formData.is_anonymous
      })

      setFormData({
        to_user_id: '',
        feedback_type: 'peer_review',
        content: '',
        rating: undefined,
        is_anonymous: false
      })

      onFeedbackCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('teamFeedback.errors.createError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ zIndex: 99999 }}
      >
        {/* Backdrop transparente */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Container - Split Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative rounded-2xl shadow-2xl overflow-hidden border border-white/10"
          style={{ backgroundColor: cardBg }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex min-h-[550px]">
            {/* Panel Izquierdo - Preview */}
            <div
              className="w-80 p-8 border-r border-white/5 flex flex-col"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)`
              }}
            >
              {/* Avatar Animado */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="relative mb-6"
              >
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                    boxShadow: `0 8px 30px ${primaryColor}40`
                  }}
                >
                  {selectedMember?.user?.profile_picture_url ? (
                    <img
                      src={selectedMember.user.profile_picture_url}
                      alt=""
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  ) : (
                    <Heart className="w-10 h-10 text-white" />
                  )}
                </div>

                {/* Badge animado */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: accentColor }}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </motion.div>
              </motion.div>

              {/* Preview Info */}
              <div className="text-center mb-8">
                <h3
                  className="text-lg font-semibold mb-1"
                  style={{ color: textColor }}
                >
                  {selectedMember?.user?.name || t('teamFeedback.preview.selectRecipient')}
                </h3>
                <p
                  className="text-sm"
                  style={{ color: textColor, opacity: 0.6 }}
                >
                  {selectedMember?.user?.email || t('teamFeedback.preview.teamMember')}
                </p>
              </div>

              {/* Preview del Tipo */}
              {selectedType && (
                <div
                  className="rounded-xl p-4 mb-6"
                  style={{ backgroundColor: `${selectedType.color}15` }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <selectedType.icon
                      className="w-5 h-5"
                      style={{ color: selectedType.color }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: selectedType.color }}
                    >
                      {t(`teamFeedback.types.${selectedType.value}`)}
                    </span>
                  </div>
                  {formData.content && (
                    <p
                      className="text-xs line-clamp-3"
                      style={{ color: textColor, opacity: 0.7 }}
                    >
                      "{formData.content.substring(0, 100)}..."
                    </p>
                  )}
                </div>
              )}

              {/* Rating Preview */}
              {formData.rating && (
                <div className="flex items-center justify-center gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${star <= formData.rating!
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-600'
                        }`}
                    />
                  ))}
                </div>
              )}

              {/* Estado Anónimo */}
              {formData.is_anonymous && (
                <div
                  className="mt-auto rounded-xl p-3 text-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                >
                  <span className="text-sm" style={{ color: textColor, opacity: 0.7 }}>
                    {t('teamFeedback.anonymousStatus')}
                  </span>
                </div>
              )}
            </div>

            {/* Panel Derecho - Form */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2
                      className="text-xl font-bold"
                      style={{ color: textColor }}
                    >
                      {t('teamFeedback.title')}
                    </h2>
                    <p
                      className="text-sm mt-1"
                      style={{ color: textColor, opacity: 0.6 }}
                    >
                      {t('teamFeedback.subtitle')}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-white/5"
                  >
                    <X className="w-5 h-5" style={{ color: textColor, opacity: 0.5 }} />
                  </motion.button>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl flex items-center gap-3"
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <span className="text-sm text-red-400">{error}</span>
                    </motion.div>
                  )}

                  {/* Destinatario Dropdown */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: textColor }}
                    >
                      {t('teamFeedback.selectRecipient')} <span className="text-red-400">*</span>
                    </label>
                    <div className="relative" ref={memberDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                        className="w-full px-4 py-3 rounded-xl border-2 flex items-center justify-between gap-2 transition-all duration-300 text-left"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          borderColor: formData.to_user_id ? primaryColor : 'rgba(255,255,255,0.1)',
                          color: textColor
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {selectedMember ? (
                            <>
                              {selectedMember.user?.profile_picture_url ? (
                                <img
                                  src={selectedMember.user.profile_picture_url}
                                  alt=""
                                  className="w-8 h-8 rounded-lg object-cover"
                                />
                              ) : (
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                                  style={{ backgroundColor: `${primaryColor}30` }}
                                >
                                  <User className="w-4 h-4" style={{ color: primaryColor }} />
                                </div>
                              )}
                              <span className="text-sm">{selectedMember.user?.name || t('teamFeedback.selectedUser')}</span>
                            </>
                          ) : (
                            <span className="text-sm" style={{ opacity: 0.5 }}>
                                {t('teamFeedback.selectRecipientPlaceholder')}
                            </span>
                          )}
                        </div>
                        <motion.div animate={{ rotate: showMemberDropdown ? 180 : 0 }}>
                          <ChevronDown className="w-4 h-4 opacity-50" />
                        </motion.div>
                      </button>

                      <AnimatePresence>
                        {showMemberDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute top-full left-0 right-0 mt-2 rounded-xl border overflow-hidden shadow-2xl z-50 max-h-48 overflow-y-auto"
                            style={{
                              backgroundColor: cardBg,
                              borderColor: 'rgba(255,255,255,0.15)'
                            }}
                          >
                            {availableMembers.map((member) => (
                              <button
                                key={member.user_id}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, to_user_id: member.user_id }))
                                  setShowMemberDropdown(false)
                                }}
                                className="w-full px-4 py-3 text-left flex items-center gap-3 transition-colors hover:bg-white/5"
                                style={{
                                  backgroundColor: formData.to_user_id === member.user_id ? `${primaryColor}30` : 'transparent'
                                }}
                              >
                                {member.user?.profile_picture_url ? (
                                  <img
                                    src={member.user.profile_picture_url}
                                    alt=""
                                    className="w-8 h-8 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: `${primaryColor}30` }}
                                  >
                                    <User className="w-4 h-4" style={{ color: primaryColor }} />
                                  </div>
                                )}
                                <span className="text-sm" style={{ color: textColor }}>
                                  {member.user?.name || member.user?.email || t('teamFeedback.selectedUser')}
                                </span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Tipo de Feedback Dropdown */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: textColor }}
                    >
                      {t('teamFeedback.feedbackType')} <span className="text-red-400">*</span>
                    </label>
                    <div className="relative" ref={typeDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                        className="w-full px-4 py-3 rounded-xl border-2 flex items-center justify-between gap-2 transition-all duration-300 text-left"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          borderColor: 'rgba(255,255,255,0.1)',
                          color: textColor
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {selectedType && (
                            <>
                              <selectedType.icon
                                className="w-5 h-5"
                                style={{ color: selectedType.color }}
                              />
                              <span className="text-sm">{t(`teamFeedback.types.${selectedType.value}`)}</span>
                            </>
                          )}
                        </div>
                        <motion.div animate={{ rotate: showTypeDropdown ? 180 : 0 }}>
                          <ChevronDown className="w-4 h-4 opacity-50" />
                        </motion.div>
                      </button>

                      <AnimatePresence>
                        {showTypeDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute top-full left-0 right-0 mt-2 rounded-xl border overflow-hidden shadow-2xl z-50"
                            style={{
                              backgroundColor: cardBg,
                              borderColor: 'rgba(255,255,255,0.15)'
                            }}
                          >
                            {FEEDBACK_TYPES.map((type) => (
                              <button
                                key={type.value}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, feedback_type: type.value as any }))
                                  setShowTypeDropdown(false)
                                }}
                                className="w-full px-4 py-3 text-left flex items-center gap-3 transition-colors hover:bg-white/5"
                                style={{
                                  backgroundColor: formData.feedback_type === type.value ? `${type.color}20` : 'transparent'
                                }}
                              >
                                <type.icon className="w-5 h-5" style={{ color: type.color }} />
                                <span className="text-sm" style={{ color: textColor }}>
                                  {t(`teamFeedback.types.${type.value}`)}
                                </span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: textColor }}
                    >
                      {t('teamFeedback.content')} <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      rows={4}
                      maxLength={1000}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-white/20 transition-colors resize-none"
                      style={{ color: textColor }}
                      placeholder={t('teamFeedback.contentPlaceholder')}
                    />
                    <p
                      className="text-xs mt-2"
                      style={{ color: textColor, opacity: 0.5 }}
                    >
                      {formData.content.length}/1000 caracteres
                    </p>
                  </div>

                  {/* Rating */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-3"
                      style={{ color: textColor }}
                    >
                      {t('teamFeedback.rating')}
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={star}
                          type="button"
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            rating: prev.rating === star ? undefined : star
                          }))}
                        >
                          <Star
                            className={`w-7 h-7 transition-colors ${formData.rating && formData.rating >= star
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-600 hover:text-yellow-400/50'
                              }`}
                          />
                        </motion.button>
                      ))}
                      {formData.rating && (
                        <span
                          className="text-sm ml-2 font-medium"
                          style={{ color: '#FBBF24' }}
                        >
                          {formData.rating}/5
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Anónimo Toggle */}
                  <div
                    className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-colors"
                    style={{ backgroundColor: formData.is_anonymous ? `${primaryColor}15` : 'rgba(255,255,255,0.03)' }}
                    onClick={() => setFormData(prev => ({ ...prev, is_anonymous: !prev.is_anonymous }))}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${formData.is_anonymous ? 'border-transparent' : 'border-white/20'
                        }`}
                      style={{
                        backgroundColor: formData.is_anonymous ? primaryColor : 'transparent'
                      }}
                    >
                      {formData.is_anonymous && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                    <span className="text-sm" style={{ color: textColor }}>
                      {t('teamFeedback.anonymous')}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
                    style={{ color: `${textColor}99` }}
                  >
                    {t('teamFeedback.buttons.cancel')}
                  </button>
                  <motion.button
                    type="submit"
                    disabled={isSubmitting || !formData.to_user_id || !formData.content.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                      boxShadow: `0 4px 15px ${primaryColor}40`
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('teamFeedback.buttons.sending')}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {t('teamFeedback.buttons.send')}
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
