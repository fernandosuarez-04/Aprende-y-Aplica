'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Target, Calendar, TrendingUp, BookOpen, Loader2, Sparkles, Zap, CheckCircle } from 'lucide-react'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { TeamsService, CreateTeamObjectiveRequest, UpdateTeamObjectiveRequest, WorkTeamObjective } from '../services/teams.service'
import { PremiumSelect } from './PremiumSelect'
import { PremiumDatePicker } from './PremiumDatePicker'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation('business')

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
      setError(t('teamObjective.errors.titleRequired'))
      return
    }

    if (formData.target_value <= 0) {
      setError(t('teamObjective.errors.valueRequired'))
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
      setError(err instanceof Error ? err.message : t('teamObjective.errors.saveError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const metricTypeOptions = [
    { value: 'completion_percentage', label: t('teamObjective.metrics.completion_percentage') },
    { value: 'average_score', label: t('teamObjective.metrics.average_score') },
    { value: 'participation_rate', label: t('teamObjective.metrics.participation_rate') },
    { value: 'engagement_rate', label: t('teamObjective.metrics.engagement_rate') },
    { value: 'custom', label: t('teamObjective.metrics.custom') }
  ]

  const getMetricLabel = (type: string) => {
    switch (type) {
      case 'completion_percentage': return t('teamObjective.metricLabels.completion_percentage')
      case 'average_score': return t('teamObjective.metricLabels.average_score')
      case 'participation_rate': return t('teamObjective.metricLabels.participation_rate')
      case 'engagement_rate': return t('teamObjective.metricLabels.engagement_rate')
      default: return t('teamObjective.metricLabels.custom')
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
          className="relative rounded-2xl shadow-2xl overflow-hidden border w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col lg:flex-row max-h-[90vh] overflow-y-auto lg:overflow-hidden">
            {/* Left Panel - Preview (hidden on mobile, visible on lg) */}
            <div
              className="hidden lg:flex lg:w-80 p-8 border-r border-gray-200 dark:border-white/5 flex-col items-center justify-center shrink-0"
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
                  {formData.title || t('teamObjective.title.new')}
                </h3>
                <p className="text-sm opacity-60" style={{ color: textColor }}>
                  {formData.description || t('teamObjective.subtitle.default')}
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
                    <p className="text-xs opacity-50" style={{ color: textColor }}>{t('teamObjective.labels.goal')}</p>
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
                      <p className="text-xs opacity-50" style={{ color: textColor }}>{t('teamObjective.labels.deadline')}</p>
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
                    <p className="text-xs opacity-50" style={{ color: textColor }}>{t('teamObjective.labels.metric')}</p>
                    <p className="text-sm font-semibold" style={{ color: textColor }}>
                      {metricTypeOptions.find(m => m.value === formData.metric_type)?.label || t('teamObjective.metrics.completion_percentage')}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex flex-col min-w-0 max-h-[90vh] lg:max-h-full overflow-hidden">
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-200 dark:border-white/5 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {objective ? t('teamObjective.title.edit') : t('teamObjective.title.create')}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {objective ? t('teamObjective.subtitle.edit') : t('teamObjective.subtitle.create')}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </motion.button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
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
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      {t('teamObjective.labels.title')} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder={t('teamObjective.placeholders.title')}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-blue-500 dark:focus:border-white/20 transition-colors"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      {t('teamObjective.labels.description')}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      placeholder={t('teamObjective.placeholders.description')}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-blue-500 dark:focus:border-white/20 transition-colors resize-none"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Curso (Opcional) */}
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <BookOpen className="w-4 h-4 opacity-50" />
                      {t('teamObjective.labels.course')}
                    </label>
                    {isLoadingCourses ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: primaryColor }} />
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('teamObjective.labels.loadingCourses')}</span>
                      </div>
                    ) : (
                      <PremiumSelect
                        value={formData.course_id || '__general__'}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value === '__general__' ? '' : value }))}
                        placeholder={t('teamObjective.placeholders.selectCourse')}
                        options={[
                          { value: '__general__', label: t('teamObjective.labels.generalGoal') },
                          ...teamCourses
                            .filter(tc => tc.course)
                            .map(tc => ({
                              value: tc.course_id,
                              label: tc.course?.title || t('teamObjective.labels.unknownCourse')
                            }))
                        ]}
                        className="w-full"
                      />
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                      {t('teamObjective.labels.courseHint')}
                    </p>
                  </div>

                  {/* Grid: Métrica y Valor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <TrendingUp className="w-4 h-4 opacity-50" />
                        {t('teamObjective.labels.metricType')} <span className="text-red-400">*</span>
                      </label>
                      <PremiumSelect
                        value={formData.metric_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, metric_type: value as any }))}
                        placeholder={t('teamObjective.placeholders.selectMetric')}
                        options={metricTypeOptions}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        {t('teamObjective.labels.targetValue')} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.1"
                        value={formData.target_value}
                        onChange={(e) => setFormData(prev => ({ ...prev, target_value: parseFloat(e.target.value) || 0 }))}
                        placeholder="100"
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-blue-500 dark:focus:border-white/20 transition-colors"
                        required
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {getMetricLabel(formData.metric_type)}
                      </p>
                    </div>
                  </div>

                  {/* Fecha Límite */}
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Calendar className="w-4 h-4 opacity-50" />
                      {t('teamObjective.labels.deadline')}
                    </label>
                    <PremiumDatePicker
                      value={formData.deadline}
                      onChange={(date) => setFormData(prev => ({ ...prev, deadline: date }))}
                      placeholder={t('teamObjective.placeholders.selectDate')}
                      minDate={new Date()}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-white/5 flex justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    {t('teamObjective.buttons.cancel')}
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
                        {t('teamObjective.buttons.saving')}
                      </>
                    ) : (
                      <>
                        {objective ? <CheckCircle className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                        {objective ? t('teamObjective.buttons.update') : t('teamObjective.buttons.create')}
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
