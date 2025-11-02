import { useState, useEffect } from 'react'

export interface GeneralMetrics {
  total_users: number
  total_courses_assigned: number
  completed_courses: number
  average_progress: number
  total_time_hours: number
  total_certificates: number
  active_users: number
  retention_rate: number
}

export interface UserAnalytics {
  user_id: string
  display_name: string
  email: string
  username: string
  role: string
  profile_picture_url: string | null
  courses_assigned: number
  courses_completed: number
  average_progress: number
  total_time_hours: number
  certificates_count: number
  last_login_at: string | null
  joined_at: string
}

export interface TrendData {
  month: string
  count: number
  label: string
}

export interface RoleData {
  role: string
  count?: number
  average_progress?: number
  total_completed?: number
  average_hours?: number
}

export interface CourseMetrics {
  status: string
  count: number
}

export interface AnalyticsData {
  general_metrics: GeneralMetrics
  user_analytics: UserAnalytics[]
  trends: {
    enrollments_by_month: TrendData[]
    completions_by_month: TrendData[]
    time_by_month: TrendData[]
    active_users_by_month: TrendData[]
  }
  by_role: {
    distribution: RoleData[]
    progress_comparison: RoleData[]
    completions: RoleData[]
    time_spent: RoleData[]
  }
  course_metrics: {
    distribution: CourseMetrics[]
    top_by_time: any[]
  }
}

export function useBusinessAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/business/analytics', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success && result.general_metrics) {
        setData({
          general_metrics: result.general_metrics,
          user_analytics: result.user_analytics || [],
          trends: result.trends || {
            enrollments_by_month: [],
            completions_by_month: [],
            time_by_month: [],
            active_users_by_month: []
          },
          by_role: result.by_role || {
            distribution: [],
            progress_comparison: [],
            completions: [],
            time_spent: []
          },
          course_metrics: result.course_metrics || {
            distribution: [],
            top_by_time: []
          }
        })
      } else {
        throw new Error(result.error || 'Error al obtener datos de analytics')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar analytics'
      setError(errorMessage)
      console.error('Error fetching analytics:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  return {
    data,
    isLoading,
    error,
    refetch: fetchAnalytics
  }
}

