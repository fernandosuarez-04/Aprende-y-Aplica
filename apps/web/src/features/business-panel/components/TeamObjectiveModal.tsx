'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Target, Calendar, TrendingUp, BookOpen, Loader2, Sparkles, Zap, CheckCircle } from 'lucide-react'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { TeamsService, CreateTeamObjectiveRequest, UpdateTeamObjectiveRequest, WorkTeamObjective } from '../services/teams.service'
import { PremiumSelect } from './PremiumSelect'
import { PremiumDatePicker } from './PremiumDatePicker'

interface TeamObjectiveModalProps {
  isOpen: boolean
  onClose: () => void
  teamId: string
  objective?: WorkTeamObjective | null
  onComplete: () => void
}

interface TeamCourse {
  id: string
  course_id: string
  course: {
    id: string
    title: string
  } | null
}

export function TeamObjectiveModal({
  isOpen,
  onClose,
  teamId,
  objective,
  onComplete
}: TeamObjectiveModalProps) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel

  const primaryColor = panelStyles?.primary_button_color || '#0EA5E9'
  const secondaryColor = panelStyles?.secondary_button_color || '#8b5cf6'
  const accentColor = panelStyles?.accent_color || '#10B981'
  const textColor = panelStyles?.text_color || '#ffffff'
  const cardBg = panelStyles?.card_background || '#1a1f2e'
  const borderColor = panelStyles?.border_color || 'rgba(255,255,255,0.1)'

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: '',
    target_value: 100,
    metric_type: 'completion_percentage' as 'completion_percentage' | 'average_score' | 'participation_rate' | 'engagement_rate' | 'custom',
    deadline: ''
  })

  const [teamCourses, setTeamCourses] = useState<TeamCourse[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchTeamCourses()
      if (objective) {
        setFormData({
          title: objective.title,
          description: objective.description || '',
          course_id: objective.course_id || '',
          target_value: objective.target_value,
          metric_type: objective.metric_type,
          deadline: objective.deadline ? new Date(objective.deadline).toISOString().split('T')[0] : ''
        })
      } else {
        resetForm()
      }
    }
  }, [isOpen, objective])

  const fetchTeamCourses = async () => {
    try {
      setIsLoadingCourses(true)
      const courses = await TeamsService.getTeamCourses(teamId)
      setTeamCourses(courses.map(c => ({
        id: c.id,
        course_id: c.course_id,
        course: c.course ? {
          id: c.course.id,
          title: c.course.title
        } : null
      })))
    } catch (err) {
      console.error('Error fetching team courses:', err)
      setTeamCourses([])
    } finally {
      setIsLoadingCourses(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      course_id: '',
      target_value: 100,
      metric_type: 'completion_percentage',
      deadline: ''
    })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      setError('El título del objetivo es requerido')
      return
    }

    if (formData.target_value <= 0) {
      setError('El valor objetivo debe ser mayor a 0')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const request: CreateTeamObjectiveRequest | UpdateTeamObjectiveRequest = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        course_id: formData.course_id || undefined,
        target_value: formData.target_value,
        metric_type: formData.metric_type,
        deadline: formData.deadline || undefined
      }

      if (objective) {
        await TeamsService.updateTeamObjective(teamId, objective.objective_id, request)
      } else {
        await TeamsService.createTeamObjective(teamId, request as CreateTeamObjectiveRequest)
      }

      resetForm()
      onComplete()
      onClose()
    } catch (err) {
      console.error('Error al guardar objetivo:', err)
      setError(err instanceof Error ? err.message : 'Error al guardar objetivo')
    } finally {
      setIsSubmitting(false)
    }
  }

  const metricTypeOptions = [
    { value: 'completion_percentage', label: 'Porcentaje de Completitud' },
    { value: 'average_score', label: 'Calificación Promedio' },
    { value: 'participation_rate', label: 'Tasa de Participación' },
    { value: 'engagement_rate', label: 'Tasa de Compromiso' },
    { value: 'custom', label: 'Personalizado' }
  ]

  const getMetricLabel = (type: string) => {
    switch (type) {
      case 'completion_percentage': return 'Porcentaje (0-100)'
      case 'average_score': return 'Calificación (0-10)'
      case 'participation_rate': return 'Participación (0-100)'
      case 'engagement_rate': return 'Compromiso (0-100)'
      default: return 'Valor personalizado'
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: 99999 }}
      >
        {/* Backdrop - SIN blur según SOFIA Design System */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        />

        {/* Modal - Split Panel Design */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative rounded-2xl shadow-2xl overflow-hidden border border-white/10 w-full max-w-4xl"
          style={{ backgroundColor: cardBg }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex min-h-[550px]">
            {/* Left Panel - Preview */}
            <div
              className="w-80 p-8 border-r border-white/5 flex flex-col items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)`
              }}
            >
              {/* Avatar/Icon Animado */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="relative mb-6"
              >
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                    boxShadow: `0 8px 30px ${primaryColor}40`
                  }}
                >
                  <Target className="w-12 h-12 text-white" />
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

              {/* Title Preview */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-6"
              >
                <h3 className="text-lg font-bold mb-1" style={{ color: textColor }}>
                  {formData.title || 'Nuevo Objetivo'}
                </h3>
                <p className="text-sm opacity-60" style={{ color: textColor }}>
                  {formData.description || 'Define metas claras para tu equipo'}
                </p>
              </motion.div>

              {/* Stats Preview */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="w-full space-y-3"
              >
                <div
                  className="p-3 rounded-xl flex items-center gap-3"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                >
                  <Zap className="w-4 h-4" style={{ color: primaryColor }} />
                  <div className="flex-1">
                    <p className="text-xs opacity-50" style={{ color: textColor }}>Meta</p>
                    <p className="text-sm font-semibold" style={{ color: textColor }}>
                      {formData.target_value} {formData.metric_type === 'completion_percentage' ? '%' : ''}
                    </p>
                  </div>
                </div>

                {formData.deadline && (
                  <div
                    className="p-3 rounded-xl flex items-center gap-3"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                  >
                    <Calendar className="w-4 h-4" style={{ color: accentColor }} />
                    <div className="flex-1">
                      <p className="text-xs opacity-50" style={{ color: textColor }}>Fecha límite</p>
                      <p className="text-sm font-semibold" style={{ color: textColor }}>
                        {new Date(formData.deadline).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )}

                <div
                  className="p-3 rounded-xl flex items-center gap-3"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                >
                  <TrendingUp className="w-4 h-4" style={{ color: secondaryColor }} />
                  <div className="flex-1">
                    <p className="text-xs opacity-50" style={{ color: textColor }}>Métrica</p>
                    <p className="text-sm font-semibold" style={{ color: textColor }}>
                      {metricTypeOptions.find(m => m.value === formData.metric_type)?.label || 'Porcentaje'}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: textColor }}>
                    {objective ? 'Editar Objetivo' : 'Crear Objetivo'}
                  </h2>
                  <p className="text-sm opacity-50 mt-0.5" style={{ color: textColor }}>
                    {objective ? 'Modifica los detalles del objetivo' : 'Define un nuevo objetivo para el equipo'}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="p-2 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" style={{ color: textColor, opacity: 0.7 }} />
                </motion.button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl text-red-400 flex items-center gap-3 border"
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderColor: 'rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      <X className="w-4 h-4" />
                      <span className="text-sm">{error}</span>
                    </motion.div>
                  )}

                  {/* Título */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                      Título del Objetivo <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ej: Completar 80% del curso de IA"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      placeholder="Describe el objetivo en detalle..."
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors resize-none"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Curso (Opcional) */}
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: textColor }}>
                      <BookOpen className="w-4 h-4 opacity-50" />
                      Curso (Opcional)
                    </label>
                    {isLoadingCourses ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: primaryColor }} />
                        <span className="text-sm opacity-70" style={{ color: textColor }}>Cargando cursos...</span>
                      </div>
                    ) : (
                      <PremiumSelect
                        value={formData.course_id || '__general__'}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value === '__general__' ? '' : value }))}
                        placeholder="Seleccionar curso"
                        options={[
                          { value: '__general__', label: 'Objetivo General del Equipo' },
                          ...teamCourses
                            .filter(tc => tc.course)
                            .map(tc => ({
                              value: tc.course_id,
                              label: tc.course?.title || 'Curso desconocido'
                            }))
                        ]}
                        className="w-full"
                      />
                    )}
                    <p className="text-xs opacity-50 mt-1.5" style={{ color: textColor }}>
                      Deja vacío para objetivo general o selecciona un curso específico
                    </p>
                  </div>

                  {/* Grid: Métrica y Valor */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: textColor }}>
                        <TrendingUp className="w-4 h-4 opacity-50" />
                        Tipo de Métrica <span className="text-red-400">*</span>
                      </label>
                      <PremiumSelect
                        value={formData.metric_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, metric_type: value as any }))}
                        placeholder="Seleccionar..."
                        options={metricTypeOptions}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                        Valor Objetivo <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.1"
                        value={formData.target_value}
                        onChange={(e) => setFormData(prev => ({ ...prev, target_value: parseFloat(e.target.value) || 0 }))}
                        placeholder="100"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                        required
                        disabled={isSubmitting}
                      />
                      <p className="text-xs opacity-50 mt-1" style={{ color: textColor }}>
                        {getMetricLabel(formData.metric_type)}
                      </p>
                    </div>
                  </div>

                  {/* Fecha Límite */}
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: textColor }}>
                      <Calendar className="w-4 h-4 opacity-50" />
                      Fecha Límite (Opcional)
                    </label>
                    <PremiumDatePicker
                      value={formData.deadline}
                      onChange={(date) => setFormData(prev => ({ ...prev, deadline: date }))}
                      placeholder="Seleccionar fecha límite"
                      minDate={new Date()}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSubmitting || !formData.title.trim()}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                      boxShadow: `0 4px 15px ${primaryColor}40`
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        {objective ? <CheckCircle className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                        {objective ? 'Actualizar' : 'Crear Objetivo'}
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
