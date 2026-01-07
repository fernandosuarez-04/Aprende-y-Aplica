import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'

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

export interface TeamStats {
  average_progress: number
  courses_completed: number
  total_enrollments: number
  total_time_hours: number
  lia_conversations: number
}

export interface TeamAnalytics {
  team_id: string
  name: string
  description: string | null
  image_url: string | null
  member_count: number
  stats: TeamStats
}

export interface TeamsData {
  total_teams: number
  teams: TeamAnalytics[]
  ranking: TeamAnalytics[]
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
  teams?: TeamsData
  study_planner?: any
  engagement_metrics?: any
}

/**
 * Hook para obtener datos de analytics de la organización.
 *
 * IMPORTANTE: Este hook usa el orgSlug de la URL para asegurar
 * que se obtengan los datos de la organización correcta.
 */
export function useBusinessAnalytics() {
  const params = useParams()
  const orgSlug = params?.orgSlug as string | undefined

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    if (!orgSlug) {
      setError('No se pudo determinar la organización')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Usar la API org-scoped
      const response = await fetch(`/api/${orgSlug}/business/analytics`, {
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || `Error ${response.status}: ${response.statusText}`

        if (response.status === 401 || response.status === 403) {
          throw new Error(errorMessage)
        }

        throw new Error(errorMessage)
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
          },
          teams: result.teams || {
            total_teams: 0,
            teams: [],
            ranking: []
          },
          study_planner: result.study_planner,
          engagement_metrics: result.engagement_metrics
        })
      } else {
        throw new Error(result.error || 'Error al obtener datos de analytics')
      }
    } catch (err) {
      let errorMessage = 'Error desconocido al cargar analytics'

      if (err instanceof Error) {
        errorMessage = err.message

        if (err.message.includes('401') || err.message.includes('No autenticado') || err.message.includes('Sesión')) {
          errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.'
        } else if (err.message.includes('403') || err.message.includes('Permisos insuficientes')) {
          errorMessage = 'No tienes permisos para acceder a esta información.'
        }
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [orgSlug])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return {
    data,
    isLoading,
    error,
    refetch: fetchAnalytics
  }
}
