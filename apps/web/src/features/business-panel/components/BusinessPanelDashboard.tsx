'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  TrendingUp
} from 'lucide-react'
import { Card, CardContent } from '@aprende-y-aplica/ui'

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
}

interface CourseProgress {
  label: string;
  progress: number;
  students: number;
}

const iconMap: Record<string, typeof Users> = {
  'Users': Users,
  'CheckCircle': CheckCircle,
  'BookOpen': BookOpen,
}

export function BusinessPanelDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [courses, setCourses] = useState<CourseProgress[]>([])
  const [loading, setLoading] = useState(true)

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
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Estadísticas con valores por defecto mientras carga
  const statsData = stats ? [
    {
      name: 'Usuarios Activos',
      value: stats.activeUsers.value,
      change: stats.activeUsers.change,
      changeType: stats.activeUsers.changeType,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Cursos Asignados',
      value: stats.assignedCourses.value,
      change: stats.assignedCourses.change,
      changeType: stats.assignedCourses.changeType,
      icon: BookOpen,
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Completados',
      value: stats.completed.value,
      change: stats.completed.change,
      changeType: stats.completed.changeType,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      name: 'En Progreso',
      value: stats.inProgress.value,
      change: stats.inProgress.change,
      changeType: stats.inProgress.changeType,
      icon: TrendingUp,
      gradient: 'from-orange-500 to-red-500'
    },
  ] : [
    {
      name: 'Usuarios Activos',
      value: '0',
      change: '0%',
      changeType: 'positive' as const,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Cursos Asignados',
      value: '0',
      change: '0',
      changeType: 'positive' as const,
      icon: BookOpen,
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Completados',
      value: '0',
      change: '0%',
      changeType: 'positive' as const,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      name: 'En Progreso',
      value: '0%',
      change: '0%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      gradient: 'from-orange-500 to-red-500'
    },
  ]

  return (
    <div className="w-full space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-8 shadow-xl"
        style={{
          backgroundImage: `linear-gradient(to right, var(--org-primary-button-color, #3b82f6)20, var(--org-secondary-button-color, #10b981)10, var(--org-primary-button-color, #3b82f6)20)`,
          borderColor: 'var(--org-primary-button-color, #3b82f6)55'
        }}
      >
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10">
          <h1 
            className="text-4xl font-bold mb-3 bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(to right, var(--org-primary-button-color, #3b82f6), var(--org-secondary-button-color, #10b981))`
            }}
          >
            ¡Bienvenido de vuelta!
          </h1>
          <p className="text-carbon-200 text-lg">
            Gestiona tu equipo y supervisa el progreso de aprendizaje
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="relative group"
            >
              <Card variant="glassmorphism" className="h-full border-carbon-600 transition-all duration-300" onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--org-primary-button-color, #3b82f6)88'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = ''; }}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                      style={{
                        backgroundImage: `linear-gradient(to bottom right, var(--org-primary-button-color, #3b82f6), var(--org-accent-color, #60a5fa))`
                      }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                      stat.changeType === 'positive' 
                        ? 'text-green-400 bg-green-400/10' 
                        : 'text-red-400 bg-red-400/10'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-carbon-400 text-sm mb-2">{stat.name}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div>
          <h2 className="text-2xl font-bold text-white mb-6">Actividad Reciente</h2>
          <div className="space-y-4">
            {loading ? (
              <div className="text-carbon-400 text-center py-8">Cargando actividad...</div>
            ) : activities.length > 0 ? (
              activities.map((activity, index) => {
                const Icon = iconMap[activity.icon] || CheckCircle
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 5 }}
                    className="flex items-start gap-4 p-4 bg-gradient-to-r from-carbon-700/50 to-carbon-800/50 rounded-xl border border-carbon-600/50 transition-all duration-300 cursor-pointer"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--org-primary-button-color, #3b82f6)55'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = ''; }}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--org-primary-button-color, #3b82f6)33' }}>
                      <Icon className="w-5 h-5" style={{ color: 'var(--org-primary-button-color, #3b82f6)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm">
                        <span className="font-semibold">{activity.user}</span> {activity.action}
                      </p>
                      <p className="text-carbon-400 text-xs mt-1">{activity.time}</p>
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <div className="text-carbon-400 text-center py-8">No hay actividad reciente</div>
            )}
          </div>
        </div>

      {/* Progress Overview */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Resumen de Progreso</h2>
        <Card variant="glassmorphism" className="border-carbon-600">
          <CardContent className="p-8">
            {loading ? (
              <div className="text-carbon-400 text-center py-8">Cargando progreso...</div>
            ) : courses.length > 0 ? (
              <div className="space-y-6">
                {courses.map((course, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium">{course.label}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-carbon-400 text-sm">{course.students} estudiantes</span>
                        <span className="font-semibold" style={{ color: 'var(--org-primary-button-color, #3b82f6)' }}>{course.progress}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-carbon-600 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${course.progress}%` }}
                        transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                        className="h-full bg-gradient-to-r from-primary to-success rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-carbon-400 text-center py-8">No hay cursos asignados aún</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

