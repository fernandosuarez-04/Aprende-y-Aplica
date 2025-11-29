'use client'

import useSWR from 'swr'
import { ReelsService, FeaturedReel } from '../services/reels.service'

// 🚀 OPTIMIZACIÓN: Migrado a SWR para caching automático
const featuredReelsFetcher = async (url: string) => {
  const limit = parseInt(url.split('=')[1] || '6')
  return await ReelsService.getFeaturedReels(limit)
}

export function useFeaturedReels(limit: number = 6) {
  const { data: reels, error, isLoading, mutate } = useSWR<FeaturedReel[]>(
    `/reels/featured?limit=${limit}`,
    featuredReelsFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,      // 1 minuto
      refreshInterval: 300000,      // Auto-refresh cada 5 minutos
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      keepPreviousData: true,
    }
  )

  return {
    reels: reels ?? [],
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Error desconocido') : null,
    refetch: async () => { await mutate() }
  }
}
