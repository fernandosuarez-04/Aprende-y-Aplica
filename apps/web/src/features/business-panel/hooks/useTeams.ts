import { useState, useEffect } from 'react'
import { TeamsService, WorkTeam } from '../services/teams.service'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function useTeams() {
  const { user } = useAuth()
  const [teams, setTeams] = useState<WorkTeam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTeams = async () => {
    if (!user?.organization_id) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const fetchedTeams = await TeamsService.getTeams(user.organization_id)
      setTeams(fetchedTeams)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar equipos')
      console.error('Error fetching teams:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [user?.organization_id])

  return {
    teams,
    isLoading,
    error,
    refetch: fetchTeams
  }
}

