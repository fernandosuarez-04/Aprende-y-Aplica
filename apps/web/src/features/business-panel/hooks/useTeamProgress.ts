import { useState, useEffect } from 'react'

export interface TeamProgressStats {
  total_users: number
  total_courses_assigned: number
  completed_courses: number
  average_progress: number
  total_time_spent_hours: number
  completion_rate: number
}

export interface TeamProgressCourse {
  course_id: string
  course_title: string
  thumbnail_url: string | null
  total_assigned: number
  completed: number
  in_progress: number
  not_started: number
  average_progress: number
  total_time_minutes: number
  total_time_hours: number
}

export interface TeamProgressUser {
  user_id: string
  username: string
  email: string
  display_name: string
  first_name: string | null
  last_name: string | null
  profile_picture_url: string | null
  role: 'owner' | 'admin' | 'member'
  last_login_at: string | null
  courses_assigned: number
  courses_completed: number
  courses_in_progress: number
  average_progress: number
  time_spent_hours: number
  certificates_count: number
  last_activity: string | null
}

export interface TeamProgressCharts {
  distribution: Array<{
    name: string
    value: number
    color: string
  }>
  progress_by_course: Array<{
    course_id: string
    course_title: string
    progress: number
    total_assigned: number
    completed: number
  }>
  progress_by_user: Array<{
    user_id: string
    display_name: string
    progress: number
  }>
  completion_trends: Array<{
    month: string
    count: number
  }>
  time_by_course: Array<{
    course_id: string
    course_title: string
    total_hours: number
  }>
}

export interface TeamProgressData {
  stats: TeamProgressStats
  courses: TeamProgressCourse[]
  users: TeamProgressUser[]
  charts: TeamProgressCharts
}

export function useTeamProgress() {
  const [data, setData] = useState<TeamProgressData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProgress = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/business/progress', {
        credentials: 'include'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar progreso del equipo')
      }

      if (result.success && result.stats) {
        setData({
          stats: result.stats,
          courses: result.courses || [],
          users: result.users || [],
          charts: result.charts || {
            distribution: [],
            progress_by_course: [],
            progress_by_user: [],
            completion_trends: [],
            time_by_course: []
          }
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar progreso del equipo')
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProgress()
  }, [])

  return {
    data,
    isLoading,
    error,
    refetch: fetchProgress
  }
}

