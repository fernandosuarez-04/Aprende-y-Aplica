'use client'

import React, { useState, useEffect } from 'react'
import { CourseWithInstructor } from '../services/course.service'
import { useAuth } from '../../auth/hooks/useAuth'

interface UseCoursesReturn {
  courses: CourseWithInstructor[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  filteredCourses: CourseWithInstructor[]
  setFilter: (filter: string) => void
  activeFilter: string
  setFavorites: (favorites: string[]) => void
}

export function useCourses(): UseCoursesReturn {
  const [courses, setCourses] = useState<CourseWithInstructor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [userFavorites, setUserFavorites] = useState<string[]>([])
  const { user } = useAuth()

  const fetchCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = user?.id 
        ? `/api/courses?userId=${user.id}`
        : '/api/courses'
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setCourses(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error fetching courses:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [user?.id])

  // Filtrar cursos basado en el filtro activo
  const filteredCourses = React.useMemo(() => {
    if (activeFilter === 'all') {
      return courses
    }
    
    if (activeFilter === 'favorites') {
      // Filtrar por favoritos del usuario
      return courses.filter(course => userFavorites.includes(course.id))
    }
    
    return courses.filter(course => 
      course.category?.toLowerCase() === activeFilter.toLowerCase()
    )
  }, [courses, activeFilter, userFavorites])

  const setFilter = (filter: string) => {
    setActiveFilter(filter)
  }

  return {
    courses,
    loading,
    error,
    refetch: fetchCourses,
    filteredCourses,
    setFilter,
    activeFilter,
    setFavorites: setUserFavorites
  }
}

interface UseCoursesByCategoryReturn {
  courses: CourseWithInstructor[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCoursesByCategory(category: string): UseCoursesByCategoryReturn {
  const [courses, setCourses] = useState<CourseWithInstructor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/courses?category=${encodeURIComponent(category)}`)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setCourses(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error fetching courses by category:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (category) {
      fetchCourses()
    }
  }, [category])

  return {
    courses,
    loading,
    error,
    refetch: fetchCourses
  }
}
