'use client'

import { useState, useMemo } from 'react'
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
  PlayCircle
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'

// Importaciones dinámicas de Nivo para mejor performance
const ResponsiveLine = dynamic(() => import('@nivo/line').then(mod => mod.ResponsiveLine), { ssr: false })
const ResponsiveBar = dynamic(() => import('@nivo/bar').then(mod => mod.ResponsiveBar), { ssr: false })
const ResponsivePie = dynamic(() => import('@nivo/pie').then(mod => mod.ResponsivePie), { ssr: false })
import { useTeamProgress } from '../hooks/useTeamProgress'
import Image from 'next/image'

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

export function BusinessTeamProgress() {
  const { data, isLoading, error, refetch } = useTeamProgress()
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'users' | 'trends'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'owner' | 'admin' | 'member'>('all')

  const { styles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const panelStyles = styles?.panel

  // Dynamic Styles
  const cardBg = isDark ? (panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)') : '#FFFFFF'
  const cardBorder = isDark ? (panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)') : '#E2E8F0'
  const textColor = isDark ? (panelStyles?.text_color || '#f8fafc') : '#0F172A'
  const subTextColor = isDark ? '#9ca3af' : '#64748B'
  const primaryColor = panelStyles?.primary_button_color || '#8b5cf6'
  
  const tableHeaderBg = isDark ? 'rgba(0, 0, 0, 0.2)' : '#F1F5F9'
  const inputBg = isDark ? 'rgba(0, 0, 0, 0.2)' : '#FFFFFF'

  // Nivo Theme
  const nivoTheme = useMemo(() => ({
    background: 'transparent',
    text: {
      fontSize: 12,
      fill: isDark ? '#e5e7eb' : '#374151',
      outlineWidth: 0,
      outlineColor: 'transparent'
    },
    axis: {
      domain: {
        line: {
          stroke: isDark ? '#4b5563' : '#cbd5e1',
          strokeWidth: 1
        }
      },
      legend: {
        text: {
          fontSize: 12,
          fill: isDark ? '#e5e7eb' : '#374151',
          outlineWidth: 0,
          outlineColor: 'transparent'
        }
      },
      ticks: {
        line: {
          stroke: isDark ? '#4b5563' : '#cbd5e1',
          strokeWidth: 1
        },
        text: {
          fontSize: 11,
          fill: isDark ? '#9ca3af' : '#64748B',
          outlineWidth: 0,
          outlineColor: 'transparent'
        }
      }
    },
    grid: {
      line: {
        stroke: isDark ? '#374151' : '#e2e8f0',
        strokeWidth: 1
      }
    },
    legends: {
      title: {
        text: {
          fontSize: 11,
          fill: isDark ? '#e5e7eb' : '#374151',
          outlineWidth: 0,
          outlineColor: 'transparent'
        }
      },
      text: {
        fontSize: 11,
        fill: isDark ? '#9ca3af' : '#64748B',
        outlineWidth: 0,
        outlineColor: 'transparent'
      },
      ticks: {
        line: {},
        text: {
          fontSize: 10,
          fill: isDark ? '#9ca3af' : '#64748B',
          outlineWidth: 0,
          outlineColor: 'transparent'
        }
      }
    },
    tooltip: {
      container: {
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#e5e7eb' : '#374151',
        fontSize: 12,
        borderRadius: '8px',
        padding: '8px 12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: `1px solid ${cardBorder}`
      }
    }
  }), [isDark, cardBorder])

  const filteredUsers = useMemo(() => {
    if (!data?.users) return []
    
    let filtered = data.users

    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(user =>
        user.display_name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term)
      )
    }

    // Filtrar por rol
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole)
    }

    return filtered
  }, [data?.users, searchTerm, filterRole])

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
  }

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
        <p style={{ color: subTextColor }}>No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Usuarios', value: data.stats.total_users, icon: Users, color: '#60A5FA' },
          { label: 'Cursos Asignados', value: data.stats.total_courses_assigned, icon: BookOpen, color: '#A78BFA' },
          { label: 'Completados', value: data.stats.completed_courses, icon: CheckCircle, color: '#4ADE80' },
          { label: 'Progreso Promedio', value: `${data.stats.average_progress}%`, icon: Target, color: '#FACC15' },
          { label: 'Tiempo Total', value: `${data.stats.total_time_spent_hours}h`, icon: Clock, color: '#22D3EE' },
          { label: 'Tasa Completación', value: `${data.stats.completion_rate}%`, icon: TrendingUp, color: '#4ADE80' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl p-4 border backdrop-blur-sm"
            style={{ 
              backgroundColor: cardBg, 
              borderColor: cardBorder 
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
            </div>
            <p className="text-sm mb-1" style={{ color: subTextColor }}>{stat.label}</p>
            <p className="text-2xl font-bold" style={{ color: textColor }}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="rounded-xl p-1 border flex gap-2" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        {[
          { id: 'overview', label: 'Resumen General', icon: BarChart3 },
          { id: 'courses', label: 'Por Curso', icon: BookOpen },
          { id: 'users', label: 'Por Usuario', icon: Users },
          { id: 'trends', label: 'Tendencias', icon: TrendingUp }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all flex-1 ${
              activeTab === id
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            style={{
              color: activeTab === id ? primaryColor : subTextColor,
              backgroundColor: activeTab === id ? `${primaryColor}20` : 'transparent',
              borderColor: activeTab === id ? `${primaryColor}30` : 'transparent',
            }}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Distribution Chart */}
            {data.charts.distribution.length > 0 && (
              <div 
                className="rounded-xl p-6 border backdrop-blur-sm"
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              >
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: textColor }}>
                  <Target className="w-5 h-5" style={{ color: primaryColor }} />
                  Distribución de Cursos
                </h3>
                <div className="h-80">
                  <ResponsivePie
                    data={data.charts.distribution.map(item => ({
                      id: item.name,
                      value: item.value,
                      label: item.name
                    }))}
                    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                    innerRadius={0.5}
                    padAngle={0.7}
                    cornerRadius={3}
                    activeOuterRadiusOffset={8}
                    colors={data.charts.distribution.map(item => item.color)}
                    borderWidth={1}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor={textColor}
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: 'color' }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                    theme={nivoTheme}
                  />
                </div>
              </div>
            )}

            {/* Progress by Course */}
            {data.charts.progress_by_course.length > 0 && (
              <div 
                className="rounded-xl p-6 border backdrop-blur-sm"
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              >
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: textColor }}>
                  <BookOpen className="w-5 h-5" style={{ color: primaryColor }} />
                  Progreso por Curso
                </h3>
                <div className="h-96">
                  <ResponsiveBar
                    data={data.charts.progress_by_course.slice(0, 10).map(entry => ({
                      curso: entry.course_title,
                      progreso: entry.progress,
                      color: entry.progress >= 80 ? COLORS.success :
                             entry.progress >= 50 ? COLORS.warning :
                             COLORS.info
                    }))}
                    keys={['progreso']}
                    indexBy="curso"
                    margin={{ top: 50, right: 130, bottom: 120, left: 60 }}
                    padding={0.3}
                    valueScale={{ type: 'linear' }}
                    indexScale={{ type: 'band', round: true }}
                    colors={(entry: any) => entry.data.color}
                    borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45,
                      legend: 'Curso',
                      legendPosition: 'middle',
                      legendOffset: 100
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
                </div>
              </div>
            )}
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            {/* Courses List */}
            <div 
              className="rounded-xl border overflow-hidden"
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b" style={{ backgroundColor: tableHeaderBg, borderColor: cardBorder }}>
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: subTextColor }}>Curso</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: subTextColor }}>Asignados</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: subTextColor }}>Completados</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: subTextColor }}>En Progreso</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: subTextColor }}>Progreso Promedio</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: subTextColor }}>Tiempo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: cardBorder }}>
                    {data.courses.map((course, index) => (
                      <motion.tr
                        key={course.course_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ backgroundColor: 'transparent' }}
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium" style={{ color: textColor }}>{course.course_title}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span style={{ color: subTextColor }}>{course.total_assigned}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-green-500 font-medium">{course.completed}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-yellow-500 font-medium">{course.in_progress}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${course.average_progress}%` }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                className="h-full bg-gradient-to-r from-primary to-success rounded-full"
                              />
                            </div>
                            <span className="text-sm font-medium" style={{ color: textColor }}>{course.average_progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span style={{ color: subTextColor }}>{course.total_time_hours}h</span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Time by Course Chart */}
            {data.charts.time_by_course.length > 0 && (
              <div 
                className="rounded-xl p-6 border backdrop-blur-sm"
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              >
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: textColor }}>
                  <Clock className="w-5 h-5" style={{ color: primaryColor }} />
                  Tiempo Dedicado por Curso
                </h3>
                <div className="h-96">
                  <ResponsiveBar
                    data={data.charts.time_by_course.slice(0, 10).map(entry => ({
                      curso: entry.course_title,
                      horas: entry.total_hours
                    }))}
                    keys={['horas']}
                    indexBy="curso"
                    margin={{ top: 50, right: 130, bottom: 120, left: 60 }}
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
                      tickRotation: -45,
                      legend: 'Curso',
                      legendPosition: 'middle',
                      legendOffset: 100
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Horas',
                      legendPosition: 'middle',
                      legendOffset: -40
                    }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                    theme={nivoTheme}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Filters */}
            <div 
              className="rounded-xl p-4 border flex gap-4"
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: subTextColor }} />
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  style={{
                    backgroundColor: inputBg,
                    borderColor: cardBorder,
                    color: textColor
                  }}
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                style={{
                  backgroundColor: inputBg,
                  borderColor: cardBorder,
                  color: textColor
                }}
              >
                <option value="all">Todos los roles</option>
                <option value="owner">Propietario</option>
                <option value="admin">Administrador</option>
                <option value="member">Miembro</option>
              </select>
            </div>

            {/* Users Table */}
            <div 
              className="rounded-xl border overflow-hidden"
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b" style={{ backgroundColor: tableHeaderBg, borderColor: cardBorder }}>
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: subTextColor }}>Usuario</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: subTextColor }}>Rol</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: subTextColor }}>Cursos</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: subTextColor }}>Completados</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: subTextColor }}>Progreso</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: subTextColor }}>Tiempo</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: subTextColor }}>Certificados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: cardBorder }}>
                    {filteredUsers.map((user, index) => (
                      <motion.tr
                        key={user.user_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ backgroundColor: 'transparent' }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {user.profile_picture_url ? (
                              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30 flex-shrink-0">
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
                                {(user.first_name?.[0] || user.username[0]).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-medium" style={{ color: textColor }}>{user.display_name}</p>
                              <p className="text-xs" style={{ color: subTextColor }}>{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            user.role === 'owner' ? 'bg-purple-500/20 text-purple-400' :
                            user.role === 'admin' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {user.role === 'owner' ? 'Propietario' :
                             user.role === 'admin' ? 'Administrador' : 'Miembro'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span style={{ color: subTextColor }}>{user.courses_assigned}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-green-500 font-medium">{user.courses_completed}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${user.average_progress}%` }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                className="h-full bg-gradient-to-r from-primary to-success rounded-full"
                              />
                            </div>
                            <span className="text-sm font-medium" style={{ color: textColor }}>{user.average_progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span style={{ color: subTextColor }}>{user.time_spent_hours}h</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4 text-purple-400" />
                            <span style={{ color: subTextColor }}>{user.certificates_count}</span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Users Chart */}
            {data.charts.progress_by_user.length > 0 && (
              <div 
                className="rounded-xl p-6 border backdrop-blur-sm"
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              >
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: textColor }}>
                  <TrendingUp className="w-5 h-5" style={{ color: primaryColor }} />
                  Top 10 Usuarios por Progreso
                </h3>
                <div className="h-96">
                  <ResponsiveBar
                    data={data.charts.progress_by_user.map(entry => ({
                      usuario: entry.display_name,
                      progreso: entry.progress
                    }))}
                    keys={['progreso']}
                    indexBy="usuario"
                    margin={{ top: 50, right: 130, bottom: 50, left: 150 }}
                    padding={0.3}
                    layout="horizontal"
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
                      legend: 'Progreso (%)',
                      legendPosition: 'middle',
                      legendOffset: 40
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Usuario',
                      legendPosition: 'middle',
                      legendOffset: -120
                    }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                    theme={nivoTheme}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            {/* Completion Trends */}
            {data.charts.completion_trends.length > 0 && (
              <div 
                className="rounded-xl p-6 border backdrop-blur-sm"
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              >
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: textColor }}>
                  <TrendingUp className="w-5 h-5" style={{ color: primaryColor }} />
                  Tendencias de Completación
                </h3>
                <div className="h-96">
                  <ResponsiveLine
                    data={[{
                      id: 'Cursos Completados',
                      color: COLORS.success,
                      data: data.charts.completion_trends.map(entry => ({
                        x: formatMonth(entry.month),
                        y: entry.count
                      }))
                    }]}
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
                      legend: 'Cursos Completados',
                      legendPosition: 'middle',
                      legendOffset: -40
                    }}
                    pointSize={8}
                    pointColor={{ theme: 'background' }}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: 'serieColor' }}
                    pointLabelYOffset={-12}
                    useMesh={true}
                    theme={nivoTheme}
                    colors={[COLORS.success]}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
