'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  Award,
  BarChart3,
  Target,
  Search,
  XCircle,
  Activity,
  UserCheck,
  PieChart as PieChartIcon,
  ArrowUp,
  ArrowDown,
  CalendarDays,
  PlayCircle
} from 'lucide-react'
import { useBusinessAnalytics } from '../hooks/useBusinessAnalytics'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { PremiumSelect } from './PremiumSelect'
import Image from 'next/image'
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
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts'

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export function BusinessAnalytics() {
  const { data, isLoading, error, refetch } = useBusinessAnalytics()
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel

  const cardBg = panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)'
  const cardBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const textColor = panelStyles?.text_color || '#f8fafc'
  const accentColor = panelStyles?.accent_color || '#00D4B3'
  const secondaryColor = panelStyles?.secondary_button_color || '#8b5cf6'
  const sectionBg = `${cardBg}CC`

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'trends' | 'roles'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'owner' | 'admin' | 'member'>('all')



  const filteredUsers = useMemo(() => {
    if (!data?.user_analytics) return []
    let filtered = data.user_analytics
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(user =>
        user.display_name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      )
    }
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole)
    }
    return filtered
  }, [data?.user_analytics, searchTerm, filterRole])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div 
            className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: `${accentColor}30`, borderTopColor: accentColor }}
          />
          <p className="opacity-70" style={{ color: textColor }}>Cargando analíticas...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-20">
        <XCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <p className="text-lg mb-4 text-red-400">{error}</p>
        <button
          onClick={refetch}
          className="px-6 py-2 rounded-xl transition-all"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="opacity-70" style={{ color: textColor }}>No hay datos disponibles</p>
      </div>
    )
  }

  const TABS = [
    { id: 'overview', label: 'Vista General', icon: BarChart3 },
    { id: 'users', label: 'Por Usuario', icon: Users },
    { id: 'trends', label: 'Tendencias', icon: TrendingUp },
    { id: 'roles', label: 'Por Rol', icon: PieChartIcon }
  ]

  return (
    <div className="w-full space-y-8" style={{ color: textColor }}>
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8"
        style={{ 
          background: `linear-gradient(135deg, ${accentColor}15 0%, ${secondaryColor}10 50%, transparent 100%)`,
          border: `1px solid ${cardBorder}`
        }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }}
        />
        <div className="absolute bottom-0 left-1/2 w-64 h-64 rounded-full opacity-5"
          style={{ background: `radial-gradient(circle, ${secondaryColor} 0%, transparent 70%)` }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${accentColor}20` }}>
              <BarChart3 className="w-6 h-6" style={{ color: accentColor }} />
            </div>
            <span className="text-sm font-medium uppercase tracking-wider opacity-70">Centro de Analytics</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Analytics y Rendimiento</h1>
          <p className="text-sm opacity-70 max-w-2xl">
            Analiza el comportamiento y progreso de tu equipo. Visualiza métricas clave, tendencias y obtén insights accionables.
          </p>
        </div>
      </motion.div>

      {/* KPI Cards Grid - Premium Design */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard 
          icon={Users} 
          label="Total Usuarios" 
          value={data.general_metrics.total_users} 
          color={accentColor}
          trend={12}
          cardBg={cardBg}
          cardBorder={cardBorder}
        />
        <KPICard 
          icon={BookOpen} 
          label="Cursos Asignados" 
          value={data.general_metrics.total_courses_assigned} 
          color="#8b5cf6"
          cardBg={cardBg}
          cardBorder={cardBorder}
        />
        <KPICard 
          icon={CheckCircle} 
          label="Completados" 
          value={data.general_metrics.completed_courses} 
          color="#10b981"
          trend={8}
          cardBg={cardBg}
          cardBorder={cardBorder}
        />
        <KPICard 
          icon={TrendingUp} 
          label="Progreso Promedio" 
          value={`${data.general_metrics.average_progress}%`} 
          color="#f59e0b"
          cardBg={cardBg}
          cardBorder={cardBorder}
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SmallMetricCard 
          icon={Clock} 
          label="Tiempo Total" 
          value={`${data.general_metrics.total_time_hours}h`}
          color={accentColor}
          cardBg={cardBg}
          cardBorder={cardBorder}
        />
        <SmallMetricCard 
          icon={Award} 
          label="Certificados" 
          value={data.general_metrics.total_certificates}
          color="#8b5cf6"
          cardBg={cardBg}
          cardBorder={cardBorder}
        />
        <SmallMetricCard 
          icon={UserCheck} 
          label="Usuarios Activos" 
          value={data.general_metrics.active_users}
          color="#10b981"
          cardBg={cardBg}
          cardBorder={cardBorder}
        />
        <SmallMetricCard 
          icon={Target} 
          label="Tasa Retención" 
          value={`${data.general_metrics.retention_rate}%`}
          color="#f59e0b"
          cardBg={cardBg}
          cardBorder={cardBorder}
        />
      </div>

      {/* Tab Navigation - Premium Style */}
      <div 
        className="rounded-3xl border backdrop-blur-sm overflow-hidden"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
        <div className="flex border-b p-2 gap-1" style={{ borderColor: cardBorder }}>
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap"
                style={{
                  backgroundColor: isActive ? `${accentColor}15` : 'transparent',
                  color: isActive ? accentColor : textColor,
                  opacity: isActive ? 1 : 0.7
                }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: accentColor }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && (
                <OverviewTab 
                  data={data} 
                  accentColor={accentColor}
                  secondaryColor={secondaryColor}
                  cardBg={cardBg}
                  cardBorder={cardBorder}
                  textColor={textColor}
                  sectionBg={sectionBg}
                />
              )}
              {activeTab === 'users' && (
                <UsersTab
                  users={filteredUsers}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  filterRole={filterRole}
                  setFilterRole={setFilterRole}
                  accentColor={accentColor}
                  secondaryColor={secondaryColor}
                  cardBg={cardBg}
                  cardBorder={cardBorder}
                  textColor={textColor}
                  sectionBg={sectionBg}
                />
              )}
              {activeTab === 'trends' && (
                <TrendsTab 
                  data={data}
                  accentColor={accentColor}
                  secondaryColor={secondaryColor}
                  cardBg={cardBg}
                  cardBorder={cardBorder}
                  textColor={textColor}
                  sectionBg={sectionBg}
                />
              )}
              {activeTab === 'roles' && (
                <RolesTab 
                  data={data}
                  accentColor={accentColor}
                  secondaryColor={secondaryColor}
                  cardBg={cardBg}
                  cardBorder={cardBorder}
                  textColor={textColor}
                  sectionBg={sectionBg}
                />
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ============================================
// KPI CARD - Premium Design
// ============================================
function KPICard({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  trend,
  cardBg,
  cardBorder
}: {
  icon: any
  label: string
  value: string | number
  color: string
  trend?: number
  cardBg: string
  cardBorder: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative p-5 rounded-2xl border overflow-hidden group"
      style={{ backgroundColor: cardBg, borderColor: cardBorder }}
    >
      {/* Glow Effect */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
        style={{ backgroundColor: color }}
      />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${color}20` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trend >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
              {trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p className="text-3xl font-bold mb-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        <p className="text-sm opacity-60">{label}</p>
      </div>
    </motion.div>
  )
}

// ============================================
// SMALL METRIC CARD
// ============================================
function SmallMetricCard({ 
  icon: Icon, 
  label, 
  value, 
  color,
  cardBg,
  cardBorder
}: {
  icon: any
  label: string
  value: string | number
  color: string
  cardBg: string
  cardBorder: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="flex items-center gap-4 p-4 rounded-2xl border"
      style={{ backgroundColor: cardBg, borderColor: cardBorder }}
    >
      <div className="p-2 rounded-xl" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        <p className="text-xs opacity-60">{label}</p>
      </div>
    </motion.div>
  )
}

// ============================================
// CHART CARD WRAPPER
// ============================================
function ChartCard({ 
  title, 
  subtitle,
  icon: Icon,
  children, 
  cardBg, 
  cardBorder,
  accentColor 
}: { 
  title: string
  subtitle?: string
  icon?: any
  children: React.ReactNode
  cardBg: string
  cardBorder: string
  accentColor: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border p-6"
      style={{ backgroundColor: cardBg, borderColor: cardBorder }}
    >
      <div className="flex items-center gap-3 mb-6">
        {Icon && (
          <div className="p-2 rounded-xl" style={{ backgroundColor: `${accentColor}15` }}>
            <Icon className="w-4 h-4" style={{ color: accentColor }} />
          </div>
        )}
        <div>
          <h3 className="font-semibold">{title}</h3>
          {subtitle && <p className="text-xs opacity-60">{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.div>
  )
}

// ============================================
// OVERVIEW TAB
// ============================================
function OverviewTab({ data, accentColor, secondaryColor, cardBg, cardBorder, textColor, sectionBg }: any) {
  // Obtener distribución de cursos - verificar si hay datos
  const rawDistribution = data.course_metrics?.distribution || []
  const courseDistribution = rawDistribution.length > 0 ? rawDistribution.map((item: any) => ({
    name: item.status === 'completed' ? 'Completados' : item.status === 'in_progress' ? 'En Progreso' : 'No Iniciados',
    value: item.count || 0,
    color: item.status === 'completed' ? '#10b981' : item.status === 'in_progress' ? accentColor : '#6b7280'
  })).filter((d: any) => d.value > 0) : []

  // Progreso por rol - usar directamente el rol que viene del API (type_rol: Director, Analista, etc.)
  const progressByRole = (data.by_role?.progress_comparison || []).map((item: any) => ({
    name: item.role || 'Sin especificar',
    progress: item.average_progress || 0
  })).filter((d: any) => d.progress > 0 || d.name !== 'Sin especificar')

  // Datos del planificador de estudios con valores por defecto
  const studyPlanner = data.study_planner || {
    users_with_plans: 0,
    total_plans: 0,
    total_sessions: 0,
    completed_sessions: 0,
    missed_sessions: 0,
    pending_sessions: 0,
    in_progress_sessions: 0,
    ai_generated_sessions: 0,
    sessions_by_status: [],
    usage_rate: 0,
    average_session_duration_minutes: 0,
    total_study_hours: 0,
    plan_adherence_rate: 0,
    on_time_completion_rate: 0,
    avg_sessions_per_user: 0,
    user_adherence: []
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Distribution */}
        <ChartCard title="Distribución de Cursos" subtitle="Estado actual de todos los cursos" icon={PieChartIcon} cardBg={sectionBg} cardBorder={cardBorder} accentColor={accentColor}>
          <div className="h-72">
            {courseDistribution.some((d: any) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={courseDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {courseDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '12px', color: textColor }}
                    labelStyle={{ color: textColor }}
                  />
                  <Legend 
                    wrapperStyle={{ color: textColor }}
                    formatter={(value) => <span style={{ color: textColor, opacity: 0.8 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No hay datos de cursos" />
            )}
          </div>
        </ChartCard>

        {/* Progress by Role */}
        <ChartCard title="Progreso por Rol" subtitle="Promedio de avance por tipo de usuario" icon={BarChart3} cardBg={sectionBg} cardBorder={cardBorder} accentColor={accentColor}>
          <div className="h-72">
            {progressByRole.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressByRole} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} opacity={0.3} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: cardBorder }} />
                  <YAxis dataKey="name" type="category" width={70} tick={{ fill: textColor, fontSize: 12 }} axisLine={{ stroke: cardBorder }} />
                  <Tooltip contentStyle={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '12px', color: textColor }} />
                  <Bar dataKey="progress" fill={accentColor} radius={[0, 8, 8, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No hay datos de progreso" />
            )}
          </div>
        </ChartCard>
      </div>

      {/* Activity Timeline */}
      <ChartCard title="Actividad Reciente" subtitle="Tendencia de las últimas semanas" icon={Activity} cardBg={sectionBg} cardBorder={cardBorder} accentColor={accentColor}>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trends?.activity_timeline || []}>
              <defs>
                <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accentColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={accentColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} opacity={0.3} />
              <XAxis dataKey="date" tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: cardBorder }} />
              <YAxis tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: cardBorder }} />
              <Tooltip contentStyle={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '12px', color: textColor }} />
              <Area type="monotone" dataKey="count" stroke={accentColor} strokeWidth={2} fill="url(#gradientArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Study Planner Metrics - Siempre visible */}
      {(
        <ChartCard title="Planificador de Estudios (LIA)" subtitle="Uso del planificador y adherencia al plan" icon={CalendarDays} cardBg={sectionBg} cardBorder={cardBorder} accentColor={accentColor}>
          {/* Primera fila: Métricas principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-xl" style={{ backgroundColor: `${accentColor}10` }}>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4" style={{ color: accentColor }} />
                <span className="text-xs opacity-70">Usuarios con Plan</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: accentColor }}>
                {studyPlanner.users_with_plans}
              </p>
              <p className="text-xs opacity-60 mt-1">
                {studyPlanner.usage_rate}% de adopción
              </p>
            </div>
            <div className="p-4 rounded-xl" style={{ backgroundColor: `${secondaryColor}10` }}>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4" style={{ color: secondaryColor }} />
                <span className="text-xs opacity-70">Adherencia al Plan</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: secondaryColor }}>
                {studyPlanner.plan_adherence_rate || 0}%
              </p>
              <p className="text-xs opacity-60 mt-1">
                {studyPlanner.on_time_completion_rate || 0}% a tiempo
              </p>
            </div>
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#f59e0b10' }}>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4" style={{ color: '#f59e0b' }} />
                <span className="text-xs opacity-70">Tiempo Promedio</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
                {studyPlanner.average_session_duration_minutes || 0}min
              </p>
              <p className="text-xs opacity-60 mt-1">
                {studyPlanner.total_study_hours || 0}h totales
              </p>
            </div>
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#10b98110' }}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />
                <span className="text-xs opacity-70">Sesiones Completadas</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: '#10b981' }}>
                {studyPlanner.completed_sessions}
              </p>
              <p className="text-xs opacity-60 mt-1">
                de {studyPlanner.total_sessions} totales
              </p>
            </div>
          </div>

          {/* Segunda fila: Estadísticas de sesiones */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: `${cardBg}60` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accentColor}20` }}>
                <CalendarDays className="w-4 h-4" style={{ color: accentColor }} />
              </div>
              <div>
                <p className="text-lg font-bold">{studyPlanner.total_plans}</p>
                <p className="text-xs opacity-60">Planes</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: `${cardBg}60` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#10b98120' }}>
                <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />
              </div>
              <div>
                <p className="text-lg font-bold">{studyPlanner.completed_sessions}</p>
                <p className="text-xs opacity-60">Completadas</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: `${cardBg}60` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f59e0b20' }}>
                <PlayCircle className="w-4 h-4" style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <p className="text-lg font-bold">{studyPlanner.in_progress_sessions || 0}</p>
                <p className="text-xs opacity-60">En Progreso</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: `${cardBg}60` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#ef444420' }}>
                <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
              </div>
              <div>
                <p className="text-lg font-bold">{studyPlanner.missed_sessions || 0}</p>
                <p className="text-xs opacity-60">Perdidas</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: `${cardBg}60` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${secondaryColor}20` }}>
                <Activity className="w-4 h-4" style={{ color: secondaryColor }} />
              </div>
              <div>
                <p className="text-lg font-bold">{studyPlanner.ai_generated_sessions || 0}</p>
                <p className="text-xs opacity-60">Por LIA</p>
              </div>
            </div>
          </div>
          
          {/* Gráficos lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribución de Sesiones - Donut Chart */}
            <div>
              <p className="text-sm font-medium mb-4 opacity-70">Estado de Sesiones</p>
              <div className="h-52">
                {studyPlanner.total_sessions > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Completadas', value: studyPlanner.completed_sessions, color: '#10b981' },
                          { name: 'En Progreso', value: studyPlanner.in_progress_sessions || 0, color: '#f59e0b' },
                          { name: 'Pendientes', value: studyPlanner.pending_sessions || 0, color: accentColor },
                          { name: 'Perdidas', value: studyPlanner.missed_sessions || 0, color: '#ef4444' }
                        ].filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {[
                          { name: 'Completadas', value: studyPlanner.completed_sessions, color: '#10b981' },
                          { name: 'En Progreso', value: studyPlanner.in_progress_sessions || 0, color: '#f59e0b' },
                          { name: 'Pendientes', value: studyPlanner.pending_sessions || 0, color: accentColor },
                          { name: 'Perdidas', value: studyPlanner.missed_sessions || 0, color: '#ef4444' }
                        ].filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '12px', color: textColor }}
                      />
                      <Legend 
                        formatter={(value) => <span style={{ color: textColor, opacity: 0.8, fontSize: '11px' }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="Sin sesiones planificadas" />
                )}
              </div>
            </div>

            {/* Adherencia al Plan - Bar Chart */}
            <div>
              <p className="text-sm font-medium mb-4 opacity-70">Métricas de Cumplimiento</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={[
                      { name: 'Adherencia', value: studyPlanner.plan_adherence_rate || 0, fill: accentColor },
                      { name: 'A Tiempo', value: studyPlanner.on_time_completion_rate || 0, fill: '#10b981' },
                      { name: 'Adopción', value: studyPlanner.usage_rate || 0, fill: secondaryColor }
                    ]}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} opacity={0.3} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: cardBorder }} />
                    <YAxis dataKey="name" type="category" width={70} tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: cardBorder }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '12px', color: textColor }}
                      formatter={(value: any) => [`${value}%`, '']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                      {[
                        { name: 'Adherencia', value: studyPlanner.plan_adherence_rate || 0, fill: accentColor },
                        { name: 'A Tiempo', value: studyPlanner.on_time_completion_rate || 0, fill: '#10b981' },
                        { name: 'Adopción', value: studyPlanner.usage_rate || 0, fill: secondaryColor }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="mt-6 pt-4 border-t" style={{ borderColor: cardBorder }}>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" style={{ color: secondaryColor }} />
                <span className="opacity-70">Promedio:</span>
                <span className="font-medium">{studyPlanner.avg_sessions_per_user || 0} sesiones/usuario</span>
              </div>
              {studyPlanner.ai_generated_sessions > 0 && (
                <div className="flex items-center gap-2">
                  <span className="opacity-70">•</span>
                  <span className="font-medium" style={{ color: secondaryColor }}>
                    {studyPlanner.ai_generated_sessions} sesiones creadas con LIA
                  </span>
                </div>
              )}
            </div>
          </div>
        </ChartCard>
      )}
    </div>
  )
}

// ============================================
// USERS TAB
// ============================================
function UsersTab({ users, searchTerm, setSearchTerm, filterRole, setFilterRole, accentColor, secondaryColor, cardBg, cardBorder, textColor, sectionBg }: any) {
  const topPerformers = [...users]
    .sort((a: any, b: any) => b.courses_completed - a.courses_completed)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-50" style={{ color: textColor }} />
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
            style={{ borderColor: cardBorder, backgroundColor: sectionBg, color: textColor }}
          />
        </div>
        <PremiumSelect
          value={filterRole}
          onValueChange={(value) => setFilterRole(value as any)}
          placeholder="Todos los roles"
          options={[
            { value: 'all', label: 'Todos los roles' },
            { value: 'owner', label: 'Owner' },
            { value: 'admin', label: 'Admin' },
            { value: 'member', label: 'Member' }
          ]}
        />
      </div>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <ChartCard title="Top Performers" subtitle="Usuarios con más cursos completados" icon={Award} cardBg={sectionBg} cardBorder={cardBorder} accentColor={accentColor}>
          <div className="space-y-3">
            {topPerformers.map((user: any, index: number) => (
              <motion.div
                key={user.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-3 rounded-xl"
                style={{ backgroundColor: `${cardBg}80` }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)` }}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{user.display_name}</p>
                  <p className="text-xs opacity-60">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold" style={{ color: accentColor }}>{user.courses_completed}</p>
                  <p className="text-xs opacity-60">completados</p>
                </div>
              </motion.div>
            ))}
          </div>
        </ChartCard>
      )}

      {/* Users Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: sectionBg, borderColor: cardBorder }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${cardBorder}` }}>
                {['Usuario', 'Rol', 'Asignados', 'Completados', 'Progreso', 'Certificados'].map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider opacity-70">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 10).map((user: any, index: number) => (
                <motion.tr
                  key={user.user_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:opacity-80 transition-opacity"
                  style={{ borderBottom: `1px solid ${cardBorder}` }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                        style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)` }}>
                        {(user.display_name[0] || 'U').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user.display_name}</p>
                        <p className="text-xs opacity-60">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-lg text-xs capitalize" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{user.courses_assigned}</td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: '#10b981' }}>{user.courses_completed}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-white/10 max-w-[100px]">
                        <div className="h-full rounded-full" style={{ width: `${user.average_progress}%`, backgroundColor: accentColor }} />
                      </div>
                      <span className="text-xs font-medium">{user.average_progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{user.certificates_earned}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ============================================
// TRENDS TAB
// ============================================
function TrendsTab({ data, accentColor, secondaryColor, cardBg, cardBorder, textColor, sectionBg }: any) {
  const enrollmentTrend = data.trends?.enrollment_trend || []
  const completionTrend = data.trends?.completion_trend || []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Trend */}
        <ChartCard title="Tendencia de Inscripciones" subtitle="Nuevas inscripciones por período" icon={TrendingUp} cardBg={sectionBg} cardBorder={cardBorder} accentColor={accentColor}>
          <div className="h-64">
            {enrollmentTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={enrollmentTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} opacity={0.3} />
                  <XAxis dataKey="period" tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: cardBorder }} />
                  <YAxis tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: cardBorder }} />
                  <Tooltip contentStyle={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '12px', color: textColor }} />
                  <Line type="monotone" dataKey="count" stroke={accentColor} strokeWidth={3} dot={{ fill: accentColor, strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No hay datos de inscripciones" />
            )}
          </div>
        </ChartCard>

        {/* Completion Trend */}
        <ChartCard title="Tendencia de Completados" subtitle="Cursos finalizados por período" icon={CheckCircle} cardBg={sectionBg} cardBorder={cardBorder} accentColor={accentColor}>
          <div className="h-64">
            {completionTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={completionTrend}>
                  <defs>
                    <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} opacity={0.3} />
                  <XAxis dataKey="period" tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: cardBorder }} />
                  <YAxis tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: cardBorder }} />
                  <Tooltip contentStyle={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '12px', color: textColor }} />
                  <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fill="url(#completionGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No hay datos de completados" />
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  )
}

// ============================================
// ROLES TAB
// ============================================
function RolesTab({ data, accentColor, secondaryColor, cardBg, cardBorder, textColor, sectionBg }: any) {
  // Usar los colores basados en índice ya que los roles ahora son dinámicos (Director, Analista, etc.)
  const ROLE_COLORS = [accentColor, secondaryColor, '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']
  
  const roleDistribution = (data.by_role?.distribution || []).map((item: any, index: number) => ({
    name: item.role || 'Sin especificar',
    value: item.count || 0,
    color: ROLE_COLORS[index % ROLE_COLORS.length]
  })).filter((d: any) => d.value > 0)

  const roleComparison = (data.by_role?.progress_comparison || []).map((item: any) => ({
    role: item.role || 'Sin especificar',
    progress: item.average_progress || 0,
    time: (data.by_role?.time_spent || []).find((t: any) => t.role === item.role)?.average_hours || 0
  })).filter((d: any) => d.progress > 0 || d.time > 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <ChartCard title="Distribución por Rol" subtitle="Cantidad de usuarios por tipo" icon={Users} cardBg={sectionBg} cardBorder={cardBorder} accentColor={accentColor}>
          <div className="h-72">
            {roleDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {roleDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '12px', color: textColor }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No hay datos de distribución" />
            )}
          </div>
        </ChartCard>

        {/* Progress Comparison */}
        <ChartCard title="Comparativa de Rendimiento" subtitle="Progreso y tiempo por rol" icon={BarChart3} cardBg={sectionBg} cardBorder={cardBorder} accentColor={accentColor}>
          <div className="h-72">
            {roleComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} opacity={0.3} />
                  <XAxis dataKey="role" tick={{ fill: textColor, fontSize: 12 }} axisLine={{ stroke: cardBorder }} />
                  <YAxis tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: cardBorder }} />
                  <Tooltip contentStyle={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '12px', color: textColor }} />
                  <Legend wrapperStyle={{ color: textColor }} />
                  <Bar dataKey="progress" name="Progreso %" fill={accentColor} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="time" name="Tiempo (h)" fill={secondaryColor} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No hay datos comparativos" />
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  )
}



// ============================================
// EMPTY STATE
// ============================================
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full opacity-50">
      <BarChart3 className="w-12 h-12 mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
