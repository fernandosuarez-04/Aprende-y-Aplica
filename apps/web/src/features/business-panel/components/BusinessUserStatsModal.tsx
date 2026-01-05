'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BarChart3, TrendingUp, BookOpen, Award, Clock, FileText, Target, CheckCircle, PlayCircle, XCircle, User, Mail, Briefcase, Calendar, LogIn, MessageSquare, HelpCircle, Activity, Zap, Trophy, Layers, BookMarked, Eye } from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'
import { useTranslation } from 'react-i18next'
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

// Fallback translations in case i18n fails
const fallbackTranslations: Record<string, string> = {
  'users.stats.time.never': 'Nunca',
  'users.stats.time.invalid': 'Fecha inválida',
  'users.stats.time.moments': 'Hace unos momentos',
  'users.stats.time.minutes': 'Hace {{count}} minuto(s)',
  'users.stats.time.hours': 'Hace {{count}} hora(s)',
  'users.stats.time.days': 'Hace {{count}} día(s)',
  'users.stats.time.weeks': 'Hace {{count}} semana(s)',
  'users.stats.time.months': 'Hace {{count}} mes(es)',
  'users.stats.time.years': 'Hace {{count}} año(s)',
  'users.stats.time.today': 'Hoy',
  'users.stats.time.yesterday': 'Ayer',
  'users.stats.labels.typeRole': 'Tipo de Rol',
  'users.stats.labels.lastConnection': 'Última Conexión',
  'users.stats.labels.joined': 'Se unió',
  'users.stats.cards.courses': 'Cursos',
  'users.stats.cards.completed': 'Completados',
  'users.stats.cards.hours': 'Horas',
  'users.stats.cards.certificates': 'Certificados',
  'users.stats.platformActivity.title': 'Actividad en la Plataforma',
  'users.stats.platformActivity.liaQueries': 'Consultas LIA',
  'users.stats.platformActivity.messages': 'mensajes',
  'users.stats.platformActivity.quizzesPassed': 'Quiz Aprobados',
  'users.stats.platformActivity.average': 'promedio',
  'users.stats.platformActivity.liaActivities': 'Actividades LIA',
  'users.stats.platformActivity.total': 'total',
  'users.stats.generalProgress.title': 'Progreso General',
  'users.stats.generalProgress.subtitle': 'Avance en todos los cursos asignados',
  'users.stats.generalProgress.completed': 'Completados',
  'users.stats.generalProgress.inProgress': 'En Progreso',
  'users.stats.generalProgress.notStarted': 'Sin Iniciar',
  'users.stats.coursesList.empty': 'No hay cursos asignados',
  'users.stats.coursesList.enrolled': 'Inscrito',
  'users.stats.coursesList.certificate': 'Certificado',
  'users.stats.coursesList.completed': 'Completado',
  'users.stats.coursesList.inProgress': 'En progreso',
  'users.stats.coursesList.notStarted': 'Sin iniciar',
  'users.stats.coursesList.progress': 'Progreso del curso',
  'users.stats.coursesList.time': 'Tiempo',
  'users.stats.coursesList.lia': 'LIA',
  'users.stats.coursesList.quiz': 'Quiz',
  'users.stats.coursesList.notes': 'Notas',
  'users.stats.timeline.empty': 'No hay progreso que mostrar',
  'users.stats.timeline.modules': 'módulos',
  'users.stats.timeline.lessons': 'lecciones',
  'users.stats.timeline.quizzes': 'quiz',
  'users.stats.activity.notesCreated': 'Notas Creadas',
  'users.stats.activity.assignments': 'Asignaciones',
  'users.stats.activity.certificates': 'Certificados',
  'users.stats.activity.completionHistory': 'Historial de Completados',
  'users.stats.activity.courses': 'curso(s)',
  'users.stats.activity.summary': 'Resumen de Actividad',
  'users.stats.activity.studyTime': 'Tiempo de estudio',
  'users.stats.activity.lessons': 'Lecciones',
  'users.roles.owner': 'Propietario',
  'users.roles.admin': 'Administrador',
  'users.roles.member': 'Miembro'
}

export function BusinessUserStatsModal({ user, isOpen, onClose }: BusinessUserStatsModalProps) {
  const { t: originalT } = useTranslation('business')
  
  // Helper function that provides fallback translations
  const t = (key: string, options?: any): string => {
    const result = originalT(key, options)
    // If the result equals the key, it means translation was not found
    if (result === key || result.includes('.stats.')) {
      let fallback = fallbackTranslations[key] || key
      // Handle interpolation for count
      if (options?.count !== undefined && fallback.includes('{{count}}')) {
        fallback = fallback.replace('{{count}}', String(options.count))
      }
      return fallback
    }
    return result
  }
  
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
    if (!dateString) return t('users.stats.time.never')

    try {
      const date = new Date(dateString)
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) return t('users.stats.time.invalid')

      const now = new Date()
      const diffMs = now.getTime() - date.getTime()

      // Si la fecha es en el futuro, mostrar la fecha completa
      if (diffMs < 0) {
        return formatDate(dateString)
      }

      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMinutes = Math.floor(diffMs / (1000 * 60))

      if (diffMinutes < 1) return t('users.stats.time.moments')
      if (diffMinutes < 60) return t('users.stats.time.minutes', { count: diffMinutes, plural: diffMinutes > 1 ? 's' : '' })
      if (diffHours < 24) return t('users.stats.time.hours', { count: diffHours, plural: diffHours > 1 ? 's' : '' })
      if (diffDays === 0) return t('users.stats.time.today')
      if (diffDays === 1) return t('users.stats.time.yesterday')
      if (diffDays < 7) return t('users.stats.time.days', { count: diffDays })
      if (diffDays < 30) return t('users.stats.time.weeks', { count: Math.floor(diffDays / 7) })
      if (diffDays < 365) return t('users.stats.time.months', { count: Math.floor(diffDays / 30) })
      return t('users.stats.time.years', { count: Math.floor(diffDays / 365) })
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
      {/* Container - transparent backdrop */}
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ zIndex: 99999 }}
      >
        {/* Backdrop - transparent, just for closing */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-5xl mx-4 max-h-[90vh] flex"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="rounded-2xl shadow-2xl overflow-hidden border border-white/10 w-full flex flex-col"
            style={{ backgroundColor: 'var(--org-card-background, #1a1f2e)' }}
          >
            {/* Two Column Layout */}
            <div className="flex min-h-[500px] max-h-[85vh]">

              {/* Left Side - User Profile */}
              <div
                className="w-64 lg:w-72 p-4 lg:p-6 flex flex-col border-r border-white/5 shrink-0 overflow-y-auto"
                style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)`, scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
              >
                {/* User Avatar */}
                <div className="flex flex-col items-center mb-6">
                  {user.profile_picture_url ? (
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 mb-4" style={{ borderColor: `${primaryColor}40` }}>
                      <Image
                        src={user.profile_picture_url}
                        alt={displayName}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold mb-4"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}DD)`,
                        color: '#ffffff'
                      }}
                    >
                      {initials}
                    </div>
                  )}
                  <h2 className="text-lg font-bold text-white text-center">{displayName}</h2>
                  <p className="text-sm text-white/50 text-center mt-1">{user.email}</p>

                  {/* Role Badge */}
                  <div
                    className="mt-3 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                  >
                    {user.org_role === 'owner' ? t('users.roles.owner') :
                      user.org_role === 'admin' ? t('users.roles.admin') : t('users.roles.member')}
                  </div>
                </div>

                {/* User Info */}
                <div className="space-y-3 lg:space-y-4 flex-1">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="w-4 h-4 text-white/50" />
                      <span className="text-xs text-white/50">{t('users.stats.labels.typeRole')}</span>
                    </div>
                    <p className="text-sm text-white font-medium">{user.type_rol || 'N/A'}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-white/50" />
                      <span className="text-xs text-white/50">{t('users.stats.labels.lastConnection')}</span>
                    </div>
                    <p className="text-sm text-white font-medium">
                      {user.last_login_at ? formatRelativeTime(user.last_login_at) : t('users.stats.time.never')}
                    </p>
                    {user.last_login_at && (
                      <p className="text-xs text-white/40 mt-0.5">{formatDate(user.last_login_at)}</p>
                    )}
                  </div>

                  {user.joined_at && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <LogIn className="w-4 h-4 text-white/50" />
                        <span className="text-xs text-white/50">{t('users.stats.labels.joined')}</span>
                      </div>
                      <p className="text-sm text-white font-medium">{formatDate(user.joined_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Stats Content */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header with Tabs */}
                <div className="flex items-center justify-between p-3 lg:p-4 border-b border-white/5 shrink-0">
                  <div className="flex gap-1">
                    {[
                      { id: 'overview', label: 'Resumen', icon: BarChart3 },
                      { id: 'courses', label: 'Cursos', icon: BookOpen },
                      { id: 'progress', label: 'Progreso', icon: TrendingUp },
                      { id: 'activity', label: 'Actividad', icon: Clock }
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id as any)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === id
                          ? 'text-white'
                          : 'text-white/50 hover:text-white hover:bg-white/5'
                          }`}
                        style={activeTab === id ? { backgroundColor: `${primaryColor}20`, color: primaryColor } : {}}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{label}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/40" />
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-3 lg:p-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
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
                        <div className="space-y-6">

                          {/* Main Stats - Hero Style */}
                          <div className="grid grid-cols-4 gap-4">
                            {[
                              {
                                icon: BookOpen,
                                label: t('users.stats.cards.courses'),
                                value: stats.total_courses,
                                gradient: 'from-blue-500/20 to-blue-600/5',
                                iconBg: 'bg-blue-500/20',
                                iconColor: '#3B82F6'
                              },
                              {
                                icon: CheckCircle,
                                label: t('users.stats.cards.completed'),
                                value: stats.completed_courses,
                                gradient: 'from-emerald-500/20 to-emerald-600/5',
                                iconBg: 'bg-emerald-500/20',
                                iconColor: '#10B981'
                              },
                              {
                                icon: Clock,
                                label: t('users.stats.cards.hours'),
                                value: stats.total_time_spent_hours,
                                gradient: 'from-amber-500/20 to-amber-600/5',
                                iconBg: 'bg-amber-500/20',
                                iconColor: '#F59E0B'
                              },
                              {
                                icon: Award,
                                label: t('users.stats.cards.certificates'),
                                value: stats.certificates_count,
                                gradient: 'from-purple-500/20 to-purple-600/5',
                                iconBg: 'bg-purple-500/20',
                                iconColor: '#A855F7'
                              }
                            ].map(({ icon: Icon, label, value, gradient, iconBg, iconColor }, index) => (
                              <motion.div
                                key={label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 group cursor-default`}
                              >
                                {/* Glow effect */}
                                <div
                                  className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500"
                                  style={{ backgroundColor: iconColor }}
                                />

                                <div className={`${iconBg} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                                  <Icon className="w-5 h-5" style={{ color: iconColor }} />
                                </div>

                                <div className="text-3xl font-bold text-white mb-1">{value}</div>
                                <div className="text-xs text-white/50 uppercase tracking-wider">{label}</div>
                              </motion.div>
                            ))}
                          </div>

                          {/* Activity Grid - Modern Cards */}
                          {(stats.lia_conversations_total || stats.quiz_total || stats.lia_activities_completed) && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                            >
                              <h3 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
                                <Activity className="w-4 h-4" style={{ color: primaryColor }} />
                                {t('users.stats.platformActivity.title')}
                              </h3>
                              <div className="grid grid-cols-3 gap-3">
                                {stats.lia_conversations_total !== undefined && (
                                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500/10 to-transparent p-4 border border-cyan-500/20">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                        <MessageSquare className="w-6 h-6 text-cyan-400" />
                                      </div>
                                      <div>
                                        <div className="text-2xl font-bold text-white">{stats.lia_conversations_total}</div>
                                        <div className="text-xs text-white/50">{t('users.stats.platformActivity.liaQueries')}</div>
                                      </div>
                                    </div>
                                    {stats.lia_messages_total !== undefined && (
                                      <div className="mt-2 text-xs text-cyan-400/80">{stats.lia_messages_total} {t('users.stats.platformActivity.messages')}</div>
                                    )}
                                  </div>
                                )}

                                {stats.quiz_total !== undefined && stats.quiz_total > 0 && (
                                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-500/10 to-transparent p-4 border border-violet-500/20">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                                        <HelpCircle className="w-6 h-6 text-violet-400" />
                                      </div>
                                      <div>
                                        <div className="text-2xl font-bold text-white">
                                          {stats.quiz_passed || 0}<span className="text-white/40">/{stats.quiz_total}</span>
                                        </div>
                                        <div className="text-xs text-white/50">{t('users.stats.platformActivity.quizzesPassed')}</div>
                                      </div>
                                    </div>
                                    {stats.quiz_average_score !== undefined && (
                                      <div className="mt-2 text-xs text-violet-400/80">{stats.quiz_average_score}% {t('users.stats.platformActivity.average')}</div>
                                    )}
                                  </div>
                                )}

                                {stats.lia_activities_completed !== undefined && (
                                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-500/10 to-transparent p-4 border border-rose-500/20">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
                                        <Zap className="w-6 h-6 text-rose-400" />
                                      </div>
                                      <div>
                                        <div className="text-2xl font-bold text-white">{stats.lia_activities_completed}</div>
                                        <div className="text-xs text-white/50">{t('users.stats.platformActivity.liaActivities')}</div>
                                      </div>
                                    </div>
                                    {stats.lia_activities_total !== undefined && (
                                      <div className="mt-2 text-xs text-rose-400/80">de {stats.lia_activities_total} {t('users.stats.platformActivity.total')}</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}

                          {/* Progress Section - Clean Design */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="rounded-2xl bg-gradient-to-br from-white/5 to-transparent p-5 border border-white/10"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="text-sm font-medium text-white/70">Progreso General</h3>
                                <p className="text-xs text-white/40 mt-0.5">Avance en todos los cursos asignados</p>
                              </div>
                              <div
                                className="text-3xl font-bold"
                                style={{ color: primaryColor }}
                              >
                                {stats.average_progress}%
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative h-3 rounded-full overflow-hidden bg-white/5 mb-5">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${stats.average_progress}%` }}
                                transition={{ duration: 1.2, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
                                className="absolute inset-y-0 left-0 rounded-full"
                                style={{
                                  background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}CC)`,
                                  boxShadow: `0 0 20px ${primaryColor}60`
                                }}
                              />
                            </div>

                            {/* Distribution */}
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center">
                                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/20 mb-2">
                                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div className="text-2xl font-bold text-emerald-400">{stats.completed_courses}</div>
                                <div className="text-xs text-white/40">{t('users.stats.generalProgress.completed')}</div>
                              </div>
                              <div className="text-center">
                                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/20 mb-2">
                                  <PlayCircle className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="text-2xl font-bold text-blue-400">{stats.in_progress_courses}</div>
                                <div className="text-xs text-white/40">{t('users.stats.generalProgress.inProgress')}</div>
                              </div>
                              <div className="text-center">
                                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 mb-2">
                                  <XCircle className="w-5 h-5 text-white/40" />
                                </div>
                                <div className="text-2xl font-bold text-white/40">{stats.not_started_courses}</div>
                                <div className="text-xs text-white/40">{t('users.stats.generalProgress.notStarted')}</div>
                              </div>
                            </div>
                          </motion.div>

                        </div>
                      )}

                      {/* Courses Tab - Card Grid Design */}
                      {activeTab === 'courses' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-4"
                        >
                          {stats.courses_data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                <BookOpen className="w-8 h-8 text-white/30" />
                              </div>
                              <p className="text-white/50">{t('users.stats.coursesList.empty')}</p>
                            </div>
                          ) : (
                            stats.courses_data.map((course, index) => {
                              const timeData = stats.time_by_course.find(t => t.course_id === course.course_id)
                              const progressColor = course.status === 'completed' ? '#10B981' : course.progress > 0 ? '#3B82F6' : '#6B7280'

                              return (
                                <motion.div
                                  key={course.course_id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-white/20 transition-all duration-300"
                                >
                                  {/* Course Header */}
                                  <div className="p-5">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-base font-semibold text-white truncate mb-1">
                                          {course.course_title}
                                        </h4>
                                        <div className="flex items-center gap-3 text-xs text-white/50">
                                          {course.enrolled_at && (
                                            <span>{t('users.stats.coursesList.enrolled')}: {formatDate(course.enrolled_at)}</span>
                                          )}
                                          {course.has_certificate && (
                                            <span className="flex items-center gap-1 text-amber-400">
                                              <Award className="w-3 h-3" />
                                              {t('users.stats.coursesList.certificate')}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Status Badge */}
                                      <div
                                        className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
                                        style={{
                                          backgroundColor: `${progressColor}20`,
                                          color: progressColor
                                        }}
                                      >
                                        {course.status === 'completed' ? `✓ ${t('users.stats.coursesList.completed')}` :
                                          course.progress > 0 ? t('users.stats.coursesList.inProgress') : t('users.stats.coursesList.notStarted')}
                                      </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-white/50">{t('users.stats.coursesList.progress')}</span>
                                        <span className="text-sm font-bold" style={{ color: progressColor }}>{course.progress}%</span>
                                      </div>
                                      <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${course.progress}%` }}
                                          transition={{ duration: 0.8, delay: index * 0.1 }}
                                          className="absolute inset-y-0 left-0 rounded-full"
                                          style={{
                                            backgroundColor: progressColor,
                                            boxShadow: `0 0 10px ${progressColor}60`
                                          }}
                                        />
                                      </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-4 gap-3">
                                      {/* Time */}
                                      <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5">
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                          <Clock className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <div>
                                          <div className="text-sm font-semibold text-white">
                                            {course.time_spent_minutes ? `${Math.round((course.time_spent_minutes / 60) * 10) / 10}h` : timeData ? `${timeData.total_hours}h` : '0h'}
                                          </div>
                                          <div className="text-xs text-white/40">{t('users.stats.coursesList.time')}</div>
                                        </div>
                                      </div>

                                      {/* LIA */}
                                      <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5">
                                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                          <MessageSquare className="w-4 h-4 text-cyan-400" />
                                        </div>
                                        <div>
                                          <div className="text-sm font-semibold text-white">
                                            {course.lia_conversations_count || 0}
                                          </div>
                                          <div className="text-xs text-white/40">{t('users.stats.coursesList.lia')}</div>
                                        </div>
                                      </div>

                                      {/* Quiz */}
                                      <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5">
                                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                          <HelpCircle className="w-4 h-4 text-violet-400" />
                                        </div>
                                        <div>
                                          <div className="text-sm font-semibold text-white">
                                            {course.quiz_passed || 0}/{course.quiz_total || 0}
                                          </div>
                                          <div className="text-xs text-white/40">{t('users.stats.coursesList.quiz')}</div>
                                        </div>
                                      </div>

                                      {/* Notes */}
                                      <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                          <FileText className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <div>
                                          <div className="text-sm font-semibold text-white">
                                            {course.notes_count || 0}
                                          </div>
                                          <div className="text-xs text-white/40">{t('users.stats.coursesList.notes')}</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )
                            })
                          )}
                        </motion.div>
                      )}

                      {/* Progress Tab - Visual Timeline */}
                      {activeTab === 'progress' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-5"
                        >
                          {stats.courses_data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                <TrendingUp className="w-8 h-8 text-white/30" />
                              </div>
                              <p className="text-white/50">{t('users.stats.timeline.empty')}</p>
                            </div>
                          ) : (
                            stats.courses_data.map((course, index) => {
                              const progressColor = course.status === 'completed' ? '#10B981' : course.progress > 50 ? '#3B82F6' : course.progress > 0 ? '#F59E0B' : '#6B7280'

                              return (
                                <motion.div
                                  key={course.course_id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.15 }}
                                  className="relative"
                                >
                                  {/* Timeline line */}
                                  {index < stats.courses_data.length - 1 && (
                                    <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gradient-to-b from-white/20 to-transparent" />
                                  )}

                                  <div className="flex gap-4">
                                    {/* Progress Circle */}
                                    <div className="flex-shrink-0 relative">
                                      <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold"
                                        style={{
                                          backgroundColor: `${progressColor}20`,
                                          color: progressColor
                                        }}
                                      >
                                        {course.progress}%
                                      </div>
                                    </div>

                                    {/* Course Content */}
                                    <div className="flex-1 pb-6">
                                      <div className="rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-4">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                          <div>
                                            <h4 className="text-base font-semibold text-white mb-1">{course.course_title}</h4>
                                            <p className="text-xs text-white/40">
                                              {course.status === 'completed'
                                                ? `${t('users.stats.coursesList.completed')} ${formatDate(course.completed_at)}`
                                                : course.progress > 0
                                                  ? t('users.stats.coursesList.inProgress')
                                                  : t('users.stats.coursesList.notStarted')
                                              }
                                            </p>
                                          </div>
                                          {course.status === 'completed' && (
                                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                              <CheckCircle className="w-5 h-5 text-emerald-400" />
                                            </div>
                                          )}
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="relative h-3 rounded-full bg-white/10 overflow-hidden mb-4">
                                          <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${course.progress}%` }}
                                            transition={{ duration: 1, delay: index * 0.15 }}
                                            className="absolute inset-y-0 left-0 rounded-full"
                                            style={{
                                              background: `linear-gradient(90deg, ${progressColor}, ${progressColor}CC)`,
                                              boxShadow: `0 0 15px ${progressColor}50`
                                            }}
                                          />
                                        </div>

                                        {/* Stats Row */}
                                        <div className="flex flex-wrap gap-4">
                                          {course.modules_total !== undefined && course.modules_total > 0 && (
                                            <div className="flex items-center gap-2">
                                              <Layers className="w-4 h-4 text-blue-400" />
                                              <span className="text-sm text-white/70">
                                                <span className="font-semibold text-white">{course.modules_completed || 0}</span>
                                                /{course.modules_total} {t('users.stats.timeline.modules')}
                                              </span>
                                            </div>
                                          )}
                                          {course.lessons_total !== undefined && course.lessons_total > 0 && (
                                            <div className="flex items-center gap-2">
                                              <BookOpen className="w-4 h-4 text-violet-400" />
                                              <span className="text-sm text-white/70">
                                                <span className="font-semibold text-white">{course.lessons_completed || 0}</span>
                                                /{course.lessons_total} {t('users.stats.timeline.lessons')}
                                              </span>
                                            </div>
                                          )}
                                          {course.quiz_total !== undefined && course.quiz_total > 0 && (
                                            <div className="flex items-center gap-2">
                                              <HelpCircle className="w-4 h-4 text-amber-400" />
                                              <span className="text-sm text-white/70">
                                                <span className="font-semibold text-white">{course.quiz_passed || 0}</span>
                                                /{course.quiz_total} {t('users.stats.timeline.quizzes')}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )
                            })
                          )}
                        </motion.div>
                      )}

                      {/* Activity Tab - Dashboard Style */}
                      {activeTab === 'activity' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-5"
                        >
                          {/* Activity Summary Cards */}
                          <div className="grid grid-cols-3 gap-4">
                            {/* Notes Card */}
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 p-5 border border-emerald-500/20"
                            >
                              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-emerald-500/10 blur-2xl" />
                              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3">
                                <FileText className="w-6 h-6 text-emerald-400" />
                              </div>
                              <div className="text-3xl font-bold text-white mb-1">{stats.notes_count}</div>
                              <div className="text-sm text-emerald-400/80">{t('users.stats.activity.notesCreated')}</div>
                            </motion.div>

                            {/* Assignments Card */}
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 p-5 border border-blue-500/20"
                            >
                              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-blue-500/10 blur-2xl" />
                              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-3">
                                <Target className="w-6 h-6 text-blue-400" />
                              </div>
                              <div className="text-3xl font-bold text-white mb-1">{stats.completed_assignments}<span className="text-white/40">/{stats.total_assignments}</span></div>
                              <div className="text-sm text-blue-400/80">{t('users.stats.activity.assignments')}</div>
                            </motion.div>

                            {/* Certificates Card */}
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 p-5 border border-amber-500/20"
                            >
                              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-amber-500/10 blur-2xl" />
                              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-3">
                                <Award className="w-6 h-6 text-amber-400" />
                              </div>
                              <div className="text-3xl font-bold text-white mb-1">{stats.certificates_count}</div>
                              <div className="text-sm text-amber-400/80">{t('users.stats.activity.certificates')}</div>
                            </motion.div>
                          </div>

                          {/* Completion Timeline */}
                          {stats.completed_by_month.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                              className="rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-5"
                            >
                              <div className="flex items-center gap-2 mb-4">
                                <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
                                <h3 className="text-sm font-medium text-white">{t('users.stats.activity.completionHistory')}</h3>
                              </div>

                              <div className="space-y-3">
                                {stats.completed_by_month.map((item, index) => {
                                  const maxCount = Math.max(...stats.completed_by_month.map(m => m.count), 1)
                                  const percentage = (item.count / maxCount) * 100

                                  return (
                                    <motion.div
                                      key={item.month}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.4 + index * 0.1 }}
                                      className="flex items-center gap-4"
                                    >
                                      <div className="w-20 text-xs text-white/60 flex-shrink-0">
                                        {formatMonth(item.month)}
                                      </div>
                                      <div className="flex-1 relative h-8">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${percentage}%` }}
                                          transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                                          className="absolute inset-y-0 left-0 rounded-lg flex items-center justify-end px-3"
                                          style={{
                                            background: `linear-gradient(90deg, ${primaryColor}40, ${primaryColor}80)`,
                                            minWidth: '60px'
                                          }}
                                        >
                                          <span className="text-xs font-semibold text-white">
                                            {item.count} {t('users.stats.activity.courses')}
                                          </span>
                                        </motion.div>
                                      </div>
                                    </motion.div>
                                  )
                                })}
                              </div>
                            </motion.div>
                          )}

                          {/* Recent Activity Feed */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-5"
                          >
                            <div className="flex items-center gap-2 mb-4">
                              <Activity className="w-5 h-5" style={{ color: primaryColor }} />
                              <h3 className="text-sm font-medium text-white">Resumen de Actividad</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                                <Clock className="w-5 h-5 text-white/50" />
                                <div>
                                  <div className="text-lg font-semibold text-white">{stats.total_time_spent_hours}h</div>
                                  <div className="text-xs text-white/40">{t('users.stats.activity.studyTime')}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                                <BookOpen className="w-5 h-5 text-white/50" />
                                <div>
                                  <div className="text-lg font-semibold text-white">{stats.completed_lessons}/{stats.total_lessons}</div>
                                  <div className="text-xs text-white/40">{t('users.stats.activity.lessons')}</div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

