'use client'

import { useState, useEffect, useCallback } from 'react'
import { NewsService, NewsWithMetrics, NewsFilters } from '../services/news.service'

interface UseNewsReturn {
  news: NewsWithMetrics[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  loadMore: () => Promise<void>
  hasMore: boolean
}

export function useNews(filters: NewsFilters = {}): UseNewsReturn {
  const [news, setNews] = useState<NewsWithMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const fetchNews = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setOffset(0)
      }
      
      setError(null)
      
      const currentOffset = reset ? 0 : offset
      const newsData = await NewsService.getPublishedNews({
        ...filters,
        limit: 10,
        offset: currentOffset
      })

      if (reset) {
        setNews(newsData)
      } else {
        setNews(prev => [...prev, ...newsData])
      }

      setHasMore(newsData.length === 10)
      setOffset(currentOffset + newsData.length)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error fetching news:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, offset])

  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchNews(false)
    }
  }, [loading, hasMore, fetchNews])

  const refetch = useCallback(async () => {
    await fetchNews(true)
  }, [fetchNews])

  useEffect(() => {
    fetchNews(true)
  }, [filters.status, filters.language])

  return {
    news,
    loading,
    error,
    refetch,
    loadMore,
    hasMore
  }
}

interface UseNewsDetailReturn {
  news: NewsWithMetrics | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useNewsDetail(slug: string): UseNewsDetailReturn {
  const [news, setNews] = useState<NewsWithMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNewsDetail = useCallback(async () => {
    if (!slug) return

    try {
      setLoading(true)
      setError(null)
      
      const newsData = await NewsService.getNewsBySlug(slug)
      setNews(newsData)

      // Incrementar contador de vistas
      if (newsData) {
        await NewsService.incrementViewCount(slug)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error fetching news detail:', err)
    } finally {
      setLoading(false)
    }
  }, [slug])

  const refetch = useCallback(async () => {
    await fetchNewsDetail()
  }, [fetchNewsDetail])

  useEffect(() => {
    fetchNewsDetail()
  }, [fetchNewsDetail])

  return {
    news,
    loading,
    error,
    refetch
  }
}

interface UseNewsStatsReturn {
  stats: {
    totalNews: number
    totalCategories: number
    totalViews: number
  } | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useNewsStats(): UseNewsStatsReturn {
  const [stats, setStats] = useState<{
    totalNews: number
    totalCategories: number
    totalViews: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const statsData = await NewsService.getNewsStats()
      setStats(statsData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error fetching news stats:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const refetch = useCallback(async () => {
    await fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch
  }
}

interface UseFeaturedNewsReturn {
  featuredNews: NewsWithMetrics[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useFeaturedNews(limit: number = 3): UseFeaturedNewsReturn {
  const [featuredNews, setFeaturedNews] = useState<NewsWithMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeaturedNews = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const newsData = await NewsService.getFeaturedNews(limit)
      setFeaturedNews(newsData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error fetching featured news:', err)
    } finally {
      setLoading(false)
    }
  }, [limit])

  const refetch = useCallback(async () => {
    await fetchFeaturedNews()
  }, [fetchFeaturedNews])

  useEffect(() => {
    fetchFeaturedNews()
  }, [fetchFeaturedNews])

  return {
    featuredNews,
    loading,
    error,
    refetch
  }
}
