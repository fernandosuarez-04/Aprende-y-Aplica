'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Target,
  TrendingUp,
  Users,
  ChevronRight,
  Sparkles,
  AlertCircle,
  BarChart3,
  GraduationCap,
  PlayCircle
} from 'lucide-react'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'
import { TeamsService, WorkTeamCourseAssignment } from '../services/teams.service'
import { BusinessAssignCourseToTeamModal } from './BusinessAssignCourseToTeamModal'
import { WorkTeamMember } from '../services/teams.service'
import Image from 'next/image'

interface TeamCoursesTabProps {
  teamId: string
  teamName: string
  teamMembers: WorkTeamMember[]
}

export function TeamCoursesTab({ teamId, teamName, teamMembers }: TeamCoursesTabProps) {
  const { styles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const panelStyles = styles?.panel

  const primaryColor = panelStyles?.primary_button_color || '#8B5CF6'
  const accentColor = panelStyles?.accent_color || '#10B981'
  const cardBackground = isDark ? (panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)') : '#FFFFFF'
  const textColor = isDark ? (panelStyles?.text_color || '#f8fafc') : '#0F172A'
  const secondaryTextColor = isDark ? 'rgba(248, 250, 252, 0.6)' : 'rgba(15, 23, 42, 0.6)'
  const tertiaryTextColor = isDark ? 'rgba(248, 250, 252, 0.5)' : 'rgba(15, 23, 42, 0.5)'
  const borderColor = isDark ? (panelStyles?.border_color || 'rgba(255,255,255,0.1)') : 'rgba(0,0,0,0.1)'
  const statBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
  const progressBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'

  const [assignments, setAssignments] = useState<WorkTeamCourseAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)

  useEffect(() => {
    fetchAssignments()
  }, [teamId])

  const fetchAssignments = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const courses = await TeamsService.getTeamCourses(teamId)
      setAssignments(courses)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cursos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignSuccess = () => {
    fetchAssignments()
  }

  // Stats
  const totalCourses = assignments.length
  const completedCourses = assignments.filter(a => a.status === 'completed').length
  const inProgressCourses = assignments.filter(a => a.status === 'in_progress').length
  const pendingCourses = assignments.filter(a => a.status === 'assigned').length

  // Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ backgroundColor: primaryColor }}
            />
            <div
              className="absolute inset-0 flex items-center justify-center"
            >
              <BookOpen className="w-8 h-8" style={{ color: primaryColor }} />
            </div>
          </div>
          <p className="text-sm" style={{ color: secondaryTextColor }}>
            Cargando cursos...
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Premium */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ rotate: -10, scale: 1.1 }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
              boxShadow: `0 8px 25px ${primaryColor}40`
            }}
          >
            <BookOpen className="w-7 h-7 text-white" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: textColor }}>
              Cursos del Equipo
            </h2>
            <p className="text-sm" style={{ color: secondaryTextColor }}>
              {totalCourses} curso{totalCourses !== 1 ? 's' : ''} asignado{totalCourses !== 1 ? 's' : ''} a {teamName}
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAssignModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl !text-white font-semibold transition-all"
          style={{
            background: 'linear-gradient(135deg, #0A2540 0%, #1e3a5f 100%)',
            boxShadow: '0 4px 20px rgba(10, 37, 64, 0.5)',
            color: '#FFFFFF'
          }}
        >
          <Plus className="w-5 h-5 !text-white" />
          <span className="!text-white font-bold">Asignar Curso</span>
        </motion.button>
      </motion.div>

      {/* Stats Cards */}
      {totalCourses > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[
            {
              label: 'Total Cursos',
              value: totalCourses,
              icon: BookOpen,
              color: primaryColor,
              gradient: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}05)`
            },
            {
              label: 'Completados',
              value: completedCourses,
              icon: CheckCircle2,
              color: '#10B981',
              gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))'
            },
            {
              label: 'En Progreso',
              value: inProgressCourses,
              icon: TrendingUp,
              color: '#3B82F6',
              gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.05))'
            },
            {
              label: 'Pendientes',
              value: pendingCourses,
              icon: Clock,
              color: '#F59E0B',
              gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.05))'
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ scale: 1.03, y: -3 }}
              className="p-4 rounded-2xl border relative overflow-hidden"
              style={{
                background: stat.gradient,
                borderColor: `${stat.color}30`
              }}
            >
              <div className="relative z-10">
                <stat.icon
                  className="w-6 h-6 mb-2"
                  style={{ color: stat.color }}
                />
                <p className="text-2xl font-bold mb-0.5" style={{ color: textColor }}>
                  {stat.value}
                </p>
                <p className="text-xs font-medium" style={{ color: secondaryTextColor }}>
                  {stat.label}
                </p>
              </div>
              <div
                className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full opacity-10"
                style={{ backgroundColor: stat.color }}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border flex items-center gap-3"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)'
          }}
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Empty State */}
      {assignments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-2xl border overflow-hidden"
          style={{ backgroundColor: cardBackground, borderColor }}
        >
          {/* Decorative Background */}
          <div className="absolute inset-0 opacity-30">
            <div
              className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl"
              style={{ backgroundColor: primaryColor }}
            />
            <div
              className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl"
              style={{ backgroundColor: accentColor }}
            />
          </div>

          <div className="relative p-12 text-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}30, ${accentColor}20)`,
                border: `2px dashed ${primaryColor}40`
              }}
            >
              <GraduationCap className="w-12 h-12" style={{ color: primaryColor }} />
            </motion.div>

            <h3 className="text-2xl font-bold mb-3" style={{ color: textColor }}>
              ¡Comienza a capacitar a tu equipo!
            </h3>
            <p className="text-base mb-8 max-w-md mx-auto" style={{ color: secondaryTextColor }}>
              Asigna cursos a tu equipo para impulsar su desarrollo profesional y hacer seguimiento de su progreso.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl !text-white font-semibold text-lg"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                boxShadow: `0 8px 30px ${primaryColor}50`
              }}
            >
              <Sparkles className="w-5 h-5 !text-white" />
              <span className="!text-white">Asignar Primer Curso</span>
            </motion.button>

            {/* Features List */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
              {[
                { icon: BarChart3, text: 'Seguimiento de progreso' },
                { icon: Users, text: 'Aprendizaje en equipo' },
                { icon: Target, text: 'Objetivos medibles' }
              ].map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 justify-center text-sm"
                  style={{ color: tertiaryTextColor }}
                >
                  <feature.icon className="w-4 h-4" style={{ color: primaryColor }} />
                  {feature.text}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        /* Course Cards Grid */
        <div className="space-y-4">
          {assignments.map((assignment, index) => {
            const statusConfig = {
              completed: {
                label: 'Completado',
                color: '#10B981',
                bgColor: 'rgba(16, 185, 129, 0.15)',
                icon: CheckCircle2,
                progress: 100
              },
              in_progress: {
                label: 'En Progreso',
                color: '#3B82F6',
                bgColor: 'rgba(59, 130, 246, 0.15)',
                icon: TrendingUp,
                progress: 45
              },
              assigned: {
                label: 'Pendiente',
                color: '#F59E0B',
                bgColor: 'rgba(245, 158, 11, 0.15)',
                icon: Clock,
                progress: 0
              }
            }
            const status = statusConfig[assignment.status as keyof typeof statusConfig] || statusConfig.assigned

            // Check if course is overdue
            const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date() && assignment.status !== 'completed'

            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ scale: 1.01, y: -3 }}
                className="group relative rounded-2xl border overflow-hidden cursor-pointer"
                style={{
                  backgroundColor: cardBackground,
                  borderColor: isOverdue ? 'rgba(239, 68, 68, 0.4)' : borderColor
                }}
              >
                {/* Hover Gradient */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${status.color}08, transparent)`
                  }}
                />

                {/* Decorative Circle */}
                <div
                  className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
                  style={{ backgroundColor: status.color }}
                />

                <div className="relative p-6">
                  <div className="flex flex-col sm:flex-row gap-5">
                    {/* Course Thumbnail */}
                    <div className="relative flex-shrink-0">
                      {assignment.course?.thumbnail_url ? (
                        <div
                          className="relative w-full sm:w-32 h-32 rounded-2xl overflow-hidden border-2 transition-transform group-hover:scale-105"
                          style={{ borderColor: `${status.color}40` }}
                        >
                          <Image
                            src={assignment.course.thumbnail_url}
                            alt={assignment.course.title || 'Curso'}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm"
                              style={{ backgroundColor: `${primaryColor}CC` }}
                            >
                              <PlayCircle className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="w-full sm:w-32 h-32 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
                          style={{
                            background: `linear-gradient(135deg, ${primaryColor}30, ${accentColor}20)`,
                            border: `2px solid ${primaryColor}30`
                          }}
                        >
                          <BookOpen className="w-12 h-12" style={{ color: primaryColor }} />
                        </div>
                      )}

                      {/* Status Badge on Image */}
                      <div
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold whitespace-nowrap"
                        style={{
                          backgroundColor: status.bgColor,
                          color: status.color,
                          border: `1px solid ${status.color}30`
                        }}
                      >
                        <status.icon className="w-3 h-3" />
                        {status.label}
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3
                            className="text-xl font-bold mb-1 truncate group-hover:text-clip"
                            style={{ color: textColor }}
                          >
                            {assignment.course?.title || 'Curso sin título'}
                          </h3>
                          <p className="text-sm" style={{ color: tertiaryTextColor }}>
                            Asignado el {new Date(assignment.assigned_at).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Message if exists */}
                      {assignment.message && (
                        <p
                          className="text-sm mb-3 line-clamp-2 italic"
                          style={{ color: secondaryTextColor }}
                        >
                          "{assignment.message}"
                        </p>
                      )}

                      {/* Progress Section */}
                      <div className="mt-auto space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span style={{ color: secondaryTextColor }}>Progreso del equipo</span>
                          <span className="font-bold" style={{ color: status.color }}>
                            {status.progress}%
                          </span>
                        </div>
                        <div
                          className="h-2.5 rounded-full overflow-hidden"
                          style={{ backgroundColor: progressBg }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${status.progress}%` }}
                            transition={{ delay: 0.3 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{
                              background: `linear-gradient(90deg, ${status.color}, ${status.color}CC)`,
                              boxShadow: status.progress > 0 ? `0 0 15px ${status.color}60` : 'none'
                            }}
                          />
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="mt-4 pt-4 border-t flex flex-wrap items-center justify-between gap-3" style={{ borderColor }}>
                        <div className="flex items-center gap-4">
                          {/* Due Date */}
                          {assignment.due_date && (
                            <div
                              className={`flex items-center gap-1.5 text-sm ${isOverdue ? 'text-red-400' : ''}`}
                              style={{ color: isOverdue ? '#EF4444' : tertiaryTextColor }}
                            >
                              <Calendar className="w-4 h-4" />
                              <span>
                                {isOverdue ? 'Venció: ' : 'Vence: '}
                                {new Date(assignment.due_date).toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                              {isOverdue && (
                                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                                  Atrasado
                                </span>
                              )}
                            </div>
                          )}

                          {/* Category */}
                          {assignment.course?.category && (
                            <span
                              className="px-2.5 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${primaryColor}15`,
                                color: primaryColor
                              }}
                            >
                              {assignment.course.category}
                            </span>
                          )}
                        </div>

                        {/* View More */}
                        <motion.div
                          whileHover={{ x: 3 }}
                          className="flex items-center gap-1 text-sm font-medium"
                          style={{ color: primaryColor }}
                        >
                          Ver detalles
                          <ChevronRight className="w-4 h-4" />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overdue Warning Bar */}
                {isOverdue && (
                  <div
                    className="px-6 py-2 flex items-center gap-2 text-sm"
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                  >
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-red-400">Este curso ha superado su fecha límite</span>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Modal de Asignación */}
      <BusinessAssignCourseToTeamModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        teamId={teamId}
        teamName={teamName}
        teamMembers={teamMembers}
        onAssignComplete={handleAssignSuccess}
      />
    </div>
  )
}

