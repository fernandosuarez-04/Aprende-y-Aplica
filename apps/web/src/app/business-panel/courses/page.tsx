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

export default function BusinessPanelCoursesPage() {
  const { courses, stats, isLoading, error, refetch } = useBusinessCourses()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterLevel, setFilterLevel] = useState('all')
  const router = useRouter()

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
        <h1 className="text-4xl font-bold text-white mb-3">Gestión de Cursos</h1>
        <p className="text-carbon-300">Asigna cursos a tu equipo y supervisa su progreso</p>
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
          <div className="p-4 bg-yellow-900/20 border border-yellow-500/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-yellow-400" />
              <div>
                <h4 className="text-sm font-semibold text-yellow-400">Información</h4>
                <p className="text-xs text-carbon-300 mt-1">{error}</p>
              </div>
        </div>
      </div>
        </motion.div>
      )}


      {/* Filters */}
      <div className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-6 border border-carbon-600 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-carbon-400" />
            <input
              type="text"
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-carbon-600/50 border border-carbon-500 rounded-xl text-white placeholder-carbon-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-carbon-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-carbon-600/50 border border-carbon-500 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-carbon-400" />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-carbon-600/50 border border-carbon-500 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none"
            >
              <option value="all">Todos los niveles</option>
              {levels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-12 border border-carbon-600 text-center">
          <BookOpen className="w-16 h-16 text-carbon-500 mx-auto mb-4" />
          <p className="text-carbon-400 text-lg mb-2">
            {courses.length === 0 ? 'No hay cursos disponibles' : 'No se encontraron cursos'}
          </p>
          <p className="text-carbon-500 text-sm">
            {courses.length === 0 
              ? 'Aún no hay cursos disponibles en la plataforma'
              : 'Intenta con otros filtros de búsqueda'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              onClick={() => router.push(`/business-panel/courses/${course.id}`)}
              className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl overflow-hidden border border-carbon-600 hover:border-primary/50 transition-all duration-300 cursor-pointer group"
            >
              {/* Thumbnail */}
              <div className="relative h-48 bg-carbon-600 overflow-hidden">
                {course.thumbnail_url ? (
                  <Image
                    src={course.thumbnail_url}
                    alt={course.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-success/20 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-primary/50" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLevelColor(course.level)}`}>
                    {course.level || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {course.title}
                </h3>
                <p className="text-carbon-400 text-sm mb-4 line-clamp-2">
                  {course.description || 'Sin descripción'}
                </p>

                {/* Instructor */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-success rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {course.instructor.name[0].toUpperCase()}
                  </div>
                  <span className="text-carbon-300 text-sm">{course.instructor.name}</span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-carbon-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(course.duration)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{course.student_count || 0}</span>
                  </div>
                  <StarRating
                    rating={course.rating || 0}
                    size="sm"
                    showRatingNumber={true}
                  />
                </div>

                {/* Category */}
                {course.category && (
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-carbon-500" />
                    <span className="text-carbon-500 text-xs">{course.category}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
