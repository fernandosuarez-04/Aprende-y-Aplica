'use client'

import { useState, useEffect } from 'react'
import { ReelsService, FeaturedReel } from '../services/reels.service'

export function useFeaturedReels(limit: number = 6) {
  const [reels, setReels] = useState<FeaturedReel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReels = async () => {
    try {
      setLoading(true)
      setError(null)
      // console.log('🔄 Fetching featured reels with limit:', limit)
      const data = await ReelsService.getFeaturedReels(limit)
      // console.log('📊 Received featured reels:', { count: data.length, reels: data.map(r => ({ id: r.id, title: r.title })) })
      setReels(data)
    } catch (err) {
      // console.error('❌ Error fetching featured reels:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReels()
  }, [limit])

  return {
    reels,
    loading,
    error,
    refetch: fetchReels
  }
}
