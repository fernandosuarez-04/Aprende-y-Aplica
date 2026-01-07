'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, TrendingUp, Users, MessageSquare, Target, Award, Clock, BookOpen, Bot, FileText, CheckCircle2, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'
import { TeamsService, WorkTeamStatistics, UserDetailedAudit } from '../services/teams.service'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

interface TeamAnalyticsTabProps {
  teamId: string
}

export function TeamAnalyticsTab({ teamId }: TeamAnalyticsTabProps) {
  const { styles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const panelStyles = styles?.panel

  const cardBg = isDark ? (panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)') : '#FFFFFF'
  const cardBorder = isDark ? (panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)') : 'rgba(226, 232, 240, 0.8)'
  const textColor = isDark ? (panelStyles?.text_color || '#f8fafc') : '#0F172A'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'
  const sectionBg = isDark ? `${cardBg}CC` : '#F8FAFC'

  // Colores vibrantes para gráficas - mejor contraste en dark mode
  const chartColors = {
    cyan: '#22D3EE',      // Cyan vibrante
    emerald: '#10B981',   // Verde esmeralda
    violet: '#A78BFA',    // Violeta claro
    amber: '#FBBF24',     // Amarillo ámbar
    rose: '#FB7185',      // Rosa
    orange: '#FB923C',    // Naranja
    teal: '#2DD4BF',      // Teal
    primary: '#0EA5E9'    // Azul cielo
  }

  const [statistics, setStatistics] = useState<WorkTeamStatistics[]>([])
  const [detailedAudit, setDetailedAudit] = useState<UserDetailedAudit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAudit, setIsLoadingAudit] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({})
  const [weeklyMessages, setWeeklyMessages] = useState<any[]>([])
  const [weeklyFeedback, setWeeklyFeedback] = useState<any[]>([])

  useEffect(() => {
    fetchStatistics()
    fetchDetailedAudit()
    fetchWeeklyActivity()
  }, [teamId])

  const fetchWeeklyActivity = async () => {
    try {
      // Obtener mensajes de la última semana
      const messages = await TeamsService.getTeamMessages(teamId, undefined, 1000, 0)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const recentMessages = messages.filter(msg =>
        new Date(msg.created_at) >= sevenDaysAgo
      )
      setWeeklyMessages(recentMessages)

      // Obtener feedback de la última semana
      const feedback = await TeamsService.getTeamFeedback(teamId)
      const recentFeedback = feedback.filter(fb =>
        new Date(fb.created_at) >= sevenDaysAgo
      )
      setWeeklyFeedback(recentFeedback)
    } catch (err) {
      console.error('Error al cargar actividad semanal:', err)
    }
  }

  const fetchStatistics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const stats = await TeamsService.getTeamStatistics(teamId)
      setStatistics(stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDetailedAudit = async () => {
    try {
      setIsLoadingAudit(true)
      const audit = await TeamsService.getTeamDetailedAnalytics(teamId)
      setDetailedAudit(audit)
    } catch (err) {
      console.error('Error al cargar auditoría detallada:', err)
    } finally {
      setIsLoadingAudit(false)
    }
  }

  const toggleUser = (userId: string) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }))
  }

  const toggleSection = (userId: string, section: string) => {
    const key = `${userId}-${section}`
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} min`
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}min`
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Ahora'
    if (minutes < 60) return `Hace ${minutes} min`
    if (minutes < 1440) return `Hace ${Math.floor(minutes / 60)} h`
    if (minutes < 10080) return `Hace ${Math.floor(minutes / 1440)} días`
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  const filteredUsers = detailedAudit.filter(user =>
    user.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.user_email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Preparar datos para gráficos
  const currentStats = statistics[0] || {
    total_members: 0,
    active_members: 0,
    average_completion_percentage: 0,
    average_score: 0,
    total_interactions: 0,
    total_messages: 0,
    total_feedback_given: 0
  }

  // Calcular datos de actividad semanal desde los datos reales
  const calculateWeeklyActivity = () => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekData: Record<string, { mensajes: number; feedback: number }> = {}

    // Inicializar todos los días con 0
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dayKey = days[date.getDay()]
      weekData[dayKey] = { mensajes: 0, feedback: 0 }
    }

    // Contar mensajes de la última semana
    weeklyMessages.forEach(message => {
      const messageDate = new Date(message.created_at)
      messageDate.setHours(0, 0, 0, 0)
      const daysDiff = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff >= 0 && daysDiff < 7) {
        const dayKey = days[messageDate.getDay()]
        if (weekData[dayKey]) {
          weekData[dayKey].mensajes++
        }
      }
    })

    // Contar feedback de la última semana
    weeklyFeedback.forEach(feedback => {
      const feedbackDate = new Date(feedback.created_at)
      feedbackDate.setHours(0, 0, 0, 0)
      const daysDiff = Math.floor((today.getTime() - feedbackDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff >= 0 && daysDiff < 7) {
        const dayKey = days[feedbackDate.getDay()]
        if (weekData[dayKey]) {
          weekData[dayKey].feedback++
        }
      }
    })

    // Convertir a array para el gráfico, ordenando por día de la semana (Lun-Dom)
    const dayOrder = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    return dayOrder.map(day => ({
      fecha: day,
      mensajes: weekData[day]?.mensajes || 0,
      feedback: weekData[day]?.feedback || 0
    }))
  }

  const activityData = calculateWeeklyActivity()

  // Datos para gráfico de progreso temporal (usar datos históricos si están disponibles)
  const progressData = statistics.length > 1
    ? statistics.slice(-5).map((stat, index) => ({
      fecha: `Sem ${index + 1}`,
      progreso: stat.average_completion_percentage
    }))
    : [
      { fecha: 'Sem 1', progreso: currentStats.average_completion_percentage || 0 },
      { fecha: 'Sem 2', progreso: currentStats.average_completion_percentage || 0 },
      { fecha: 'Sem 3', progreso: currentStats.average_completion_percentage || 0 },
      { fecha: 'Sem 4', progreso: currentStats.average_completion_percentage || 0 },
      { fecha: 'Sem 5', progreso: currentStats.average_completion_percentage || 0 }
    ]

  // Datos para gráfico circular de completitud
  const completionPercentage = currentStats.average_completion_percentage || 0
  const completionData = [
    { name: 'Completado', value: completionPercentage, color: chartColors.emerald },
    { name: 'Pendiente', value: Math.max(0, 100 - completionPercentage), color: 'rgba(148, 163, 184, 0.3)' }
  ].filter(item => item.value > 0) // Solo mostrar segmentos con valor > 0

  const COLORS = completionData.map(item => item.color)

  const chartTooltipStyle = {
    backgroundColor: cardBg,
    border: `1px solid ${cardBorder}`,
    borderRadius: '8px',
    color: textColor
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" style={{ color: textColor }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: primaryColor }}></div>
          <p className="text-sm font-body">Cargando analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl border backdrop-blur-sm"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body opacity-70 mb-1">Progreso Promedio</p>
              <p className="text-2xl font-bold font-heading">
                {currentStats.average_completion_percentage.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8" style={{ color: '#00D4B3' }} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl border backdrop-blur-sm"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body opacity-70 mb-1">Calificación Promedio</p>
              <p className="text-2xl font-bold font-heading">
                {currentStats.average_score.toFixed(1)}/10
              </p>
            </div>
            <Award className="w-8 h-8" style={{ color: '#00D4B3' }} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-2xl border backdrop-blur-sm"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body opacity-70 mb-1">Mensajes</p>
              <p className="text-2xl font-bold font-heading">{currentStats.total_messages}</p>
            </div>
            <MessageSquare className="w-8 h-8" style={{ color: '#00D4B3' }} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-2xl border backdrop-blur-sm"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body opacity-70 mb-1">Feedback</p>
              <p className="text-2xl font-bold font-heading">{currentStats.total_feedback_given}</p>
            </div>
            <Target className="w-8 h-8" style={{ color: '#00D4B3' }} />
          </div>
        </motion.div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progreso Temporal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl border backdrop-blur-sm"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: textColor }}>
            Progreso Temporal
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} />
              <XAxis
                dataKey="fecha"
                stroke={textColor}
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke={textColor}
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
              />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Line
                type="monotone"
                dataKey="progreso"
                stroke={chartColors.cyan}
                strokeWidth={3}
                dot={{ fill: chartColors.cyan, r: 5 }}
                name="Progreso %"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Completitud */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl border backdrop-blur-sm relative"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: textColor }}>
            Completitud del Equipo
          </h3>
          <div className="relative">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={completionData.length > 0 ? completionData : [{ name: 'Sin datos', value: 100, color: cardBorder }]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={90}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {(completionData.length > 0 ? completionData : [{ color: cardBorder }]).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || COLORS[index % COLORS.length]}
                      stroke={cardBg}
                      strokeWidth={3}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Valor']}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Centro del donut con porcentaje */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '50%', transform: 'translateY(-50%)' }}>
              <div className="text-center">
                <p className="text-4xl font-bold font-heading mb-1" style={{ color: chartColors.emerald }}>
                  {completionPercentage.toFixed(0)}%
                </p>
                <p className="text-xs font-body opacity-70" style={{ color: textColor }}>
                  Completado
                </p>
              </div>
            </div>
          </div>
          {/* Leyenda personalizada */}
          <div className="flex flex-wrap justify-center gap-6 mt-6">
            {completionData.length > 0 ? (
              <>
                {completionPercentage > 0 && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded shadow-sm"
                      style={{ backgroundColor: chartColors.emerald }}
                    />
                    <span className="text-sm font-body font-medium" style={{ color: textColor }}>
                      Completado: {completionPercentage.toFixed(1)}%
                    </span>
                  </div>
                )}
                {completionPercentage < 100 && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded shadow-sm"
                      style={{ backgroundColor: cardBorder }}
                    />
                    <span className="text-sm font-body opacity-70" style={{ color: textColor }}>
                      Pendiente: {(100 - completionPercentage).toFixed(1)}%
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded shadow-sm"
                  style={{ backgroundColor: cardBorder }}
                />
                <span className="text-sm font-body opacity-70" style={{ color: textColor }}>
                  Sin datos disponibles
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Actividad del Equipo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl border backdrop-blur-sm lg:col-span-2"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: textColor }}>
            Actividad Semanal
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} />
              <XAxis
                dataKey="fecha"
                stroke={textColor}
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke={textColor}
                style={{ fontSize: '12px' }}
              />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend />
              <Area
                type="monotone"
                dataKey="mensajes"
                stackId="1"
                stroke={chartColors.cyan}
                fill={chartColors.cyan}
                fillOpacity={0.6}
                name="Mensajes"
              />
              <Area
                type="monotone"
                dataKey="feedback"
                stackId="1"
                stroke={chartColors.teal}
                fill={chartColors.teal}
                fillOpacity={0.6}
                name="Feedback"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Comparación de Miembros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl border backdrop-blur-sm lg:col-span-2"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: textColor }}>
            Comparación de Miembros
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={detailedAudit.slice(0, 10).map((user, index) => {
              // Calcular progreso promedio desde las lecciones
              const totalLessons = user.lesson_time.reduce((sum, course) => sum + course.lessons.length, 0)
              const completedLessons = user.lesson_time.reduce((sum, course) =>
                sum + course.lessons.filter(l => l.completion_status === 'completed').length, 0
              )
              const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

              // Calcular calificación promedio desde los quiz
              const averageScore = user.quiz_summary.total_attempts > 0
                ? user.quiz_summary.average_score
                : 0

              return {
                nombre: user.user_name.length > 15
                  ? `${user.user_name.substring(0, 15)}...`
                  : user.user_name,
                progreso: Math.round(progressPercentage),
                calificacion: Math.round(averageScore * 10) / 10
              }
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} />
              <XAxis
                dataKey="nombre"
                stroke={textColor}
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke={textColor}
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
              />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend />
              <Bar
                dataKey="progreso"
                fill={chartColors.violet}
                name="Progreso %"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="calificacion"
                fill={chartColors.emerald}
                name="Calificación (x10)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Auditoría por Usuario */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-heading font-semibold" style={{ color: textColor }}>
            Auditoría por Usuario
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-50" style={{ color: textColor }} />
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl border font-body focus:outline-none focus:ring-1 transition-all"
                style={{
                  borderColor: cardBorder,
                  backgroundColor: cardBg,
                  color: textColor
                }}
              />
            </div>
          </div>
        </div>

        {isLoadingAudit ? (
          <div className="flex items-center justify-center py-12" style={{ color: textColor }}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: primaryColor }}></div>
              <p className="text-sm font-body">Cargando auditoría...</p>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border backdrop-blur-sm" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <Users className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: textColor }} />
            <p className="font-body opacity-70" style={{ color: textColor }}>
              {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios en el equipo'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user.user_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border backdrop-blur-sm overflow-hidden"
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              >
                {/* Header del Usuario - Clickable para expandir/colapsar */}
                <div
                  className="p-4 border-b cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ borderColor: cardBorder }}
                  onClick={() => toggleUser(user.user_id)}
                >
                  <div className="flex items-center gap-3">
                    {user.profile_picture_url ? (
                      <img
                        src={user.profile_picture_url}
                        alt={user.user_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}30` }}
                      >
                        <Users className="w-6 h-6" style={{ color: primaryColor }} />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-base font-heading font-semibold" style={{ color: textColor }}>
                        {user.user_name}
                      </h3>
                      <p className="text-xs font-body opacity-70" style={{ color: textColor }}>
                        {user.user_email}
                      </p>
                    </div>
                    {expandedUsers[user.user_id] ? (
                      <ChevronUp className="w-5 h-5 opacity-50" style={{ color: textColor }} />
                    ) : (
                      <ChevronDown className="w-5 h-5 opacity-50" style={{ color: textColor }} />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedUsers[user.user_id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-2">
                        {/* Tiempo por Lección */}
                        <div className="rounded-xl border p-3" style={{ backgroundColor: `${cardBg}CC`, borderColor: cardBorder }}>
                          <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleSection(user.user_id, 'lessons')}
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" style={{ color: chartColors.emerald }} />
                              <h4 className="text-sm font-heading font-semibold" style={{ color: textColor }}>
                                Tiempo por Lección ({user.lesson_time.reduce((sum, course) => sum + course.lessons.length, 0)})
                              </h4>
                            </div>
                            {expandedSections[`${user.user_id}-lessons`] ? (
                              <ChevronUp className="w-4 h-4 opacity-50" style={{ color: textColor }} />
                            ) : (
                              <ChevronDown className="w-4 h-4 opacity-50" style={{ color: textColor }} />
                            )}
                          </div>
                          <AnimatePresence>
                            {expandedSections[`${user.user_id}-lessons`] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 space-y-4 overflow-hidden"
                              >
                                {user.lesson_time.length === 0 ? (
                                  <p className="text-sm font-body opacity-50" style={{ color: textColor }}>
                                    No hay lecciones registradas
                                  </p>
                                ) : (
                                  user.lesson_time.map((courseGroup) => (
                                    <div key={courseGroup.course_id} className="space-y-2">
                                      <div className="flex items-center gap-2 mb-2">
                                        <BookOpen className="w-4 h-4" style={{ color: chartColors.cyan }} />
                                        <h5 className="text-sm font-heading font-semibold" style={{ color: textColor }}>
                                          {courseGroup.course_title}
                                        </h5>
                                        <span className="text-xs font-body opacity-50" style={{ color: textColor }}>
                                          ({courseGroup.lessons.length} lecciones)
                                        </span>
                                      </div>
                                      <div className="pl-6 space-y-2">
                                        {courseGroup.lessons.map((lesson) => (
                                          <div
                                            key={lesson.lesson_id}
                                            className="flex items-center justify-between p-3 rounded-lg"
                                            style={{ backgroundColor: cardBg }}
                                          >
                                            <div
                                              className="flex-1"
                                            >
                                              <p className="text-sm font-body font-medium" style={{ color: textColor }}>
                                                {lesson.lesson_title}
                                              </p>
                                              <p className="text-xs font-body opacity-70" style={{ color: textColor }}>
                                                {lesson.completion_status === 'completed' ? 'Completada' :
                                                  lesson.completion_status === 'in_progress' ? 'En progreso' : 'No iniciada'}
                                              </p>
                                            </div>
                                            <p className="text-sm font-body font-semibold" style={{ color: isDark ? '#FFFFFF' : primaryColor }}>
                                              {formatTime(lesson.time_spent_minutes)}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Interacciones con LIA - Solo estadísticas (LFPDPPP compliance) */}
                        <div className="rounded-xl border p-3" style={{ backgroundColor: `${cardBg}CC`, borderColor: cardBorder }}>
                          <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleSection(user.user_id, 'lia')}
                          >
                            <div className="flex items-center gap-2">
                              <Bot className="w-4 h-4" style={{ color: chartColors.violet }} />
                              <h4 className="text-sm font-heading font-semibold" style={{ color: textColor }}>
                                Interacciones con LIA
                              </h4>
                              <span className="text-xs font-body opacity-70" style={{ color: textColor }}>
                                {user.lia_interactions.total_conversations} conversaciones | {user.lia_interactions.total_messages} mensajes
                              </span>
                            </div>
                            {expandedSections[`${user.user_id}-lia`] ? (
                              <ChevronUp className="w-4 h-4 opacity-50" style={{ color: textColor }} />
                            ) : (
                              <ChevronDown className="w-4 h-4 opacity-50" style={{ color: textColor }} />
                            )}
                          </div>
                          <AnimatePresence>
                            {expandedSections[`${user.user_id}-lia`] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 overflow-hidden"
                              >
                                {user.lia_interactions.total_conversations === 0 ? (
                                  <p className="text-sm font-body opacity-50" style={{ color: textColor }}>
                                    No hay conversaciones registradas
                                  </p>
                                ) : (
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {/* Estadística: Total Conversaciones */}
                                    <div
                                      className="p-3 rounded-lg text-center"
                                      style={{ backgroundColor: cardBg }}
                                    >
                                      <p className="text-2xl font-bold" style={{ color: chartColors.violet }}>
                                        {user.lia_interactions.total_conversations}
                                      </p>
                                      <p className="text-xs font-body opacity-70" style={{ color: textColor }}>
                                        Conversaciones
                                      </p>
                                    </div>
                                    {/* Estadística: Total Mensajes */}
                                    <div
                                      className="p-3 rounded-lg text-center"
                                      style={{ backgroundColor: cardBg }}
                                    >
                                      <p className="text-2xl font-bold" style={{ color: chartColors.cyan }}>
                                        {user.lia_interactions.total_messages}
                                      </p>
                                      <p className="text-xs font-body opacity-70" style={{ color: textColor }}>
                                        Mensajes totales
                                      </p>
                                    </div>
                                    {/* Estadística: Duración Total */}
                                    <div
                                      className="p-3 rounded-lg text-center"
                                      style={{ backgroundColor: cardBg }}
                                    >
                                      <p className="text-2xl font-bold" style={{ color: chartColors.emerald }}>
                                        {formatDuration(user.lia_interactions.total_duration_seconds)}
                                      </p>
                                      <p className="text-xs font-body opacity-70" style={{ color: textColor }}>
                                        Tiempo total
                                      </p>
                                    </div>
                                    {/* Estadística: Promedio por conversación */}
                                    <div
                                      className="p-3 rounded-lg text-center"
                                      style={{ backgroundColor: cardBg }}
                                    >
                                      <p className="text-2xl font-bold" style={{ color: chartColors.amber }}>
                                        {user.lia_interactions.total_conversations > 0
                                          ? Math.round(user.lia_interactions.total_messages / user.lia_interactions.total_conversations)
                                          : 0}
                                      </p>
                                      <p className="text-xs font-body opacity-70" style={{ color: textColor }}>
                                        Msgs/conversación
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Actividad en Chat - Solo estadísticas (LFPDPPP compliance) */}
                        <div className="rounded-xl border p-3" style={{ backgroundColor: `${cardBg}CC`, borderColor: cardBorder }}>
                          <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleSection(user.user_id, 'chat')}
                          >
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" style={{ color: chartColors.cyan }} />
                              <h4 className="text-sm font-heading font-semibold" style={{ color: textColor }}>
                                Actividad en Chat
                              </h4>
                              <span className="text-xs font-body opacity-70" style={{ color: textColor }}>
                                {user.chat_activity.total_messages} mensajes
                              </span>
                            </div>
                            {expandedSections[`${user.user_id}-chat`] ? (
                              <ChevronUp className="w-4 h-4 opacity-50" style={{ color: textColor }} />
                            ) : (
                              <ChevronDown className="w-4 h-4 opacity-50" style={{ color: textColor }} />
                            )}
                          </div>
                          <AnimatePresence>
                            {expandedSections[`${user.user_id}-chat`] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 overflow-hidden"
                              >
                                {user.chat_activity.total_messages === 0 ? (
                                  <p className="text-sm font-body opacity-50" style={{ color: textColor }}>
                                    No hay participación en el chat del equipo
                                  </p>
                                ) : (
                                  <div className="grid grid-cols-2 gap-3">
                                    {/* Estadística: Total Mensajes */}
                                    <div
                                      className="p-3 rounded-lg text-center"
                                      style={{ backgroundColor: cardBg }}
                                    >
                                      <p className="text-2xl font-bold" style={{ color: chartColors.cyan }}>
                                        {user.chat_activity.total_messages}
                                      </p>
                                      <p className="text-xs font-body opacity-70" style={{ color: textColor }}>
                                        Mensajes enviados
                                      </p>
                                    </div>
                                    {/* Estadística: Participación activa */}
                                    <div
                                      className="p-3 rounded-lg text-center"
                                      style={{ backgroundColor: cardBg }}
                                    >
                                      <p className="text-2xl font-bold" style={{ color: chartColors.emerald }}>
                                        {user.chat_activity.total_messages > 10 ? 'Alta' :
                                          user.chat_activity.total_messages > 3 ? 'Media' : 'Baja'}
                                      </p>
                                      <p className="text-xs font-body opacity-70" style={{ color: textColor }}>
                                        Nivel de participación
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Notas Creadas - Solo estadísticas (LFPDPPP compliance) */}
                        <div className="rounded-xl border p-3" style={{ backgroundColor: `${cardBg}CC`, borderColor: cardBorder }}>
                          <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleSection(user.user_id, 'notes')}
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" style={{ color: chartColors.amber }} />
                              <h4 className="text-sm font-heading font-semibold" style={{ color: textColor }}>
                                Notas Creadas
                              </h4>
                              <span className="text-xs font-body opacity-70" style={{ color: textColor }}>
                                {user.notes.length} notas
                              </span>
                            </div>
                            {expandedSections[`${user.user_id}-notes`] ? (
                              <ChevronUp className="w-4 h-4 opacity-50" style={{ color: textColor }} />
                            ) : (
                              <ChevronDown className="w-4 h-4 opacity-50" style={{ color: textColor }} />
                            )}
                          </div>
                          <AnimatePresence>
                            {expandedSections[`${user.user_id}-notes`] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 overflow-hidden"
                              >
                                {user.notes.length === 0 ? (
                                  <p className="text-sm font-body opacity-50" style={{ color: textColor }}>
                                    No hay notas creadas
                                  </p>
                                ) : (
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {/* Estadística: Total Notas */}
                                    <div
                                      className="p-3 rounded-lg text-center"
                                      style={{ backgroundColor: cardBg }}
                                    >
                                      <p className="text-2xl font-bold" style={{ color: chartColors.amber }}>
                                        {user.notes.length}
                                      </p>
                                      <p className="text-xs font-body opacity-70" style={{ color: textColor }}>
                                        Notas creadas
                                      </p>
                                    </div>
                                    {/* Estadística: Cursos con notas */}
                                    <div
                                      className="p-3 rounded-lg text-center"
                                      style={{ backgroundColor: cardBg }}
                                    >
                                      <p className="text-2xl font-bold" style={{ color: chartColors.teal }}>
                                        {new Set(user.notes.map(n => n.lesson_title)).size}
                                      </p>
                                      <p className="text-xs font-body opacity-70" style={{ color: textColor }}>
                                        Lecciones con notas
                                      </p>
                                    </div>
                                    {/* Estadística: Actividad */}
                                    <div
                                      className="p-3 rounded-lg text-center"
                                      style={{ backgroundColor: cardBg }}
                                    >
                                      <p className="text-2xl font-bold" style={{ color: chartColors.emerald }}>
                                        {user.notes.length > 5 ? 'Alta' :
                                          user.notes.length > 2 ? 'Media' : 'Baja'}
                                      </p>
                                      <p className="text-xs font-body opacity-70" style={{ color: textColor }}>
                                        Toma de notas
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Intentos de Quiz */}
                        <div className="rounded-xl border p-3" style={{ backgroundColor: `${cardBg}CC`, borderColor: cardBorder }}>
                          <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleSection(user.user_id, 'quiz')}
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" style={{ color: chartColors.rose }} />
                              <h4 className="text-sm font-heading font-semibold" style={{ color: textColor }}>
                                Intentos de Quiz ({user.quiz_summary.total_attempts})
                              </h4>
                            </div>
                            {expandedSections[`${user.user_id}-quiz`] ? (
                              <ChevronUp className="w-4 h-4 opacity-50" style={{ color: textColor }} />
                            ) : (
                              <ChevronDown className="w-4 h-4 opacity-50" style={{ color: textColor }} />
                            )}
                          </div>
                          {expandedSections[`${user.user_id}-quiz`] && (
                            <div className="mt-2 flex items-center gap-4 text-xs font-body">
                              <span style={{ color: textColor }}>
                                Mejor: <span className="font-semibold" style={{ color: chartColors.rose }}>{user.quiz_summary.best_score.toFixed(1)}%</span>
                              </span>
                              <span style={{ color: textColor }}>
                                Promedio: <span className="font-semibold" style={{ color: chartColors.amber }}>{user.quiz_summary.average_score.toFixed(1)}%</span>
                              </span>
                              <span style={{ color: textColor }}>
                                Aprobados: <span className="font-semibold" style={{ color: chartColors.emerald }}>{user.quiz_summary.passed_count}</span>
                              </span>
                            </div>
                          )}
                          <AnimatePresence>
                            {expandedSections[`${user.user_id}-quiz`] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 overflow-hidden"
                              >
                                {user.quiz_attempts.length === 0 ? (
                                  <p className="text-sm font-body opacity-50" style={{ color: textColor }}>
                                    No hay intentos de quiz registrados
                                  </p>
                                ) : (
                                  <div className="space-y-3">
                                    {user.quiz_attempts.map((attempt) => (
                                      <div
                                        key={attempt.submission_id}
                                        className="p-3 rounded-lg"
                                        style={{ backgroundColor: cardBg }}
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <p className="text-sm font-body font-medium" style={{ color: textColor }}>
                                                {attempt.lesson_title}
                                              </p>
                                              {attempt.total_attempts_for_lesson > 1 && (
                                                <span
                                                  className="text-xs font-body px-2 py-0.5 rounded-full"
                                                  style={{
                                                    backgroundColor: `${primaryColor}20`,
                                                    color: primaryColor
                                                  }}
                                                >
                                                  Intento {attempt.attempt_number} de {attempt.total_attempts_for_lesson}
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-xs font-body opacity-70" style={{ color: textColor }}>
                                              {formatRelativeTime(attempt.completed_at)}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-sm font-body font-semibold" style={{
                                              color: attempt.is_passed ? '#10b981' : '#ef4444'
                                            }}>
                                              {attempt.percentage_score.toFixed(1)}%
                                            </p>
                                            <p className="text-xs font-body opacity-70" style={{ color: textColor }}>
                                              {attempt.is_passed ? 'Aprobado' : 'No aprobado'}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

