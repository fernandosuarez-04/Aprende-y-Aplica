'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BarChart3, TrendingUp, BookOpen, Award, Clock, FileText, Target, CheckCircle, PlayCircle, XCircle, User, Mail, Briefcase, Star, Calendar, LogIn, MessageSquare, HelpCircle, Activity, Zap, Trophy, Layers, BookMarked, Eye } from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'
import Image from 'next/image'
import { BusinessUser } from '../services/businessUsers.service'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'

interface BusinessUserStatsModalProps {
  user: BusinessUser | null
  isOpen: boolean
  onClose: () => void
}

interface UserStats {
  total_courses: number
  completed_courses: number
  in_progress_courses: number
  not_started_courses: number
  average_progress: number
  total_time_spent_minutes: number
  total_time_spent_hours: number
  completed_lessons: number
  total_lessons: number
  certificates_count: number
  notes_count: number
  total_assignments: number
  completed_assignments: number
  lia_conversations_total?: number
  lia_messages_total?: number
  quiz_total?: number
  quiz_passed?: number
  quiz_failed?: number
  quiz_average_score?: number
  lia_activities_completed?: number
  lia_activities_total?: number
  courses_data: Array<{
    course_id: string
    course_title: string
    progress: number
    status: string
    enrolled_at: string
    completed_at: string | null
    has_certificate: boolean
    lia_conversations_count?: number
    lia_messages_count?: number
    lia_avg_duration_minutes?: number
    lia_last_conversation?: string | null
    quiz_total?: number
    quiz_passed?: number
    quiz_failed?: number
    quiz_average_score?: number
    quiz_best_score?: number
    quiz_total_attempts?: number
    lia_activities_completed?: number
    notes_count?: number
    time_spent_minutes?: number
    modules_total?: number
    modules_completed?: number
    lessons_total?: number
    lessons_completed?: number
    lessons_in_progress?: number
    activities_completed?: number
    activities_total?: number
    readings_viewed?: number
    quiz_lessons_completed?: number
  }>
  time_by_course: Array<{
    course_id: string
    course_title: string
    total_minutes: number
    total_hours: number
  }>
  completed_by_month: Array<{
    month: string
    count: number
  }>
  distribution: {
    completed: number
    in_progress: number
    not_started: number
  }
}

export function BusinessUserStatsModal({ user, isOpen, onClose }: BusinessUserStatsModalProps) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'progress' | 'activity'>('overview')

  // Aplicar colores personalizados
  const modalBg = panelStyles?.card_background || 'rgba(15, 23, 42, 0.95)'
  const modalBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const textColor = panelStyles?.text_color || '#f8fafc'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'

  useEffect(() => {
    if (isOpen && user) {
      fetchUserStats()
    }
  }, [isOpen, user])

  const fetchUserStats = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/business/users/${user.id}/stats`, {
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar estadísticas')
      }

      if (data.success && data.stats) {
        setStats(data.stats)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  const formatRelativeTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'Nunca'
    
    try {
      const date = new Date(dateString)
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) return 'Fecha inválida'
      
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      
      // Si la fecha es en el futuro, mostrar la fecha completa
      if (diffMs < 0) {
        return formatDate(dateString)
      }
      
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      
      if (diffMinutes < 1) return 'Hace unos momentos'
      if (diffMinutes < 60) return `Hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`
      if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
      if (diffDays === 0) return 'Hoy'
      if (diffDays === 1) return 'Ayer'
      if (diffDays < 7) return `Hace ${diffDays} días`
      if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`
      if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`
      return `Hace ${Math.floor(diffDays / 365)} año${Math.floor(diffDays / 365) > 1 ? 's' : ''}`
    } catch (error) {
      // Si hay algún error, intentar mostrar la fecha formateada
      return formatDate(dateString)
    }
  }

  if (!isOpen || !user) return null

  const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
  const initials = (user.first_name?.[0] || user.username[0] || 'U').toUpperCase()

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xl"
        />

        {/* Modal - Más compacto */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative backdrop-blur-xl rounded-3xl shadow-2xl border w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col z-10"
          style={{
            backgroundColor: modalBg,
            borderColor: modalBorder
          }}
        >
          {/* Header compacto */}
          <div className="relative border-b p-4" style={{
            backgroundColor: modalBg,
            borderColor: modalBorder
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user.profile_picture_url ? (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border flex-shrink-0" style={{ borderColor: `${primaryColor}40` }}>
                    <Image
                      src={user.profile_picture_url}
                      alt={displayName}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-heading font-semibold flex-shrink-0 border"
                    style={{
                      background: `linear-gradient(to bottom right, ${primaryColor}, ${primaryColor}DD)`,
                      borderColor: `${primaryColor}40`,
                      color: '#ffffff'
                    }}
                  >
                    {initials}
                  </div>
                )}
                <div>
                  <h2 className="font-heading text-lg font-semibold tracking-tight" style={{ color: textColor }}>
                    {displayName}
                  </h2>
                  <p className="font-body text-xs mt-0.5" style={{ color: textColor, opacity: 0.6 }}>
                    {user.email}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1.5 rounded-lg transition-all duration-200"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${modalBg}80`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <X className="w-4 h-4" style={{ color: textColor, opacity: 0.7 }} />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs compactos */}
            <div className="border-b" style={{ borderColor: modalBorder }}>
              <div className="flex gap-1 p-2">
                {[
                  { id: 'overview', label: 'Resumen', icon: BarChart3 },
                  { id: 'courses', label: 'Cursos', icon: BookOpen },
                  { id: 'progress', label: 'Progreso', icon: TrendingUp },
                  { id: 'activity', label: 'Actividad', icon: Clock }
                ].map(({ id, label, icon: Icon }) => (
                  <motion.button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 font-heading text-xs"
                    style={{
                      backgroundColor: activeTab === id ? `${primaryColor}15` : 'transparent',
                      color: activeTab === id ? primaryColor : textColor,
                      opacity: activeTab === id ? 1 : 0.7
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== id) {
                        e.currentTarget.style.backgroundColor = `${modalBg}80`
                        e.currentTarget.style.opacity = '1'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== id) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.opacity = '0.7'
                      }
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div
                    className="w-8 h-8 border-3 rounded-full animate-spin"
                    style={{
                      borderColor: `${primaryColor}30`,
                      borderTopColor: primaryColor
                    }}
                  ></div>
                </div>
              ) : error ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                  <p className="font-body text-sm text-red-400">{error}</p>
                </motion.div>
              ) : stats ? (
                <>
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="space-y-4">
                      {/* Información del Usuario */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border p-4"
                        style={{
                          backgroundColor: `${modalBg}CC`,
                          borderColor: modalBorder
                        }}
                      >
                        <h3 className="font-heading text-sm font-semibold mb-3" style={{ color: textColor }}>Información del Usuario</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <p className="font-body text-xs mb-1" style={{ color: textColor, opacity: 0.6 }}>Cargo</p>
                            <p className="font-body text-sm font-medium" style={{ color: textColor }}>
                              {user.cargo_rol || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="font-body text-xs mb-1" style={{ color: textColor, opacity: 0.6 }}>Tipo de Rol</p>
                            <p className="font-body text-sm font-medium" style={{ color: textColor }}>
                              {user.type_rol || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="font-body text-xs mb-1" style={{ color: textColor, opacity: 0.6 }}>Puntos</p>
                            <p className="font-body text-sm font-medium flex items-center gap-1" style={{ color: primaryColor }}>
                              <Star className="w-3.5 h-3.5" />
                              {user.points || 0}
                            </p>
                          </div>
                          <div>
                            <p className="font-body text-xs mb-1" style={{ color: textColor, opacity: 0.6 }}>Última Conexión</p>
                            <p className="font-body text-xs font-medium" style={{ color: textColor, opacity: 0.8 }}>
                              {user.last_login_at ? formatRelativeTime(user.last_login_at) : 'Nunca'}
                            </p>
                            {user.last_login_at && (
                              <p className="font-body text-xs mt-0.5" style={{ color: textColor, opacity: 0.5 }}>
                                {formatDate(user.last_login_at)}
                              </p>
                            )}
                          </div>
                        </div>
                        {user.joined_at && (
                          <div className="mt-3 pt-3 border-t" style={{ borderColor: modalBorder }}>
                            <p className="font-body text-xs" style={{ color: textColor, opacity: 0.6 }}>
                              Se unió el {formatDate(user.joined_at)}
                            </p>
                          </div>
                        )}
                      </motion.div>

                      {/* Stats Cards compactas */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { icon: BookOpen, label: 'Total Cursos', value: stats.total_courses },
                          { icon: CheckCircle, label: 'Completados', value: stats.completed_courses },
                          { icon: Clock, label: 'Tiempo Total', value: `${stats.total_time_spent_hours}h` },
                          { icon: Award, label: 'Certificados', value: stats.certificates_count }
                        ].map(({ icon: Icon, label, value }, index) => (
                          <motion.div
                            key={label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                            className="rounded-xl border p-3"
                            style={{
                              backgroundColor: `${modalBg}CC`,
                              borderColor: modalBorder
                            }}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div
                                className="w-8 h-8 rounded-lg border flex items-center justify-center"
                                style={{
                                  backgroundColor: `${primaryColor}15`,
                                  borderColor: `${primaryColor}30`
                                }}
                              >
                                <Icon className="w-4 h-4" style={{ color: primaryColor }} />
                              </div>
                              <span className="font-heading text-xl font-bold" style={{ color: textColor }}>{value}</span>
                            </div>
                            <p className="font-body text-xs uppercase tracking-wider" style={{ color: textColor, opacity: 0.7 }}>{label}</p>
                          </motion.div>
                        ))}
                      </div>

                      {/* Estadísticas Adicionales */}
                      {(stats.lia_conversations_total || stats.quiz_total || stats.lia_activities_completed) && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25 }}
                          className="rounded-2xl border p-4"
                          style={{
                            backgroundColor: `${modalBg}CC`,
                            borderColor: modalBorder
                          }}
                        >
                          <h3 className="font-heading text-sm font-semibold mb-3" style={{ color: textColor }}>Actividad Detallada</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {stats.lia_conversations_total !== undefined && (
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <MessageSquare className="w-4 h-4" style={{ color: primaryColor }} />
                                  <span className="font-body text-xs" style={{ color: textColor, opacity: 0.7 }}>Consultas LIA</span>
                                </div>
                                <p className="font-heading text-lg font-bold" style={{ color: textColor }}>{stats.lia_conversations_total}</p>
                                {stats.lia_messages_total !== undefined && (
                                  <p className="font-body text-xs mt-0.5" style={{ color: textColor, opacity: 0.6 }}>{stats.lia_messages_total} mensajes</p>
                                )}
                              </div>
                            )}
                            {stats.quiz_total !== undefined && stats.quiz_total > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <HelpCircle className="w-4 h-4" style={{ color: primaryColor }} />
                                  <span className="font-body text-xs" style={{ color: textColor, opacity: 0.7 }}>Quiz Resueltos</span>
                                </div>
                                <p className="font-heading text-lg font-bold" style={{ color: textColor }}>{stats.quiz_passed || 0}/{stats.quiz_total}</p>
                                {stats.quiz_average_score !== undefined && (
                                  <p className="font-body text-xs mt-0.5" style={{ color: textColor, opacity: 0.6 }}>Promedio: {stats.quiz_average_score}%</p>
                                )}
                              </div>
                            )}
                            {stats.lia_activities_completed !== undefined && (
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Activity className="w-4 h-4" style={{ color: primaryColor }} />
                                  <span className="font-body text-xs" style={{ color: textColor, opacity: 0.7 }}>Actividades LIA</span>
                                </div>
                                <p className="font-heading text-lg font-bold" style={{ color: textColor }}>{stats.lia_activities_completed}</p>
                                {stats.lia_activities_total !== undefined && (
                                  <p className="font-body text-xs mt-0.5" style={{ color: textColor, opacity: 0.6 }}>de {stats.lia_activities_total} total</p>
                                )}
                              </div>
                            )}
                            {stats.notes_count > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <FileText className="w-4 h-4" style={{ color: primaryColor }} />
                                  <span className="font-body text-xs" style={{ color: textColor, opacity: 0.7 }}>Notas</span>
                                </div>
                                <p className="font-heading text-lg font-bold" style={{ color: textColor }}>{stats.notes_count}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Progress Overview */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="rounded-2xl border p-4"
                        style={{
                          backgroundColor: `${modalBg}CC`,
                          borderColor: modalBorder
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-heading text-sm font-semibold" style={{ color: textColor }}>Progreso Promedio</h3>
                          <span className="font-body text-sm font-heading font-semibold" style={{ color: textColor }}>{stats.average_progress}%</span>
                        </div>
                        <div
                          className="w-full h-2 rounded-full overflow-hidden"
                          style={{ backgroundColor: `${modalBorder}50` }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.average_progress}%` }}
                            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}DD)` }}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-4">
                          {[
                            { label: 'Completados', value: stats.completed_courses, color: primaryColor },
                            { label: 'En Progreso', value: stats.in_progress_courses, color: primaryColor, opacity: 0.8 },
                            { label: 'No Iniciados', value: stats.not_started_courses, color: textColor, opacity: 0.5 }
                          ].map(({ label, value, color, opacity = 1 }) => (
                            <div
                              key={label}
                              className="text-center p-2 rounded border"
                              style={{
                                backgroundColor: `${color}10`,
                                borderColor: `${color}20`
                              }}
                            >
                              <div className="font-heading text-lg font-bold" style={{ color, opacity }}>{value}</div>
                              <div className="font-body text-xs mt-0.5" style={{ color: textColor, opacity: 0.7 }}>{label}</div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* Courses Tab */}
                  {activeTab === 'courses' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-3"
                    >
                      <div
                        className="rounded-lg border overflow-hidden"
                        style={{
                          backgroundColor: `${modalBg}CC`,
                          borderColor: modalBorder
                        }}
                      >
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead
                              className="border-b"
                              style={{
                                backgroundColor: `${modalBg}80`,
                                borderColor: modalBorder
                              }}
                            >
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-heading font-semibold uppercase tracking-wider" style={{ color: textColor, opacity: 0.7 }}>Curso</th>
                                <th className="px-4 py-3 text-left text-xs font-heading font-semibold uppercase tracking-wider" style={{ color: textColor, opacity: 0.7 }}>Progreso</th>
                                <th className="px-4 py-3 text-left text-xs font-heading font-semibold uppercase tracking-wider" style={{ color: textColor, opacity: 0.7 }}>Estado</th>
                                <th className="px-4 py-3 text-center text-xs font-heading font-semibold uppercase tracking-wider" style={{ color: textColor, opacity: 0.7 }}>Tiempo</th>
                                <th className="px-3 py-3 text-center text-xs font-heading font-semibold uppercase tracking-wider" style={{ color: textColor, opacity: 0.7 }}>LIA</th>
                                <th className="px-3 py-3 text-center text-xs font-heading font-semibold uppercase tracking-wider" style={{ color: textColor, opacity: 0.7 }}>Quiz</th>
                                <th className="px-4 py-3 text-center text-xs font-heading font-semibold uppercase tracking-wider" style={{ color: textColor, opacity: 0.7 }}>Certificado</th>
                              </tr>
                            </thead>
                            <tbody style={{ borderColor: `${modalBorder}50` }}>
                              {stats.courses_data.map((course, index) => {
                                const timeData = stats.time_by_course.find(t => t.course_id === course.course_id)
                                return (
                                  <motion.tr
                                    key={course.course_id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    whileHover={{ backgroundColor: `${modalBg}80` }}
                                    className="border-b transition-all duration-200"
                                    style={{ borderColor: `${modalBorder}30` }}
                                  >
                                    <td className="px-4 py-3">
                                      <p className="font-body text-sm font-medium" style={{ color: textColor }}>{course.course_title}</p>
                                      {course.notes_count !== undefined && course.notes_count > 0 && (
                                        <p className="font-body text-xs mt-0.5 flex items-center gap-1" style={{ color: textColor, opacity: 0.6 }}>
                                          <FileText className="w-3 h-3" />
                                          {course.notes_count} nota{course.notes_count > 1 ? 's' : ''}
                                        </p>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-20 h-1.5 rounded-full overflow-hidden"
                                          style={{ backgroundColor: `${modalBorder}50` }}
                                        >
                                          <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${course.progress}%` }}
                                            transition={{ duration: 0.6, delay: index * 0.05 }}
                                            className="h-full rounded-full"
                                            style={{ background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}DD)` }}
                                          />
                                        </div>
                                        <span className="font-body text-xs font-heading font-medium" style={{ color: textColor }}>{course.progress}%</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span
                                        className="px-2 py-1 rounded-full text-xs font-heading font-medium"
                                        style={{
                                          backgroundColor: course.status === 'completed'
                                            ? `${primaryColor}20`
                                            : course.progress > 0
                                            ? `${primaryColor}15`
                                            : `${modalBg}80`,
                                          color: course.status === 'completed'
                                            ? primaryColor
                                            : course.progress > 0
                                            ? primaryColor
                                            : textColor,
                                          opacity: course.status === 'completed' ? 1 : course.progress > 0 ? 0.9 : 0.6
                                        }}
                                      >
                                        {course.status === 'completed' ? 'Completado' :
                                         course.progress > 0 ? 'En Progreso' : 'No Iniciado'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className="font-body text-xs font-medium" style={{ color: textColor }}>
                                        {course.time_spent_minutes ? `${Math.round((course.time_spent_minutes / 60) * 10) / 10}h` : timeData ? `${timeData.total_hours}h` : '0h'}
                                      </span>
                                    </td>
                                    <td className="px-3 py-3">
                                      {course.lia_conversations_count !== undefined && course.lia_conversations_count > 0 ? (
                                        <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
                                          <div className="flex items-center gap-1">
                                            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" style={{ color: primaryColor }} />
                                            <span className="font-body text-xs font-semibold whitespace-nowrap" style={{ color: primaryColor }}>
                                              {course.lia_conversations_count}
                                            </span>
                                          </div>
                                          {course.lia_messages_count !== undefined && course.lia_messages_count > 0 && (
                                            <span className="font-body text-xs whitespace-nowrap" style={{ color: textColor, opacity: 0.65 }}>
                                              {course.lia_messages_count} msgs
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-center block" style={{ color: textColor, opacity: 0.3 }}>-</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-3">
                                      {course.quiz_total !== undefined && course.quiz_total > 0 ? (
                                        <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
                                          <div className="flex items-center gap-1">
                                            <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: primaryColor }} />
                                            <span className="font-body text-xs font-semibold whitespace-nowrap" style={{ color: primaryColor }}>
                                              {course.quiz_passed || 0}/{course.quiz_total}
                                            </span>
                                          </div>
                                          {course.quiz_average_score !== undefined && course.quiz_average_score > 0 && (
                                            <span className="font-body text-xs whitespace-nowrap" style={{ color: textColor, opacity: 0.65 }}>
                                              {course.quiz_average_score}%
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-center block" style={{ color: textColor, opacity: 0.3 }}>-</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {course.has_certificate ? (
                                        <Award className="w-4 h-4 mx-auto" style={{ color: primaryColor }} />
                                      ) : (
                                        <span style={{ color: textColor, opacity: 0.3 }}>-</span>
                                      )}
                                    </td>
                                  </motion.tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Progress Tab */}
                  {activeTab === 'progress' && (
                    <div className="space-y-4">
                      {stats.courses_data.map((course, index) => {
                        const timeData = stats.time_by_course.find(t => t.course_id === course.course_id)
                        return (
                          <motion.div
                            key={course.course_id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="rounded-2xl border p-4"
                            style={{
                              backgroundColor: `${modalBg}CC`,
                              borderColor: modalBorder
                            }}
                          >
                            {/* Header del curso */}
                            <div className="flex items-center justify-between mb-3">
                              <p className="font-body text-sm font-semibold" style={{ color: textColor }}>{course.course_title}</p>
                              <span className="font-body text-sm font-heading font-bold" style={{ color: primaryColor }}>{course.progress}%</span>
                            </div>
                            
                            {/* Barra de progreso */}
                            <div
                              className="w-full h-2 rounded-full overflow-hidden mb-4"
                              style={{ backgroundColor: `${modalBorder}50` }}
                            >
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${course.progress}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                                className="h-full rounded-full"
                                style={{ background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}DD)` }}
                              />
                            </div>

                            {/* Estadísticas detalladas */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {/* Módulos */}
                              {course.modules_total !== undefined && course.modules_total > 0 && (
                                <div className="flex items-start gap-2">
                                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                                    <Layers className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-body text-xs" style={{ color: textColor, opacity: 0.7 }}>Módulos</p>
                                    <p className="font-heading text-sm font-semibold" style={{ color: textColor }}>
                                      {course.modules_completed || 0}/{course.modules_total}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Lecciones */}
                              {course.lessons_total !== undefined && course.lessons_total > 0 && (
                                <div className="flex items-start gap-2">
                                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                                    <BookOpen className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-body text-xs" style={{ color: textColor, opacity: 0.7 }}>Lecciones</p>
                                    <p className="font-heading text-sm font-semibold" style={{ color: textColor }}>
                                      {course.lessons_completed || 0}/{course.lessons_total}
                                    </p>
                                    {course.lessons_in_progress !== undefined && course.lessons_in_progress > 0 && (
                                      <p className="font-body text-xs mt-0.5" style={{ color: textColor, opacity: 0.6 }}>
                                        {course.lessons_in_progress} en progreso
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Actividades */}
                              {course.activities_total !== undefined && course.activities_total > 0 && (
                                <div className="flex items-start gap-2">
                                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                                    <Activity className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-body text-xs" style={{ color: textColor, opacity: 0.7 }}>Actividades</p>
                                    <p className="font-heading text-sm font-semibold" style={{ color: textColor }}>
                                      {course.activities_completed || 0}/{course.activities_total}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Quiz */}
                              {course.quiz_lessons_completed !== undefined && course.quiz_lessons_completed > 0 && (
                                <div className="flex items-start gap-2">
                                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                                    <HelpCircle className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-body text-xs" style={{ color: textColor, opacity: 0.7 }}>Quiz</p>
                                    <p className="font-heading text-sm font-semibold" style={{ color: textColor }}>
                                      {course.quiz_lessons_completed} completados
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Lecturas */}
                              {course.readings_viewed !== undefined && course.readings_viewed > 0 && (
                                <div className="flex items-start gap-2">
                                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                                    <Eye className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-body text-xs" style={{ color: textColor, opacity: 0.7 }}>Lecturas</p>
                                    <p className="font-heading text-sm font-semibold" style={{ color: textColor }}>
                                      {course.readings_viewed}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Tiempo */}
                              {timeData && timeData.total_hours > 0 && (
                                <div className="flex items-start gap-2">
                                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                                    <Clock className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-body text-xs" style={{ color: textColor, opacity: 0.7 }}>Tiempo</p>
                                    <p className="font-heading text-sm font-semibold" style={{ color: textColor }}>
                                      {timeData.total_hours}h
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}

                  {/* Activity Tab */}
                  {activeTab === 'activity' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-2xl border p-4"
                          style={{
                            backgroundColor: `${modalBg}CC`,
                            borderColor: modalBorder
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4" style={{ color: primaryColor }} />
                            <h3 className="font-heading text-sm font-semibold" style={{ color: textColor }}>Notas</h3>
                          </div>
                          <div className="font-heading text-2xl font-bold" style={{ color: textColor }}>{stats.notes_count}</div>
                          <p className="font-body text-xs mt-1" style={{ color: textColor, opacity: 0.6 }}>Notas creadas</p>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="rounded-2xl border p-4"
                          style={{
                            backgroundColor: `${modalBg}CC`,
                            borderColor: modalBorder
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4" style={{ color: primaryColor }} />
                            <h3 className="font-heading text-sm font-semibold" style={{ color: textColor }}>Asignaciones</h3>
                          </div>
                          <div className="font-heading text-2xl font-bold" style={{ color: textColor }}>{stats.total_assignments}</div>
                          <p className="font-body text-xs mt-1" style={{ color: textColor, opacity: 0.6 }}>
                            {stats.completed_assignments} completadas
                          </p>
                        </motion.div>
                      </div>

                      {stats.completed_by_month.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="rounded-2xl border p-4"
                          style={{
                            backgroundColor: `${modalBg}CC`,
                            borderColor: modalBorder
                          }}
                        >
                          <h3 className="font-heading text-sm font-semibold mb-3" style={{ color: textColor }}>Cursos Completados por Mes</h3>
                          <div className="space-y-2">
                            {stats.completed_by_month.map((item, index) => {
                              const maxCount = Math.max(...stats.completed_by_month.map(m => m.count), 1)
                              const percentage = (item.count / maxCount) * 100

                              return (
                                <div key={item.month}>
                                  <div className="flex justify-between mb-1.5">
                                    <span className="font-body text-xs" style={{ color: textColor, opacity: 0.8 }}>{formatMonth(item.month)}</span>
                                    <span className="font-body text-xs font-heading font-semibold" style={{ color: textColor }}>{item.count} curso{item.count !== 1 ? 's' : ''}</span>
                                  </div>
                                  <div
                                    className="w-full h-1.5 rounded-full overflow-hidden"
                                    style={{ backgroundColor: `${modalBorder}50` }}
                                  >
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${percentage}%` }}
                                      transition={{ duration: 0.8, delay: index * 0.1 }}
                                      className="h-full rounded-full"
                                      style={{ background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}DD)` }}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
