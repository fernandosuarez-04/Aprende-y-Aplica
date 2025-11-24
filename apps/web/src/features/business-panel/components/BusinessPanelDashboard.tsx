'use client'

import { useState, useEffect, Suspense, lazy, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  TrendingUp,
  Activity as ActivityIcon,
  Clock,
  User as UserIcon
} from 'lucide-react'
import Image from 'next/image'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { getBackgroundStyle, generateCSSVariables, hexToRgb } from '../utils/styles'

// Lazy load components
const ParticlesBackground = lazy(() => 
  import('@/app/business-user/dashboard/components/ParticlesBackground').then(m => ({ default: m.ParticlesBackground }))
)

const Background3DEffects = lazy(() => 
  import('@/app/business-user/dashboard/components/Background3DEffects').then(m => ({ default: m.Background3DEffects }))
)

const ModernStatsCard = lazy(() => 
  import('@/app/business-user/dashboard/components/ModernStatsCard').then(m => ({ default: m.ModernStatsCard }))
)

const ProgressBar3D = lazy(() => 
  import('@/app/business-user/dashboard/components/ProgressBar3D').then(m => ({ default: m.ProgressBar3D }))
)

interface DashboardStats {
  activeUsers: { value: string; change: string; changeType: 'positive' | 'negative' };
  assignedCourses: { value: string; change: string; changeType: 'positive' | 'negative' };
  completed: { value: string; change: string; changeType: 'positive' | 'negative' };
  inProgress: { value: string; change: string; changeType: 'positive' | 'negative' };
}

interface ActivityItem {
  user: string;
  action: string;
  time: string;
  icon: string;
  userPicture?: string;
}

interface CourseProgress {
  label: string;
  progress: number;
  students: number;
  thumbnail?: string;
}

const iconMap: Record<string, typeof Users> = {
  'Users': Users,
  'CheckCircle': CheckCircle,
  'BookOpen': BookOpen,
  'Activity': ActivityIcon,
}

export function BusinessPanelDashboard() {
  const { styles } = useOrganizationStylesContext()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [courses, setCourses] = useState<CourseProgress[]>([])
  const [loading, setLoading] = useState(true)

  // Aplicar estilos personalizados
  const panelStyles = styles?.panel
  const cardStyle = useMemo(() => {
    if (!panelStyles) {
      return {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: 'rgba(71, 85, 105, 0.5)',
        color: undefined as string | undefined
      }
    }

    const cardBg = panelStyles.card_background || '#1e293b'
    const cardOpacity = panelStyles.card_opacity !== undefined ? panelStyles.card_opacity : 0.95
    const borderColor = panelStyles.border_color || 'rgba(71, 85, 105, 0.5)'
    const textColor = panelStyles.text_color

    let backgroundColor: string
    if (cardBg.startsWith('#')) {
      const rgb = hexToRgb(cardBg)
      backgroundColor = `rgba(${rgb}, ${cardOpacity})`
    } else if (cardBg.startsWith('rgba')) {
      const rgbaMatch = cardBg.match(/rgba?\(([^)]+)\)/)
      if (rgbaMatch) {
        const parts = rgbaMatch[1].split(',')
        if (parts.length >= 3) {
          backgroundColor = `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${cardOpacity})`
        } else {
          backgroundColor = cardBg
        }
      } else {
        backgroundColor = cardBg
      }
    } else {
      backgroundColor = cardBg
    }

    return {
      backgroundColor,
      borderColor,
      color: textColor
    }
  }, [panelStyles])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Obtener estadísticas, actividad y progreso en paralelo
        const [statsRes, activityRes, progressRes] = await Promise.all([
          fetch('/api/business/dashboard/stats', { credentials: 'include' }),
          fetch('/api/business/dashboard/activity', { credentials: 'include' }),
          fetch('/api/business/dashboard/progress', { credentials: 'include' })
        ])

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          if (statsData.success && statsData.stats) {
            setStats(statsData.stats)
          }
        }

        if (activityRes.ok) {
          const activityData = await activityRes.json()
          if (activityData.success && activityData.activities) {
            setActivities(activityData.activities)
          }
        }

        if (progressRes.ok) {
          const progressData = await progressRes.json()
          if (progressData.success && progressData.courses) {
            setCourses(progressData.courses)
          }
        }
      } catch (error) {
        // console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Convertir valores de string a number para ModernStatsCard
  const myStats = useMemo(() => {
    const parseValue = (value: string): number => {
      // Remover % y convertir a número
      const num = parseInt(value.replace(/[^0-9]/g, '')) || 0
      return num
    }

    return [
      { 
        label: 'Usuarios Activos', 
        value: parseValue(stats?.activeUsers.value || '0'), 
        icon: Users, 
        color: 'from-blue-500 to-cyan-500' 
      },
      { 
        label: 'Cursos Asignados', 
        value: parseValue(stats?.assignedCourses.value || '0'), 
        icon: BookOpen, 
        color: 'from-purple-500 to-pink-500' 
      },
      { 
        label: 'Completados', 
        value: parseValue(stats?.completed.value || '0'), 
        icon: CheckCircle, 
        color: 'from-green-500 to-emerald-500' 
      },
      { 
        label: 'En Progreso', 
        value: parseValue(stats?.inProgress.value || '0'), 
        icon: TrendingUp, 
        color: 'from-orange-500 to-red-500' 
      },
    ]
  }, [stats])

  return (
    <div className="relative w-full min-h-[calc(100vh-8rem)]">
      {/* Background Effects */}
      <Suspense fallback={null}>
        <ParticlesBackground />
        <Background3DEffects />
      </Suspense>

      <div className="relative z-10 space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-xl border backdrop-blur-sm p-8 shadow-lg"
          style={{
            backgroundColor: cardStyle.backgroundColor,
            borderColor: cardStyle.borderColor,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5" />
          <div className="relative z-10">
            <h1 
              className="text-2xl sm:text-3xl font-bold mb-2"
              style={{ color: cardStyle.color || undefined }}
            >
              ¡Bienvenido de vuelta!
            </h1>
            <p 
              className="text-sm sm:text-base opacity-80"
              style={{ color: cardStyle.color || undefined }}
            >
              Gestiona tu equipo y supervisa el progreso de aprendizaje
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <Suspense fallback={
            <>
              {myStats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="rounded-xl border backdrop-blur-sm p-5 animate-pulse"
                  style={{
                    backgroundColor: cardStyle.backgroundColor,
                    borderColor: cardStyle.borderColor,
                  }}
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-800 mb-3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded mb-2 w-2/3" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                </div>
              ))}
            </>
          }>
            {myStats.map((stat, index) => (
              <ModernStatsCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                index={index}
                styles={panelStyles}
              />
            ))}
          </Suspense>
        </div>

        {/* Recent Activity */}
        <div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl sm:text-2xl font-semibold mb-6"
            style={{ color: cardStyle.color || undefined }}
          >
            Actividad Reciente
          </motion.h2>
          
          <div className="space-y-3">
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border backdrop-blur-sm p-12 text-center"
                style={{
                  backgroundColor: cardStyle.backgroundColor,
                  borderColor: cardStyle.borderColor,
                }}
              >
                <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                <p 
                  className="mt-4 text-sm opacity-70"
                  style={{ color: cardStyle.color || undefined }}
                >
                  Cargando actividad...
                </p>
              </motion.div>
            ) : activities.length > 0 ? (
              activities.map((activity, index) => {
                const Icon = iconMap[activity.icon] || ActivityIcon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                    whileHover={{ x: 4 }}
                    className="flex items-start gap-4 p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 cursor-pointer group"
                    style={{
                      backgroundColor: cardStyle.backgroundColor,
                      borderColor: cardStyle.borderColor,
                    }}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                      <Icon className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p 
                        className="text-sm font-medium mb-1"
                        style={{ color: cardStyle.color || undefined }}
                      >
                        <span className="font-semibold">{activity.user}</span> {activity.action}
                      </p>
                      <p 
                        className="text-xs opacity-70 flex items-center gap-1"
                        style={{ color: cardStyle.color || undefined }}
                      >
                        <Clock className="w-3 h-3" />
                        {activity.time}
                      </p>
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border backdrop-blur-sm p-12 text-center"
                style={{
                  backgroundColor: cardStyle.backgroundColor,
                  borderColor: cardStyle.borderColor,
                }}
              >
                <ActivityIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4 opacity-50" />
                <p 
                  className="text-base sm:text-lg font-medium mb-2"
                  style={{ color: cardStyle.color || undefined }}
                >
                  No hay actividad reciente
                </p>
                <p 
                  className="text-sm opacity-80"
                  style={{ color: cardStyle.color || undefined }}
                >
                  La actividad de tu equipo aparecerá aquí
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Progress Overview */}
        <div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-xl sm:text-2xl font-semibold mb-6"
            style={{ color: cardStyle.color || undefined }}
          >
            Resumen de Progreso
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-xl border backdrop-blur-sm p-6 lg:p-8"
            style={{
              backgroundColor: cardStyle.backgroundColor,
              borderColor: cardStyle.borderColor,
            }}
          >
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                <p 
                  className="mt-4 text-sm opacity-70"
                  style={{ color: cardStyle.color || undefined }}
                >
                  Cargando progreso...
                </p>
              </div>
            ) : courses.length > 0 ? (
              <div className="space-y-6">
                {courses.map((course, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.5, duration: 0.4 }}
                    className="space-y-3"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="text-base font-semibold mb-2"
                          style={{ color: cardStyle.color || undefined }}
                        >
                          {course.label}
                        </h3>
                        <div className="flex items-center gap-4 text-sm">
                          <span 
                            className="opacity-70 flex items-center gap-1"
                            style={{ color: cardStyle.color || undefined }}
                          >
                            <UserIcon className="w-4 h-4" />
                            {course.students} estudiantes
                          </span>
                          <span 
                            className="font-semibold"
                            style={{ 
                              color: 'var(--org-primary-button-color, #3b82f6)' 
                            }}
                          >
                            {course.progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <Suspense fallback={
                      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    }>
                      <ProgressBar3D
                        progress={course.progress}
                        delay={index * 0.1}
                      />
                    </Suspense>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4 opacity-50" />
                <p 
                  className="text-base sm:text-lg font-medium mb-2"
                  style={{ color: cardStyle.color || undefined }}
                >
                  No hay cursos asignados aún
                </p>
                <p 
                  className="text-sm opacity-80"
                  style={{ color: cardStyle.color || undefined }}
                >
                  Los cursos que asignes aparecerán aquí
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}