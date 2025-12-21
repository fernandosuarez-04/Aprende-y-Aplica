'use client'

import { useState, useEffect, useRef, lazy, Suspense, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  PlayCircle,
  TrendingUp,
  Loader2,
  AlertCircle,
  Edit3,
  LogOut,
  ChevronDown,
  User,
  Building2,
  Package
} from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useOrganizationStyles } from '@/features/business-panel/hooks/useOrganizationStyles'
import { useBusinessUserScormPackages, AssignedScormPackage } from '@/features/scorm'
import { getBackgroundStyle, generateCSSVariables, hexToRgb } from '@/features/business-panel/utils/styles'

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
const ScormCoursesSection = lazy(() =>
  import('./components/ScormCoursesSection').then(m => ({ default: m.ScormCoursesSection }))
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  
  // Aplicar estilos personalizados
  const userDashboardStyles = styles?.userDashboard
  const backgroundStyle = getBackgroundStyle(userDashboardStyles)
  const cssVariables = generateCSSVariables(userDashboardStyles)
  const loadingBackgroundStyle = getBackgroundStyle(userDashboardStyles)
  
  const [stats, setStats] = useState<DashboardStats>({
    total_assigned: 0,
    in_progress: 0,
    completed: 0,
    certificates: 0
  })
  const [assignedCourses, setAssignedCourses] = useState<AssignedCourse[]>([])

  // SCORM packages
  const {
    packages: scormPackages,
    stats: scormStats,
    isLoading: scormLoading
  } = useBusinessUserScormPackages()

  // Obtener información de la organización
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user?.organization) {
            setOrganization(data.user.organization)
          }
        }
      } catch (error) {
        // console.error('Error fetching organization:', error)
      }
    }
    fetchOrganization()
  }, [])


  const myStats = [
    { label: 'Cursos Asignados', value: stats.total_assigned.toString(), icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
    { label: 'En Progreso', value: stats.in_progress.toString(), icon: Clock, color: 'from-purple-500 to-pink-500' },
    { label: 'Completados', value: stats.completed.toString(), icon: CheckCircle2, color: 'from-green-500 to-emerald-500' },
    { label: 'Certificados', value: stats.certificates.toString(), icon: Award, color: 'from-orange-500 to-red-500' },
  ]

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/business-user/dashboard', {
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        // Si la respuesta no es ok, usar el mensaje de error de la API
        throw new Error(data.error || `Error ${response.status}: Error al cargar datos del dashboard`)
      }

      if (data.success) {
        setStats(data.stats)
        setAssignedCourses(data.courses || [])
      } else {
        // Aún así intentar mostrar datos si están disponibles
        if (data.stats && data.courses) {
          setStats(data.stats)
          setAssignedCourses(data.courses)
        } else {
          throw new Error(data.error || 'Error al obtener datos')
        }
      }
    } catch (err) {
      // console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      // Asegurar que siempre tenemos valores por defecto
      setStats({
        total_assigned: 0,
        in_progress: 0,
        completed: 0,
        certificates: 0
      })
      setAssignedCourses([])
    } finally {
      setLoading(false)
    }
  }

  const handleCourseClick = useCallback((course: AssignedCourse, action?: 'start' | 'continue' | 'certificate') => {
    if (action === 'certificate' && course.has_certificate) {
      // Si tiene certificado, buscar el certificado y redirigir a la página de detalle
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

  const handleScormPackageClick = useCallback((packageId: string) => {
    router.push(`/business-user/scorm/${packageId}`)
  }, [router])

  const handleProfileClick = useCallback(() => {
    router.push('/profile')
  }, [router])

  const handleCertificatesClick = useCallback(() => {
    router.push('/certificates')
  }, [router])

  const getDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user?.display_name || user?.username || 'Usuario'
  }

  const getInitials = () => {
    const firstName = user?.first_name || ''
    const lastName = user?.last_name || ''
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }
    return (user?.username || 'U').charAt(0).toUpperCase()
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-carbon via-carbon to-carbon-dark p-6 lg:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-gray-300 dark:text-gray-200 text-lg">Cargando tu panel de aprendizaje...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main 
        className="min-h-screen p-6 lg:p-8 flex items-center justify-center transition-all duration-300"
        style={loadingBackgroundStyle}
      >
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-red-400 text-lg font-semibold">Error al cargar datos</p>
          <p className="text-gray-300 dark:text-gray-200 text-sm">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </main>
    )
  }

  return (
    <div 
      className="min-h-screen bg-white dark:bg-gray-950 transition-all duration-300"
      style={{
        ...backgroundStyle,
        ...cssVariables
      } as React.CSSProperties}
    >
      {/* Modern Navbar */}
      <Suspense fallback={
        <nav className="sticky top-0 z-50 w-full border-b border-gray-200/10 dark:border-gray-800/50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl h-16" />
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

      {/* Main Content */}
      <main className="relative overflow-hidden min-h-[calc(100vh-4rem)]">
        {/* Background Effects */}
        <Suspense fallback={null}>
          <ParticlesBackground />
          <Background3DEffects />
        </Suspense>

        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20 py-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mb-10"
          >
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-2">
              Mi Panel de Aprendizaje
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Continúa tu crecimiento profesional</p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10">
            <Suspense fallback={
              <>
                {myStats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 p-5 animate-pulse"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-800 mb-3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded mb-2 w-2/3" />
                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                  </div>
                ))}
              </>
            }>
              {myStats.map((stat, index) => {
                const isCertificates = stat.label === 'Certificados'
                const statValue = stat.label === 'Cursos Asignados' ? stats.total_assigned
                  : stat.label === 'En Progreso' ? stats.in_progress
                  : stat.label === 'Completados' ? stats.completed
                  : stats.certificates

                return (
                  <ModernStatsCard
                    key={stat.label}
                    label={stat.label}
                    value={statValue}
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

          {/* Assigned Courses */}
          <div>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-6"
            >
              Mis Cursos Asignados
            </motion.h2>
            {assignedCourses.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-12 text-center"
              >
                <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4 opacity-50" />
                <p className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">No tienes cursos asignados aún</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tu organización te asignará cursos próximamente</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                <Suspense fallback={
                  <>
                    {assignedCourses.map((_, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 p-6 animate-pulse"
                      >
                        <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-800 mb-4" />
                        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded mb-2 w-3/4" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded mb-4 w-1/2" />
                        <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded" />
                      </div>
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
          </div>

          {/* SCORM Courses Section */}
          {(scormPackages.length > 0 || scormLoading) && (
            <div className="mt-12">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-center gap-3 mb-6"
              >
                <Package className="w-6 h-6 text-primary" />
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                  Cursos SCORM
                </h2>
                {scormStats.total > 0 && (
                  <span className="px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                    {scormStats.total} {scormStats.total === 1 ? 'curso' : 'cursos'}
                  </span>
                )}
              </motion.div>
              <Suspense fallback={
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[0, 1, 2].map((index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 p-6 animate-pulse"
                    >
                      <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
                      <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded mb-2 w-3/4" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded mb-4 w-1/2" />
                      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded" />
                    </div>
                  ))}
                </div>
              }>
                <ScormCoursesSection
                  packages={scormPackages}
                  isLoading={scormLoading}
                  styles={userDashboardStyles}
                  onPackageClick={handleScormPackageClick}
                />
              </Suspense>
            </div>
          )}
        </div>
      </main>

      {/* Tour de bienvenida para Business User */}
      <Suspense fallback={null}>
        <BusinessUserOnboardingAgent />
      </Suspense>
    </div>
  )
}

