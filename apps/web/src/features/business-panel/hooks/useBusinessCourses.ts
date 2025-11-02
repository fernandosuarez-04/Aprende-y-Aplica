import { useState, useEffect } from 'react'

export interface BusinessCourse {
  id: string
  title: string
  description: string | null
  category: string | null
  level: string | null
  instructor: {
    id: string
    name: string
    email: string
  }
  duration: number | null
  thumbnail_url: string | null
  slug: string | null
  price: number | null
  rating: number
  student_count: number
  review_count: number
  learning_objectives: string[] | null
  created_at: string
  updated_at: string
}

export interface BusinessCoursesStats {
  total: number
  byCategory: Record<string, number>
  byLevel: Record<string, number>
}

export function useBusinessCourses() {
  const [courses, setCourses] = useState<BusinessCourse[]>([])
  const [stats, setStats] = useState<BusinessCoursesStats>({
    total: 0,
    byCategory: {},
    byLevel: {}
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCourses = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/business/courses', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.courses) {
        setCourses(data.courses)

        // Calcular estadísticas
        const byCategory: Record<string, number> = {}
        const byLevel: Record<string, number> = {}

        data.courses.forEach((course: BusinessCourse) => {
          // Por categoría
          const category = course.category || 'Sin categoría'
          byCategory[category] = (byCategory[category] || 0) + 1

          // Por nivel
          const level = course.level || 'Sin nivel'
          byLevel[level] = (byLevel[level] || 0) + 1
        })

        setStats({
          total: data.courses.length,
          byCategory,
          byLevel
        })
      } else {
        throw new Error(data.error || 'Error al obtener cursos')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error fetching courses:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  return {
    courses,
    stats,
    isLoading,
    error,
    refetch: fetchCourses
  }
}
