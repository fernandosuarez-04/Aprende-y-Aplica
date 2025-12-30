'use client'
import Image from 'next/image'
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
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTour } from '@/features/tours/hooks/useBusinessPanelTour'

// ============================================
// COMPONENTE: StatCard Premium
// ============================================
// ============================================
// COMPONENTE: StatCard Premium con Efectos Avanzados
// ============================================
interface StatCardProps {
  title: string
  value: string | number
  change: number
  backgroundImage?: string
  gradient: string
  gradientStyle?: React.CSSProperties
  delay: number
  href?: string
  id?: string
}

function StatCard({ title, value, change, backgroundImage, gradient, gradientStyle, delay, href, id }: StatCardProps) {
  const isPositive = change >= 0

  const CardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: delay * 0.08,
        duration: 0.4,
        ease: 'easeOut'
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative group overflow-hidden rounded-3xl cursor-pointer h-40"
      id={id}
      style={{
        backgroundColor: 'var(--org-card-background, #1E2329)'
      }}
    >
      {/* Border */}
      <div className="absolute inset-0 rounded-3xl border border-white/10 group-hover:border-white/20 transition-colors duration-300" />

      {/* Background Image with Overlay */}
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={backgroundImage}
            alt={title}
            fill
            className="object-cover opacity-70 group-hover:opacity-80 transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--org-card-background,#1E2329)]/70 via-[var(--org-card-background,#1E2329)]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--org-card-background,#1E2329)]/80 via-transparent to-transparent" />
        </div>
      )}

      {/* Content Container */}
      <div className="relative z-10 p-5 h-full flex flex-col justify-between">
        {/* Top Row: Indicator + Badge */}
        <div className="flex items-start justify-between">
          {/* Visual Indicator */}
          <div
            className="p-2.5 rounded-xl backdrop-blur-md border border-white/10"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <div
              className="w-8 h-1.5 rounded-full"
              style={gradientStyle}
            />
          </div>

          {/* Change Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border ${isPositive
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              }`}
          >
            {isPositive ? (
              <ArrowTrendingUpIcon className="h-4 w-4" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4" />
            )}
            <span>{isPositive ? '+' : ''}{change}%</span>
          </div>
        </div>

        {/* Bottom Row: Value + Title */}
        <div className="space-y-1">
          <h3
            className="text-4xl font-black tracking-tight"
            style={{
              color: 'var(--org-text-color, #FFFFFF)'
            }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>

          <p
            className="text-sm font-semibold tracking-wide uppercase opacity-80"
            style={{
              color: 'var(--org-border-color, #9CA3AF)',
              letterSpacing: '0.05em'
            }}
          >
            {title}
          </p>
        </div>

        {/* Progress Bar at Bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <div
            className="h-full rounded-r-full w-[60%]"
            style={{
              background: `linear-gradient(90deg, ${gradientStyle?.background || 'var(--org-accent-color, #00D4B3)'}, transparent)`
            }}
          />
        </div>
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
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay * 0.05 + 0.3, duration: 0.3 }}
    >
      <Link href={href}>
        <div
          className="flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 hover:scale-[1.01] hover:brightness-110 group cursor-pointer"
          style={{
            backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 35, 41), 0.5)',
            borderColor: 'var(--org-border-color, #6C757D)33'
          }}
        >
          <div
            className="p-3 rounded-lg transition-colors"
            style={{ backgroundColor: color }}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h4
              className="font-semibold text-sm transition-colors"
              style={{ color: 'var(--org-text-color, #FFFFFF)' }}
            >
              {title}
            </h4>
            <p
              className="text-xs mt-0.5 opacity-80"
              style={{ color: 'var(--org-border-color, #6C757D)' }}
            >
              {description}
            </p>
          </div>
          <div
            className="opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-[-5px] group-hover:translate-x-0"
            style={{ color: 'var(--org-accent-color, #00D4B3)' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
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
      case 'user': return 'var(--org-primary-button-color, #0A2540)'
      case 'course': return 'var(--org-secondary-button-color, #10B981)'
      case 'certificate': return 'var(--org-accent-color, #00D4B3)'
      case 'progress': return '#F59E0B'
      default: return 'var(--org-border-color, #6C757D)'
    }
  }

  return (
    <div
      className="flex items-start gap-4 p-4 rounded-xl transition-all duration-200 hover:bg-[rgba(var(--org-card-background-rgb),0.8)] border-l-2 border-transparent hover:border-[var(--org-accent-color)]"
    >
      <div
        className="w-2 h-2 mt-2 rounded-full"
        style={{ backgroundColor: getTypeColor(type) }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-4">
          <h4
            className="font-medium text-sm truncate"
            style={{ color: 'var(--org-text-color, #FFFFFF)' }}
          >
            {title}
          </h4>
          <div
            className="flex items-center gap-1 text-xs whitespace-nowrap opacity-70"
            style={{ color: 'var(--org-border-color, #6C757D)' }}
          >
            <ClockIcon className="h-3.5 w-3.5" />
            {timestamp}
          </div>
        </div>
        <p
          className="text-xs mt-1 line-clamp-1 opacity-80"
          style={{ color: 'var(--org-border-color, #6C757D)' }}
        >
          {description}
        </p>
        <p
          className="text-xs mt-1 font-medium"
          style={{ color: 'var(--org-accent-color, #00D4B3)' }}
        >
          {t('dashboard.recentActivity.by')} {user}
        </p>
      </div>
    </div>
  )
}

// ============================================
// COMPONENTE PRINCIPAL: BusinessPanelDashboard
// ============================================
export function BusinessPanelDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { t } = useTranslation('business')

  // Obtener estilos de la organización (incluyendo el estado de carga)
  const { styles, loading: stylesLoading } = useOrganizationStylesContext()

  // Debug: Ver qué estilos se están cargando
  useEffect(() => {
    console.log('🎨 [BusinessPanelDashboard] Estilos cargados:', {
      hasStyles: !!styles,
      stylesLoading,
      panel: styles?.panel,
      selectedTheme: styles?.selectedTheme,
      allStyles: styles
    });
  }, [styles, stylesLoading]);

  // Colores dinámicos basados en los estilos de la organización
  const themeColors = useMemo(() => {
    const panelStyles = styles?.panel
    console.log('🎨 [BusinessPanelDashboard] Panel styles:', panelStyles);
    return {
      // Colores principales
      background: panelStyles?.background_value || '#0A2540',
      backgroundType: panelStyles?.background_type || 'color',
      primary: panelStyles?.primary_button_color || '#0A2540',
      secondary: panelStyles?.secondary_button_color || '#10B981',
      accent: panelStyles?.accent_color || '#00D4B3',
      text: panelStyles?.text_color || '#FFFFFF',
      cardBg: panelStyles?.card_background || '#1E2329',
      sidebarBg: panelStyles?.sidebar_background || '#161B22',
      borderColor: panelStyles?.border_color || '#6C757D',
    }
  }, [styles])

  // Mostrar skeleton mientras se cargan los estilos
  if (stylesLoading) {
    return (
      <div className="p-6 lg:p-8 min-h-screen bg-gray-900 animate-pulse">
        {/* Hero Skeleton */}
        <div className="h-48 rounded-3xl bg-gray-800 mb-8" />

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3 space-y-8">
            {/* Stats Header Skeleton */}
            <div className="space-y-2 mb-6">
              <div className="h-6 w-48 bg-gray-800 rounded" />
              <div className="h-4 w-32 bg-gray-800 rounded" />
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-36 bg-gray-800 rounded-2xl" />
              ))}
            </div>

            {/* Activity Skeleton */}
            <div className="space-y-2 mb-6">
              <div className="h-6 w-40 bg-gray-800 rounded" />
              <div className="h-4 w-32 bg-gray-800 rounded" />
            </div>
            <div className="h-64 bg-gray-800 rounded-2xl" />
          </div>

          {/* Sidebar Skeleton */}
          <div className="xl:col-span-1 space-y-4">
            <div className="h-6 w-32 bg-gray-800 rounded mb-4" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-800 rounded-xl" />
            ))}
            <div className="h-40 bg-gray-800 rounded-2xl mt-6" />
          </div>
        </div>
      </div>
    )
  }


  // Actualizar la hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Inicializar tour del dashboard de gestión
  useBusinessPanelTour()

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
    if (hour < 12) return t('dashboard.greetings.morning')
    if (hour < 18) return t('dashboard.greetings.afternoon')
    return t('dashboard.greetings.evening')
  }

  const getUserName = () => {
    if (!user) return 'Usuario'
    // Prioridad: Nombre propio -> Nombre para mostrar -> Username -> Fallback
    return user.first_name || user.display_name || user.username || 'Usuario'
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

      if (diffMins < 1) return t('dashboard.recentActivity.time.justNow')
      if (diffMins < 60) return t('dashboard.recentActivity.time.minsAgo', { time: diffMins })
      if (diffHours < 24) return t('dashboard.recentActivity.time.hoursAgo', { time: diffHours })
      if (diffDays < 7) return t('dashboard.recentActivity.time.daysAgo', { time: diffDays })
      return date.toLocaleDateString(t('language') === 'en' ? 'en-US' : 'es-MX') // Simple fallback for locale
    } catch {
      return t('dashboard.recentActivity.time.justNow')
    }
  }

  const statsData = useMemo(() => stats ? [
    {
      title: t('dashboard.stats.activeUsers'),
      value: typeof stats.activeUsers === 'object' ? stats.activeUsers.value : (stats.activeUsers || 0),
      change: typeof stats.activeUsers === 'object' ? parseFloat(stats.activeUsers.change) : 0,
      backgroundImage: '/images/dashboard-cards/users-card-bg.png',
      gradient: `bg-gradient-to-br from-[${themeColors.primary}] to-[${themeColors.primary}]/80`,
      gradientStyle: { background: `linear-gradient(to bottom right, ${themeColors.primary}, ${themeColors.primary}cc)` },
      href: '/business-panel/users'
    },
    {
      title: t('dashboard.stats.assignedCourses'),
      value: typeof stats.assignedCourses === 'object' ? stats.assignedCourses.value : (stats.assignedCourses || 0),
      change: typeof stats.assignedCourses === 'object' ? parseFloat(stats.assignedCourses.change) : 0,
      backgroundImage: '/images/dashboard-cards/courses-card-bg.png',
      gradient: `bg-gradient-to-br from-[${themeColors.secondary}] to-[${themeColors.secondary}]/80`,
      gradientStyle: { background: `linear-gradient(to bottom right, ${themeColors.secondary}, ${themeColors.secondary}cc)` },
      gradientStyle: { background: `linear-gradient(to bottom right, ${themeColors.secondary}, ${themeColors.secondary}cc)` },
      href: '/business-panel/courses',
      id: 'tour-stat-courses'
    },
    {
      title: t('dashboard.stats.completed'),
      value: typeof stats.completed === 'object' ? stats.completed.value : (stats.completed || stats.completedCourses || 0),
      change: typeof stats.completed === 'object' ? parseFloat(stats.completed.change) : 0,
      backgroundImage: '/images/dashboard-cards/completed-card-bg.png',
      gradient: `bg-gradient-to-br from-[${themeColors.accent}] to-[${themeColors.accent}]/80`,
      gradientStyle: { background: `linear-gradient(to bottom right, ${themeColors.accent}, ${themeColors.accent}cc)` },
    },
    {
      title: t('dashboard.stats.avgProgress'),
      value: typeof stats.inProgress === 'object' ? stats.inProgress.value : `${stats.averageProgress || 0}%`,
      change: typeof stats.inProgress === 'object' ? parseFloat(stats.inProgress.change) : 0,
      backgroundImage: '/images/dashboard-cards/progress-card-bg.png',
      gradient: 'bg-gradient-to-br from-[#F59E0B] to-[#F59E0B]/80',
      gradientStyle: { background: `linear-gradient(to bottom right, #F59E0B, #F59E0Bcc)` },
    },
    {
      title: t('dashboard.stats.certificates'),
      value: stats.certificates || 0,
      change: stats.certificateGrowth || 0,
      backgroundImage: '/images/dashboard-cards/certificates-card-bg.png',
      gradient: 'bg-gradient-to-br from-[#8B5CF6] to-[#8B5CF6]/80',
      gradient: 'bg-gradient-to-br from-[#8B5CF6] to-[#8B5CF6]/80',
      gradientStyle: { background: `linear-gradient(to bottom right, #8B5CF6, #8B5CF6cc)` },
      id: 'tour-stat-certificates'
    },
    {
      title: t('dashboard.stats.engagement'),
      value: `${stats.engagementRate || 0}%`,
      change: stats.engagementGrowth || 0,
      backgroundImage: '/images/dashboard-cards/engagement-card-bg.png',
      gradient: 'bg-gradient-to-br from-[#EC4899] to-[#EC4899]/80',
      gradientStyle: { background: `linear-gradient(to bottom right, #EC4899, #EC4899cc)` },
    },
  ] : [], [stats, themeColors, t])

  const quickActions = useMemo(() => [
    {
      title: t('dashboard.quickActions.manageUsers.title'),
      description: t('dashboard.quickActions.manageUsers.desc'),
      icon: UsersIcon,
      href: '/business-panel/users',
      color: themeColors.primary
    },
    {
      title: t('dashboard.quickActions.assignCourses.title'),
      description: t('dashboard.quickActions.assignCourses.desc'),
      icon: PlusIcon,
      href: '/business-panel/courses',
      color: themeColors.secondary
    },
    {
      title: t('dashboard.quickActions.viewReports.title'),
      description: t('dashboard.quickActions.viewReports.desc'),
      icon: ChartBarIcon,
      href: '/business-panel/reports',
      color: themeColors.accent
    },
    {
      title: t('dashboard.quickActions.settings.title'),
      description: t('dashboard.quickActions.settings.desc'),
      icon: Cog6ToothIcon,
      href: '/business-panel/settings',
      color: '#8B5CF6'
    },
  ], [themeColors, t])

  // Calcular estilo de fondo dinámico
  const getBackgroundStyles = () => {
    if (themeColors.backgroundType === 'gradient' && themeColors.background) {
      return { background: themeColors.background }
    } else if (themeColors.backgroundType === 'image' && themeColors.background) {
      return {
        backgroundImage: `url(${themeColors.background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    }
    return { backgroundColor: themeColors.background }
  }

  return (
    <div
      className="p-6 lg:p-8 min-h-screen"
      style={getBackgroundStyles()}
    >
      {/* Hero Section */}
      <motion.div
        id="tour-hero-section"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl p-8 mb-8 group"
      >
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 mix-blend-multiply opacity-80 z-10"
            style={{ backgroundColor: themeColors.primary }}
          />
          <div
            className="absolute inset-0 z-10"
            style={{
              background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.primary}99, transparent)`
            }}
          />
          <Image
            src="/images/dashboard-header.png"
            alt="Business Dashboard Background"
            fill
            priority
            unoptimized
            className="object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, 100vw"
          />
        </div>

        {/* Animated Particles */}


        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="transition-transform duration-[10s] ease-linear hover:rotate-180"
            >
              <SparklesIcon className="h-6 w-6" style={{ color: themeColors.accent }} />
            </div>
            <span
              className="text-sm font-medium tracking-wide uppercase"
              style={{ color: themeColors.accent }}
            >
              {t('dashboard.title')}
            </span>
          </div>

          <motion.h1
            className="text-3xl lg:text-4xl font-bold mb-2"
            style={{ color: themeColors.text }}
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
            {t('dashboard.subtitle')}
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
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: themeColors.secondary }} />
              <span className="text-sm font-medium" style={{ color: themeColors.secondary }}>{t('dashboard.systemActive')}</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-3 space-y-8">
          {/* Stats Grid */}
          <section id="tour-stats-section">
            <motion.div
              className="flex items-center justify-between mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div>
                <h2 className="text-xl font-bold" style={{ color: themeColors.text }}>{t('dashboard.generalStats')}</h2>
                <p className="text-sm mt-1" style={{ color: themeColors.borderColor }}>{t('dashboard.keyMetrics')}</p>
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
                    backgroundImage={stat.backgroundImage}
                    gradient={stat.gradient}
                    gradientStyle={stat.gradientStyle}
                    delay={index}
                    href={stat.href}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Activity Section */}
          <section id="tour-activity-section">
            <motion.div
              className="flex items-center justify-between mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div>
                <h2 className="text-xl font-bold" style={{ color: themeColors.text }}>{t('dashboard.recentActivity.title')}</h2>
                <p className="text-sm mt-1" style={{ color: themeColors.borderColor }}>{t('dashboard.recentActivity.subtitle')}</p>
              </div>
            </motion.div>

            <motion.div
              id="tour-activity-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="rounded-2xl border overflow-hidden"
              style={{
                backgroundColor: themeColors.cardBg,
                borderColor: `${themeColors.borderColor}33`
              }}
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
                  <p className="text-[#6C757D]">{t('dashboard.recentActivity.empty')}</p>
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
        <div id="tour-quick-actions" className="xl:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="sticky top-24"
          >
            <div id="tour-quick-actions-list">
              <div className="mb-6">
                <h2 className="text-lg font-bold" style={{ color: themeColors.text }}>{t('dashboard.quickActions.title')}</h2>
                <p className="text-sm mt-1" style={{ color: themeColors.borderColor }}>{t('dashboard.quickActions.subtitle')}</p>
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
            </div>

            {/* System Health Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mt-6 p-6 rounded-2xl"
              style={{
                background: `linear-gradient(to bottom right, ${themeColors.secondary}33, ${themeColors.secondary}0d)`,
                borderColor: `${themeColors.secondary}4d`,
                borderWidth: 1,
                borderStyle: 'solid'
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: themeColors.secondary }}
                >
                  <RocketLaunchIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: themeColors.text }}>{t('dashboard.systemHealth.activeAccount')}</h3>
                  <p className="text-xs" style={{ color: themeColors.secondary }}>{t('dashboard.systemHealth.servicesOperational')}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: themeColors.borderColor }}>{t('dashboard.systemHealth.users')}</span>
                  <span className="font-medium" style={{ color: themeColors.secondary }}>
                    {typeof stats?.activeUsers === 'object' ? stats.activeUsers.value : (stats?.activeUsers || 0)} {t('dashboard.systemHealth.active')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: themeColors.borderColor }}>{t('dashboard.systemHealth.courses')}</span>
                  <span className="font-medium" style={{ color: themeColors.secondary }}>
                    {typeof stats?.assignedCourses === 'object' ? stats.assignedCourses.value : (stats?.assignedCourses || 0)} asignados
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: themeColors.borderColor }}>Sistema</span>
                  <span className="font-medium" style={{ color: themeColors.secondary }}>Operativo</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}