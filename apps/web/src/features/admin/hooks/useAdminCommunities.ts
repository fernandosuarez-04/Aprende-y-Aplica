'use client'

import { useState, useEffect } from 'react'
import { AdminCommunity, CommunityStats } from '../services/adminCommunities.service'

interface UseAdminCommunitiesReturn {
  communities: AdminCommunity[]
  stats: CommunityStats | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useAdminCommunities(): UseAdminCommunitiesReturn {
  const [communities, setCommunities] = useState<AdminCommunity[]>([])
  const [stats, setStats] = useState<CommunityStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [communitiesResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/communities'),
        fetch('/api/admin/communities/stats')
      ])

      if (!communitiesResponse.ok || !statsResponse.ok) {
        throw new Error('Error al cargar los datos de comunidades')
      }

      const [communitiesData, statsData] = await Promise.all([
        communitiesResponse.json(),
        statsResponse.json()
      ])

      setCommunities(communitiesData.communities || [])
      setStats(statsData.stats || null)
    } catch (err) {
      console.error('Error fetching communities data:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const refetch = () => {
    fetchData()
  }

  return {
    communities,
    stats,
    isLoading,
    error,
    refetch
  }
}
