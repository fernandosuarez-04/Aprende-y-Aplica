'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Plus,
  Star,
  User,
  MessageSquare,
  ThumbsUp,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Award,
  Send
} from 'lucide-react'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { TeamsService, WorkTeamFeedback } from '../services/teams.service'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { TeamFeedbackModal } from './TeamFeedbackModal'

interface TeamFeedbackTabProps {
  teamId: string
  teamMembers: Array<{ user_id: string; user?: { name: string; email: string } }>
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'received', label: 'Recibidos' },
  { value: 'given', label: 'Enviados' },
]

export function TeamFeedbackTab({ teamId, teamMembers }: TeamFeedbackTabProps) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const { user } = useAuth()

  const cardBg = panelStyles?.card_background || '#1E2329'
  const textColor = panelStyles?.text_color || '#f8fafc'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'
  const accentColor = panelStyles?.accent_color || '#10B981'
  const secondaryColor = panelStyles?.secondary_button_color || '#8b5cf6'

  const [feedback, setFeedback] = useState<WorkTeamFeedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'received' | 'given'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    fetchFeedback()
  }, [teamId, filter])

  const fetchFeedback = async () => {
    try {
      setIsLoading(true)
      setError(null)
      let fetchedFeedback = await TeamsService.getTeamFeedback(teamId)

      if (filter === 'received' && user?.id) {
        fetchedFeedback = fetchedFeedback.filter(fb => fb.to_user_id === user.id)
      } else if (filter === 'given' && user?.id) {
        fetchedFeedback = fetchedFeedback.filter(fb => fb.from_user_id === user.id)
      }

      setFeedback(fetchedFeedback)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar retroalimentación')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFeedbackCreated = () => {
    fetchFeedback()
  }

  const getFeedbackTypeConfig = (type: string) => {
    switch (type) {
      case 'achievement':
        return { icon: Award, label: 'Logro', color: accentColor }
      case 'peer_review':
        return { icon: Star, label: 'Evaluación', color: '#F59E0B' }
      case 'suggestion':
        return { icon: AlertCircle, label: 'Sugerencia', color: '#F97316' }
      default:
        return { icon: MessageSquare, label: 'Pregunta', color: primaryColor }
    }
  }

  // Estadísticas
  const stats = {
    total: feedback.length,
    achievements: feedback.filter(f => f.feedback_type === 'achievement').length,
    avgRating: feedback.filter(f => f.rating).reduce((acc, f) => acc + (f.rating || 0), 0) /
      (feedback.filter(f => f.rating).length || 1)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 rounded-full border-2 border-t-transparent mx-auto mb-4"
            style={{ borderColor: `${primaryColor}40`, borderTopColor: primaryColor }}
          />
          <p className="text-sm" style={{ color: textColor, opacity: 0.7 }}>
            Cargando retroalimentación...
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Premium con Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Info y Stats */}
        <div className="flex items-center gap-6">
          <div>
            <h2
              className="text-2xl font-bold mb-1 flex items-center gap-2"
              style={{ color: textColor }}
            >
              <Sparkles className="w-6 h-6" style={{ color: accentColor }} />
              Retroalimentación
            </h2>
            <p className="text-sm" style={{ color: textColor, opacity: 0.6 }}>
              Comparte y recibe feedback del equipo
            </p>
          </div>

          {/* Mini Stats */}
          <div className="hidden md:flex items-center gap-4">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <MessageSquare className="w-4 h-4" style={{ color: primaryColor }} />
              <span className="text-sm font-semibold" style={{ color: textColor }}>
                {stats.total}
              </span>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ backgroundColor: `${accentColor}15` }}
            >
              <Award className="w-4 h-4" style={{ color: accentColor }} />
              <span className="text-sm font-semibold" style={{ color: textColor }}>
                {stats.achievements}
              </span>
            </div>
            {stats.avgRating > 0 && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ backgroundColor: 'rgba(251, 191, 36, 0.15)' }}
              >
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-semibold" style={{ color: textColor }}>
                  {stats.avgRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-3">
          {/* Dropdown Premium según SOFIA Design System */}
          <div className="relative min-w-[140px]" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-3 rounded-xl border-2 flex items-center justify-between gap-2 transition-all duration-300"
              style={{
                backgroundColor: cardBg,
                borderColor: filter !== 'all' ? primaryColor : 'rgba(255,255,255,0.1)',
                color: textColor
              }}
            >
              <span className="text-sm font-medium">
                {FILTER_OPTIONS.find(o => o.value === filter)?.label}
              </span>
              <motion.div
                animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 opacity-50" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 rounded-xl border overflow-hidden shadow-2xl z-50"
                  style={{
                    backgroundColor: cardBg,
                    borderColor: 'rgba(255,255,255,0.15)'
                  }}
                >
                  {FILTER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setFilter(option.value as 'all' | 'received' | 'given')
                        setIsDropdownOpen(false)
                      }}
                      className="w-full px-4 py-3 text-left text-sm transition-colors"
                      style={{
                        color: filter === option.value ? textColor : `${textColor}99`,
                        backgroundColor: filter === option.value ? `${primaryColor}30` : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (filter !== option.value) {
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (filter !== option.value) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Botón Dar Feedback */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              boxShadow: `0 4px 20px ${primaryColor}40`
            }}
          >
            <Plus className="w-4 h-4" />
            Dar Feedback
          </motion.button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border flex items-center gap-3"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            color: '#ef4444'
          }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </motion.div>
      )}

      {/* Estado Vacío */}
      {feedback.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-16 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}20, ${accentColor}20)`
            }}
          >
            <Heart className="w-10 h-10" style={{ color: primaryColor }} />
          </motion.div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: textColor }}>
            Sin retroalimentación aún
          </h3>
          <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: textColor, opacity: 0.6 }}>
            Comparte feedback positivo con los miembros de tu equipo para fomentar el crecimiento
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              boxShadow: `0 4px 20px ${primaryColor}40`
            }}
          >
            <Send className="w-4 h-4" />
            Enviar Primer Feedback
          </motion.button>
        </motion.div>
      ) : (
        /* Lista de Feedback */
        <div className="space-y-4">
          {feedback.map((fb, index) => {
            const typeConfig = getFeedbackTypeConfig(fb.feedback_type)
            const TypeIcon = typeConfig.icon

            return (
              <motion.div
                key={fb.feedback_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  backgroundColor: cardBg,
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
              >
                <div className="p-5">
                  {/* Header del Feedback */}
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {fb.from_user?.profile_picture_url ? (
                        <img
                          src={fb.from_user.profile_picture_url}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${primaryColor}30, ${accentColor}20)`
                          }}
                        >
                          <User className="w-6 h-6" style={{ color: primaryColor }} />
                        </div>
                      )}
                      {/* Badge de Online/Anónimo */}
                      {fb.is_anonymous && (
                        <div
                          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                          style={{ backgroundColor: cardBg, border: '2px solid rgba(255,255,255,0.1)' }}
                        >
                          👤
                        </div>
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      {/* Nombres y Tipo */}
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="font-semibold truncate"
                            style={{ color: textColor }}
                          >
                            {fb.is_anonymous ? 'Anónimo' : (fb.from_user?.name || 'Usuario')}
                          </span>
                          <span style={{ color: textColor, opacity: 0.3 }}>→</span>
                          <span
                            className="truncate"
                            style={{ color: textColor, opacity: 0.8 }}
                          >
                            {fb.to_user?.name || 'Usuario'}
                          </span>
                        </div>

                        {/* Badge del Tipo */}
                        <div
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0"
                          style={{
                            backgroundColor: `${typeConfig.color}15`,
                            color: typeConfig.color
                          }}
                        >
                          <TypeIcon className="w-3.5 h-3.5" />
                          {typeConfig.label}
                        </div>
                      </div>

                      {/* Contenido del Mensaje */}
                      <div
                        className="p-4 rounded-xl mb-3"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          borderLeft: `3px solid ${typeConfig.color}40`
                        }}
                      >
                        <p
                          className="text-sm whitespace-pre-wrap leading-relaxed"
                          style={{ color: textColor, opacity: 0.9 }}
                        >
                          {fb.content}
                        </p>
                      </div>

                      {/* Footer: Rating y Fecha */}
                      <div className="flex items-center gap-4">
                        {fb.rating && (
                          <div
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                            style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)' }}
                          >
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${i < fb.rating!
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-600'
                                  }`}
                              />
                            ))}
                            <span
                              className="ml-1 text-xs font-semibold"
                              style={{ color: '#FBBF24' }}
                            >
                              {fb.rating}/5
                            </span>
                          </div>
                        )}
                        <span
                          className="text-xs"
                          style={{ color: textColor, opacity: 0.5 }}
                        >
                          {new Date(fb.created_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Modal de Feedback */}
      <TeamFeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        teamId={teamId}
        teamMembers={teamMembers}
        onFeedbackCreated={handleFeedbackCreated}
      />
    </div>
  )
}
