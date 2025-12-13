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

      // Forzar formato no paginado (legacy) para mantener compatibilidad
      const [communitiesResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/communities?paginated=false'),
        fetch('/api/admin/communities/stats')
      ])

      if (!communitiesResponse.ok || !statsResponse.ok) {
        const communitiesError = !communitiesResponse.ok ? await communitiesResponse.json().catch(() => null) : null
        const statsError = !statsResponse.ok ? await statsResponse.json().catch(() => null) : null
        // console.error('❌ Error en respuestas:', { communitiesError, statsError })
        throw new Error('Error al cargar los datos de comunidades')
      }

      const [communitiesData, statsData] = await Promise.all([
        communitiesResponse.json(),
        statsResponse.json()
      ])

      // Logging para debugging
      // console.log('📊 Communities API Response:', {
      //   hasCommunities: !!communitiesData.communities,
      //   communitiesCount: communitiesData.communities?.length || 0,
      //   rawData: communitiesData
      // })
      // console.log('📈 Stats API Response:', {
      //   hasStats: !!statsData.stats,
      //   stats: statsData.stats
      // })

// 
      // Manejar ambos formatos: paginado (data) y no paginado (communities)
      const communities = communitiesData.communities || communitiesData.data || []
      
// 
      setCommunities(communities)
      setStats(statsData.stats || null)

// 
      // console.log('✅ Communities loaded:', communities.length)
    } catch (err) {
      // console.error('❌ Error fetching communities data:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

// 
  useEffect(() => {
    fetchData()
  }, [])

// 
  const refetch = () => {
    fetchData()
  }

// 
  return {
    communities,
    stats,
    isLoading,
    error,
    refetch
  }
}

// 
/**
 * ✅ ISSUE #19: Hook para paginación infinita de comunidades
 * Usa cursor-based pagination para manejar miles de comunidades
 * 
 * @param search - Término de búsqueda opcional
 * @param visibility - Filtro por visibilidad (public, private)
 * @param isActive - Filtro por estado activo
 * @param limit - Items por página (default: 20)
 */
interface UseCommunitiesPaginatedParams {
  search?: string
  visibility?: string
  isActive?: boolean
  limit?: number
}

// 
interface PaginatedCommunitiesPage {
  data: AdminCommunity[]
  nextCursor: string | null
  hasMore: boolean
  total: number
}

// 
export function useCommunitiesPaginated(params: UseCommunitiesPaginatedParams = {}) {
  const { search, visibility, isActive, limit = 20 } = params

// 
  const [pages, setPages] = useState<PaginatedCommunitiesPage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false)
  const [error, setError] = useState<string | null>(null)

// 
  // Resetear páginas cuando cambian los filtros
  useEffect(() => {
    setPages([])
    fetchFirstPage()
  }, [search, visibility, isActive, limit])

// 
  const fetchFirstPage = async () => {
    try {
      setIsLoading(true)
      setError(null)

// 
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(search && { search }),
        ...(visibility && { visibility }),
        ...(isActive !== undefined && { isActive: String(isActive) })
      })

// 
      const response = await fetch(`/api/admin/communities?${params}`)
      
// 
      if (!response.ok) {
        throw new Error('Error al cargar comunidades')
      }

// 
      const result: PaginatedCommunitiesPage = await response.json()
      setPages([result])
    } catch (err) {
      // console.error('Error fetching first page:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

// 
  const fetchNextPage = async () => {
    if (isFetchingNextPage || !pages.length || !pages[pages.length - 1].hasMore) {
      return
    }

// 
    try {
      setIsFetchingNextPage(true)
      setError(null)

// 
      const lastPage = pages[pages.length - 1]
      const params = new URLSearchParams({
        limit: limit.toString(),
        cursor: lastPage.nextCursor || '',
        ...(search && { search }),
        ...(visibility && { visibility }),
        ...(isActive !== undefined && { isActive: String(isActive) })
      })

// 
      const response = await fetch(`/api/admin/communities?${params}`)
      
// 
      if (!response.ok) {
        throw new Error('Error al cargar más comunidades')
      }

// 
      const result: PaginatedCommunitiesPage = await response.json()
      setPages(prev => [...prev, result])
    } catch (err) {
      // console.error('Error fetching next page:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsFetchingNextPage(false)
    }
  }

// 
  const refetch = () => {
    setPages([])
    fetchFirstPage()
  }

// 
  // Aplanar todas las páginas en un solo array
  const allCommunities = pages.flatMap(page => page.data)
  const hasNextPage = pages.length > 0 && pages[pages.length - 1].hasMore
  const total = pages[0]?.total || 0

// 
  return {
    communities: allCommunities,
    total,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    error,
    fetchNextPage,
    refetch
  }
}
// 