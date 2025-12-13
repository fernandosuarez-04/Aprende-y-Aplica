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

      // Obtener AMBOS endpoints en paralelo para máximo rendimiento
      const [subscriptionResponse, orgResponse] = await Promise.all([
        fetch('/api/business/settings/subscription', { credentials: 'include' }),
        fetch('/api/business/settings/organization', { credentials: 'include' })
      ])

      let planValue: string | null = null
      let billingCycleValue: string = 'yearly'
      let subscriptionData: any = null

      // Primero intentar desde subscription
      if (subscriptionResponse.ok) {
        const data = await subscriptionResponse.json()
        if (data.success && data.subscription) {
          subscriptionData = data.subscription
          planValue = subscriptionData.plan?.toLowerCase()?.trim()
          billingCycleValue = subscriptionData.billing_cycle?.toLowerCase() || 'yearly'
        }
      }

      // Si no hay plan en subscription, usar organization (ya cargado en paralelo)
      if (!planValue && orgResponse.ok) {
        const orgData = await orgResponse.json()
        if (orgData.success && orgData.organization?.subscription_plan) {
          planValue = orgData.organization.subscription_plan.toLowerCase()?.trim()
          billingCycleValue = orgData.organization.billing_cycle?.toLowerCase() || 'yearly'

          // Si no había subscriptionData, crearlo desde organization
          if (!subscriptionData) {
            subscriptionData = {
              plan: planValue,
              billing_cycle: billingCycleValue,
              status: orgData.organization.subscription_status,
              start_date: orgData.organization.subscription_start_date,
              end_date: orgData.organization.subscription_end_date,
              max_users: orgData.organization.max_users
            }
          }
        }
      }

      // Validar y establecer el plan
      if (planValue && ['team', 'business', 'enterprise'].includes(planValue)) {
        setPlan(planValue as SubscriptionPlan)
      } else {
        setPlan(null)
      }

      // Establecer billing cycle
      if (['monthly', 'yearly'].includes(billingCycleValue)) {
        setBillingCycle(billingCycleValue as BillingCycle)
      } else {
        setBillingCycle('yearly')
      }

      // Establecer subscription
      if (subscriptionData) {
        setSubscription({
          plan: (planValue && ['team', 'business', 'enterprise'].includes(planValue) ? planValue as SubscriptionPlan : null),
          billing_cycle: billingCycleValue as BillingCycle || 'yearly',
          status: subscriptionData.status,
          start_date: subscriptionData.start_date,
          end_date: subscriptionData.end_date,
          max_users: subscriptionData.max_users
        })
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

  const getRequiredPlanForFeature = useCallback((feature: FeatureKey): SubscriptionPlan | null => {
    return getRequiredPlan(feature)
  }, [])

  const getMessage = useCallback((feature: FeatureKey): string => {
    return getFeatureMessage(feature, plan)
  }, [plan])

  const getFeatureNameForFeature = useCallback((feature: FeatureKey): string => {
    return getFeatureName(feature)
  }, [])

  const getAllowedChannels = useCallback((): string[] => {
    // Siempre retornar al menos email como canal por defecto
    const channels = getAllowedNotificationChannels(plan)
    return channels.length > 0 ? channels : ['email']
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
