import type { OverviewStats, LearningStats, EngagementStats, UserDetailResponse } from '../components/UserStatsB2B/types'

const BASE_URL = '/api/admin/user-stats'

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Error ${res.status}: ${text}`)
  }
  return res.json()
}

export const UserStatsB2BService = {
  getOverview: () => fetchJSON<OverviewStats>(`${BASE_URL}/overview`),
  getLearning: () => fetchJSON<LearningStats>(`${BASE_URL}/learning`),
  getEngagement: () => fetchJSON<EngagementStats>(`${BASE_URL}/engagement`),
  getUsers: (params: { search?: string; org?: string; status?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams()
    if (params.search) searchParams.set('search', params.search)
    if (params.org) searchParams.set('org', params.org)
    if (params.status) searchParams.set('status', params.status)
    if (params.page) searchParams.set('page', String(params.page))
    if (params.limit) searchParams.set('limit', String(params.limit))
    return fetchJSON<UserDetailResponse>(`${BASE_URL}/users?${searchParams.toString()}`)
  },
}
