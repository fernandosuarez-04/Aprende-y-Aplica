'use client'

import { motion } from 'framer-motion'
import { 
  UsersIcon, 
  BookOpenIcon, 
  CheckCircleIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  ClockIcon,
  PlusIcon,
  Cog6ToothIcon,
  RocketLaunchIcon,
  AcademicCapIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import Link from 'next/link'

// ============================================
// COMPONENTE: StatCard Premium
// ============================================
interface StatCardProps {
  title: string
  value: string | number
  change: number
  icon: React.ComponentType<any>
  gradient: string
  delay: number
  href?: string
}

function StatCard({ title, value, change, icon: Icon, gradient, delay, href }: StatCardProps) {
  const isPositive = change >= 0

  const CardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: delay * 0.1,
        duration: 0.5,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        y: -5,
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className="relative group overflow-hidden rounded-2xl bg-[#1E2329] border border-[#6C757D]/20 p-6 cursor-pointer"
    >
      {/* Gradient Background Effect */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`} />
      
      {/* Glow Effect */}
      <motion.div 
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[#00D4B3]/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
      />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <motion.div 
            className={`p-3 rounded-xl ${gradient} shadow-lg`}
            whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
          >
            <Icon className="h-6 w-6 text-white" />
          </motion.div>
          
          {/* Change Badge */}
          <motion.div 
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              isPositive 
                ? 'bg-[#10B981]/20 text-[#10B981]' 
                : 'bg-red-500/20 text-red-400'
            }`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay * 0.1 + 0.3, type: "spring" }}
          >
            {isPositive ? (
              <ArrowTrendingUpIcon className="h-3.5 w-3.5" />
            ) : (
              <ArrowTrendingDownIcon className="h-3.5 w-3.5" />
            )}
            {isPositive ? '+' : ''}{change}%
          </motion.div>
        </div>
        
        <motion.h3 
          className="text-3xl font-bold text-white mb-1 tracking-tight"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay * 0.1 + 0.2 }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </motion.h3>
        
        <p className="text-[#6C757D] text-sm font-medium">{title}</p>
        
        {/* Animated line */}
        <motion.div 
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#00D4B3] to-[#0A2540]"
          initial={{ width: 0 }}
          animate={{ width: '30%' }}
          transition={{ delay: delay * 0.1 + 0.4, duration: 0.8 }}
        />
      </div>
    </motion.div>
  )

  if (href) {
    return <Link href={href}>{CardContent}</Link>
  }

  return CardContent
}

// ============================================
// COMPONENTE: Quick Action Button
// ============================================
interface QuickActionProps {
  title: string
  description: string
  icon: React.ComponentType<any>
  href: string
  color: string
  delay: number
}

function QuickAction({ title, description, icon: Icon, href, color, delay }: QuickActionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay * 0.1 + 0.5, duration: 0.4 }}
    >
      <Link href={href}>
        <motion.div
          whileHover={{ x: 5, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-4 p-4 rounded-xl bg-[#1E2329]/50 border border-[#6C757D]/20 hover:border-[#00D4B3]/50 transition-all duration-300 group"
        >
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-white font-semibold text-sm group-hover:text-[#00D4B3] transition-colors">
              {title}
            </h4>
            <p className="text-[#6C757D] text-xs mt-0.5">{description}</p>
          </div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileHover={{ opacity: 1, x: 0 }}
            className="text-[#00D4B3]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.div>
        </motion.div>
      </Link>
    </motion.div>
  )
}

// ============================================
// COMPONENTE: Activity Item
// ============================================
interface ActivityItemProps {
  title: string
  description: string
  user: string
  timestamp: string
  type: string
  delay: number
}

function ActivityItem({ title, description, user, timestamp, type, delay }: ActivityItemProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user': return 'bg-[#0A2540] border-[#0A2540]/50'
      case 'course': return 'bg-[#10B981] border-[#10B981]/50'
      case 'certificate': return 'bg-[#00D4B3] border-[#00D4B3]/50'
      case 'progress': return 'bg-[#F59E0B] border-[#F59E0B]/50'
      default: return 'bg-[#6C757D] border-[#6C757D]/50'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay * 0.08, duration: 0.4 }}
      whileHover={{ x: 5 }}
      className="flex items-start gap-4 p-4 rounded-xl hover:bg-[#1E2329]/80 transition-all duration-300 border-l-2 border-transparent hover:border-[#00D4B3]"
    >
      <div className={`w-2 h-2 mt-2 rounded-full ${getTypeColor(type)}`} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-4">
          <h4 className="text-white font-medium text-sm truncate">{title}</h4>
          <div className="flex items-center gap-1 text-[#6C757D] text-xs whitespace-nowrap">
            <ClockIcon className="h-3.5 w-3.5" />
            {timestamp}
          </div>
        </div>
        <p className="text-[#6C757D] text-xs mt-1 line-clamp-1">{description}</p>
        <p className="text-[#00D4B3] text-xs mt-1 font-medium">por {user}</p>
      </div>
    </motion.div>
  )
}

// ============================================
// COMPONENTE PRINCIPAL: BusinessPanelDashboard
// ============================================
export function BusinessPanelDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Actualizar la hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Cargar estadísticas
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/business/dashboard/stats', { credentials: 'include' })
        const data = await res.json()
        if (data.success && data.stats) {
          setStats(data.stats)
        }
      } catch (err) {
        console.error('Error fetching stats:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  // Cargar actividad reciente
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch('/api/business/dashboard/activity?limit=8', { credentials: 'include' })
        const data = await res.json()
        if (data.success && data.activities) {
          setActivities(data.activities)
        }
      } catch (err) {
        console.error('Error fetching activities:', err)
      } finally {
        setActivitiesLoading(false)
      }
    }
    fetchActivities()
    const interval = setInterval(fetchActivities, 30000)
    return () => clearInterval(interval)
  }, [])

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const getUserName = () => {
    return 'Administrador'
  }

  // Helper function para formatear timestamps
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'Hace un momento'
      if (diffMins < 60) return `Hace ${diffMins} min`
      if (diffHours < 24) return `Hace ${diffHours}h`
      if (diffDays < 7) return `Hace ${diffDays}d`
      return date.toLocaleDateString('es-MX')
    } catch {
      return 'Hace un momento'
    }
  }

  const statsData = stats ? [
    {
      title: 'Usuarios Activos',
      value: typeof stats.activeUsers === 'object' ? stats.activeUsers.value : (stats.activeUsers || 0),
      change: typeof stats.activeUsers === 'object' ? parseFloat(stats.activeUsers.change) : 0,
      icon: UsersIcon,
      gradient: 'bg-gradient-to-br from-[#0A2540] to-[#0A2540]/80',
      href: '/business-panel/users'
    },
    {
      title: 'Cursos Asignados',
      value: typeof stats.assignedCourses === 'object' ? stats.assignedCourses.value : (stats.assignedCourses || 0),
      change: typeof stats.assignedCourses === 'object' ? parseFloat(stats.assignedCourses.change) : 0,
      icon: BookOpenIcon,
      gradient: 'bg-gradient-to-br from-[#10B981] to-[#10B981]/80',
      href: '/business-panel/courses'
    },
    {
      title: 'Completados',
      value: typeof stats.completed === 'object' ? stats.completed.value : (stats.completed || stats.completedCourses || 0),
      change: typeof stats.completed === 'object' ? parseFloat(stats.completed.change) : 0,
      icon: CheckCircleIcon,
      gradient: 'bg-gradient-to-br from-[#00D4B3] to-[#00D4B3]/80',
    },
    {
      title: 'Progreso Promedio',
      value: typeof stats.inProgress === 'object' ? stats.inProgress.value : `${stats.averageProgress || 0}%`,
      change: typeof stats.inProgress === 'object' ? parseFloat(stats.inProgress.change) : 0,
      icon: ChartBarIcon,
      gradient: 'bg-gradient-to-br from-[#F59E0B] to-[#F59E0B]/80',
    },
    {
      title: 'Certificados',
      value: stats.certificates || 0,
      change: stats.certificateGrowth || 0,
      icon: AcademicCapIcon,
      gradient: 'bg-gradient-to-br from-[#8B5CF6] to-[#8B5CF6]/80',
    },
    {
      title: 'Engagement',
      value: `${stats.engagementRate || 0}%`,
      change: stats.engagementGrowth || 0,
      icon: UserGroupIcon,
      gradient: 'bg-gradient-to-br from-[#EC4899] to-[#EC4899]/80',
    },
  ] : []

  const quickActions = [
    {
      title: 'Gestionar Usuarios',
      description: 'Administra tu equipo',
      icon: UsersIcon,
      href: '/business-panel/users',
      color: 'bg-[#0A2540]'
    },
    {
      title: 'Asignar Cursos',
      description: 'Asigna talleres a usuarios',
      icon: PlusIcon,
      href: '/business-panel/courses',
      color: 'bg-[#10B981]'
    },
    {
      title: 'Ver Reportes',
      description: 'Analytics y métricas',
      icon: ChartBarIcon,
      href: '/business-panel/reports',
      color: 'bg-[#00D4B3]'
    },
    {
      title: 'Configuración',
      description: 'Branding y ajustes',
      icon: Cog6ToothIcon,
      href: '/business-panel/settings',
      color: 'bg-[#8B5CF6]'
    },
  ]

  return (
    <div className="p-6 lg:p-8 bg-[#0F1419] min-h-screen">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A2540] via-[#0A2540] to-[#0A2540]/90 p-8 mb-8"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00D4B3] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00D4B3] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>
        
        {/* Animated Particles */}
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-10 right-20 w-2 h-2 bg-[#00D4B3] rounded-full"
        />
        <motion.div
          animate={{ 
            y: [0, 10, 0],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          className="absolute bottom-10 right-40 w-3 h-3 bg-[#00D4B3] rounded-full"
        />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <SparklesIcon className="h-6 w-6 text-[#00D4B3]" />
            </motion.div>
            <span className="text-[#00D4B3] text-sm font-medium tracking-wide uppercase">
              Panel Empresarial
            </span>
          </div>
          
          <motion.h1 
            className="text-3xl lg:text-4xl font-bold text-white mb-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {getGreeting()}, {getUserName()}
          </motion.h1>
          
          <motion.p 
            className="text-white/70 text-lg max-w-xl"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            Gestiona el aprendizaje de tu equipo y supervisa su progreso.
          </motion.p>
          
          {/* Date & Status */}
          <motion.div 
            className="flex items-center gap-6 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <ClockIcon className="h-4 w-4" />
              {currentTime.toLocaleDateString('es-MX', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
              <span className="text-[#10B981] text-sm font-medium">Sistema Activo</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-3 space-y-8">
          {/* Stats Grid */}
          <section>
            <motion.div 
              className="flex items-center justify-between mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div>
                <h2 className="text-xl font-bold text-white">Estadísticas Generales</h2>
                <p className="text-[#6C757D] text-sm mt-1">Métricas clave de tu equipo</p>
              </div>
            </motion.div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-36 bg-[#1E2329] rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statsData.map((stat, index) => (
                  <StatCard
                    key={stat.title}
                    title={stat.title}
                    value={stat.value}
                    change={stat.change}
                    icon={stat.icon}
                    gradient={stat.gradient}
                    delay={index}
                    href={stat.href}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Activity Section */}
          <section>
            <motion.div 
              className="flex items-center justify-between mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div>
                <h2 className="text-xl font-bold text-white">Actividad Reciente</h2>
                <p className="text-[#6C757D] text-sm mt-1">Últimas acciones de tu equipo</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-[#1E2329] rounded-2xl border border-[#6C757D]/20 overflow-hidden"
            >
              {activitiesLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="w-2 h-2 mt-2 rounded-full bg-[#6C757D]/30" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-[#6C757D]/20 rounded w-3/4" />
                        <div className="h-3 bg-[#6C757D]/20 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="p-12 text-center">
                  <ClockIcon className="h-12 w-12 text-[#6C757D]/50 mx-auto mb-4" />
                  <p className="text-[#6C757D]">No hay actividad reciente</p>
                </div>
              ) : (
                <div className="divide-y divide-[#6C757D]/10">
                  {activities.map((activity, index) => (
                    <ActivityItem
                      key={index}
                      title={activity.title || 'Actividad'}
                      description={activity.description || 'Sin descripción'}
                      user={activity.user || 'Usuario'}
                      timestamp={activity.timestamp ? formatTimestamp(activity.timestamp) : 'Hace un momento'}
                      type={activity.type || 'system'}
                      delay={index}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </section>
        </div>

        {/* Sidebar - Quick Actions */}
        <div className="xl:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="sticky top-24"
          >
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white">Acciones Rápidas</h2>
              <p className="text-[#6C757D] text-sm mt-1">Accesos directos</p>
            </div>
            
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <QuickAction
                  key={action.title}
                  title={action.title}
                  description={action.description}
                  icon={action.icon}
                  href={action.href}
                  color={action.color}
                  delay={index}
                />
              ))}
            </div>

            {/* System Health Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-[#10B981]/20 to-[#10B981]/5 border border-[#10B981]/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-2 bg-[#10B981] rounded-lg"
                >
                  <RocketLaunchIcon className="h-5 w-5 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-white font-semibold">Cuenta Activa</h3>
                  <p className="text-[#10B981] text-xs">Todos los servicios operativos</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6C757D]">Usuarios</span>
                  <span className="text-[#10B981] font-medium">
                    {typeof stats?.activeUsers === 'object' ? stats.activeUsers.value : (stats?.activeUsers || 0)} activos
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6C757D]">Cursos</span>
                  <span className="text-[#10B981] font-medium">
                    {typeof stats?.assignedCourses === 'object' ? stats.assignedCourses.value : (stats?.assignedCourses || 0)} asignados
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6C757D]">Sistema</span>
                  <span className="text-[#10B981] font-medium">Operativo</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}