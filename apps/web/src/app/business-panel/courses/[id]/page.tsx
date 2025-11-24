'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft,
  Clock,
  User,
  Star,
  BookOpen,
  Play,
  CheckCircle,
  Users,
  Tag,
  Award,
  FileText,
  Video,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Calendar,
  Eye,
  ThumbsUp,
  MessageSquare,
  BarChart3
} from 'lucide-react'
import Image from 'next/image'
import { Button } from '@aprende-y-aplica/ui'
import { BusinessAssignCourseModal } from '@/features/business-panel/components/BusinessAssignCourseModal'
import { CourseAnalyticsTab } from '@/features/business-panel/components/CourseAnalyticsTab'
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'

interface CourseDetail {
  id: string
  title: string
  description: string | null
  category: string | null
  level: string | null
  instructor: {
    id: string
    name: string
    email: string
    profile_picture_url: string | null
    bio: string | null
    linkedin_url: string | null
    github_url: string | null
    website_url: string | null
    location: string | null
    cargo_rol: string | null
    type_rol: string | null
  } | null
  duration: number | null
  thumbnail_url: string | null
  slug: string | null
  price: number | null
  rating: number
  student_count: number
  review_count: number
  learning_objectives: string[]
  created_at: string
  updated_at: string
  stats: {
    total_modules: number
    total_lessons: number
    total_duration_minutes: number
  }
  modules: Array<{
    module_id: string
    module_title: string
    module_description: string | null
    module_order_index: number
    module_duration_minutes: number | null
    is_required: boolean
    lessons: Array<{
      lesson_id: string
      lesson_title: string
      lesson_description: string | null
      lesson_order_index: number
      duration_seconds: number
      video_provider: string
      video_provider_id: string
    }>
  }>
  reviews: Array<{
    id: string
    title: string | null
    content: string
    rating: number
    is_verified: boolean
    created_at: string
    user: {
      name: string
      profile_picture_url: string | null
    }
  }>
  subscription_status?: {
    has_subscription: boolean
    is_purchased: boolean // Mantener para compatibilidad
    is_organization_purchased: boolean
    can_assign: boolean
    can_purchase_for_free?: boolean
    monthly_course_count?: number
    max_courses_per_period?: number
  }
}

export default function BusinessCourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'info' | 'content' | 'reviews' | 'instructor' | 'analytics'>('info')
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        setError('ID de curso no válido')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        console.log('🔍 Fetching course with ID:', courseId)

        const response = await fetch(`/api/business/courses/${courseId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        console.log('📡 Response status:', response.status)

        let data
        try {
          const responseText = await response.text()
          console.log('📦 Response text:', responseText.substring(0, 500))
          
          if (!responseText) {
            throw new Error('Respuesta vacía del servidor')
          }
          
          data = JSON.parse(responseText)
          console.log('📦 Parsed data:', data)
        } catch (jsonError) {
          console.error('❌ Failed to parse JSON response:', jsonError)
          throw new Error(`Error al procesar la respuesta del servidor (${response.status})`)
        }

        if (!response.ok) {
          const errorMessage = data?.error || `Error ${response.status}: ${response.statusText}`
          console.error('❌ API Error:', {
            status: response.status,
            statusText: response.statusText,
            error: data?.error,
            fullData: data
          })
          throw new Error(errorMessage)
        }

        if (data.success && data.course) {
          console.log('✅ Course loaded successfully:', data.course.title)
          setCourse(data.course)
          // Expandir el primer módulo por defecto
          if (data.course.modules && data.course.modules.length > 0) {
            setExpandedModules(new Set([data.course.modules[0].module_id]))
          }
        } else {
          throw new Error(data.error || 'Error al cargar el curso')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar el curso'
        console.error('❌ Error loading course:', err)
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
  }, [courseId])

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
      return next
    })
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  const formatDurationSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getLevelColor = (level: string | null) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
      case 'principiante':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'intermediate':
      case 'intermedio':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'advanced':
      case 'avanzado':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handlePurchase = async () => {
    setIsPurchasing(true)
    setPurchaseError(null)
    setPurchaseSuccess(false)

    try {
      const response = await fetch(`/api/business/courses/${courseId}/purchase`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al adquirir el curso')
      }

      setPurchaseSuccess(true)
      
      // Refrescar datos del curso
      const courseResponse = await fetch(`/api/business/courses/${courseId}`, {
        credentials: 'include'
      })
      if (courseResponse.ok) {
        const courseData = await courseResponse.json()
        if (courseData.success && courseData.course) {
          setCourse(courseData.course)
        }
      }
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : 'Error al adquirir el curso')
    } finally {
      setIsPurchasing(false)
    }
  }

  const handleAssignComplete = () => {
    // Refrescar datos del curso si es necesario
    // El modal ya maneja el cierre y el refresh
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-carbon-700/50 rounded w-1/4 mb-6"></div>
          <div className="h-96 bg-carbon-700/50 rounded-xl mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 bg-carbon-700/50 rounded-xl"></div>
              <div className="h-64 bg-carbon-700/50 rounded-xl"></div>
            </div>
            <div className="h-96 bg-carbon-700/50 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="w-full">
        <div className="mb-6">
          <Button
            onClick={() => router.push('/business-panel/courses')}
            variant="outline"
            className="flex items-center gap-2 font-heading"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        </div>
        <div className="rounded-2xl p-12 border text-center backdrop-blur-sm" style={{ 
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          borderColor: 'rgba(51, 65, 85, 0.3)'
        }}>
          <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: '#f8fafc', opacity: 0.5 }} />
          <p className="font-body text-lg mb-2" style={{ color: '#f8fafc' }}>
            {error || 'Curso no encontrado'}
          </p>
          <p className="font-body text-sm mt-2" style={{ color: '#f8fafc', opacity: 0.7 }}>
            El curso con ID "{courseId}" no existe o no tienes acceso a él.
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      {/* Header with Back Button */}
      <div className="mb-6">
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Cursos
        </Button>
      </div>

      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden border border-carbon-600 mb-8">
        {course.thumbnail_url ? (
          <div className="relative h-96 bg-carbon-600">
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-carbon-900 via-carbon-900/50 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    {course.category && (
                      <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold border border-primary/30">
                        {course.category}
                      </span>
                    )}
                    {course.level && (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getLevelColor(course.level)}`}>
                        {course.level}
                      </span>
                    )}
                    {course.stats.total_modules > 0 && (
                      <span className="px-3 py-1 bg-carbon-700/50 text-carbon-300 rounded-full text-xs font-semibold border border-carbon-600">
                        {course.stats.total_modules} módulos
                      </span>
                    )}
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    {course.title}
                  </h1>
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        <span className="text-white font-bold text-lg">{course.rating.toFixed(1)}</span>
                      </div>
                      {course.review_count > 0 && (
                        <span className="text-carbon-300 text-sm">
                          ({course.review_count} {course.review_count === 1 ? 'reseña' : 'reseñas'})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-carbon-300">
                      <Users className="w-5 h-5" />
                      <span>{course.student_count.toLocaleString()} estudiantes</span>
                    </div>
                    <div className="flex items-center gap-2 text-carbon-300">
                      <Clock className="w-5 h-5" />
                      <span>{formatDuration(course.stats.total_duration_minutes)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-carbon-300">
                      <Calendar className="w-5 h-5" />
                      <span>Actualizado {formatDate(course.updated_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-96 bg-gradient-to-br from-primary/20 to-success/20 flex items-center justify-center">
            <BookOpen className="w-32 h-32 text-primary/30" />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl border border-carbon-600 overflow-hidden">
            <div className="flex border-b border-carbon-600">
              {[
                { id: 'overview', label: 'Información', icon: BookOpen },
                { id: 'content', label: 'Contenido', icon: FileText },
                { id: 'reviews', label: 'Reseñas', icon: Star },
                { id: 'instructor', label: 'Instructor', icon: User },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary/20 text-primary border-b-2 border-primary'
                        : 'text-carbon-300 hover:text-white hover:bg-carbon-700/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold">{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="space-y-6">
                      {/* Learning Objectives */}
                      {course.learning_objectives && course.learning_objectives.length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold text-white mb-4">Lo que aprenderás</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {course.learning_objectives.map((objective: string, index: number) => (
                              <div key={index} className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                <span className="text-carbon-300">{objective}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {course.description && (
                        <div>
                          <h3 className="text-xl font-bold text-white mb-3">Descripción del Curso</h3>
                          <p className="text-carbon-300 leading-relaxed whitespace-pre-line">
                            {course.description}
                          </p>
                        </div>
                      )}

                      {/* Course Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-carbon-800/50 rounded-xl p-4 border border-carbon-600">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-5 h-5 text-primary" />
                            <span className="text-carbon-400 text-sm">Módulos</span>
                          </div>
                          <p className="text-2xl font-bold text-white">{course.stats.total_modules}</p>
                        </div>
                        <div className="bg-carbon-800/50 rounded-xl p-4 border border-carbon-600">
                          <div className="flex items-center gap-2 mb-2">
                            <Video className="w-5 h-5 text-primary" />
                            <span className="text-carbon-400 text-sm">Lecciones</span>
                          </div>
                          <p className="text-2xl font-bold text-white">{course.stats.total_lessons}</p>
                        </div>
                        <div className="bg-carbon-800/50 rounded-xl p-4 border border-carbon-600">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-primary" />
                            <span className="text-carbon-400 text-sm">Duración</span>
                          </div>
                          <p className="text-2xl font-bold text-white">{formatDuration(course.stats.total_duration_minutes)}</p>
                        </div>
                        <div className="bg-carbon-800/50 rounded-xl p-4 border border-carbon-600">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-5 h-5 text-primary" />
                            <span className="text-carbon-400 text-sm">Estudiantes</span>
                          </div>
                          <p className="text-2xl font-bold text-white">{course.student_count.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'content' && (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">
                          Contenido del Curso
                        </h3>
                        <span className="text-carbon-400 text-sm">
                          {course.stats.total_modules} módulos • {course.stats.total_lessons} lecciones • {formatDuration(course.stats.total_duration_minutes)}
                        </span>
                      </div>

                      {course.modules.length === 0 ? (
                        <div className="text-center py-12">
                          <BookOpen className="w-16 h-16 text-carbon-500 mx-auto mb-4" />
                          <p className="text-carbon-400">Este curso aún no tiene contenido disponible</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {course.modules.map((module, moduleIndex) => {
                            const isExpanded = expandedModules.has(module.module_id)
                            const moduleLessonsDuration = module.lessons.reduce((sum, l) => sum + l.duration_seconds, 0)
                            const moduleDuration = module.module_duration_minutes 
                              ? module.module_duration_minutes * 60 
                              : moduleLessonsDuration
                            
                            return (
                              <div
                                key={module.module_id}
                                className="bg-carbon-800/50 rounded-xl border border-carbon-600 overflow-hidden"
                              >
                                <button
                                  onClick={() => toggleModule(module.module_id)}
                                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-carbon-700/50 transition-colors"
                                >
                                  <div className="flex items-center gap-4 flex-1 text-left">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                                      isExpanded ? 'bg-primary' : 'bg-carbon-600'
                                    }`}>
                                      {moduleIndex + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-white font-semibold mb-1">{module.module_title}</h4>
                                      <div className="flex items-center gap-4 text-sm text-carbon-400">
                                        <span>{module.lessons.length} {module.lessons.length === 1 ? 'lección' : 'lecciones'}</span>
                                        <span>{formatDurationSeconds(moduleDuration)}</span>
                                        {module.is_required && (
                                          <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs">Requerido</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-carbon-400" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 text-carbon-400" />
                                  )}
                                </button>

                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="px-6 pb-4 space-y-2 border-t border-carbon-600 pt-4">
                                        {module.module_description && (
                                          <p className="text-carbon-400 text-sm mb-4">{module.module_description}</p>
                                        )}
                                        {module.lessons.map((lesson, lessonIndex) => (
                                          <div
                                            key={lesson.lesson_id}
                                            className="flex items-center gap-3 p-3 rounded-lg bg-carbon-700/30 hover:bg-carbon-700/50 transition-colors"
                                          >
                                            <Play className="w-4 h-4 text-carbon-400 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-white text-sm font-medium">
                                                {lessonIndex + 1}. {lesson.lesson_title}
                                              </p>
                                              {lesson.lesson_description && (
                                                <p className="text-carbon-400 text-xs mt-1 line-clamp-1">
                                                  {lesson.lesson_description}
                                                </p>
                                              )}
                                            </div>
                                            <span className="text-carbon-500 text-xs flex-shrink-0">
                                              {formatDurationSeconds(lesson.duration_seconds)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'reviews' && (
                  <motion.div
                    key="reviews"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="space-y-6">
                      {course.reviews.length === 0 ? (
                        <div className="text-center py-12">
                          <Star className="w-16 h-16 text-carbon-500 mx-auto mb-4" />
                          <p className="text-carbon-400">Aún no hay reseñas para este curso</p>
                        </div>
                      ) : (
                        course.reviews.map((review) => (
                          <div
                            key={review.id}
                            className="bg-carbon-800/50 rounded-xl p-6 border border-carbon-600"
                          >
                            <div className="flex items-start gap-4 mb-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-primary to-success rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                {review.user.name[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-white font-semibold">{review.user.name}</h4>
                                  {review.is_verified && (
                                    <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" />
                                      Verificado
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating
                                          ? 'text-yellow-400 fill-yellow-400'
                                          : 'text-carbon-600'
                                      }`}
                                    />
                                  ))}
                                  <span className="text-carbon-400 text-xs ml-1">
                                    {formatDate(review.created_at)}
                                  </span>
                                </div>
                                {review.title && (
                                  <h5 className="text-white font-medium mb-2">{review.title}</h5>
                                )}
                                <p className="text-carbon-300 text-sm leading-relaxed whitespace-pre-line">
                                  {review.content}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'instructor' && course.instructor && (
                  <motion.div
                    key="instructor"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="space-y-6">
                      {/* Profile Header */}
                      <div className="flex items-start gap-6">
                        {course.instructor.profile_picture_url ? (
                          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary flex-shrink-0">
                            <Image
                              src={course.instructor.profile_picture_url}
                              alt={course.instructor.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 bg-gradient-to-br from-primary to-success rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 border-2 border-primary">
                            {course.instructor.name[0].toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-2xl font-bold text-white mb-2">{course.instructor.name}</h3>
                          <p className="text-carbon-300 text-lg mb-4">Instructor</p>
                          {/* Social Links */}
                          <div className="flex items-center gap-3 flex-wrap mb-4">
                            {course.instructor.linkedin_url && (
                              <a
                                href={course.instructor.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg border border-blue-600/30 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                                <span className="text-sm font-medium">LinkedIn</span>
                              </a>
                            )}
                            {course.instructor.github_url && (
                              <a
                                href={course.instructor.github_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-gray-700/20 hover:bg-gray-700/30 text-gray-300 rounded-lg border border-gray-600/30 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                                </svg>
                                <span className="text-sm font-medium">GitHub</span>
                              </a>
                            )}
                            {course.instructor.website_url && (
                              <a
                                href={course.instructor.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg border border-primary/30 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                                <span className="text-sm font-medium">Portafolio</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Email */}
                      {course.instructor.email && (
                        <div className="bg-carbon-800/50 rounded-xl p-4 border border-carbon-600">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-carbon-400 text-sm mb-1">Correo electrónico</p>
                              <a
                                href={`mailto:${course.instructor.email}`}
                                className="text-primary hover:text-primary/80 transition-colors font-medium break-all"
                              >
                                {course.instructor.email}
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Bio */}
                      {course.instructor.bio && (
                        <div className="bg-carbon-800/50 rounded-xl p-5 border border-carbon-600">
                          <h4 className="text-lg font-bold text-white mb-3 font-heading">Biografía</h4>
                          <p className="text-carbon-300 leading-relaxed whitespace-pre-line font-body">
                            {course.instructor.bio}
                          </p>
                        </div>
                      )}

                      {/* Social Links Section - Only show if there are links */}
                      {(course.instructor.linkedin_url || course.instructor.github_url || course.instructor.website_url) && (
                        <div className="bg-carbon-800/50 rounded-xl p-5 border border-carbon-600">
                          <h4 className="text-lg font-bold text-white mb-4 font-heading">Enlaces del Perfil</h4>
                          <div className="flex flex-col gap-3">
                            {course.instructor.linkedin_url && (
                              <a
                                href={course.instructor.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl border border-blue-600/30 transition-colors font-body"
                              >
                                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                                <span className="font-medium">LinkedIn</span>
                                <span className="text-sm text-carbon-400 ml-auto truncate max-w-[200px]">{course.instructor.linkedin_url}</span>
                              </a>
                            )}
                            {course.instructor.github_url && (
                              <a
                                href={course.instructor.github_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-4 py-3 bg-gray-700/20 hover:bg-gray-700/30 text-gray-300 rounded-xl border border-gray-600/30 transition-colors font-body"
                              >
                                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                                </svg>
                                <span className="font-medium">GitHub</span>
                                <span className="text-sm text-carbon-400 ml-auto truncate max-w-[200px]">{course.instructor.github_url}</span>
                              </a>
                            )}
                            {course.instructor.website_url && (
                              <a
                                href={course.instructor.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-4 py-3 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl border border-primary/30 transition-colors font-body"
                              >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                                <span className="font-medium">Portafolio</span>
                                <span className="text-sm text-carbon-400 ml-auto truncate max-w-[200px]">{course.instructor.website_url}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
                {activeTab === 'analytics' && course && (
                  <CourseAnalyticsTab courseId={course.id} />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Course Info Card */}
          <div className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-6 border border-carbon-600 sticky top-6">
            <div className="space-y-6">
              {/* Price */}
              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  {course.subscription_status?.is_organization_purchased ? (
                    // Ya comprado - mostrar como adquirido
                    <span className="text-3xl font-bold text-success">Adquirido</span>
                  ) : course.subscription_status?.can_purchase_for_free ? (
                    // Puede comprar gratis
                    <span className="text-3xl font-bold text-primary">Gratis</span>
                  ) : course.price && course.price > 0 ? (
                    // Debe pagar precio del curso
                    <>
                      <span className="text-3xl font-bold text-white">
                        ${course.price.toFixed(2)}
                      </span>
                      <span className="text-carbon-400 text-sm">USD</span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-primary">Gratis</span>
                  )}
                </div>
                {!course.subscription_status?.is_organization_purchased && 
                 course.subscription_status?.has_subscription && 
                 course.subscription_status.monthly_course_count !== undefined && (
                  <p className="text-carbon-400 text-xs mt-1 font-body">
                    {course.subscription_status.monthly_course_count} de {course.subscription_status.max_courses_per_period} cursos usados este período
                  </p>
                )}
                {!course.subscription_status?.is_organization_purchased && 
                 course.subscription_status?.has_subscription && 
                 !course.subscription_status?.can_purchase_for_free && (
                  <p className="text-yellow-400 text-xs mt-1 font-body">
                    Límite mensual alcanzado. Se aplicará el precio del curso.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {purchaseSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-success/20 border border-success/30 flex items-center gap-2 text-success"
                  >
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">Curso adquirido exitosamente</span>
                  </motion.div>
                )}
                
                {purchaseError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center gap-2 text-red-400"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{purchaseError}</span>
                  </motion.div>
                )}

                {course.subscription_status?.has_subscription === false ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    disabled
                  >
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Requiere membresía
                  </Button>
                ) : course.subscription_status?.is_organization_purchased ? (
                  <Button
                    variant="gradient"
                    className="w-full"
                    size="lg"
                    onClick={() => setIsAssignModalOpen(true)}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Asignar Curso
                  </Button>
                ) : (
                  <Button
                    variant="gradient"
                    className="w-full"
                    size="lg"
                    onClick={handlePurchase}
                    disabled={isPurchasing}
                  >
                    {isPurchasing ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Comprando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Play className="w-5 h-5" />
                        Comprar Curso
                      </span>
                    )}
                  </Button>
                )}
              </div>

              {/* Course Features */}
              <div className="space-y-3 pt-4 border-t border-carbon-600">
                <div className="flex items-center gap-3 text-carbon-300">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-sm">Acceso de por vida</span>
                </div>
                <div className="flex items-center gap-3 text-carbon-300">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-sm">{course.stats.total_lessons} lecciones en video</span>
                </div>
                <div className="flex items-center gap-3 text-carbon-300">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-sm">Certificado de finalización</span>
                </div>
                <div className="flex items-center gap-3 text-carbon-300">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-sm">Actualizado {formatDate(course.updated_at)}</span>
                </div>
              </div>

              {/* Rating Summary */}
              {course.rating > 0 && (
                <div className="pt-4 border-t border-carbon-600">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                      <span className="text-2xl font-bold text-white">{course.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(course.rating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-carbon-600'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-carbon-400 text-xs">
                        {course.review_count} {course.review_count === 1 ? 'reseña' : 'reseñas'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Assign Course Modal */}
      {course && (
        <BusinessAssignCourseModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          courseId={course.id}
          courseTitle={course.title}
          onAssignComplete={handleAssignComplete}
        />
      )}
    </motion.div>
  )
}

