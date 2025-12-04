export type ReportReasonCategory = 'spam' | 'inappropriate' | 'harassment' | 'misinformation' | 'violence' | 'other'

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'ignored'

export type ResolutionAction = 'delete_post' | 'hide_post' | 'ignore_report' | 'warn_user'

export interface PostReport {
  id: string
  post_id: string
  community_id: string
  reported_by_user_id: string
  reason_category: ReportReasonCategory
  reason_details?: string | null
  status: ReportStatus
  reviewed_by_user_id?: string | null
  reviewed_at?: string | null
  resolution_action?: ResolutionAction | null
  resolution_notes?: string | null
  created_at: string
  updated_at: string
  post?: {
    id: string
    content: string
    created_at: string
    user_id: string
    author?: {
      id: string
      username?: string
      first_name?: string
      last_name?: string
      profile_picture_url?: string
      email?: string
    }
  }
  reported_by?: {
    id: string
    username?: string
    first_name?: string
    last_name?: string
    profile_picture_url?: string
    email?: string
  }
  reviewed_by?: {
    id: string
    username?: string
    first_name?: string
    last_name?: string
    email?: string
  }
}

export interface CreateReportData {
  reason_category: ReportReasonCategory
  reason_details?: string
}

export interface ResolveReportData {
  status: 'reviewed' | 'resolved' | 'ignored'
  resolution_action?: ResolutionAction
  resolution_notes?: string
}

export interface GetReportsFilters {
  status?: ReportStatus
  reason_category?: ReportReasonCategory
  limit?: number
  offset?: number
}

export interface GetReportsResponse {
  success: boolean
  reports: PostReport[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export class PostReportsService {
  /**
   * Crea un reporte para un post
   */
  static async createReport(
    communitySlug: string,
    postId: string,
    reportData: CreateReportData
  ): Promise<{ success: boolean; report?: PostReport; message?: string; error?: string }> {
    try {
      const response = await fetch(
        `/api/communities/${communitySlug}/posts/${postId}/report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reportData),
        }
      )

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError)
        return {
          success: false,
          error: `Error ${response.status}: ${response.statusText}`,
        }
      }

      if (!response.ok) {
        const errorMessage = data?.error || `Error al crear el reporte (${response.status})`
        
        return {
          success: false,
          error: errorMessage,
        }
      }

      return {
        success: true,
        report: data.report,
        message: data.message || 'Reporte enviado exitosamente',
      }
    } catch (error) {
      console.error('Error creating report:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión al crear el reporte',
      }
    }
  }

  /**
   * Obtiene reportes de una comunidad (para moderadores/owners)
   */
  static async getReports(
    communitySlug: string,
    filters?: GetReportsFilters
  ): Promise<GetReportsResponse> {
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.reason_category) params.append('reason_category', filters.reason_category)
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.offset) params.append('offset', filters.offset.toString())

      const response = await fetch(
        `/api/communities/${communitySlug}/moderation/reports?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Error ${response.status}: ${response.statusText}`
        console.error('❌ Error fetching reports:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          url: `/api/communities/${communitySlug}/moderation/reports`,
          errorData
        })
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('✅ Reports data received:', {
        success: data.success,
        reportsCount: data.reports?.length || 0,
        pagination: data.pagination
      })
      return data
    } catch (error) {
      console.error('Error fetching reports:', error)
      return {
        success: false,
        reports: [],
        pagination: {
          total: 0,
          limit: filters?.limit || 50,
          offset: filters?.offset || 0,
          hasMore: false,
        },
      }
    }
  }

  /**
   * Obtiene reportes de una comunidad (para administradores)
   */
  static async getAdminReports(
    communitySlug: string,
    filters?: GetReportsFilters
  ): Promise<GetReportsResponse> {
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.reason_category) params.append('reason_category', filters.reason_category)
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.offset) params.append('offset', filters.offset.toString())

      const response = await fetch(
        `/api/admin/communities/slug/${communitySlug}/reports?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener reportes')
      }

      return data
    } catch (error) {
      console.error('Error fetching admin reports:', error)
      return {
        success: false,
        reports: [],
        pagination: {
          total: 0,
          limit: filters?.limit || 50,
          offset: filters?.offset || 0,
          hasMore: false,
        },
      }
    }
  }

  /**
   * Resuelve un reporte
   */
  static async resolveReport(
    communitySlug: string,
    reportId: string,
    resolutionData: ResolveReportData
  ): Promise<{ success: boolean; report?: PostReport; message?: string; error?: string }> {
    try {
      const response = await fetch(
        `/api/communities/${communitySlug}/reports/${reportId}/resolve`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(resolutionData),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Error al resolver el reporte',
        }
      }

      return {
        success: true,
        report: data.report,
        message: data.message || 'Reporte resuelto exitosamente',
      }
    } catch (error) {
      console.error('Error resolving report:', error)
      return {
        success: false,
        error: 'Error de conexión al resolver el reporte',
      }
    }
  }
}

