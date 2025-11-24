'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Plus, Star, User, MessageSquare, ThumbsUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { TeamsService, WorkTeamFeedback } from '../services/teams.service'
import { useAuth } from '@/features/auth/hooks/useAuth'

interface TeamFeedbackTabProps {
  teamId: string
  teamMembers: Array<{ user_id: string; user?: { name: string; email: string } }>
}

export function TeamFeedbackTab({ teamId, teamMembers }: TeamFeedbackTabProps) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const { user } = useAuth()
  
  const cardBg = panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)'
  const cardBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const textColor = panelStyles?.text_color || '#f8fafc'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'

  const [feedback, setFeedback] = useState<WorkTeamFeedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'received' | 'given'>('all')

  useEffect(() => {
    fetchFeedback()
  }, [teamId, filter])

  const fetchFeedback = async () => {
    try {
      setIsLoading(true)
      setError(null)
      let fetchedFeedback = await TeamsService.getTeamFeedback(teamId)
      
      // Filtrar según el filtro seleccionado
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

  const getFeedbackTypeIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return <CheckCircle2 className="w-4 h-4" />
      case 'peer_review':
        return <Star className="w-4 h-4" />
      case 'suggestion':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  const getFeedbackTypeLabel = (type: string) => {
    switch (type) {
      case 'achievement':
        return 'Logro'
      case 'peer_review':
        return 'Evaluación'
      case 'suggestion':
        return 'Sugerencia'
      default:
        return 'Pregunta'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" style={{ color: textColor }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: primaryColor }}></div>
          <p className="text-sm font-body">Cargando retroalimentación...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading font-semibold mb-1" style={{ color: textColor }}>
            Retroalimentación
          </h2>
          <p className="text-sm font-body opacity-70">
            {feedback.length} comentario(s) de retroalimentación
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'received' | 'given')}
            className="px-4 py-2 rounded-xl border backdrop-blur-sm font-body"
            style={{ 
              backgroundColor: cardBg,
              borderColor: cardBorder,
              color: textColor
            }}
          >
            <option value="all">Todos</option>
            <option value="received">Recibidos</option>
            <option value="given">Enviados</option>
          </select>
          <Button
            onClick={() => {/* TODO: Abrir modal de crear feedback */}}
            variant="gradient"
            size="lg"
            className="font-body"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${panelStyles?.secondary_button_color || '#8b5cf6'} 100%)`,
              boxShadow: `0 4px 14px 0 ${primaryColor}40`
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Dar Feedback
          </Button>
        </div>
      </div>

      {error && (
        <div 
          className="p-4 rounded-xl border text-red-400"
          style={{ backgroundColor: cardBg, borderColor: 'rgba(220, 38, 38, 0.3)' }}
        >
          <p className="font-body text-sm">{error}</p>
        </div>
      )}

      {feedback.length === 0 ? (
        <div 
          className="p-12 rounded-2xl border text-center backdrop-blur-sm"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <Heart className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-heading mb-2">No hay retroalimentación</p>
          <p className="text-sm font-body opacity-70 mb-4">
            Comparte feedback con los miembros del equipo
          </p>
          <Button
            onClick={() => {/* TODO: Abrir modal */}}
            variant="gradient"
            className="font-body"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${panelStyles?.secondary_button_color || '#8b5cf6'} 100%)`,
              boxShadow: `0 4px 14px 0 ${primaryColor}40`
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Dar Primer Feedback
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {feedback.map((fb, index) => (
            <motion.div
              key={fb.feedback_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-5 rounded-2xl border backdrop-blur-sm"
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {fb.from_user?.profile_picture_url ? (
                    <img 
                      src={fb.from_user.profile_picture_url} 
                      alt="" 
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}30` }}
                    >
                      <User className="w-5 h-5" style={{ color: primaryColor }} />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-body font-semibold">
                      {fb.is_anonymous ? 'Anónimo' : (fb.from_user?.name || 'Usuario')}
                    </span>
                    <span className="text-xs font-body opacity-70">→</span>
                    <span className="font-body">
                      {fb.to_user?.name || 'Usuario'}
                    </span>
                    <span 
                      className="ml-auto px-2 py-1 rounded-lg text-xs font-body flex items-center gap-1"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      {getFeedbackTypeIcon(fb.feedback_type)}
                      {getFeedbackTypeLabel(fb.feedback_type)}
                    </span>
                  </div>
                  <p className="text-sm font-body mb-3">{fb.content}</p>
                  <div className="flex items-center gap-4 text-xs font-body opacity-70">
                    {fb.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{fb.rating}/5</span>
                      </div>
                    )}
                    <span>{new Date(fb.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

