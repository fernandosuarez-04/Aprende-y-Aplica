'use client'

import { useState, useEffect, useRef } from 'react'
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
      Building2
    } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useOrganizationStyles } from '@/features/business-panel/hooks/useOrganizationStyles'
import { getBackgroundStyle, generateCSSVariables } from '@/features/business-panel/utils/styles'

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
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
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

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
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

  const handleCourseClick = (course: AssignedCourse, action?: 'start' | 'continue' | 'certificate') => {
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
  }

  const handleLogout = async () => {
    await logout()
    setUserDropdownOpen(false)
    router.push('/auth')
  }

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
          <p className="text-carbon-300 text-lg">Cargando tu panel de aprendizaje...</p>
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
          <p className="text-carbon-300 text-sm">{error}</p>
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
      className="min-h-screen transition-all duration-300"
      style={{
        ...backgroundStyle,
        ...cssVariables
      } as React.CSSProperties}
    >
      {/* Header Premium */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-gradient-to-r from-carbon-800/95 via-carbon-800/90 to-carbon-800/95 border-b border-carbon-700/50 shadow-2xl shadow-black/20">
        <div className="px-6 lg:px-10 py-5">
          <div className="flex items-center justify-between">
            {/* Left: Company Name */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-4"
            >
              {(organization?.favicon_url || organization?.logo_url) ? (
                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg border-2 border-primary/30 ring-2 ring-primary/20">
                  <Image
                    src={organization.favicon_url || organization.logo_url || '/icono.png'}
                    alt={organization.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/icono.png';
                    }}
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-success/20 flex items-center justify-center shadow-lg border-2 border-primary/30 ring-2 ring-primary/20">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-blue-400 to-success bg-clip-text text-transparent">
                  {organization?.name || 'Mi Organización'}
                </h1>
                <p className="text-xs text-carbon-400 font-medium">Panel de Aprendizaje</p>
              </div>
            </motion.div>

            {/* Right: User Dropdown */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="relative" 
              ref={dropdownRef}
            >
              <motion.button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl backdrop-blur-sm bg-carbon-700/50 hover:bg-carbon-700/70 border border-carbon-600/50 hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-primary to-success flex items-center justify-center shadow-lg overflow-hidden ring-2 ring-primary/30">
                  {user?.profile_picture_url ? (
                    <Image
                      src={user.profile_picture_url}
                      alt={getDisplayName()}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {getInitials()}
                    </span>
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-white">{getDisplayName()}</p>
                  <p className="text-xs text-carbon-400">{user?.email?.split('@')[0] || 'Usuario'}</p>
                </div>
                <motion.div
                  animate={{ rotate: userDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-carbon-400" />
                </motion.div>
              </motion.button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {userDropdownOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[998] bg-black/20 backdrop-blur-sm"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 w-72 bg-carbon-800 rounded-2xl shadow-2xl border border-carbon-600 z-[999] overflow-hidden"
                      style={{ 
                        backdropFilter: 'none',
                        backgroundColor: 'rgb(30, 41, 59)'
                      }}
                    >
                      {/* User Header */}
                      <div className="px-6 py-5 border-b border-carbon-700 bg-carbon-800">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-success flex items-center justify-center shadow-xl overflow-hidden ring-2 ring-primary/30">
                            {user?.profile_picture_url ? (
                              <Image
                                src={user.profile_picture_url}
                                alt={getDisplayName()}
                                width={56}
                                height={56}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-bold text-lg">
                                {getInitials()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-white truncate">{getDisplayName()}</h3>
                            <p className="text-sm text-carbon-400 truncate">{user?.email || ''}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <motion.button
                          onClick={() => {
                            router.push('/profile')
                            setUserDropdownOpen(false)
                          }}
                          className="w-full flex items-center gap-4 px-6 py-3.5 text-left text-carbon-300 hover:text-white hover:bg-carbon-700 transition-all duration-200"
                          whileHover={{ x: 4 }}
                        >
                          <Edit3 className="w-5 h-5 text-primary" />
                          <span className="font-medium">Editar perfil</span>
                        </motion.button>

                        <div className="h-px bg-carbon-700 my-2" />

                        <motion.button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-4 px-6 py-3.5 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                          whileHover={{ x: 4 }}
                        >
                          <LogOut className="w-5 h-5" />
                          <span className="font-medium">Cerrar sesión</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute bottom-20 right-1/4 w-96 h-96 bg-success/5 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
        </div>

        <div className="p-6 lg:p-10">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12"
          >
            <h2 className="text-4xl lg:text-5xl font-extrabold mb-3 bg-gradient-to-r from-primary via-blue-400 to-success bg-clip-text text-transparent leading-tight">
              Mi Panel de Aprendizaje
            </h2>
            <p className="text-carbon-300 text-lg font-medium">Continúa tu crecimiento profesional</p>
          </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {myStats.map((stat, index) => {
          const Icon = stat.icon
          const isCertificates = stat.label === 'Certificados'
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                delay: index * 0.1,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1]
              }}
              whileHover={{ 
                scale: 1.03, 
                y: -8,
                transition: { duration: 0.3 }
              }}
              onClick={isCertificates && stats.certificates > 0 ? () => router.push('/certificates') : undefined}
              className={`relative group overflow-hidden backdrop-blur-xl bg-gradient-to-br from-carbon-800/90 via-carbon-700/90 to-carbon-800/90 rounded-2xl p-7 border border-carbon-600/50 hover:border-primary/60 transition-all duration-500 shadow-2xl shadow-black/20 hover:shadow-2xl hover:shadow-primary/20 ${isCertificates && stats.certificates > 0 ? 'cursor-pointer' : ''}`}
            >
              {/* Animated Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
              
              {/* Glow Effect */}
              <div className={`absolute -top-1/2 -right-1/2 w-32 h-32 bg-gradient-to-br ${stat.color} rounded-full opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 group-hover:scale-150`}></div>
              
              {/* Border Glow */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-500 -z-10`}></div>
              
              <div className="relative z-10">
                <motion.div 
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-5 shadow-xl shadow-black/30 group-hover:shadow-2xl group-hover:shadow-primary/30 transition-all duration-500`}
                  whileHover={{ rotate: [0, -5, 5, -5, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Icon className="w-7 h-7 text-white drop-shadow-lg" />
                </motion.div>
                <p className="text-carbon-400 text-sm font-medium mb-2 uppercase tracking-wider">{stat.label}</p>
                <p className="text-4xl font-extrabold text-white tracking-tight">{stat.value}</p>
                {isCertificates && stats.certificates > 0 && (
                  <p className="text-carbon-400 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click para ver →
                  </p>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Assigned Courses */}
      <div>
        <motion.h2 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-3xl font-bold text-white mb-8 tracking-tight"
        >
          Mis Cursos Asignados
        </motion.h2>
        {assignedCourses.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="backdrop-blur-xl bg-gradient-to-br from-carbon-800/80 via-carbon-700/80 to-carbon-800/80 rounded-2xl p-16 border border-carbon-600/50 text-center shadow-2xl shadow-black/20"
          >
            <BookOpen className="w-20 h-20 text-carbon-400 mx-auto mb-6 opacity-50" />
            <p className="text-carbon-200 text-xl font-semibold mb-3">No tienes cursos asignados aún</p>
            <p className="text-carbon-400 text-base">Tu organización te asignará cursos próximamente</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {assignedCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: index * 0.1,
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1]
                }}
                whileHover={{ 
                  y: -12,
                  scale: 1.02,
                  transition: { duration: 0.3 }
                }}
                onClick={() => handleCourseClick(course)}
                className="group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-carbon-800/90 via-carbon-700/90 to-carbon-800/90 rounded-3xl border border-carbon-600/50 hover:border-primary/60 transition-all duration-500 cursor-pointer shadow-2xl shadow-black/30 hover:shadow-2xl hover:shadow-primary/30"
              >
                {/* Animated Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Glow Effects */}
                <div className="absolute -top-1/2 -left-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -bottom-1/2 -right-1/2 w-64 h-64 bg-success/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <div className="p-8 relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    {course.thumbnail.startsWith('http') || course.thumbnail.startsWith('/') ? (
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl shadow-black/30 border-2 border-carbon-600/50 group-hover:border-primary/50 transition-all duration-500"
                      >
                        <img 
                          src={course.thumbnail} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    ) : (
                      <motion.div 
                        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-success/20 flex items-center justify-center text-4xl shadow-xl shadow-black/30 border-2 border-carbon-600/50 group-hover:border-primary/50 transition-all duration-500"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        {course.thumbnail}
                      </motion.div>
                    )}
                    <motion.span 
                      className={`px-4 py-2 rounded-full text-xs font-bold backdrop-blur-sm border ${
                        course.status === 'Completado' 
                          ? 'bg-green-500/20 text-green-300 border-green-500/30 shadow-lg shadow-green-500/20'
                          : course.status === 'En progreso'
                          ? 'bg-primary/20 text-primary border-primary/30 shadow-lg shadow-primary/20'
                          : 'bg-carbon-600/50 text-carbon-300 border-carbon-500/30'
                      }`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {course.status}
                    </motion.span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-success transition-all duration-500 leading-tight">
                    {course.title}
                  </h3>
                  <p className="text-carbon-300 text-base mb-6 font-medium">Por {course.instructor}</p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-carbon-400 text-sm font-medium uppercase tracking-wider">Progreso</span>
                      <span className="text-primary font-bold text-lg">{course.progress}%</span>
                    </div>
                    <div className="h-3 bg-carbon-700/50 rounded-full overflow-hidden shadow-inner border border-carbon-600/30">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${course.progress}%` }}
                        transition={{ delay: index * 0.2 + 0.3, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full bg-gradient-to-r from-primary via-blue-400 to-success rounded-full shadow-lg shadow-primary/30 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                      </motion.div>
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (course.progress === 100 && course.has_certificate) {
                        handleCourseClick(course, 'certificate')
                      } else {
                        handleCourseClick(course)
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-primary via-blue-500 to-success rounded-xl text-white font-bold text-base shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/50 transition-all duration-500 relative overflow-hidden group/btn"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-success/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10 flex items-center gap-3">
                      {course.progress === 100 && course.has_certificate ? (
                        <>
                          <Award className="w-5 h-5" />
                          Ver Certificado
                        </>
                      ) : course.progress === 100 ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Curso Completado
                        </>
                      ) : course.progress > 0 ? (
                        <>
                          <PlayCircle className="w-5 h-5" />
                          Continuar Curso
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-5 h-5" />
                          Empezar Curso
                        </>
                      )}
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
        </div>
      </main>
    </div>
  )
}

