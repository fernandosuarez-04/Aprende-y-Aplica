import { useState, useEffect } from 'react'

export interface OrganizationData {
  id: string
  name: string
  description?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  website_url?: string | null
  logo_url?: string | null
  subscription_plan?: string
  subscription_status?: string
  subscription_start_date?: string | null
  subscription_end_date?: string | null
  max_users?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface SubscriptionData {
  plan: string
  status: string
  start_date?: string | null
  end_date?: string | null
  is_expired: boolean
  days_until_expiration?: number | null
  is_expiring_soon: boolean
  user_subscriptions: any[]
}

export interface BusinessSettingsData {
  organization: OrganizationData | null
  subscription: SubscriptionData | null
}

export function useBusinessSettings() {
  const [data, setData] = useState<BusinessSettingsData>({
    organization: null,
    subscription: null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Obtener datos de organización y suscripción en paralelo
      const [orgResponse, subResponse] = await Promise.all([
        fetch('/api/business/settings/organization', {
          credentials: 'include'
        }),
        fetch('/api/business/settings/subscription', {
          credentials: 'include'
        })
      ])

      if (!orgResponse.ok) {
        throw new Error(`Error ${orgResponse.status}: ${orgResponse.statusText}`)
      }

      const orgResult = await orgResponse.json()
      const subResult = subResponse.ok ? await subResponse.json() : null

      if (orgResult.success) {
        setData({
          organization: orgResult.organization,
          subscription: subResult?.success ? subResult.subscription : null
        })
      } else {
        throw new Error(orgResult.error || 'Error al obtener datos de configuración')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar configuración'
      setError(errorMessage)
      console.error('Error fetching settings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const updateOrganization = async (updateData: Partial<OrganizationData>): Promise<boolean> => {
    try {
      setError(null)

      const response = await fetch('/api/business/settings/organization', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || `Error ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.organization) {
        setData(prev => ({
          ...prev,
          organization: result.organization
        }))
        return true
      } else {
        throw new Error(result.error || 'Error al actualizar la organización')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar la organización'
      setError(errorMessage)
      console.error('Error updating organization:', err)
      return false
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return {
    data,
    isLoading,
    error,
    refetch: fetchSettings,
    updateOrganization
  }
}

