'use client'

import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  GraduationCap,
  TrendingUp,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useOrganizationStyles } from '@/features/business-panel/hooks/useOrganizationStyles'
import { getBackgroundStyle, generateCSSVariables } from '@/features/business-panel/utils/styles'
// import { useLiaPanel } from '@/core/contexts/LiaPanelContext' // Removed LIA logic

// Lazy load components
const ParticlesBackground = lazy(() =>
  import('./components/ParticlesBackground').then(m => ({ default: m.ParticlesBackground }))
)
const Background3DEffects = lazy(() =>
  import('./components/Background3DEffects').then(m => ({ default: m.Background3DEffects }))
)
const ModernNavbar = lazy(() =>
  import('./components/ModernNavbar').then(m => ({ default: m.ModernNavbar }))
)
const ModernStatsCard = lazy(() =>
  import('./components/ModernStatsCard').then(m => ({ default: m.ModernStatsCard }))
)
const CourseCard3D = lazy(() =>
  import('./components/CourseCard3D').then(m => ({ default: m.CourseCard3D }))
)
const BusinessUserOnboardingAgent = lazy(() =>
  import('./components/BusinessUserOnboardingAgent').then(m => ({ default: m.BusinessUserOnboardingAgent }))
)

interface DashboardStats {
  total_assigned: number
  in_progress: number
  completed: number
  certificates: number
}

interface AssignedCourse {
  id: string
  course_id: string
  title: string
  instructor: string
  progress: number
  status: 'Asignado' | 'En progreso' | 'Completado'
  thumbnail: string
  slug: string
  assigned_at: string
  due_date?: string
  completed_at?: string
  has_certificate?: boolean
}

interface Organization {
  id: string
  name: string
  logo_url?: string | null
  favicon_url?: string | null
}

export default function BusinessUserDashboardPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { styles } = useOrganizationStyles()
  // const { isPanelOpen, isCollapsed, panelWidth } = useLiaPanel() // Removed LIA logic
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Aplicar estilos personalizados
  const userDashboardStyles = styles?.userDashboard
  const backgroundStyle = getBackgroundStyle(userDashboardStyles)
  const cssVariables = generateCSSVariables(userDashboardStyles)

  // Colores personalizados de la organización
  const orgColors = {
    primary: userDashboardStyles?.primary_button_color || '#0A2540',
    accent: userDashboardStyles?.accent_color || '#00D4B3'
  }

  const [stats, setStats] = useState<DashboardStats>({
    total_assigned: 0,
    in_progress: 0,
    completed: 0,
    certificates: 0
  })
  const [assignedCourses, setAssignedCourses] = useState<AssignedCourse[]>([])

  // Time update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Obtener saludo basado en hora
  const getGreeting = useCallback(() => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }, [currentTime])

  // Obtener información de la organización
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user?.organization) {
            setOrganization(data.user.organization)
          }
        }
      } catch (error) {
        // Silent fail
      }
    }
    fetchOrganization()
  }, [])

  const myStats = useMemo(() => [
    { label: 'Cursos Asignados', value: stats.total_assigned, icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
    { label: 'En Progreso', value: stats.in_progress, icon: Clock, color: 'from-purple-500 to-pink-500' },
    { label: 'Completados', value: stats.completed, icon: CheckCircle2, color: 'from-green-500 to-emerald-500' },
    { label: 'Certificados', value: stats.certificates, icon: Award, color: 'from-orange-500 to-red-500' },
  ], [stats])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/business-user/dashboard', { credentials: 'include' })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}: Error al cargar datos del dashboard`)
      }

      if (data.success) {
        setStats(data.stats)
        setAssignedCourses(data.courses || [])
      } else {
        if (data.stats && data.courses) {
          setStats(data.stats)
          setAssignedCourses(data.courses)
        } else {
          throw new Error(data.error || 'Error al obtener datos')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setStats({ total_assigned: 0, in_progress: 0, completed: 0, certificates: 0 })
      setAssignedCourses([])
    } finally {
      setLoading(false)
    }
  }

  const handleCourseClick = useCallback((course: AssignedCourse, action?: 'start' | 'continue' | 'certificate') => {
    if (action === 'certificate' && course.has_certificate) {
      fetch('/api/certificates', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.certificates) {
            const certificate = data.certificates.find((cert: any) => cert.course_id === course.course_id)
            if (certificate) {
              router.push(`/certificates/${certificate.certificate_id}`)
            } else {
              router.push('/certificates')
            }
          } else {
            router.push('/certificates')
          }
        })
        .catch(() => router.push('/certificates'))
    } else if (!course.slug) {
      return
    } else {
      router.push(`/courses/${course.slug}/learn`)
    }
  }, [router])

  const handleLogout = useCallback(async () => {
    await logout()
    router.push('/auth')
  }, [logout, router])

  const handleProfileClick = useCallback(() => {
    router.push('/profile')
  }, [router])

  const handleCertificatesClick = useCallback(() => {
    router.push('/certificates')
  }, [router])

  const getDisplayName = useCallback(() => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user?.display_name || user?.username || 'Usuario'
  }, [user])

  const getInitials = useCallback(() => {
    const firstName = user?.first_name || ''
    const lastName = user?.last_name || ''
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }
    return (user?.username || 'U').charAt(0).toUpperCase()
  }, [user])

  // Loading state with premium animation
  if (loading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{
          background: '#0F1419'
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-8"
        >
          {/* Premium Loading Animation - No rotation */}
          <div className="relative">
            {/* Outer ring with pulse */}
            <motion.div
              className="w-20 h-20 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${orgColors.primary}15, ${orgColors.accent}15)`,
                border: `2px solid ${orgColors.accent}50`
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Inner glow */}
            <motion.div
              className="absolute inset-2 rounded-full"
              style={{
                background: `radial-gradient(circle, ${orgColors.accent}50, transparent)`,
              }}
              animate={{
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <GraduationCap className="w-8 h-8" style={{ color: orgColors.accent, filter: `drop-shadow(0 0 8px ${orgColors.accent}80)` }} />
              </motion.div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-white text-lg font-semibold">Cargando tu panel</p>
            <p className="text-gray-400 text-sm mt-2">Preparando tu experiencia de aprendizaje...</p>
          </div>
        </motion.div>
      </main>
    )
  }

  // Error state
  if (error) {
    return (
      <main
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: '#0F1419' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 max-w-md text-center p-8 rounded-2xl border border-red-500/20 backdrop-blur-xl"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)' }}
        >
          <div className="p-4 rounded-full bg-red-500/10">
            <AlertCircle className="w-12 h-12 text-red-400" />
          </div>
          <div>
            <p className="text-red-400 text-xl font-semibold">Error al cargar datos</p>
            <p className="text-gray-400 text-sm mt-2">{error}</p>
          </div>
          <motion.button
            onClick={fetchDashboardData}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-6 py-3 text-white rounded-xl font-medium"
            style={{
              background: `linear-gradient(135deg, ${orgColors.primary}, ${orgColors.accent})`,
              boxShadow: `0 4px 20px ${orgColors.primary}50`
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </motion.button>
        </motion.div>
      </main>
    )
  }

  // Calcular el margen derecho basado en el estado del panel LIA
  // const contentMarginRight = isPanelOpen && !isCollapsed ? `${panelWidth}px` : '0' // Removed LIA logic

  return (
    <div
      className="min-h-screen"
      style={{
        ...backgroundStyle,
        ...cssVariables,
        background: backgroundStyle?.background || '#0F1419'
      } as React.CSSProperties}
    >
      {/* Modern Navbar - Siempre ocupa el ancho completo, NO se desplaza */}
      <Suspense fallback={
        <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-xl h-16" />
      }>
        <ModernNavbar
          organization={organization}
          user={user}
          getDisplayName={getDisplayName}
          getInitials={getInitials}
          onProfileClick={handleProfileClick}
          onLogout={handleLogout}
          styles={userDashboardStyles}
        />
      </Suspense>

      {/* Main Content - Solo este contenido tiene margen cuando LIA está abierto */}
      <main
        className="relative overflow-hidden min-h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out"
        // style={{ marginRight: contentMarginRight }} // Removed LIA logic
      >
        {/* Background Effects */}
        <Suspense fallback={null}>
          <ParticlesBackground />
          <Background3DEffects />
        </Suspense>

        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20 py-8">

          {/* ============================================ */}
          {/* HERO SECTION - Premium Design */}
          {/* ============================================ */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl p-8 mb-10 group"
          >
            {/* Background with gradient overlay */}
            <div className="absolute inset-0 z-0">
              <div
                className="absolute inset-0 z-10"
                style={{
                  background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(16, 185, 129, 0.1), transparent)'
                }}
              />
              <div
                className="absolute inset-0 z-10"
                style={{
                  background: 'linear-gradient(to right, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.7), transparent)'
                }}
              />
              <Image
                src="/images/nanobanana-hero.png"
                alt="Nanobanana Dashboard Background"
                fill
                priority
                unoptimized
                className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                sizes="100vw"
              />
            </div>

            {/* Animated Orbs */}
            <motion.div
              className="absolute top-10 right-10 w-32 h-32 rounded-full blur-3xl pointer-events-none"
              style={{ backgroundColor: 'rgba(14, 165, 233, 0.3)' }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-10 right-40 w-24 h-24 rounded-full blur-3xl pointer-events-none"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.3)' }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            />

            {/* Floating particles */}
            <motion.div
              animate={{ y: [0, -15, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-8 right-24 w-2 h-2 rounded-full bg-cyan-400"
            />
            <motion.div
              animate={{ y: [0, 12, 0], opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              className="absolute bottom-12 right-32 w-3 h-3 rounded-full bg-emerald-400"
            />

            {/* Content */}
            <div className="relative z-10">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 border"
                style={{
                  backgroundColor: `${orgColors.accent}15`,
                  borderColor: `${orgColors.accent}50`
                }}
              >
                <Sparkles className="w-4 h-4" style={{ color: orgColors.accent }} />
                <span className="text-sm font-medium" style={{ color: orgColors.accent }}>Panel de Aprendizaje</span>
              </motion.div>

              {/* Greeting */}
              <motion.h1
                className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {getGreeting()},{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${orgColors.accent}, ${orgColors.primary})`,
                  }}
                >
                  {user?.first_name || 'Usuario'}
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                className="text-lg text-gray-300 max-w-xl mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Continúa tu camino de aprendizaje y alcanza tus metas profesionales.
              </motion.p>

              {/* Date and Status */}
              <motion.div
                className="flex flex-wrap items-center gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Clock className="w-4 h-4" />
                  {currentTime.toLocaleDateString('es-MX', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: orgColors.accent }}
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-sm font-medium" style={{ color: orgColors.accent }}>Aprendizaje Activo</span>
                </div>
              </motion.div>
            </div>

            {/* Decorative border gradient */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                background: `linear-gradient(135deg, ${orgColors.primary}50, transparent, ${orgColors.accent}30)`,
                padding: '1px',
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'exclude',
                WebkitMaskComposite: 'xor'
              }}
            />
          </motion.div>

          {/* ============================================ */}
          {/* STATS SECTION - Premium Cards */}
          {/* ============================================ */}
          <section className="mb-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-between mb-6"
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-xl border"
                  style={{
                    background: `linear-gradient(135deg, ${orgColors.accent}25, ${orgColors.accent}08)`,
                    borderColor: `${orgColors.accent}30`
                  }}
                >
                  <TrendingUp className="w-5 h-5" style={{ color: orgColors.accent }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Tu Progreso</h2>
                  <p className="text-sm text-gray-400">Métricas de tu aprendizaje</p>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <Suspense fallback={
                <>
                  {myStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-white/5 bg-slate-900/50 p-5 animate-pulse h-32"
                    />
                  ))}
                </>
              }>
                {myStats.map((stat, index) => {
                  const isCertificates = stat.label === 'Certificados'
                  return (
                    <ModernStatsCard
                      key={stat.label}
                      label={stat.label}
                      value={stat.value}
                      icon={stat.icon}
                      color={stat.color}
                      index={index}
                      onClick={isCertificates && stats.certificates > 0 ? handleCertificatesClick : undefined}
                      isClickable={isCertificates && stats.certificates > 0}
                      styles={userDashboardStyles}
                    />
                  )
                })}
              </Suspense>
            </div>
          </section>

          {/* ============================================ */}
          {/* COURSES SECTION - Premium Grid */}
          {/* ============================================ */}
          <section>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-between mb-6"
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-xl border"
                  style={{
                    background: `linear-gradient(135deg, ${orgColors.primary}25, ${orgColors.primary}08)`,
                    borderColor: `${orgColors.primary}30`
                  }}
                >
                  <GraduationCap className="w-5 h-5" style={{ color: orgColors.primary }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Mis Cursos</h2>
                  <p className="text-sm text-gray-400">Continúa donde lo dejaste</p>
                </div>
              </div>
            </motion.div>

            {assignedCourses.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-2xl border border-white/5 backdrop-blur-xl p-12 text-center"
                style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}
              >
                {/* Decorative gradient */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${orgColors.primary}15, transparent 60%)`
                  }}
                />

                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="relative z-10"
                >
                  <div
                    className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border"
                    style={{
                      background: `linear-gradient(135deg, ${orgColors.primary}25, ${orgColors.primary}08)`,
                      borderColor: `${orgColors.primary}30`
                    }}
                  >
                    <BookOpen className="w-10 h-10" style={{ color: orgColors.primary }} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No tienes cursos asignados aún</h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    Tu organización te asignará cursos próximamente. Mientras tanto, explora lo que tenemos preparado para ti.
                  </p>

                  {/* Decorative elements - static */}
                  <div className="absolute top-6 right-6">
                    <Sparkles className="w-5 h-5" style={{ color: `${orgColors.accent}50` }} />
                  </div>
                  <div className="absolute bottom-8 left-8">
                    <GraduationCap className="w-6 h-6" style={{ color: `${orgColors.primary}50` }} />
                  </div>
                </motion.div>

                {/* Border gradient */}
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    background: `linear-gradient(135deg, ${orgColors.primary}30, transparent, ${orgColors.accent}15)`,
                    padding: '1px',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                    WebkitMaskComposite: 'xor'
                  }}
                />
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                <Suspense fallback={
                  <>
                    {assignedCourses.map((_, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-white/5 bg-slate-900/50 animate-pulse h-80"
                      />
                    ))}
                  </>
                }>
                  {assignedCourses.map((course, index) => (
                    <CourseCard3D
                      key={course.id}
                      course={course}
                      index={index}
                      onClick={() => handleCourseClick(course)}
                      onCertificateClick={
                        course.progress === 100 && course.has_certificate
                          ? () => handleCourseClick(course, 'certificate')
                          : undefined
                      }
                      styles={userDashboardStyles}
                    />
                  ))}
                </Suspense>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Tour de bienvenida para Business User */}
      <Suspense fallback={null}>
        <BusinessUserOnboardingAgent />
      </Suspense>
    </div>
  )
}
