'use client'

import { useState, useMemo, useEffect } from 'react'
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
  Brain,
  AlertTriangle,
  BookMarked
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

export function BusinessAnalytics() {
  const { data, isLoading, error, refetch } = useBusinessAnalytics()
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel

  const cardBg = panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)'
  const cardBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const textColor = panelStyles?.text_color || '#f8fafc'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'
  const secondaryColor = panelStyles?.secondary_button_color || '#8b5cf6'
  const sectionBg = `${cardBg}CC`

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'trends' | 'roles' | 'skills'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'owner' | 'admin' | 'member'>('all')

  // Pre-cargar skills data en paralelo para mejorar rendimiento
  const [skillsData, setSkillsData] = useState<any>(null)
  const [skillsLoading, setSkillsLoading] = useState(true)
  const [skillsError, setSkillsError] = useState<string | null>(null)

  useEffect(() => {
    // Pre-cargar skills data en paralelo con analytics principal
    const fetchSkillsData = async () => {
      try {
        setSkillsLoading(true)
        setSkillsError(null)

        const response = await fetch('/api/business/analytics/skills', {
          credentials: 'include'
        })
        const data = await response.json()

        if (data.success) {
          setSkillsData(data)
        } else {
          setSkillsError(data.error || 'Error al obtener datos de skills')
        }
      } catch (err) {
        setSkillsError(err instanceof Error ? err.message : 'Error al cargar skills')
      } finally {
        setSkillsLoading(false)
      }
    }

    fetchSkillsData()
  }, [])

  const filteredUsers = useMemo(() => {
    if (!data?.user_analytics) return []
    
    let filtered = data.user_analytics

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(user =>
        user.display_name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term)
      )
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole)
    }

    return filtered
  }, [data?.user_analytics, searchTerm, filterRole])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div 
          className="w-16 h-16 border-4 rounded-full animate-spin"
          style={{ 
            borderColor: `${primaryColor}30`,
            borderTopColor: primaryColor
          }}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <XCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#ef4444' }} />
        <p className="text-lg mb-4 font-body" style={{ color: '#ef4444' }}>{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 rounded-xl transition-all font-body"
          style={{
            backgroundColor: `${primaryColor}20`,
            color: primaryColor
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${primaryColor}30`)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = `${primaryColor}20`)}
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="font-body opacity-70" style={{ color: textColor }}>No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Cards de Métricas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Users}
          label="Total Usuarios"
          value={data.general_metrics.total_users.toString()}
          trend=""
          cardBg={cardBg}
          cardBorder={cardBorder}
          textColor={textColor}
          primaryColor={primaryColor}
        />
        <MetricCard
          icon={BookOpen}
          label="Cursos Asignados"
          value={data.general_metrics.total_courses_assigned.toString()}
          trend=""
          cardBg={cardBg}
          cardBorder={cardBorder}
          textColor={textColor}
          primaryColor={primaryColor}
        />
        <MetricCard
          icon={CheckCircle}
          label="Completados"
          value={data.general_metrics.completed_courses.toString()}
          trend=""
          cardBg={cardBg}
          cardBorder={cardBorder}
          textColor={textColor}
          primaryColor={primaryColor}
        />
        <MetricCard
          icon={TrendingUp}
          label="Progreso Promedio"
          value={`${data.general_metrics.average_progress}%`}
          trend=""
          cardBg={cardBg}
          cardBorder={cardBorder}
          textColor={textColor}
          primaryColor={primaryColor}
        />
        <MetricCard
          icon={Clock}
          label="Tiempo Total"
          value={`${data.general_metrics.total_time_hours}h`}
          trend=""
          cardBg={cardBg}
          cardBorder={cardBorder}
          textColor={textColor}
          primaryColor={primaryColor}
        />
        <MetricCard
          icon={Award}
          label="Certificados"
          value={data.general_metrics.total_certificates.toString()}
          trend=""
          cardBg={cardBg}
          cardBorder={cardBorder}
          textColor={textColor}
          primaryColor={primaryColor}
        />
        <MetricCard
          icon={UserCheck}
          label="Usuarios Activos"
          value={data.general_metrics.active_users.toString()}
          trend=""
          cardBg={cardBg}
          cardBorder={cardBorder}
          textColor={textColor}
          primaryColor={primaryColor}
        />
        <MetricCard
          icon={Target}
          label="Tasa Retención"
          value={`${data.general_metrics.retention_rate}%`}
          trend=""
          cardBg={cardBg}
          cardBorder={cardBorder}
          textColor={textColor}
          primaryColor={primaryColor}
        />
      </div>

      {/* Tabs */}
      <div 
        className="rounded-3xl border backdrop-blur-sm p-6"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
        <div className="flex border-b mb-6 overflow-x-auto" style={{ borderColor: cardBorder }}>
          {[
            { id: 'overview', label: 'Vista General', icon: BarChart3 },
            { id: 'users', label: 'Por Usuario', icon: Users },
            { id: 'trends', label: 'Tendencias', icon: TrendingUp },
            { id: 'roles', label: 'Por Rol', icon: PieChartIcon },
            { id: 'skills', label: 'Skills Insights', icon: Brain }
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 font-body font-medium transition-all whitespace-nowrap relative ${
                  isActive ? '' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  color: isActive ? primaryColor : textColor,
                  borderBottom: isActive ? `2px solid ${primaryColor}` : '2px solid transparent'
                }}
              >
                <Icon className="w-4 h-4 inline-block mr-2" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
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
                cardBg={cardBg}
                cardBorder={cardBorder}
                textColor={textColor}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
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
                cardBg={cardBg}
                cardBorder={cardBorder}
                textColor={textColor}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                sectionBg={sectionBg}
                panelStyles={panelStyles}
              />
            )}
            {activeTab === 'trends' && (
              <TrendsTab 
                data={data}
                cardBg={cardBg}
                cardBorder={cardBorder}
                textColor={textColor}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                sectionBg={sectionBg}
              />
            )}
            {activeTab === 'roles' && (
              <RolesTab 
                data={data}
                cardBg={cardBg}
                cardBorder={cardBorder}
                textColor={textColor}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                sectionBg={sectionBg}
              />
            )}
            {activeTab === 'skills' && (
              <SkillsTab
                cardBg={cardBg}
                cardBorder={cardBorder}
                textColor={textColor}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                sectionBg={sectionBg}
                panelStyles={panelStyles}
                skillsData={skillsData}
                skillsLoading={skillsLoading}
                skillsError={skillsError}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// Componente de Card de Métrica
function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
  cardBg,
  cardBorder,
  textColor,
  primaryColor
}: {
  icon: any
  label: string
  value: string
  trend: string
  cardBg: string
  cardBorder: string
  textColor: string
  primaryColor: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border backdrop-blur-sm p-5"
      style={{ backgroundColor: cardBg, borderColor: cardBorder }}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-5 h-5" style={{ color: primaryColor }} />
      </div>
      <p className="text-sm font-body opacity-70 mb-2" style={{ color: textColor }}>{label}</p>
      <p className="text-2xl font-heading font-bold" style={{ color: textColor }}>{value}</p>
      {trend && (
        <p className="text-xs font-body opacity-60 mt-1" style={{ color: textColor }}>{trend}</p>
      )}
    </motion.div>
  )
}

// Tab: Vista General
function OverviewTab({ 
  data, 
  cardBg, 
  cardBorder, 
  textColor, 
  primaryColor, 
  secondaryColor, 
  sectionBg 
}: {
  data: any
  cardBg: string
  cardBorder: string
  textColor: string
  primaryColor: string
  secondaryColor: string
  sectionBg: string
}) {
  // Preparar datos para gráficas
  const courseDistribution = data.course_metrics.distribution.map((item: any) => ({
    name: item.status === 'completed' ? 'Completados' : item.status === 'in_progress' ? 'En Progreso' : 'No Iniciados',
    value: item.count
  }))

  const progressByRole = data.by_role.progress_comparison.map((item: any) => ({
    name: item.role === 'owner' ? 'Owner' : item.role === 'admin' ? 'Admin' : 'Member',
    progress: item.average_progress
  }))

  // Datos para Radar Chart (métricas por rol)
  const radarData = data.by_role.distribution.map((item: any) => {
    const role = item.role === 'owner' ? 'Owner' : item.role === 'admin' ? 'Admin' : 'Member'
    const progressItem = data.by_role.progress_comparison.find((p: any) => p.role === item.role)
    const completionsItem = data.by_role.completions.find((c: any) => c.role === item.role)
    const timeItem = data.by_role.time_spent.find((t: any) => t.role === item.role)
    
    return {
      role,
      progreso: progressItem?.average_progress || 0,
      completados: completionsItem?.total_completed || 0,
      tiempo: timeItem?.average_hours || 0,
      usuarios: item.count || 0
    }
  })

  const COLORS = [primaryColor, secondaryColor, '#10b981', '#f59e0b']

  return (
    <div className="space-y-6">
      {/* Gráfica de Distribución de Cursos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border backdrop-blur-sm p-6"
        style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
      >
        <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: textColor }}>
          Distribución de Cursos
        </h3>
        <div className="h-64">
          {courseDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={courseDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {courseDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '12px',
                    color: textColor
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full font-body opacity-50" style={{ color: textColor }}>
              No hay datos disponibles
            </div>
          )}
        </div>
      </motion.div>

      {/* Gráfica de Progreso por Rol */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border backdrop-blur-sm p-6"
        style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
      >
        <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: textColor }}>
          Progreso Promedio por Rol
        </h3>
        <div className="h-64">
          {progressByRole.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressByRole}>
                <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  style={{ fill: textColor, fontSize: '12px' }}
                  tick={{ fill: `${textColor}CC` }}
                />
                <YAxis 
                  style={{ fill: textColor, fontSize: '12px' }}
                  tick={{ fill: `${textColor}CC` }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '12px',
                    color: textColor
                  }}
                />
                <Bar dataKey="progress" fill={primaryColor} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full font-body opacity-50" style={{ color: textColor }}>
              No hay datos disponibles
            </div>
          )}
        </div>
      </motion.div>

      {/* Gráfica Radar (métricas por rol) */}
      {radarData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border backdrop-blur-sm p-6"
          style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
        >
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: textColor }}>
            Métricas Comparativas por Rol
          </h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke={cardBorder} opacity={0.3} />
                <PolarAngleAxis 
                  dataKey="role" 
                  style={{ fill: textColor, fontSize: '12px' }}
                  tick={{ fill: `${textColor}CC` }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 'auto']}
                  style={{ fill: textColor, fontSize: '12px' }}
                  tick={{ fill: `${textColor}CC` }}
                />
                <Radar
                  name="Progreso"
                  dataKey="progreso"
                  stroke={primaryColor}
                  fill={primaryColor}
                  fillOpacity={0.2}
                />
                <Radar
                  name="Completados"
                  dataKey="completados"
                  stroke={secondaryColor}
                  fill={secondaryColor}
                  fillOpacity={0.2}
                />
                <Radar
                  name="Tiempo"
                  dataKey="tiempo"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '12px',
                    color: textColor
                  }}
                />
                <Legend
                  wrapperStyle={{ color: textColor, fontSize: '12px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Tab: Por Usuario
function UsersTab({
  users,
  searchTerm,
  setSearchTerm,
  filterRole,
  setFilterRole,
  cardBg,
  cardBorder,
  textColor,
  primaryColor,
  secondaryColor,
  sectionBg,
  panelStyles
}: {
  users: any[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  filterRole: 'all' | 'owner' | 'admin' | 'member'
  setFilterRole: (role: 'all' | 'owner' | 'admin' | 'member') => void
  cardBg: string
  cardBorder: string
  textColor: string
  primaryColor: string
  secondaryColor: string
  sectionBg: string
  panelStyles: any
}) {
  const topPerformers = [...users]
    .sort((a, b) => b.courses_completed - a.courses_completed)
    .slice(0, 10)
    .map((user, index) => ({
      name: user.display_name.length > 15 ? user.display_name.substring(0, 15) + '...' : user.display_name,
      completed: user.courses_completed,
      rank: index + 1
    }))

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-50" style={{ color: textColor }} />
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border font-body text-sm focus:outline-none focus:ring-1 transition-all"
            style={{
              borderColor: cardBorder,
              backgroundColor: sectionBg,
              color: textColor
            }}
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

      {/* Gráfica de Top Performers */}
      {topPerformers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border backdrop-blur-sm p-6"
          style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
        >
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: textColor }}>
            Top 10 Performers
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPerformers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} opacity={0.3} />
                <XAxis type="number" style={{ fill: textColor, fontSize: '12px' }} tick={{ fill: `${textColor}CC` }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={120}
                  style={{ fill: textColor, fontSize: '12px' }}
                  tick={{ fill: `${textColor}CC` }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '12px',
                    color: textColor
                  }}
                />
                <Bar dataKey="completed" fill={primaryColor} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Tabla de Usuarios */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border overflow-hidden backdrop-blur-sm"
        style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${cardBorder}` }}>
                <th className="px-4 py-3 text-left text-xs font-heading font-semibold uppercase tracking-wider" style={{ color: `${textColor}CC` }}>
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-xs font-heading font-semibold uppercase tracking-wider" style={{ color: `${textColor}CC` }}>
                  Rol
                </th>
                <th className="px-4 py-3 text-left text-xs font-heading font-semibold uppercase tracking-wider" style={{ color: `${textColor}CC` }}>
                  Asignados
                </th>
                <th className="px-4 py-3 text-left text-xs font-heading font-semibold uppercase tracking-wider" style={{ color: `${textColor}CC` }}>
                  Completados
                </th>
                <th className="px-4 py-3 text-left text-xs font-heading font-semibold uppercase tracking-wider" style={{ color: `${textColor}CC` }}>
                  Progreso
                </th>
                <th className="px-4 py-3 text-left text-xs font-heading font-semibold uppercase tracking-wider" style={{ color: `${textColor}CC` }}>
                  Tiempo
                </th>
                <th className="px-4 py-3 text-left text-xs font-heading font-semibold uppercase tracking-wider" style={{ color: `${textColor}CC` }}>
                  Certificados
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <motion.tr
                  key={user.user_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:opacity-80 transition-opacity"
                  style={{ borderBottom: `1px solid ${cardBorder}`, backgroundColor: index % 2 === 0 ? 'transparent' : `${sectionBg}40` }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.profile_picture_url ? (
                        <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={user.profile_picture_url}
                            alt={user.display_name}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        </div>
                      ) : (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm"
                          style={{
                            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                          }}
                        >
                          {(user.display_name[0] || user.username[0]).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-body font-medium text-sm" style={{ color: textColor }}>{user.display_name}</p>
                        <p className="font-body text-xs opacity-70" style={{ color: textColor }}>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span 
                      className="px-2 py-0.5 rounded-md text-xs font-body capitalize"
                      style={{ 
                        backgroundColor: `${primaryColor}15`,
                        color: primaryColor
                      }}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body text-sm" style={{ color: textColor }}>{user.courses_assigned}</td>
                  <td className="px-4 py-3 font-body text-sm" style={{ color: textColor }}>{user.courses_completed}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-body text-sm font-semibold" style={{ color: primaryColor }}>
                        {user.average_progress}%
                      </span>
                      <div 
                        className="h-1.5 rounded-full flex-1 max-w-[60px]"
                        style={{ backgroundColor: `${cardBorder}50` }}
                      >
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${Math.min(user.average_progress, 100)}%`,
                            backgroundColor: primaryColor
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-body text-sm" style={{ color: textColor }}>{user.total_time_hours}h</td>
                  <td className="px-4 py-3 font-body text-sm" style={{ color: textColor }}>{user.certificates_count}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

// Tab: Tendencias
function TrendsTab({ 
  data, 
  cardBg, 
  cardBorder, 
  textColor, 
  primaryColor, 
  secondaryColor, 
  sectionBg 
}: {
  data: any
  cardBg: string
  cardBorder: string
  textColor: string
  primaryColor: string
  secondaryColor: string
  sectionBg: string
}) {
  const enrollmentData = data.trends.enrollments_by_month.map((item: any) => ({
    name: item.label,
    inscripciones: item.count
  }))

  const completionData = data.trends.completions_by_month.map((item: any) => ({
    name: item.label,
    completaciones: item.count
  }))

  const timeData = data.trends.time_by_month.map((item: any) => ({
    name: item.label,
    tiempo: item.count
  }))

  const activeUsersData = data.trends.active_users_by_month.map((item: any) => ({
    name: item.label,
    usuarios: item.count
  }))

  // Combinar datos para gráfico de líneas
  const combinedData = enrollmentData.map((item, index) => ({
    name: item.name,
    inscripciones: item.inscripciones,
    completaciones: completionData[index]?.completaciones || 0
  }))

  return (
    <div className="space-y-6">
      {/* Gráfica de Inscripciones y Completaciones */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border backdrop-blur-sm p-6"
        style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
      >
        <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: textColor }}>
          Tendencias de Inscripciones y Completaciones
        </h3>
        <div className="h-80">
          {combinedData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  style={{ fill: textColor, fontSize: '12px' }}
                  tick={{ fill: `${textColor}CC` }}
                />
                <YAxis 
                  style={{ fill: textColor, fontSize: '12px' }}
                  tick={{ fill: `${textColor}CC` }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '12px',
                    color: textColor
                  }}
                />
                <Legend
                  wrapperStyle={{ color: textColor, fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="inscripciones" 
                  stroke={primaryColor} 
                  strokeWidth={2}
                  dot={{ fill: primaryColor, r: 4 }}
                  name="Inscripciones"
                />
                <Line 
                  type="monotone" 
                  dataKey="completaciones" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  name="Completaciones"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full font-body opacity-50" style={{ color: textColor }}>
              No hay datos disponibles
            </div>
          )}
        </div>
      </motion.div>

      {/* Gráfica de Tiempo Dedicado */}
      {timeData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border backdrop-blur-sm p-6"
          style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
        >
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: textColor }}>
            Tiempo Dedicado por Mes
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeData}>
                <defs>
                  <linearGradient id="colorTiempo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  style={{ fill: textColor, fontSize: '12px' }}
                  tick={{ fill: `${textColor}CC` }}
                />
                <YAxis 
                  style={{ fill: textColor, fontSize: '12px' }}
                  tick={{ fill: `${textColor}CC` }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '12px',
                    color: textColor
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="tiempo" 
                  stroke="#f59e0b" 
                  fillOpacity={1} 
                  fill="url(#colorTiempo)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Gráfica de Usuarios Activos */}
      {activeUsersData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border backdrop-blur-sm p-6"
          style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
        >
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: textColor }}>
            Usuarios Activos por Mes
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeUsersData}>
                <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  style={{ fill: textColor, fontSize: '12px' }}
                  tick={{ fill: `${textColor}CC` }}
                />
                <YAxis 
                  style={{ fill: textColor, fontSize: '12px' }}
                  tick={{ fill: `${textColor}CC` }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '12px',
                    color: textColor
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="usuarios" 
                  stroke={secondaryColor} 
                  strokeWidth={2}
                  dot={{ fill: secondaryColor, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Tab: Por Rol
function RolesTab({ 
  data, 
  cardBg, 
  cardBorder, 
  textColor, 
  primaryColor, 
  secondaryColor, 
  sectionBg 
}: {
  data: any
  cardBg: string
  cardBorder: string
  textColor: string
  primaryColor: string
  secondaryColor: string
  sectionBg: string
}) {
  const roleDistribution = data.by_role.distribution.map((item: any) => ({
    name: item.role === 'owner' ? 'Owner' : item.role === 'admin' ? 'Admin' : 'Member',
    value: item.count
  }))

  const roleProgress = data.by_role.progress_comparison.map((item: any) => ({
    name: item.role === 'owner' ? 'Owner' : item.role === 'admin' ? 'Admin' : 'Member',
    progress: item.average_progress
  }))

  const roleCompletions = data.by_role.completions.map((item: any) => ({
    name: item.role === 'owner' ? 'Owner' : item.role === 'admin' ? 'Admin' : 'Member',
    completados: item.total_completed
  }))

  const roleTime = data.by_role.time_spent.map((item: any) => ({
    name: item.role === 'owner' ? 'Owner' : item.role === 'admin' ? 'Admin' : 'Member',
    tiempo: item.average_hours
  }))

  // Datos combinados para comparativa de roles
  const roleComparison = roleProgress.map((progress: any) => {
    const completions = roleCompletions.find((c: any) => c.name === progress.name)
    const time = roleTime.find((t: any) => t.name === progress.name)
    return {
      name: progress.name,
      progreso: progress.progress,
      completados: completions?.completados || 0,
      tiempo: time?.tiempo || 0
    }
  })

  const COLORS = [primaryColor, '#10b981', '#f59e0b']

  return (
    <div className="space-y-6">
      {/* Distribución por Rol */}
      {roleDistribution.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border backdrop-blur-sm p-6"
          style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
        >
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: textColor }}>
            Distribución por Rol
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '12px',
                    color: textColor
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Comparativa Multi-Métrica por Rol */}
      {roleComparison.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border backdrop-blur-sm p-6"
          style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
        >
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: textColor }}>
            Comparativa Multi-Métrica por Rol
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  style={{ fill: textColor, fontSize: '12px' }}
                  tick={{ fill: `${textColor}CC` }}
                />
                <YAxis 
                  style={{ fill: textColor, fontSize: '12px' }}
                  tick={{ fill: `${textColor}CC` }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '12px',
                    color: textColor
                  }}
                />
                <Legend
                  wrapperStyle={{ color: textColor, fontSize: '12px' }}
                />
                <Bar dataKey="progreso" fill={primaryColor} radius={[8, 8, 0, 0]} name="Progreso (%)" />
                <Bar dataKey="completados" fill="#10b981" radius={[8, 8, 0, 0]} name="Completados" />
                <Bar dataKey="tiempo" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Tiempo (h)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Progreso Comparativo por Rol */}
      {roleProgress.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border backdrop-blur-sm p-6"
          style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
        >
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: textColor }}>
            Progreso Comparativo por Rol
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  style={{ fill: textColor, fontSize: '12px' }}
                  tick={{ fill: `${textColor}CC` }}
                />
                <YAxis 
                  style={{ fill: textColor, fontSize: '12px' }}
                  tick={{ fill: `${textColor}CC` }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '12px',
                    color: textColor
                  }}
                />
                <Bar dataKey="progress" fill={secondaryColor} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Tab: Skills Insights (dividido en dos secciones)
function SkillsTab({
  cardBg,
  cardBorder,
  textColor,
  primaryColor,
  secondaryColor,
  sectionBg,
  panelStyles,
  skillsData: preloadedSkillsData,
  skillsLoading: preloadedSkillsLoading,
  skillsError: preloadedSkillsError
}: {
  cardBg: string
  cardBorder: string
  textColor: string
  primaryColor: string
  secondaryColor: string
  sectionBg: string
  panelStyles: any
  skillsData: any
  skillsLoading: boolean
  skillsError: string | null
}) {
  // Usar datos pre-cargados del componente padre
  const [skillsData, setSkillsData] = useState<any>(preloadedSkillsData)
  const [isLoading, setIsLoading] = useState(preloadedSkillsLoading)
  const [error, setError] = useState<string | null>(preloadedSkillsError)
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'courses'>('users')

  // Sincronizar con datos pre-cargados cuando cambien
  useEffect(() => {
    setSkillsData(preloadedSkillsData)
    setIsLoading(preloadedSkillsLoading)
    setError(preloadedSkillsError)
  }, [preloadedSkillsData, preloadedSkillsLoading, preloadedSkillsError])

  const fetchSkillsData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/business/analytics/skills', {
        credentials: 'include'
      })
      const data = await response.json()

      if (data.success) {
        setSkillsData(data)
      } else {
        setError(data.error || 'Error al obtener datos de skills')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar skills')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div 
          className="w-16 h-16 border-4 rounded-full animate-spin"
          style={{ 
            borderColor: `${primaryColor}30`,
            borderTopColor: primaryColor
          }}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4" style={{ color: '#ef4444' }} />
        <p className="text-lg mb-4 font-body" style={{ color: '#ef4444' }}>{error}</p>
        <button
          onClick={fetchSkillsData}
          className="px-4 py-2 rounded-xl transition-all font-body"
          style={{
            backgroundColor: `${primaryColor}20`,
            color: primaryColor
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${primaryColor}30`)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = `${primaryColor}20`)}
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!skillsData) {
    return (
      <div className="text-center py-20">
        <p className="font-body opacity-70" style={{ color: textColor }}>No hay datos disponibles</p>
      </div>
    )
  }

  const { stats, gaps, recommendations } = skillsData

  return (
    <div className="space-y-6">
      {/* Sub-tabs para Skills por Usuario y Skills por Curso */}
      <div className="flex gap-2 border-b" style={{ borderColor: cardBorder }}>
        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2 font-body font-medium transition-all relative ${
            activeSubTab === 'users' ? '' : 'opacity-70 hover:opacity-100'
          }`}
          style={{
            color: activeSubTab === 'users' ? primaryColor : textColor,
            borderBottom: activeSubTab === 'users' ? `2px solid ${primaryColor}` : '2px solid transparent'
          }}
        >
          Skills por Usuario
        </button>
        <button
          onClick={() => setActiveSubTab('courses')}
          className={`px-4 py-2 font-body font-medium transition-all relative ${
            activeSubTab === 'courses' ? '' : 'opacity-70 hover:opacity-100'
          }`}
          style={{
            color: activeSubTab === 'courses' ? primaryColor : textColor,
            borderBottom: activeSubTab === 'courses' ? `2px solid ${primaryColor}` : '2px solid transparent'
          }}
        >
          Skills por Curso
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'users' ? (
          <SkillsByUserTab
            stats={stats}
            gaps={gaps}
            recommendations={recommendations}
            cardBg={cardBg}
            cardBorder={cardBorder}
            textColor={textColor}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            sectionBg={sectionBg}
          />
        ) : (
          <SkillsByCourseTab
            cardBg={cardBg}
            cardBorder={cardBorder}
            textColor={textColor}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            sectionBg={sectionBg}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Sub-tab: Skills por Usuario
function SkillsByUserTab({
  stats,
  gaps,
  recommendations,
  cardBg,
  cardBorder,
  textColor,
  primaryColor,
  secondaryColor,
  sectionBg
}: {
  stats: any
  gaps: any[]
  recommendations: any[]
  cardBg: string
  cardBorder: string
  textColor: string
  primaryColor: string
  secondaryColor: string
  sectionBg: string
}) {
  const gapsChartData = stats?.top_gaps?.map((item: any) => ({
    name: item.skill.length > 15 ? item.skill.substring(0, 15) + '...' : item.skill,
    count: item.count
  })) || []

  const learnedChartData = stats?.top_learned?.map((item: any) => ({
    name: item.skill.length > 15 ? item.skill.substring(0, 15) + '...' : item.skill,
    count: item.count
  })) || []

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Cards de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          icon={Users}
          label="Usuarios Analizados"
          value={stats?.total_users?.toString() || '0'}
          trend=""
          cardBg={cardBg}
          cardBorder={cardBorder}
          textColor={textColor}
          primaryColor={primaryColor}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Usuarios con Gaps"
          value={stats?.users_with_gaps?.toString() || '0'}
          trend=""
          cardBg={cardBg}
          cardBorder={cardBorder}
          textColor={textColor}
          primaryColor={primaryColor}
        />
        <MetricCard
          icon={Target}
          label="Cobertura de Skills"
          value={`${stats?.skills_coverage || 0}%`}
          trend=""
          cardBg={cardBg}
          cardBorder={cardBorder}
          textColor={textColor}
          primaryColor={primaryColor}
        />
        <MetricCard
          icon={Brain}
          label="Total Skills"
          value={stats?.total_skills?.toString() || '0'}
          trend=""
          cardBg={cardBg}
          cardBorder={cardBorder}
          textColor={textColor}
          primaryColor={primaryColor}
        />
      </div>

      {/* Gráficas de Top Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Skills Faltantes */}
        {gapsChartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border backdrop-blur-sm p-6"
            style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
          >
            <h3 className="text-lg font-heading font-semibold mb-4 flex items-center gap-2" style={{ color: textColor }}>
              <AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />
              Top Skills Faltantes
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gapsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    style={{ fill: textColor, fontSize: '11px' }}
                    tick={{ fill: `${textColor}CC` }}
                  />
                  <YAxis 
                    style={{ fill: textColor, fontSize: '12px' }}
                    tick={{ fill: `${textColor}CC` }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: cardBg,
                      border: `1px solid ${cardBorder}`,
                      borderRadius: '12px',
                      color: textColor
                    }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Top Skills Aprendidas */}
        {learnedChartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border backdrop-blur-sm p-6"
            style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
          >
            <h3 className="text-lg font-heading font-semibold mb-4 flex items-center gap-2" style={{ color: textColor }}>
              <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />
              Top Skills Aprendidas
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={learnedChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    style={{ fill: textColor, fontSize: '11px' }}
                    tick={{ fill: `${textColor}CC` }}
                  />
                  <YAxis 
                    style={{ fill: textColor, fontSize: '12px' }}
                    tick={{ fill: `${textColor}CC` }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: cardBg,
                      border: `1px solid ${cardBorder}`,
                      borderRadius: '12px',
                      color: textColor
                    }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>

      {/* Tabla de Gaps por Usuario */}
      {gaps && gaps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border overflow-hidden backdrop-blur-sm"
          style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
        >
          <div className="p-6 border-b" style={{ borderColor: cardBorder }}>
            <h3 className="text-lg font-heading font-semibold flex items-center gap-2" style={{ color: textColor }}>
              <AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />
              Gaps de Conocimiento por Usuario
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${cardBorder}` }}>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold uppercase tracking-wider" style={{ color: `${textColor}CC` }}>
                    Usuario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold uppercase tracking-wider" style={{ color: `${textColor}CC` }}>
                    Rol
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold uppercase tracking-wider" style={{ color: `${textColor}CC` }}>
                    Skills Aprendidas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold uppercase tracking-wider" style={{ color: `${textColor}CC` }}>
                    Skills Faltantes
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold uppercase tracking-wider" style={{ color: `${textColor}CC` }}>
                    Cobertura
                  </th>
                </tr>
              </thead>
              <tbody>
                {gaps.map((gap: any, idx: number) => {
                  const totalSkills = (gap.learned_skills?.length || 0) + (gap.missing_skills?.length || 0)
                  const coverage = totalSkills > 0 
                    ? Math.round(((gap.learned_skills?.length || 0) / totalSkills) * 100)
                    : 0

                  return (
                    <motion.tr
                      key={gap.user_id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:opacity-80 transition-opacity"
                      style={{ 
                        borderBottom: `1px solid ${cardBorder}`, 
                        backgroundColor: idx % 2 === 0 ? 'transparent' : `${sectionBg}40`
                      }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                            style={{
                              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                            }}
                          >
                            {gap.user_name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <span className="font-body font-medium text-sm" style={{ color: textColor }}>
                            {gap.user_name || 'Usuario'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span 
                          className="px-2 py-0.5 rounded-md text-xs font-body"
                          style={{ 
                            backgroundColor: `${primaryColor}15`,
                            color: primaryColor
                          }}
                        >
                          {gap.user_role || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(gap.learned_skills || []).slice(0, 3).map((skill: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-xs font-body"
                              style={{ 
                                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                color: '#22c55e'
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                          {(gap.learned_skills?.length || 0) > 3 && (
                            <span 
                              className="px-2 py-0.5 rounded text-xs font-body opacity-70"
                              style={{ color: textColor }}
                            >
                              +{(gap.learned_skills?.length || 0) - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(gap.missing_skills || []).slice(0, 3).map((skill: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-xs font-body"
                              style={{ 
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                color: '#ef4444'
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                          {(gap.missing_skills?.length || 0) > 3 && (
                            <span 
                              className="px-2 py-0.5 rounded text-xs font-body opacity-70"
                              style={{ color: textColor }}
                            >
                              +{(gap.missing_skills?.length || 0) - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="flex-1 h-1.5 rounded-full"
                            style={{ backgroundColor: `${cardBorder}50` }}
                          >
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${coverage}%`,
                                background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                              }}
                            />
                          </div>
                          <span className="font-body text-xs min-w-[45px]" style={{ color: textColor }}>
                            {coverage}%
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// Sub-tab: Skills por Curso
function SkillsByCourseTab({
  cardBg,
  cardBorder,
  textColor,
  primaryColor,
  secondaryColor,
  sectionBg
}: {
  cardBg: string
  cardBorder: string
  textColor: string
  primaryColor: string
  secondaryColor: string
  sectionBg: string
}) {
  // Por ahora, mostrar un mensaje indicando que esta funcionalidad está en desarrollo
  // En el futuro, aquí se mostrarían los skills que enseñan los cursos
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-2xl border backdrop-blur-sm p-12 text-center"
      style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
    >
      <Brain className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: primaryColor }} />
      <h3 className="text-lg font-heading font-semibold mb-2" style={{ color: textColor }}>
        Skills por Curso
      </h3>
      <p className="font-body opacity-70" style={{ color: textColor }}>
        Esta funcionalidad mostrará las skills que enseñan los cursos y los gaps de conocimiento identificados.
      </p>
      <p className="font-body text-sm opacity-50 mt-2" style={{ color: textColor }}>
        Próximamente disponible
      </p>
    </motion.div>
  )
}
