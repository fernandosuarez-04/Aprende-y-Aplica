'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Star, User, Loader2, CheckCircle2, AlertCircle, MessageSquare, Lightbulb } from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { TeamsService, WorkTeamMember, CreateTeamFeedbackRequest } from '../services/teams.service'
import { PremiumSelect } from './PremiumSelect'
import { useAuth } from '@/features/auth/hooks/useAuth'

interface TeamFeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  teamId: string
  teamMembers: WorkTeamMember[]
  onFeedbackCreated: () => void
}

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
  
  // Aplicar colores personalizados
  const modalBg = panelStyles?.card_background || 'rgba(15, 23, 42, 0.95)'
  const modalBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const textColor = panelStyles?.text_color || '#f8fafc'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'
  const sectionBg = `${modalBg}CC`
  
  const [formData, setFormData] = useState<CreateTeamFeedbackRequest>({
    to_user_id: '',
    feedback_type: 'peer_review',
    content: '',
    rating: undefined,
    is_anonymous: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtrar miembros (excluir al usuario actual)
  const availableMembers = teamMembers.filter(member => member.user_id !== user?.id)

  const feedbackTypeOptions = [
    { value: 'peer_review', label: 'Evaluación', icon: Star },
    { value: 'achievement', label: 'Logro', icon: CheckCircle2 },
    { value: 'suggestion', label: 'Sugerencia', icon: Lightbulb },
    { value: 'question', label: 'Pregunta', icon: MessageSquare }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validaciones
    if (!formData.to_user_id) {
      setError('Debes seleccionar un destinatario')
      return
    }

    if (!formData.content || formData.content.trim().length < 10) {
      setError('El contenido debe tener al menos 10 caracteres')
      return
    }

    if (formData.rating !== undefined && (formData.rating < 1 || formData.rating > 5)) {
      setError('La calificación debe ser entre 1 y 5')
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

      // Reset form
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
      setError(err instanceof Error ? err.message : 'Error al crear feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const selectedMember = teamMembers.find(m => m.user_id === formData.to_user_id)

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xl"
        />

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
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative border-b p-5 backdrop-blur-sm" style={{ 
            backgroundColor: modalBg,
            borderColor: modalBorder
          }}>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  initial={{ scale: 0.9, rotate: -5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Heart className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h2 className="font-heading text-xl font-bold tracking-tight" style={{ color: textColor }}>
                    Dar Retroalimentación
                  </h2>
                  <p className="font-body text-xs mt-1" style={{ color: textColor, opacity: 0.7 }}>
                    Comparte feedback con los miembros del equipo
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                <X className="w-5 h-5" style={{ color: textColor, opacity: 0.7 }} />
              </motion.button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl text-red-400 flex items-center gap-3 border backdrop-blur-sm"
                  style={{ 
                    backgroundColor: 'rgba(127, 29, 29, 0.2)',
                    borderColor: 'rgba(220, 38, 38, 0.3)'
                  }}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-body">{error}</span>
                </motion.div>
              )}

              {/* Selección de Destinatario */}
              <div>
                <label className="block font-body text-sm font-semibold mb-2" style={{ color: textColor }}>
                  Destinatario <span className="text-red-400">*</span>
                </label>
                <PremiumSelect
                  value={formData.to_user_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, to_user_id: value }))}
                  placeholder="Seleccionar miembro del equipo..."
                  options={availableMembers.map(member => ({
                    value: member.user_id,
                    label: member.user?.name || member.user?.email || 'Usuario',
                    icon: member.user?.profile_picture_url || undefined
                  }))}
                  disabled={availableMembers.length === 0}
                  emptyMessage={availableMembers.length === 0 ? "No hay miembros disponibles" : "Selecciona un miembro"}
                />
                {availableMembers.length === 0 && (
                  <p className="text-xs font-body opacity-70 mt-2">
                    No puedes darte feedback a ti mismo
                  </p>
                )}
              </div>

              {/* Tipo de Feedback */}
              <div>
                <label className="block font-body text-sm font-semibold mb-2" style={{ color: textColor }}>
                  Tipo de Feedback <span className="text-red-400">*</span>
                </label>
                <PremiumSelect
                  value={formData.feedback_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, feedback_type: value as any }))}
                  placeholder="Seleccionar tipo..."
                  options={feedbackTypeOptions.map(opt => ({
                    value: opt.value,
                    label: opt.label,
                    icon: undefined // Los iconos se pueden agregar después si PremiumSelect los soporta
                  }))}
                />
              </div>

              {/* Contenido */}
              <div>
                <label className="block font-body text-sm font-semibold mb-2" style={{ color: textColor }}>
                  Contenido <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={5}
                  maxLength={1000}
                  className="w-full px-4 py-3 border rounded-xl font-body focus:outline-none focus:ring-1 transition-all resize-none"
                  style={{ 
                    borderColor: modalBorder,
                    backgroundColor: sectionBg,
                    color: textColor
                  }}
                  placeholder="Escribe tu retroalimentación aquí... (mínimo 10 caracteres)"
                  required
                />
                <p className="text-xs font-body opacity-70 mt-1">
                  {formData.content.length}/1000 caracteres
                </p>
              </div>

              {/* Calificación (Opcional) */}
              <div>
                <label className="block font-body text-sm font-semibold mb-2" style={{ color: textColor }}>
                  Calificación (Opcional)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        rating: prev.rating === rating ? undefined : rating 
                      }))}
                      className="transition-all hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          formData.rating && formData.rating >= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-400'
                        }`}
                      />
                    </button>
                  ))}
                  {formData.rating && (
                    <span className="text-sm font-body ml-2" style={{ color: textColor }}>
                      {formData.rating}/5
                    </span>
                  )}
                </div>
              </div>

              {/* Feedback Anónimo */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_anonymous"
                  checked={formData.is_anonymous}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                  className="w-5 h-5 rounded border"
                  style={{ 
                    borderColor: modalBorder,
                    backgroundColor: sectionBg,
                    accentColor: primaryColor
                  }}
                />
                <label 
                  htmlFor="is_anonymous" 
                  className="text-sm font-body cursor-pointer"
                  style={{ color: textColor }}
                >
                  Enviar feedback de forma anónima
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4 backdrop-blur-sm flex justify-end gap-3" style={{ 
              backgroundColor: modalBg,
              borderColor: modalBorder
            }}>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
                className="font-body"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="gradient"
                disabled={isSubmitting || !formData.to_user_id || !formData.content.trim()}
                className="font-body"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${panelStyles?.secondary_button_color || '#8b5cf6'} 100%)`,
                  boxShadow: `0 4px 14px 0 ${primaryColor}40`
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 mr-2" />
                    Enviar Feedback
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

