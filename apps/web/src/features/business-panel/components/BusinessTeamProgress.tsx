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
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { useTeamProgress } from '../hooks/useTeamProgress'
import Image from 'next/image'

const COLORS = {
  success: '#10b981',
  warning: '#f59e0b',
  info: '#6b7280',
  primary: '#8b5cf6',
  secondary: '#6366f1'
}

export function BusinessTeamProgress() {
  const { data, isLoading, error, refetch } = useTeamProgress()
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'users' | 'trends'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'owner' | 'admin' | 'member'>('all')

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
        <p className="text-carbon-400">No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-4 border border-carbon-600"
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-sm text-carbon-400 mb-1">Total Usuarios</p>
          <p className="text-2xl font-bold text-white">{data.stats.total_users}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-4 border border-carbon-600"
        >
          <div className="flex items-center justify-between mb-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-sm text-carbon-400 mb-1">Cursos Asignados</p>
          <p className="text-2xl font-bold text-white">{data.stats.total_courses_assigned}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-4 border border-carbon-600"
        >
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-sm text-carbon-400 mb-1">Completados</p>
          <p className="text-2xl font-bold text-white">{data.stats.completed_courses}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-4 border border-carbon-600"
        >
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-sm text-carbon-400 mb-1">Progreso Promedio</p>
          <p className="text-2xl font-bold text-white">{data.stats.average_progress}%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-4 border border-carbon-600"
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-sm text-carbon-400 mb-1">Tiempo Total</p>
          <p className="text-2xl font-bold text-white">{data.stats.total_time_spent_hours}h</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-4 border border-carbon-600"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-sm text-carbon-400 mb-1">Tasa Completación</p>
          <p className="text-2xl font-bold text-white">{data.stats.completion_rate}%</p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-1 border border-carbon-600 flex gap-2">
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
                : 'text-carbon-400 hover:text-white hover:bg-carbon-700/50'
            }`}
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
              <div className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-6 border border-carbon-600">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Distribución de Cursos
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.charts.distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.charts.distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e9d5ff'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Progress by Course */}
            {data.charts.progress_by_course.length > 0 && (
              <div className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-6 border border-carbon-600">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Progreso por Curso
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={data.charts.progress_by_course.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                    <XAxis
                      dataKey="course_title"
                      stroke="#a78bfa"
                      tick={{ fill: '#c4b5fd', fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis
                      stroke="#a78bfa"
                      tick={{ fill: '#c4b5fd', fontSize: 12 }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e9d5ff'
                      }}
                    />
                    <Bar dataKey="progress" name="Progreso (%)" radius={[8, 8, 0, 0]}>
                      {data.charts.progress_by_course.slice(0, 10).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.progress >= 80 ? COLORS.success :
                            entry.progress >= 50 ? COLORS.warning :
                            COLORS.info
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            {/* Courses List */}
            <div className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl border border-carbon-600 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-carbon-900/50 border-b border-carbon-600">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Curso</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Asignados</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Completados</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">En Progreso</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Progreso Promedio</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Tiempo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-carbon-600">
                    {data.courses.map((course, index) => (
                      <motion.tr
                        key={course.course_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-carbon-700/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="text-white font-medium">{course.course_title}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-carbon-300">{course.total_assigned}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-green-400 font-medium">{course.completed}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-yellow-400 font-medium">{course.in_progress}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-carbon-600 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${course.average_progress}%` }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                className="h-full bg-gradient-to-r from-primary to-success rounded-full"
                              />
                            </div>
                            <span className="text-sm text-white font-medium">{course.average_progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-carbon-300">{course.total_time_hours}h</span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Time by Course Chart */}
            {data.charts.time_by_course.length > 0 && (
              <div className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-6 border border-carbon-600">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Tiempo Dedicado por Curso
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={data.charts.time_by_course.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                    <XAxis
                      dataKey="course_title"
                      stroke="#a78bfa"
                      tick={{ fill: '#c4b5fd', fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis
                      stroke="#a78bfa"
                      tick={{ fill: '#c4b5fd', fontSize: 12 }}
                      label={{ value: 'Horas', angle: -90, position: 'insideLeft', fill: '#c4b5fd' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e9d5ff'
                      }}
                    />
                    <Bar dataKey="total_hours" name="Horas" fill={COLORS.secondary} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-4 border border-carbon-600 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-carbon-400" />
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-carbon-600 border border-carbon-500 rounded-lg text-white placeholder-carbon-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="px-4 py-2 bg-carbon-600 border border-carbon-500 rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              >
                <option value="all">Todos los roles</option>
                <option value="owner">Propietario</option>
                <option value="admin">Administrador</option>
                <option value="member">Miembro</option>
              </select>
            </div>

            {/* Users Table */}
            <div className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl border border-carbon-600 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-carbon-900/50 border-b border-carbon-600">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Usuario</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Rol</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Cursos</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Completados</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Progreso</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Tiempo</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Certificados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-carbon-600">
                    {filteredUsers.map((user, index) => (
                      <motion.tr
                        key={user.user_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-carbon-700/50 transition-colors"
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
                              <p className="text-white font-medium">{user.display_name}</p>
                              <p className="text-carbon-400 text-xs">{user.email}</p>
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
                          <span className="text-carbon-300">{user.courses_assigned}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-green-400 font-medium">{user.courses_completed}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-carbon-600 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${user.average_progress}%` }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                className="h-full bg-gradient-to-r from-primary to-success rounded-full"
                              />
                            </div>
                            <span className="text-sm text-white font-medium">{user.average_progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-carbon-300">{user.time_spent_hours}h</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4 text-purple-400" />
                            <span className="text-carbon-300">{user.certificates_count}</span>
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
              <div className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-6 border border-carbon-600">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Top 10 Usuarios por Progreso
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={data.charts.progress_by_user} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                    <XAxis
                      type="number"
                      stroke="#a78bfa"
                      tick={{ fill: '#c4b5fd', fontSize: 12 }}
                      domain={[0, 100]}
                    />
                    <YAxis
                      type="category"
                      dataKey="display_name"
                      stroke="#a78bfa"
                      tick={{ fill: '#c4b5fd', fontSize: 12 }}
                      width={150}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e9d5ff'
                      }}
                    />
                    <Bar dataKey="progress" name="Progreso (%)" fill={COLORS.primary} radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            {/* Completion Trends */}
            {data.charts.completion_trends.length > 0 && (
              <div className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-6 border border-carbon-600">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Tendencias de Completación
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={data.charts.completion_trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                    <XAxis
                      dataKey="month"
                      stroke="#a78bfa"
                      tick={{ fill: '#c4b5fd', fontSize: 12 }}
                      tickFormatter={formatMonth}
                    />
                    <YAxis
                      stroke="#a78bfa"
                      tick={{ fill: '#c4b5fd', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e9d5ff'
                      }}
                      labelFormatter={(label) => formatMonth(label)}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Cursos Completados"
                      stroke={COLORS.success}
                      strokeWidth={3}
                      dot={{ fill: COLORS.success, r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

