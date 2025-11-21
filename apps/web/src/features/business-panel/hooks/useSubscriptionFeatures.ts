'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { hasFeature, getRequiredPlan, getFeatureMessage, getFeatureName, getAllowedNotificationChannels, type SubscriptionPlan, type FeatureKey } from '@/lib/subscription/subscriptionFeatures'

type BillingCycle = 'monthly' | 'yearly'

interface SubscriptionInfo {
  plan: SubscriptionPlan | null
  billing_cycle: BillingCycle | null
  status?: string
  start_date?: string | null
  end_date?: string | null
  max_users?: number
}

interface UseSubscriptionFeaturesReturn {
  plan: SubscriptionPlan | null
  billingCycle: BillingCycle | null
  subscription: SubscriptionInfo | null
  loading: boolean
  canUse: (feature: FeatureKey) => boolean
  getRequiredPlan: (feature: FeatureKey) => SubscriptionPlan | null
  getMessage: (feature: FeatureKey) => string
  getFeatureName: (feature: FeatureKey) => string
  getAllowedChannels: () => string[]
  changePlan: (planId: string, billingCycle: BillingCycle) => Promise<{ success: boolean; error?: string }>
  refetch: () => Promise<void>
}

/**
 * Hook para validar características según el plan de suscripción de la organización
 */
export function useSubscriptionFeatures(): UseSubscriptionFeaturesReturn {
  const { user } = useAuth()
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null)
  const [billingCycle, setBillingCycle] = useState<BillingCycle | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSubscription = useCallback(async () => {
    if (!user?.organization_id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // Obtener plan desde la API de suscripción
      const response = await fetch('/api/business/settings/subscription', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.subscription) {
          const subscriptionData = data.subscription
          
          // Obtener plan desde subscription.plan o intentar desde organization si no está disponible
          let planValue = subscriptionData.plan?.toLowerCase()?.trim()

          // Si no hay plan en subscription, intentar obtenerlo desde organization
          if (!planValue) {
            try {
              const orgResponse = await fetch('/api/business/settings/organization', {
                credentials: 'include',
              })
              if (orgResponse.ok) {
                const orgData = await orgResponse.json()
                if (orgData.success && orgData.organization?.subscription_plan) {
                  planValue = orgData.organization.subscription_plan.toLowerCase()?.trim()
                }
              }
            } catch (e) {
              // Silent fail - plan will remain null
            }
          }

          // Validar y establecer el plan
          if (planValue && ['team', 'business', 'enterprise'].includes(planValue)) {
            setPlan(planValue as SubscriptionPlan)
          } else {
            // Si el plan es inválido, establecer null explícitamente
            setPlan(null)
          }

          const billingCycleValue = subscriptionData.billing_cycle?.toLowerCase() || 'yearly'
          if (['monthly', 'yearly'].includes(billingCycleValue)) {
            setBillingCycle(billingCycleValue as BillingCycle)
          } else {
            // Default a yearly si no está especificado
            setBillingCycle('yearly')
          }

          setSubscription({
            plan: (planValue && ['team', 'business', 'enterprise'].includes(planValue) ? planValue as SubscriptionPlan : null),
            billing_cycle: billingCycleValue as BillingCycle || 'yearly',
            status: subscriptionData.status,
            start_date: subscriptionData.start_date,
            end_date: subscriptionData.end_date,
            max_users: subscriptionData.max_users
          })
        } else {
          // Si no hay subscription, intentar obtener plan desde organization directamente
          try {
            const orgResponse = await fetch('/api/business/settings/organization', {
              credentials: 'include',
            })
            if (orgResponse.ok) {
              const orgData = await orgResponse.json()
              if (orgData.success && orgData.organization?.subscription_plan) {
                const orgPlanValue = orgData.organization.subscription_plan.toLowerCase()
                if (['team', 'business', 'enterprise'].includes(orgPlanValue)) {
                  setPlan(orgPlanValue as SubscriptionPlan)
                  setBillingCycle(orgData.organization.billing_cycle?.toLowerCase() || 'yearly')
                  setSubscription({
                    plan: orgPlanValue as SubscriptionPlan,
                    billing_cycle: (orgData.organization.billing_cycle?.toLowerCase() || 'yearly') as BillingCycle,
                    status: orgData.organization.subscription_status,
                    start_date: orgData.organization.subscription_start_date,
                    end_date: orgData.organization.subscription_end_date,
                    max_users: orgData.organization.max_users
                  })
                }
              }
            }
          } catch (e) {
            // Error al obtener de organization
          }
        }
      }
    } catch (error) {
      // console.error('Error fetching subscription plan:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.organization_id])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  // Disparar evento personalizado cuando el plan cambie
  useEffect(() => {
    if (plan) {
      // Disparar evento para notificar a otros componentes del cambio de plan
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('subscription-plan-changed', {
          detail: { plan, billingCycle, subscription }
        }))
      }
    }
  }, [plan, billingCycle, subscription])

  const changePlan = useCallback(async (planId: string, billingCycle: BillingCycle): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/business/settings/subscription/change-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ planId, billingCycle })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        console.error('Error from API:', data)
        return {
          success: false,
          error: data.error || `Error al cambiar el plan (${response.status})`
        }
      }

      // Actualizar estado local después de cambiar el plan
      await fetchSubscription()

      return { success: true }
    } catch (error) {
      console.error('Network error changing plan:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión al cambiar el plan. Verifica tu conexión a internet.'
      }
    }
  }, [fetchSubscription])

  const canUse = useCallback((feature: FeatureKey): boolean => {
    if (!plan) {
      return false
    }
    return hasFeature(plan, feature)
  }, [plan])

  const getRequiredPlanForFeature = (feature: FeatureKey): SubscriptionPlan | null => {
    return getRequiredPlan(feature)
  }

  const getMessage = (feature: FeatureKey): string => {
    return getFeatureMessage(feature, plan)
  }

  const getFeatureNameForFeature = (feature: FeatureKey): string => {
    return getFeatureName(feature)
  }

  const getAllowedChannels = useCallback((): string[] => {
    return getAllowedNotificationChannels(plan)
  }, [plan])

  return {
    plan,
    billingCycle,
    subscription,
    loading,
    canUse,
    getRequiredPlan: getRequiredPlanForFeature,
    getMessage,
    getFeatureName: getFeatureNameForFeature,
    getAllowedChannels,
    changePlan,
    refetch: fetchSubscription,
  }
}
