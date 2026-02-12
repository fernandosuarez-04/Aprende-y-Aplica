'use client'

import useSWR from 'swr'
import type { OverviewStats, LearningStats, EngagementStats, UserDetailResponse } from '../components/UserStatsB2B/types'

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

const swrConfig = {
  revalidateOnFocus: false,
  dedupingInterval: 60000,
  refreshInterval: 300000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  keepPreviousData: true,
}

export function useOverviewStats() {
  return useSWR<OverviewStats>('/api/admin/user-stats/overview', fetcher, swrConfig)
}

export function useLearningStats() {
  return useSWR<LearningStats>('/api/admin/user-stats/learning', fetcher, swrConfig)
}

export function useEngagementStats() {
  return useSWR<EngagementStats>('/api/admin/user-stats/engagement', fetcher, swrConfig)
}

export function useUserDetail(params: { search: string; org: string; status: string; page: number; limit: number }) {
  const searchParams = new URLSearchParams()
  if (params.search) searchParams.set('search', params.search)
  if (params.org) searchParams.set('org', params.org)
  if (params.status) searchParams.set('status', params.status)
  searchParams.set('page', String(params.page))
  searchParams.set('limit', String(params.limit))
  const url = `/api/admin/user-stats/users?${searchParams.toString()}`

  return useSWR<UserDetailResponse>(url, fetcher, {
    ...swrConfig,
    refreshInterval: 0, // No auto-refresh for paginated data
  })
}
