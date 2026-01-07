import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { WorkTeam } from '../services/teams.service'

/**
 * Hook para obtener equipos de trabajo de la organización.
 *
 * IMPORTANTE: Este hook usa el orgSlug de la URL para asegurar
 * que se obtengan los datos de la organización correcta.
 */
export function useTeams() {
  const params = useParams()
  const orgSlug = params?.orgSlug as string | undefined

  const [teams, setTeams] = useState<WorkTeam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTeams = useCallback(async () => {
    if (!orgSlug) {
      setError('No se pudo determinar la organización')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Usar la API org-scoped
      const response = await fetch(`/api/${orgSlug}/business/teams`, {
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al obtener equipos' }))
        throw new Error(errorData.error || 'Error al obtener equipos')
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Error al obtener equipos')
      }

      setTeams(data.teams || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar equipos')
    } finally {
      setIsLoading(false)
    }
  }, [orgSlug])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  return {
    teams,
    isLoading,
    error,
    refetch: fetchTeams
  }
}

