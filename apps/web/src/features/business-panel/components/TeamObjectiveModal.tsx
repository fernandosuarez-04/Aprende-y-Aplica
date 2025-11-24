'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Target, Calendar, TrendingUp, BookOpen, Loader2 } from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { TeamsService, CreateTeamObjectiveRequest, UpdateTeamObjectiveRequest, WorkTeamObjective } from '../services/teams.service'
import { PremiumSelect } from './PremiumSelect'

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
  
  const modalBg = panelStyles?.card_background || 'rgba(15, 23, 42, 0.95)'
  const modalBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const textColor = panelStyles?.text_color || '#f8fafc'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'
  const sectionBg = `${modalBg}CC`
  
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

  if (!isOpen) return null

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
          className="relative rounded-3xl shadow-2xl border w-full max-w-2xl max-h-[90vh] overflow-visible flex flex-col z-10 backdrop-blur-xl"
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
                  <Target className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h2 className="font-heading text-xl font-bold tracking-tight" style={{ color: textColor }}>
                    {objective ? 'Editar Objetivo' : 'Crear Objetivo'}
                  </h2>
                  <p className="font-body text-xs mt-1" style={{ color: textColor, opacity: 0.7 }}>
                    {objective ? 'Modifica los detalles del objetivo' : 'Define un nuevo objetivo para el equipo'}
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
                  <X className="w-4 h-4" />
                  <span className="text-sm font-body">{error}</span>
                </motion.div>
              )}

              {/* Título */}
              <div>
                <label className="block font-body text-sm font-semibold mb-2" style={{ color: textColor }}>
                  Título del Objetivo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Completar 80% del curso de IA"
                  className="w-full px-4 py-3 border rounded-xl font-body focus:outline-none focus:ring-1 transition-all"
                  style={{ 
                    borderColor: modalBorder,
                    backgroundColor: sectionBg,
                    color: textColor
                  }}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block font-body text-sm font-semibold mb-2" style={{ color: textColor }}>
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="Describe el objetivo en detalle..."
                  className="w-full px-4 py-3 border rounded-xl font-body focus:outline-none focus:ring-1 transition-all resize-none"
                  style={{ 
                    borderColor: modalBorder,
                    backgroundColor: sectionBg,
                    color: textColor
                  }}
                  disabled={isSubmitting}
                />
              </div>

              {/* Curso (Opcional) */}
              <div>
                <label className="block font-body text-sm font-semibold mb-2" style={{ color: textColor }}>
                  <BookOpen className="w-4 h-4 inline mr-1" />
                  Curso (Opcional)
                </label>
                {isLoadingCourses ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl border" style={{ borderColor: modalBorder, backgroundColor: sectionBg }}>
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: primaryColor }} />
                    <span className="text-sm font-body opacity-70">Cargando cursos...</span>
                  </div>
                ) : (
                  <PremiumSelect
                    value={formData.course_id || '__general__'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value === '__general__' ? '' : value }))}
                    placeholder="Seleccionar curso (opcional) o dejar vacío para objetivo general"
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
                <p className="text-xs font-body opacity-70 mt-2" style={{ color: textColor }}>
                  Deja vacío para crear un objetivo general del equipo, o selecciona un curso específico
                </p>
              </div>

              {/* Tipo de Métrica y Valor Objetivo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-sm font-semibold mb-2" style={{ color: textColor }}>
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    Tipo de Métrica <span className="text-red-400">*</span>
                  </label>
                  <PremiumSelect
                    value={formData.metric_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, metric_type: value as any }))}
                    placeholder="Seleccionar tipo..."
                    options={metricTypeOptions}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-semibold mb-2" style={{ color: textColor }}>
                    Valor Objetivo <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={formData.target_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_value: parseFloat(e.target.value) || 0 }))}
                    placeholder="100"
                    className="w-full px-4 py-3 border rounded-xl font-body focus:outline-none focus:ring-1 transition-all"
                    style={{ 
                      borderColor: modalBorder,
                      backgroundColor: sectionBg,
                      color: textColor
                    }}
                    required
                    disabled={isSubmitting}
                  />
                  <p className="text-xs font-body opacity-70 mt-1" style={{ color: textColor }}>
                    {formData.metric_type === 'completion_percentage' && 'Porcentaje (0-100)'}
                    {formData.metric_type === 'average_score' && 'Calificación promedio (0-10)'}
                    {formData.metric_type === 'participation_rate' && 'Porcentaje de participación (0-100)'}
                    {formData.metric_type === 'engagement_rate' && 'Porcentaje de compromiso (0-100)'}
                    {formData.metric_type === 'custom' && 'Valor personalizado'}
                  </p>
                </div>
              </div>

              {/* Fecha Límite */}
              <div>
                <label className="block font-body text-sm font-semibold mb-2" style={{ color: textColor }}>
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Fecha Límite (Opcional)
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border rounded-xl font-body focus:outline-none focus:ring-1 transition-all"
                  style={{ 
                    borderColor: modalBorder,
                    backgroundColor: sectionBg,
                    color: textColor
                  }}
                  disabled={isSubmitting}
                />
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
                disabled={isSubmitting || !formData.title.trim()}
                className="font-body"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${panelStyles?.secondary_button_color || '#8b5cf6'} 100%)`,
                  boxShadow: `0 4px 14px 0 ${primaryColor}40`
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    {objective ? 'Actualizar Objetivo' : 'Crear Objetivo'}
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

