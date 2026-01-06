'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BookOpen, Calendar, MessageSquare, Users, Loader2 } from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { TeamsService, WorkTeamMember } from '../services/teams.service'
import { useBusinessCourses } from '../hooks/useBusinessCourses'
import { PremiumSelect } from './PremiumSelect'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/core/stores/themeStore'

interface BusinessAssignCourseToTeamModalProps {
  isOpen: boolean
  onClose: () => void
  teamId: string
  teamName: string
  teamMembers: WorkTeamMember[]
  onAssignComplete: () => void
}

export function BusinessAssignCourseToTeamModal({
  isOpen,
  onClose,
  teamId,
  teamName,
  teamMembers,
  onAssignComplete
}: BusinessAssignCourseToTeamModalProps) {
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const { courses } = useBusinessCourses()
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  // Aplicar colores personalizados
  const modalBg = isDark 
    ? (panelStyles?.card_background || 'rgba(15, 23, 42, 0.95)')
    : '#FFFFFF'
  const modalBorder = isDark 
    ? (panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)')
    : '#E9ECEF'
  const textColor = isDark 
    ? (panelStyles?.text_color || '#f8fafc')
    : '#0A2540'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'
  const sectionBg = isDark 
    ? `${modalBg}CC`
    : '#F9FAFB'

  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCourseId) {
      setError(t('assignCourse.errors.selectCourse'))
      return
    }

    // Validar que el curso seleccionado existe
    const selectedCourse = courses.find(c => c.id === selectedCourseId)
    if (!selectedCourse) {
      setError(t('assignCourse.errors.invalidCourse'))
      return
    }

    setIsAssigning(true)
    setError(null)

    try {
      // Formatear la fecha si existe (el input date devuelve YYYY-MM-DD)
      let formattedDueDate: string | undefined = undefined
      if (dueDate) {
        // Validar que la fecha no sea anterior a hoy
        const selectedDate = new Date(dueDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (selectedDate < today) {
          setError(t('assignCourse.errors.invalidDate'))
          setIsAssigning(false)
          return
        }

        formattedDueDate = dueDate // Ya está en formato YYYY-MM-DD que PostgreSQL acepta
      }

      const result = await TeamsService.assignCourseToTeam(teamId, {
        course_id: selectedCourseId,
        due_date: formattedDueDate,
        message: customMessage.trim() || undefined
      })

      // Reset form
      setSelectedCourseId('')
      setDueDate('')
      setCustomMessage('')

      // Mostrar mensaje de éxito si está disponible
      if (result) {
        onAssignComplete()
        onClose()
      }
    } catch (err) {
      console.error('Error al asignar curso:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al asignar curso'
      setError(errorMessage.includes('adquirir')
        ? errorMessage
        : `${t('assignCourse.errors.assignFailed')}: ${errorMessage}.`)
    } finally {
      setIsAssigning(false)
    }
  }

  if (!isOpen) return null

  const selectedCourse = courses.find(c => c.id === selectedCourseId)

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative rounded-3xl shadow-2xl border w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col z-10"
          style={{
            backgroundColor: modalBg,
            borderColor: modalBorder
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative border-b p-5" style={{
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
                  <BookOpen className="w-5 h-5" style={{ color: '#FFFFFF', fill: 'none' }} />
                </motion.div>
                <div>
                  <h2 className="font-heading text-xl font-bold tracking-tight" style={{ color: textColor }}>
                    {t('assignCourse.titleTeam')}
                  </h2>
                  <p className="font-body text-xs mt-1" style={{ color: textColor, opacity: 0.7 }}>
                    {teamName} - {teamMembers.length} {t('assignCourse.labels.members')}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                disabled={isAssigning}
                className="p-2 rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                <X className="w-5 h-5" style={{ color: textColor, opacity: 0.7 }} />
              </motion.button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl text-red-400 flex items-center gap-3 border"
                  style={{
                    backgroundColor: 'rgba(127, 29, 29, 0.2)',
                    borderColor: 'rgba(220, 38, 38, 0.3)'
                  }}
                >
                  <X className="w-4 h-4" />
                  <span className="text-sm font-body">{error}</span>
                </motion.div>
              )}

              {/* Selección de Curso */}
              <div>
                <label className="block font-body text-sm font-semibold mb-2" style={{ color: textColor }}>
                  {t('assignCourse.labels.course')} <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <PremiumSelect
                    value={selectedCourseId}
                    onValueChange={(value) => {

                      setSelectedCourseId(value)
                      setError(null) // Limpiar error al cambiar selección
                    }}
                    placeholder={t('assignCourse.placeholders.selectCourse')}
                    options={courses.map(course => ({
                      value: course.id,
                      label: course.title
                    }))}
                    className="w-full"
                  />
                </div>
                {courses.length === 0 && (
                  <p className="text-xs font-body mt-2" style={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#6C757D' }}>
                    {t('assignCourse.errors.noCoursesAvailable')}
                  </p>
                )}
                {selectedCourse && (
                  <div className="mt-3 p-3 rounded-xl border" style={{ backgroundColor: sectionBg, borderColor: modalBorder }}>
                    <p className="text-sm font-body mb-1" style={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#6C757D' }}>{t('assignCourse.labels.selectedCourse')}</p>
                    <p className="font-body font-medium" style={{ color: textColor }}>{selectedCourse.title}</p>
                    {selectedCourse.description && (
                      <p className="text-xs font-body mt-1 line-clamp-2" style={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#6C757D' }}>{selectedCourse.description}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Miembros del Equipo */}
              <div>
                <label className="block font-body text-sm font-semibold mb-2" style={{ color: textColor }}>
                  {t('assignCourse.labels.receivingMembers')} ({teamMembers.length})
                </label>
                <div className="max-h-32 overflow-y-auto space-y-2 border rounded-xl p-3" style={{ borderColor: modalBorder, backgroundColor: sectionBg, scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                  {teamMembers.map(member => (
                    <div key={member.id} className="flex items-center gap-2 text-sm font-body">
                      <Users className="w-4 h-4" style={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : '#6C757D' }} />
                      <span style={{ color: textColor }}>{member.user?.name || member.user?.email || 'Usuario'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fecha Límite y Mensaje */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-sm font-semibold mb-2" style={{ color: textColor }}>
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {t('assignCourse.labels.dueDate')}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border rounded-xl font-body focus:outline-none focus:ring-1 transition-all"
                    style={{
                      borderColor: modalBorder,
                      backgroundColor: sectionBg,
                      color: textColor
                    }}
                  />
                  {dueDate && (
                    <p className="text-xs font-body mt-1" style={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#6C757D' }}>
                      {t('assignCourse.labels.dueDate')}: {new Date(dueDate).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-body text-sm font-semibold mb-2" style={{ color: textColor }}>
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    {t('assignCourse.optional.message')}
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={2}
                    maxLength={200}
                    className="w-full px-4 py-3 border rounded-xl font-body focus:outline-none focus:ring-1 transition-all resize-none"
                    style={{
                      borderColor: modalBorder,
                      backgroundColor: sectionBg,
                      color: textColor
                    }}
                    placeholder={t('assignCourse.placeholders.teamMessage')}
                  />
                  <p className="text-xs font-body mt-1" style={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#6C757D' }}>{customMessage.length}/200</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4 flex justify-end gap-3 shrink-0" style={{
              backgroundColor: modalBg,
              borderColor: modalBorder
            }}>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isAssigning}
                className="font-body"
              >
                {t('assignCourse.buttons.cancel')}
              </Button>
              <Button
                type="submit"
                variant="gradient"
                disabled={isAssigning || !selectedCourseId}
                className="font-body"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${panelStyles?.secondary_button_color || '#8b5cf6'} 100%)`,
                  boxShadow: `0 4px 14px 0 ${primaryColor}40`
                }}
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('assignCourse.buttons.assigning')}
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 mr-2" />
                    {t('assignCourse.buttons.assign')}
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

