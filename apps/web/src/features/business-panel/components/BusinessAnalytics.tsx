'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
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
  Filter,
  XCircle,
  Activity,
  Calendar,
  UserCheck,
  PieChart as PieChartIcon,
  Brain,
  AlertTriangle,
  BookMarked
} from 'lucide-react'
import { useBusinessAnalytics } from '../hooks/useBusinessAnalytics'
import Image from 'next/image'

import dynamic from 'next/dynamic'

// Importaciones dinámicas de Nivo para mejor performance
const ResponsiveLine = dynamic(() => import('@nivo/line').then(mod => mod.ResponsiveLine), { ssr: false })
const ResponsiveBar = dynamic(() => import('@nivo/bar').then(mod => mod.ResponsiveBar), { ssr: false })
const ResponsivePie = dynamic(() => import('@nivo/pie').then(mod => mod.ResponsivePie), { ssr: false })
const ResponsiveHeatMap = dynamic(() => import('@nivo/heatmap').then(mod => mod.ResponsiveHeatMap), { ssr: false })
const ResponsiveCalendar = dynamic(() => import('@nivo/calendar').then(mod => mod.ResponsiveCalendar), { ssr: false })
const ResponsiveRadar = dynamic(() => import('@nivo/radar').then(mod => mod.ResponsiveRadar), { ssr: false })
const ResponsiveTreeMap = dynamic(() => import('@nivo/treemap').then(mod => mod.ResponsiveTreeMap), { ssr: false })
const ResponsiveSankey = dynamic(() => import('@nivo/sankey').then(mod => mod.ResponsiveSankey), { ssr: false })
const ResponsiveSunburst = dynamic(() => import('@nivo/sunburst').then(mod => mod.ResponsiveSunburst), { ssr: false })
const ResponsiveStream = dynamic(() => import('@nivo/stream').then(mod => mod.ResponsiveStream), { ssr: false })

// Colores del tema
const COLORS = {
  primary: '#8b5cf6',
  secondary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  gray: '#6b7280'
}

// Tema para Nivo (dark mode)
const nivoTheme = {
  background: 'transparent',
  text: {
    fontSize: 12,
    fill: '#e5e7eb',
    outlineWidth: 0,
    outlineColor: 'transparent'
  },
  axis: {
    domain: {
      line: {
        stroke: '#4b5563',
        strokeWidth: 1
      }
    },
    legend: {
      text: {
        fontSize: 12,
        fill: '#e5e7eb',
        outlineWidth: 0,
        outlineColor: 'transparent'
      }
    },
    ticks: {
      line: {
        stroke: '#4b5563',
        strokeWidth: 1
      },
      text: {
        fontSize: 11,
        fill: '#9ca3af',
        outlineWidth: 0,
        outlineColor: 'transparent'
      }
    }
  },
  grid: {
    line: {
      stroke: '#374151',
      strokeWidth: 1
    }
  },
  legends: {
    title: {
      text: {
        fontSize: 11,
        fill: '#e5e7eb',
        outlineWidth: 0,
        outlineColor: 'transparent'
      }
    },
    text: {
      fontSize: 11,
      fill: '#9ca3af',
      outlineWidth: 0,
      outlineColor: 'transparent'
    },
    ticks: {
      line: {},
      text: {
        fontSize: 10,
        fill: '#9ca3af',
        outlineWidth: 0,
        outlineColor: 'transparent'
      }
    }
  },
  annotations: {
    text: {
      fontSize: 13,
      fill: '#e5e7eb',
      outlineWidth: 2,
      outlineColor: '#1f2937',
      outlineOpacity: 1
    },
    link: {
      stroke: '#4b5563',
      strokeWidth: 1,
      outlineWidth: 2,
      outlineColor: '#1f2937',
      outlineOpacity: 1
    },
    outline: {
      stroke: '#4b5563',
      strokeWidth: 2,
      outlineWidth: 2,
      outlineColor: '#1f2937',
      outlineOpacity: 1
    },
    symbol: {
      fill: '#e5e7eb',
      outlineWidth: 2,
      outlineColor: '#1f2937',
      outlineOpacity: 1
    }
  },
  tooltip: {
    container: {
      background: '#1f2937',
      color: '#e5e7eb',
      fontSize: 12,
      borderRadius: '8px',
      padding: '8px 12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    },
    basic: {},
    chip: {},
    table: {},
    tableCell: {},
    tableCellValue: {}
  }
}

export function BusinessAnalytics() {
  const { data, isLoading, error, refetch } = useBusinessAnalytics()
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'trends' | 'roles' | 'skills'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'owner' | 'admin' | 'member'>('all')

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
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 text-lg mb-4">{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-carbon-400">No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8">
      {/* Cards de Métricas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={Users}
          label="Total Usuarios"
          value={data.general_metrics.total_users.toString()}
          trend=""
          color={COLORS.info}
        />
        <MetricCard
          icon={BookOpen}
          label="Cursos Asignados"
          value={data.general_metrics.total_courses_assigned.toString()}
          trend=""
          color={COLORS.primary}
        />
        <MetricCard
          icon={CheckCircle}
          label="Completados"
          value={data.general_metrics.completed_courses.toString()}
          trend=""
          color={COLORS.success}
        />
        <MetricCard
          icon={TrendingUp}
          label="Progreso Promedio"
          value={`${data.general_metrics.average_progress}%`}
          trend=""
          color={COLORS.secondary}
        />
        <MetricCard
          icon={Clock}
          label="Tiempo Total"
          value={`${data.general_metrics.total_time_hours}h`}
          trend=""
          color={COLORS.warning}
        />
        <MetricCard
          icon={Award}
          label="Certificados"
          value={data.general_metrics.total_certificates.toString()}
          trend=""
          color={COLORS.success}
        />
        <MetricCard
          icon={UserCheck}
          label="Usuarios Activos"
          value={data.general_metrics.active_users.toString()}
          trend=""
          color={COLORS.info}
        />
        <MetricCard
          icon={Target}
          label="Tasa Retención"
          value={`${data.general_metrics.retention_rate}%`}
          trend=""
          color={COLORS.secondary}
        />
      </div>

      {/* Tabs */}
      <div className="bg-carbon-800 rounded-xl border border-carbon-700 p-6">
        <div className="flex border-b border-carbon-700 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'text-primary border-b-2 border-primary'
                : 'text-carbon-400 hover:text-carbon-300'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline-block mr-2" />
            Vista General
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'users'
                ? 'text-primary border-b-2 border-primary'
                : 'text-carbon-400 hover:text-carbon-300'
            }`}
          >
            <Users className="w-4 h-4 inline-block mr-2" />
            Por Usuario
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'trends'
                ? 'text-primary border-b-2 border-primary'
                : 'text-carbon-400 hover:text-carbon-300'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline-block mr-2" />
            Tendencias
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'roles'
                ? 'text-primary border-b-2 border-primary'
                : 'text-carbon-400 hover:text-carbon-300'
            }`}
          >
            <PieChartIcon className="w-4 h-4 inline-block mr-2" />
            Por Rol
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'skills'
                ? 'text-primary border-b-2 border-primary'
                : 'text-carbon-400 hover:text-carbon-300'
            }`}
          >
            <Brain className="w-4 h-4 inline-block mr-2" />
            Skills Insights
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && <OverviewTab data={data} />}
          {activeTab === 'users' && (
            <UsersTab
              users={filteredUsers}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterRole={filterRole}
              setFilterRole={setFilterRole}
            />
          )}
          {activeTab === 'trends' && <TrendsTab data={data} />}
          {activeTab === 'roles' && <RolesTab data={data} />}
          {activeTab === 'skills' && <SkillsTab />}
        </div>
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
  color
}: {
  icon: any
  label: string
  value: string
  trend: string
  color: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-carbon-800 rounded-xl p-6 border border-carbon-700"
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <p className="text-carbon-400 text-sm mb-2">{label}</p>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      {trend && (
        <p className="text-sm text-carbon-400">{trend}</p>
      )}
    </motion.div>
  )
}

// Tab: Vista General
function OverviewTab({ data }: { data: any }) {
  // Preparar datos para gráficas
  const courseDistribution = data.course_metrics.distribution.map((item: any) => ({
    id: item.status === 'completed' ? 'Completados' : item.status === 'in_progress' ? 'En Progreso' : 'No Iniciados',
    value: item.count,
    label: item.status === 'completed' ? 'Completados' : item.status === 'in_progress' ? 'En Progreso' : 'No Iniciados'
  }))

  const progressByRole = data.by_role.progress_comparison.map((item: any) => ({
    role: item.role === 'owner' ? 'Owner' : item.role === 'admin' ? 'Admin' : 'Member',
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

  const radarKeys = ['progreso', 'completados', 'tiempo', 'usuarios']
  const radarIndexBy = 'role'

  // Datos para TreeMap (distribución jerárquica)
  const treeMapData = {
    name: 'Métricas',
    children: data.by_role.distribution.map((item: any) => {
      const role = item.role === 'owner' ? 'Owner' : item.role === 'admin' ? 'Admin' : 'Member'
      const progressItem = data.by_role.progress_comparison.find((p: any) => p.role === item.role)
      return {
        name: role,
        value: (progressItem?.average_progress || 0) * (item.count || 0)
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Gráfica de Distribución de Cursos */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
        <h3 className="text-xl font-bold text-white mb-4">Distribución de Cursos</h3>
        <div className="h-64">
          {courseDistribution.length > 0 ? (
            <ResponsivePie
              data={courseDistribution}
              margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              colors={[COLORS.success, COLORS.warning, COLORS.gray]}
              borderWidth={1}
              borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#e5e7eb"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
              theme={nivoTheme}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-carbon-400">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Gráfica de Progreso por Rol */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
        <h3 className="text-xl font-bold text-white mb-4">Progreso Promedio por Rol</h3>
        <div className="h-64">
          {progressByRole.length > 0 ? (
            <ResponsiveBar
              data={progressByRole}
              keys={['progress']}
              indexBy="role"
              margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
              padding={0.3}
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={COLORS.primary}
              borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Rol',
                legendPosition: 'middle',
                legendOffset: 32
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Progreso (%)',
                legendPosition: 'middle',
                legendOffset: -40
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              theme={nivoTheme}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-carbon-400">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Gráfica Radar (métricas por rol) */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
        <h3 className="text-xl font-bold text-white mb-4">Métricas Comparativas por Rol</h3>
        <div className="h-96">
          {radarData.length > 0 ? (
            <ResponsiveRadar
              data={radarData}
              keys={radarKeys}
              indexBy={radarIndexBy}
              valueFormat=" >-.0f"
              margin={{ top: 70, right: 80, bottom: 40, left: 80 }}
              borderColor={{ from: 'color' }}
              gridLabelOffset={36}
              dotSize={10}
              dotColor={{ theme: 'background' }}
              dotBorderWidth={2}
              dotBorderColor={{ from: 'color' }}
              colors={[COLORS.primary, COLORS.secondary, COLORS.success, COLORS.info]}
              fillOpacity={0.1}
              blendMode="multiply"
              motionConfig="wobbly"
              theme={nivoTheme}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-carbon-400">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* TreeMap (distribución jerárquica) */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
        <h3 className="text-xl font-bold text-white mb-4">Distribución Jerárquica por Rol</h3>
        <div className="h-96">
          {treeMapData.children && treeMapData.children.length > 0 ? (
            <ResponsiveTreeMap
              data={treeMapData}
              identity="name"
              value="value"
              valueFormat=" >-.0f"
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              labelSkipSize={12}
              labelTextColor={{ from: 'color', modifiers: [['darker', 1.2]] }}
              parentLabelPosition="left"
              parentLabelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
              borderColor={{ from: 'color', modifiers: [['darker', 0.1]] }}
              colors={[COLORS.primary, COLORS.secondary, COLORS.success, COLORS.info]}
              theme={nivoTheme}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-carbon-400">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Tab: Por Usuario
function UsersTab({
  users,
  searchTerm,
  setSearchTerm,
  filterRole,
  setFilterRole
}: {
  users: any[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  filterRole: 'all' | 'owner' | 'admin' | 'member'
  setFilterRole: (role: 'all' | 'owner' | 'admin' | 'member') => void
}) {
  const topPerformers = [...users]
    .sort((a, b) => b.courses_completed - a.courses_completed)
    .slice(0, 10)
    .map((user, index) => ({
      user: user.display_name,
      completed: user.courses_completed,
      rank: index + 1
    }))

  return (
    <div className="space-y-8">
      {/* Filtros */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-carbon-400" />
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-carbon-900 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as any)}
          className="px-4 py-2 bg-carbon-900 border border-carbon-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Todos los roles</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
        </select>
      </div>

      {/* Gráfica de Top Performers */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
        <h3 className="text-xl font-bold text-white mb-4">Top 10 Performers</h3>
        <div className="h-96">
          {topPerformers.length > 0 ? (
            <ResponsiveBar
              data={topPerformers}
              keys={['completed']}
              indexBy="user"
              margin={{ top: 50, right: 130, bottom: 150, left: 60 }}
              padding={0.3}
              layout="horizontal"
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={COLORS.success}
              borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: 'Cursos Completados',
                legendPosition: 'middle',
                legendOffset: 60
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Usuario',
                legendPosition: 'middle',
                legendOffset: -50
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              theme={nivoTheme}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-carbon-400">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-carbon-900 rounded-lg border border-carbon-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-carbon-800 border-b border-carbon-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Usuario</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Rol</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Asignados</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Completados</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Progreso</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Tiempo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Certificados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-carbon-700">
              {users.map((user) => (
                <tr key={user.user_id} className="hover:bg-carbon-800 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.profile_picture_url ? (
                        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary/30">
                          <Image
                            src={user.profile_picture_url}
                            alt={user.display_name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-success rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {(user.display_name[0] || user.username[0]).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium">{user.display_name}</p>
                        <p className="text-carbon-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-carbon-300 capitalize">{user.role}</td>
                  <td className="px-6 py-4 text-white">{user.courses_assigned}</td>
                  <td className="px-6 py-4 text-white">{user.courses_completed}</td>
                  <td className="px-6 py-4 text-white">{user.average_progress}%</td>
                  <td className="px-6 py-4 text-white">{user.total_time_hours}h</td>
                  <td className="px-6 py-4 text-white">{user.certificates_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Tab: Tendencias
function TrendsTab({ data }: { data: any }) {
  const enrollmentData = data.trends.enrollments_by_month.map((item: any) => ({
    x: item.label,
    y: item.count
  }))

  const completionData = data.trends.completions_by_month.map((item: any) => ({
    x: item.label,
    y: item.count
  }))

  const timeData = data.trends.time_by_month.map((item: any) => ({
    x: item.label,
    y: item.count
  }))

  const activeUsersData = data.trends.active_users_by_month.map((item: any) => ({
    x: item.label,
    y: item.count
  }))

  const lineData = [
    {
      id: 'Inscripciones',
      color: COLORS.info,
      data: enrollmentData
    },
    {
      id: 'Completaciones',
      color: COLORS.success,
      data: completionData
    }
  ]

  // Datos para Stream Chart (tendencias apiladas)
  const streamData = [
    {
      id: 'Inscripciones',
      data: enrollmentData.map((item: any) => ({ x: item.x, y: item.y }))
    },
    {
      id: 'Completaciones',
      data: completionData.map((item: any) => ({ x: item.x, y: item.y }))
    },
    {
      id: 'Tiempo',
      data: timeData.map((item: any) => ({ x: item.x, y: item.y }))
    },
    {
      id: 'Usuarios Activos',
      data: activeUsersData.map((item: any) => ({ x: item.x, y: item.y }))
    }
  ]

  return (
    <div className="space-y-8">
      {/* Gráfica de Inscripciones y Completaciones (Line) */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
        <h3 className="text-xl font-bold text-white mb-4">Tendencias de Inscripciones y Completaciones</h3>
        <div className="h-96">
          {lineData[0].data.length > 0 || lineData[1].data.length > 0 ? (
            <ResponsiveLine
              data={lineData}
              margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
              xScale={{ type: 'point' }}
              yScale={{
                type: 'linear',
                min: 'auto',
                max: 'auto',
                stacked: false,
                reverse: false
              }}
              yFormat=" >-.0f"
              curve="cardinal"
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: 'Mes',
                legendPosition: 'middle',
                legendOffset: 60
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Cantidad',
                legendPosition: 'middle',
                legendOffset: -50
              }}
              pointSize={8}
              pointColor={{ theme: 'background' }}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              pointLabelYOffset={-12}
              useMesh={true}
              legends={[
                {
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 100,
                  translateY: 0,
                  itemsSpacing: 0,
                  itemDirection: 'left-to-right',
                  itemWidth: 80,
                  itemHeight: 20,
                  itemOpacity: 0.75,
                  symbolSize: 12,
                  symbolShape: 'circle',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemBackground: 'rgba(0, 0, 0, .03)',
                        itemOpacity: 1
                      }
                    }
                  ]
                }
              ]}
              theme={nivoTheme}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-carbon-400">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Stream Chart (tendencias apiladas) */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
        <h3 className="text-xl font-bold text-white mb-4">Tendencias Apiladas</h3>
        <div className="h-96">
          {streamData.length > 0 && streamData[0].data.length > 0 ? (
            <ResponsiveStream
              data={streamData}
              keys={['Inscripciones', 'Completaciones', 'Tiempo', 'Usuarios Activos']}
              margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: 'Mes',
                legendPosition: 'middle',
                legendOffset: 60
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Cantidad',
                legendPosition: 'middle',
                legendOffset: -50
              }}
              offsetType="none"
              order="none"
              curve="cardinal"
              colors={[COLORS.info, COLORS.success, COLORS.warning, COLORS.secondary]}
              fillOpacity={0.85}
              borderColor={{ theme: 'background' }}
              defs={[
                {
                  id: 'dots',
                  type: 'patternDots',
                  background: 'inherit',
                  color: '#cbd5e1',
                  size: 4,
                  padding: 2,
                  stagger: true
                }
              ]}
              fill={[
                { match: { id: 'Inscripciones' }, id: 'dots' }
              ]}
              theme={nivoTheme}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-carbon-400">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Gráfica de Tiempo Dedicado */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
        <h3 className="text-xl font-bold text-white mb-4">Tiempo Dedicado por Mes</h3>
        <div className="h-96">
          {timeData.length > 0 ? (
            <ResponsiveLine
              data={[
                {
                  id: 'Tiempo (horas)',
                  color: COLORS.warning,
                  data: timeData
                }
              ]}
              margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
              xScale={{ type: 'point' }}
              yScale={{
                type: 'linear',
                min: 'auto',
                max: 'auto'
              }}
              yFormat=" >-.1f"
              curve="cardinal"
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: 'Mes',
                legendPosition: 'middle',
                legendOffset: 60
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Horas',
                legendPosition: 'middle',
                legendOffset: -50
              }}
              pointSize={8}
              pointColor={{ theme: 'background' }}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              pointLabelYOffset={-12}
              useMesh={true}
              theme={nivoTheme}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-carbon-400">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Gráfica de Usuarios Activos */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
        <h3 className="text-xl font-bold text-white mb-4">Usuarios Activos por Mes</h3>
        <div className="h-96">
          {activeUsersData.length > 0 ? (
            <ResponsiveLine
              data={[
                {
                  id: 'Usuarios Activos',
                  color: COLORS.secondary,
                  data: activeUsersData
                }
              ]}
              margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
              xScale={{ type: 'point' }}
              yScale={{
                type: 'linear',
                min: 'auto',
                max: 'auto'
              }}
              yFormat=" >-.0f"
              curve="cardinal"
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: 'Mes',
                legendPosition: 'middle',
                legendOffset: 60
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Usuarios',
                legendPosition: 'middle',
                legendOffset: -50
              }}
              pointSize={8}
              pointColor={{ theme: 'background' }}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              pointLabelYOffset={-12}
              useMesh={true}
              areaBaselineValue={0}
              enableArea={true}
              areaOpacity={0.1}
              theme={nivoTheme}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-carbon-400">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Tab: Por Rol
function RolesTab({ data }: { data: any }) {
  const roleDistribution = data.by_role.distribution.map((item: any) => ({
    id: item.role === 'owner' ? 'Owner' : item.role === 'admin' ? 'Admin' : 'Member',
    value: item.count,
    label: item.role === 'owner' ? 'Owner' : item.role === 'admin' ? 'Admin' : 'Member'
  }))

  const roleProgress = data.by_role.progress_comparison.map((item: any) => ({
    role: item.role === 'owner' ? 'Owner' : item.role === 'admin' ? 'Admin' : 'Member',
    progress: item.average_progress
  }))

  const roleCompletions = data.by_role.completions.map((item: any) => ({
    role: item.role === 'owner' ? 'Owner' : item.role === 'admin' ? 'Admin' : 'Member',
    completados: item.total_completed
  }))

  const roleTime = data.by_role.time_spent.map((item: any) => ({
    role: item.role === 'owner' ? 'Owner' : item.role === 'admin' ? 'Admin' : 'Member',
    tiempo: item.average_hours
  }))

  // Datos combinados para comparativa de roles
  const roleComparison = roleProgress.map((progress: any) => {
    const completions = roleCompletions.find((c: any) => c.role === progress.role)
    const time = roleTime.find((t: any) => t.role === progress.role)
    return {
      role: progress.role,
      progreso: progress.progress,
      completados: completions?.completados || 0,
      tiempo: time?.tiempo || 0
    }
  })

  return (
    <div className="space-y-8">
      {/* Distribución por Rol (Sunburst) */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
        <h3 className="text-xl font-bold text-white mb-4">Distribución por Rol (Sunburst)</h3>
        <div className="h-96">
          {roleDistribution.length > 0 ? (
            <ResponsiveSunburst
              data={{
                name: 'Roles',
                children: roleDistribution.map((item: any) => ({
                  name: item.id,
                  value: item.value,
                  children: []
                }))
              }}
              margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
              id="name"
              value="value"
              cornerRadius={2}
              borderColor={{ theme: 'background' }}
              colors={[COLORS.primary, COLORS.secondary, COLORS.info]}
              childColor={{ from: 'color', modifiers: [['brighter', 0.1]] }}
              theme={nivoTheme}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-carbon-400">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Comparativa Multi-Métrica por Rol */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
        <h3 className="text-xl font-bold text-white mb-4">Comparativa Multi-Métrica por Rol</h3>
        <div className="h-96">
          {roleComparison.length > 0 ? (
            <ResponsiveBar
              data={roleComparison}
              keys={['progreso', 'completados', 'tiempo']}
              indexBy="role"
              margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
              padding={0.3}
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={[COLORS.primary, COLORS.success, COLORS.warning]}
              borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Rol',
                legendPosition: 'middle',
                legendOffset: 32
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Valor',
                legendPosition: 'middle',
                legendOffset: -40
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              legends={[
                {
                  dataFrom: 'keys',
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 120,
                  translateY: 0,
                  itemsSpacing: 2,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemDirection: 'left-to-right',
                  itemOpacity: 0.85,
                  symbolSize: 20,
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemOpacity: 1
                      }
                    }
                  ]
                }
              ]}
              theme={nivoTheme}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-carbon-400">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Distribución por Rol (Pie Chart) */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
        <h3 className="text-xl font-bold text-white mb-4">Distribución por Rol</h3>
        <div className="h-64">
          {roleDistribution.length > 0 ? (
            <ResponsivePie
              data={roleDistribution}
              margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              colors={[COLORS.primary, COLORS.secondary, COLORS.info]}
              borderWidth={1}
              borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#e5e7eb"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
              theme={nivoTheme}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-carbon-400">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Progreso Comparativo por Rol */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
        <h3 className="text-xl font-bold text-white mb-4">Progreso Comparativo por Rol</h3>
        <div className="h-64">
          {roleProgress.length > 0 ? (
            <ResponsiveBar
              data={roleProgress}
              keys={['progress']}
              indexBy="role"
              margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
              padding={0.3}
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={COLORS.secondary}
              borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Rol',
                legendPosition: 'middle',
                legendOffset: 32
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Progreso (%)',
                legendPosition: 'middle',
                legendOffset: -40
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              theme={nivoTheme}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-carbon-400">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Cursos Completados por Rol */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
        <h3 className="text-xl font-bold text-white mb-4">Cursos Completados por Rol</h3>
        <div className="h-64">
          {roleCompletions.length > 0 ? (
            <ResponsiveBar
              data={roleCompletions}
              keys={['completados']}
              indexBy="role"
              margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
              padding={0.3}
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={COLORS.success}
              borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Rol',
                legendPosition: 'middle',
                legendOffset: 32
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Cursos Completados',
                legendPosition: 'middle',
                legendOffset: -40
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              theme={nivoTheme}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-carbon-400">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Tiempo Dedicado por Rol */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
        <h3 className="text-xl font-bold text-white mb-4">Tiempo Dedicado por Rol</h3>
        <div className="h-64">
          {roleTime.length > 0 ? (
            <ResponsiveBar
              data={roleTime}
              keys={['tiempo']}
              indexBy="role"
              margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
              padding={0.3}
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={COLORS.warning}
              borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Rol',
                legendPosition: 'middle',
                legendOffset: 32
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Tiempo (horas)',
                legendPosition: 'middle',
                legendOffset: -40
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              theme={nivoTheme}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-carbon-400">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

