'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Search,
  Filter,
  Star,
  Users,
  Clock,
  GraduationCap,
  TrendingUp,
  Tag,
  Award
} from 'lucide-react'
import { useBusinessCourses, BusinessCourse } from '@/features/business-panel/hooks/useBusinessCourses'
import Image from 'next/image'
import { Button } from '@aprende-y-aplica/ui'
import { useRouter } from 'next/navigation'
import { StarRating } from '@/features/courses/components/StarRating'
import { PremiumSelect } from '@/features/business-panel/components/PremiumSelect'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'

export default function BusinessPanelCoursesPage() {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const { courses, stats, isLoading, error, refetch } = useBusinessCourses()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterLevel, setFilterLevel] = useState('all')
  const router = useRouter()

  // Aplicar colores personalizados
  const cardBg = panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)'
  const cardBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const textColor = panelStyles?.text_color || '#f8fafc'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'

  // Obtener categorías y niveles únicos para los filtros
  const categories = useMemo(() => {
    const cats = new Set<string>()
    courses.forEach(course => {
      if (course.category) cats.add(course.category)
    })
    return Array.from(cats).sort()
  }, [courses])

  const levels = useMemo(() => {
    const levs = new Set<string>()
    courses.forEach(course => {
      if (course.level) levs.add(course.level)
    })
    return Array.from(levs).sort()
  }, [courses])

  // Filtrar cursos
  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = searchTerm === '' || 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = filterCategory === 'all' || course.category === filterCategory
      const matchesLevel = filterLevel === 'all' || course.level === filterLevel

      return matchesSearch && matchesCategory && matchesLevel
    })
  }, [courses, searchTerm, filterCategory, filterLevel])

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  const getLevelColor = (level: string | null) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
      case 'principiante':
        return 'bg-green-500/20 text-green-400'
      case 'intermediate':
      case 'intermedio':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'advanced':
      case 'avanzado':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-blue-500/20 text-blue-400'
    }
  }

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="w-full"
      >
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-carbon-700/50 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-carbon-700/50 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-carbon-700/50 rounded-xl"></div>
            ))}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-semibold mb-3" style={{ color: textColor }}>
              Gestión de Cursos
            </h1>
            <p className="font-body text-sm" style={{ color: textColor, opacity: 0.7 }}>
              Asigna cursos a tu equipo y supervisa su progreso
            </p>
          </div>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="p-4 rounded-xl border backdrop-blur-sm" style={{ 
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            borderColor: 'rgba(234, 179, 8, 0.3)'
          }}>
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-yellow-400" />
              <div>
                <h4 className="font-body text-sm font-heading font-semibold text-yellow-400">Información</h4>
                <p className="font-body text-xs mt-1" style={{ color: textColor, opacity: 0.8 }}>{error}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}


      {/* Filters */}
      <div className="rounded-2xl p-6 border mb-6 backdrop-blur-sm" style={{ 
        backgroundColor: cardBg,
        borderColor: cardBorder
      }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200" style={{ color: textColor, opacity: 0.5 }} />
            <input
              type="text"
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border rounded-xl font-body placeholder-carbon-500 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
              style={{ 
                backgroundColor: `${cardBg}CC`,
                borderColor: cardBorder,
                color: textColor
              }}
            />
          </div>

          <PremiumSelect
            value={filterCategory}
            onChange={setFilterCategory}
            options={[
              { value: 'all', label: 'Todas las categorías' },
              ...categories.map(cat => ({ value: cat, label: cat }))
            ]}
            placeholder="Todas las categorías"
            icon={<Filter className="w-5 h-5" />}
          />

          <PremiumSelect
            value={filterLevel}
            onChange={setFilterLevel}
            options={[
              { value: 'all', label: 'Todos los niveles' },
              ...levels.map(level => ({ value: level, label: level }))
            ]}
            placeholder="Todos los niveles"
            icon={<GraduationCap className="w-5 h-5" />}
          />
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="rounded-2xl p-12 border text-center backdrop-blur-sm" style={{ 
          backgroundColor: cardBg,
          borderColor: cardBorder
        }}>
          <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: textColor, opacity: 0.5 }} />
          <p className="font-body text-lg mb-2" style={{ color: textColor }}>
            {courses.length === 0 ? 'No hay cursos disponibles' : 'No se encontraron cursos'}
          </p>
          <p className="font-body text-sm" style={{ color: textColor, opacity: 0.6 }}>
            {courses.length === 0 
              ? 'Aún no hay cursos disponibles en la plataforma'
              : 'Intenta con otros filtros de búsqueda'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -3, scale: 1.01 }}
              onClick={() => router.push(`/business-panel/courses/${course.id}`)}
              className="rounded-xl overflow-hidden border transition-all duration-300 cursor-pointer group backdrop-blur-sm"
              style={{ 
                backgroundColor: cardBg,
                borderColor: cardBorder
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${primaryColor}50`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = cardBorder
              }}
            >
              {/* Thumbnail */}
              <div className="relative h-32 bg-carbon-600 overflow-hidden">
                {course.thumbnail_url ? (
                  <Image
                    src={course.thumbnail_url}
                    alt={course.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-success/20 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-primary/50" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getLevelColor(course.level)}`}>
                    {course.level || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-3">
                <h3 className="font-heading text-sm font-semibold mb-1.5 line-clamp-2 transition-colors" style={{ color: textColor }}>
                  {course.title}
                </h3>
                <p className="font-body text-xs mb-2.5 line-clamp-1" style={{ color: textColor, opacity: 0.7 }}>
                  {course.description || 'Sin descripción'}
                </p>

                {/* Instructor */}
                <div className="flex items-center gap-1.5 mb-2.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                    {course.instructor.name[0].toUpperCase()}
                  </div>
                  <span className="font-body text-xs truncate" style={{ color: textColor, opacity: 0.8 }}>{course.instructor.name}</span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2 text-xs mb-2" style={{ color: textColor, opacity: 0.6 }}>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span className="font-body">{formatDuration(course.duration)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span className="font-body">{course.student_count || 0}</span>
                  </div>
                </div>

                {/* Rating & Category */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <StarRating
                      rating={course.rating || 0}
                      size="sm"
                      showRatingNumber={false}
                    />
                    <span className="font-body text-xs" style={{ color: textColor, opacity: 0.6 }}>
                      {course.rating ? course.rating.toFixed(1) : '0.0'}
                    </span>
                  </div>
                  {course.category && (
                    <div className="flex items-center gap-1">
                      <Tag className="w-3 h-3" style={{ color: textColor, opacity: 0.5 }} />
                      <span className="font-body text-xs truncate max-w-[60px]" style={{ color: textColor, opacity: 0.6 }}>{course.category}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
