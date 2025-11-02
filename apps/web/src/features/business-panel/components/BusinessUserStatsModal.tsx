'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BarChart3, TrendingUp, BookOpen, Award, Clock, FileText, Target, CheckCircle, PlayCircle, XCircle } from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'
import Image from 'next/image'
import { BusinessUser } from '../services/businessUsers.service'

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
  courses_data: Array<{
    course_id: string
    course_title: string
    progress: number
    status: string
    enrolled_at: string
    completed_at: string | null
    has_certificate: boolean
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
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'progress' | 'activity'>('overview')

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

  if (!isOpen || !user) return null

  const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-carbon-900/80 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="relative rounded-2xl shadow-2xl border w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col z-10"
          style={{
            backgroundColor: '#1e293b',
            borderColor: '#334155'
          }}
        >
          {/* Header */}
          <div className="relative border-b p-6" style={{
            backgroundColor: '#0f172a',
            borderColor: '#334155'
          }}>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                {user.profile_picture_url ? (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary flex-shrink-0">
                    <Image
                      src={user.profile_picture_url}
                      alt={displayName}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-success rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 border-2 border-primary">
                    {(user.first_name?.[0] || user.username[0]).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Estadísticas de {displayName}
                  </h2>
                  <p className="text-sm text-gray-300 mt-0.5">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                style={{
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="border-b" style={{ borderColor: '#334155' }}>
              <div className="flex gap-2 p-4">
                {[
                  { id: 'overview', label: 'Resumen', icon: BarChart3 },
                  { id: 'courses', label: 'Cursos', icon: BookOpen },
                  { id: 'progress', label: 'Progreso', icon: TrendingUp },
                  { id: 'activity', label: 'Actividad', icon: Clock }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
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
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <p className="text-red-400">{error}</p>
                </div>
              ) : stats ? (
                <>
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Stats Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-4 border border-carbon-600"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <BookOpen className="w-5 h-5 text-blue-400" />
                            <span className="text-2xl font-bold text-white">{stats.total_courses}</span>
                          </div>
                          <p className="text-sm text-carbon-400">Total Cursos</p>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-4 border border-carbon-600"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="text-2xl font-bold text-white">{stats.completed_courses}</span>
                          </div>
                          <p className="text-sm text-carbon-400">Completados</p>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-4 border border-carbon-600"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Clock className="w-5 h-5 text-yellow-400" />
                            <span className="text-2xl font-bold text-white">{stats.total_time_spent_hours}h</span>
                          </div>
                          <p className="text-sm text-carbon-400">Tiempo Total</p>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-4 border border-carbon-600"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Award className="w-5 h-5 text-purple-400" />
                            <span className="text-2xl font-bold text-white">{stats.certificates_count}</span>
                          </div>
                          <p className="text-sm text-carbon-400">Certificados</p>
                        </motion.div>
                      </div>

                      {/* Progress Overview */}
                      <div className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-6 border border-carbon-600">
                        <h3 className="text-lg font-bold text-white mb-4">Progreso General</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm text-carbon-300">Progreso Promedio</span>
                              <span className="text-sm font-semibold text-white">{stats.average_progress}%</span>
                            </div>
                            <div className="w-full h-3 bg-carbon-600 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${stats.average_progress}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="h-full bg-gradient-to-r from-primary to-success rounded-full"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mt-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-400">{stats.completed_courses}</div>
                              <div className="text-xs text-carbon-400 mt-1">Completados</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-yellow-400">{stats.in_progress_courses}</div>
                              <div className="text-xs text-carbon-400 mt-1">En Progreso</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-carbon-400">{stats.not_started_courses}</div>
                              <div className="text-xs text-carbon-400 mt-1">No Iniciados</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Distribution Chart Placeholder */}
                      <div className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-6 border border-carbon-600">
                        <h3 className="text-lg font-bold text-white mb-4">Distribución de Cursos</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#065f46' }}>
                            <div className="text-3xl font-bold text-green-400 mb-1">{stats.distribution.completed}</div>
                            <div className="text-xs text-green-300">Completados</div>
                          </div>
                          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#78350f' }}>
                            <div className="text-3xl font-bold text-yellow-400 mb-1">{stats.distribution.in_progress}</div>
                            <div className="text-xs text-yellow-300">En Progreso</div>
                          </div>
                          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#1e293b' }}>
                            <div className="text-3xl font-bold text-carbon-400 mb-1">{stats.distribution.not_started}</div>
                            <div className="text-xs text-carbon-400">No Iniciados</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Courses Tab */}
                  {activeTab === 'courses' && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl border border-carbon-600 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-carbon-900/50 border-b border-carbon-600">
                              <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Curso</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Progreso</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Estado</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Tiempo</th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-carbon-300">Certificado</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-carbon-600">
                              {stats.courses_data.map((course, index) => {
                                const timeData = stats.time_by_course.find(t => t.course_id === course.course_id)
                                return (
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
                                      <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 bg-carbon-600 rounded-full overflow-hidden">
                                          <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${course.progress}%` }}
                                            transition={{ duration: 0.5, delay: index * 0.05 }}
                                            className="h-full bg-gradient-to-r from-primary to-success"
                                          />
                                        </div>
                                        <span className="text-sm text-white font-medium">{course.progress}%</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        course.status === 'completed'
                                          ? 'bg-green-500/20 text-green-400'
                                          : course.progress > 0
                                          ? 'bg-yellow-500/20 text-yellow-400'
                                          : 'bg-carbon-600 text-carbon-400'
                                      }`}>
                                        {course.status === 'completed' ? 'Completado' :
                                         course.progress > 0 ? 'En Progreso' : 'No Iniciado'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="text-carbon-300 text-sm">
                                        {timeData ? `${timeData.total_hours}h` : '0h'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      {course.has_certificate ? (
                                        <Award className="w-5 h-5 text-purple-400 mx-auto" />
                                      ) : (
                                        <span className="text-carbon-500">-</span>
                                      )}
                                    </td>
                                  </motion.tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Progress Tab */}
                  {activeTab === 'progress' && (
                    <div className="space-y-6">
                      {/* Progress by Course Chart */}
                      <div className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-6 border border-carbon-600">
                        <h3 className="text-lg font-bold text-white mb-4">Progreso por Curso</h3>
                        <div className="space-y-4">
                          {stats.courses_data.map((course, index) => (
                            <div key={course.course_id}>
                              <div className="flex justify-between mb-2">
                                <span className="text-sm text-carbon-300 truncate flex-1 mr-2">{course.course_title}</span>
                                <span className="text-sm font-semibold text-white">{course.progress}%</span>
                              </div>
                              <div className="w-full h-4 bg-carbon-600 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${course.progress}%` }}
                                  transition={{ duration: 0.8, delay: index * 0.1 }}
                                  className="h-full bg-gradient-to-r from-primary to-success rounded-full"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Time by Course */}
                      <div className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-6 border border-carbon-600">
                        <h3 className="text-lg font-bold text-white mb-4">Tiempo Dedicado por Curso</h3>
                        <div className="space-y-4">
                          {stats.time_by_course.map((item, index) => {
                            const maxTime = Math.max(...stats.time_by_course.map(t => t.total_hours), 1)
                            const percentage = (item.total_hours / maxTime) * 100
                            
                            return (
                              <div key={item.course_id}>
                                <div className="flex justify-between mb-2">
                                  <span className="text-sm text-carbon-300 truncate flex-1 mr-2">{item.course_title}</span>
                                  <span className="text-sm font-semibold text-white">{item.total_hours}h</span>
                                </div>
                                <div className="w-full h-4 bg-carbon-600 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 0.8, delay: index * 0.1 }}
                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Activity Tab */}
                  {activeTab === 'activity' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-6 border border-carbon-600">
                          <div className="flex items-center gap-3 mb-4">
                            <FileText className="w-6 h-6 text-blue-400" />
                            <h3 className="text-lg font-bold text-white">Notas</h3>
                          </div>
                          <div className="text-3xl font-bold text-white">{stats.notes_count}</div>
                          <p className="text-sm text-carbon-400 mt-1">Notas creadas</p>
                        </div>

                        <div className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-6 border border-carbon-600">
                          <div className="flex items-center gap-3 mb-4">
                            <Target className="w-6 h-6 text-purple-400" />
                            <h3 className="text-lg font-bold text-white">Asignaciones</h3>
                          </div>
                          <div className="text-3xl font-bold text-white">{stats.total_assignments}</div>
                          <p className="text-sm text-carbon-400 mt-1">
                            {stats.completed_assignments} completadas
                          </p>
                        </div>
                      </div>

                      {/* Completed by Month */}
                      {stats.completed_by_month.length > 0 && (
                        <div className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-6 border border-carbon-600">
                          <h3 className="text-lg font-bold text-white mb-4">Cursos Completados por Mes</h3>
                          <div className="space-y-3">
                            {stats.completed_by_month.map((item, index) => {
                              const maxCount = Math.max(...stats.completed_by_month.map(m => m.count), 1)
                              const percentage = (item.count / maxCount) * 100
                              
                              return (
                                <div key={item.month}>
                                  <div className="flex justify-between mb-2">
                                    <span className="text-sm text-carbon-300">{formatMonth(item.month)}</span>
                                    <span className="text-sm font-semibold text-white">{item.count} curso{item.count !== 1 ? 's' : ''}</span>
                                  </div>
                                  <div className="w-full h-3 bg-carbon-600 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${percentage}%` }}
                                      transition={{ duration: 0.8, delay: index * 0.1 }}
                                      className="h-full bg-gradient-to-r from-primary to-success rounded-full"
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
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

