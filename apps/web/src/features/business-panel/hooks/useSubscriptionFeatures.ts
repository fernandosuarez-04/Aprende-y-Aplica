'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { hasFeature, getRequiredPlan, getFeatureMessage, getFeatureName, getAllowedNotificationChannels, type SubscriptionPlan, type FeatureKey } from '@/lib/subscription/subscriptionFeatures'

interface UseSubscriptionFeaturesReturn {
  plan: SubscriptionPlan | null
  loading: boolean
  canUse: (feature: FeatureKey) => boolean
  getRequiredPlan: (feature: FeatureKey) => SubscriptionPlan | null
  getMessage: (feature: FeatureKey) => string
  getFeatureName: (feature: FeatureKey) => string
  getAllowedChannels: () => string[]
}

/**
 * Hook para validar características según el plan de suscripción de la organización
 */
export function useSubscriptionFeatures(): UseSubscriptionFeaturesReturn {
  const { user } = useAuth()
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlan = async () => {
      if (!user?.organization_id) {
        setLoading(false)
        return
      }

      try {
        // Obtener plan desde la organización del usuario
        const response = await fetch('/api/business/settings/organization', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.organization?.subscription_plan) {
            const planValue = data.organization.subscription_plan.toLowerCase()
            if (['team', 'business', 'enterprise'].includes(planValue)) {
              setPlan(planValue as SubscriptionPlan)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching subscription plan:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlan()
  }, [user?.organization_id])

  const canUse = (feature: FeatureKey): boolean => {
    if (!plan) return false
    return hasFeature(plan, feature)
  }

  const getRequiredPlanForFeature = (feature: FeatureKey): SubscriptionPlan | null => {
    return getRequiredPlan(feature)
  }

  const getMessage = (feature: FeatureKey): string => {
    return getFeatureMessage(feature, plan)
  }

  const getFeatureNameForFeature = (feature: FeatureKey): string => {
    return getFeatureName(feature)
  }

  const getAllowedChannels = (): string[] => {
    return getAllowedNotificationChannels(plan)
  }

  return {
    plan,
    loading,
    canUse,
    getRequiredPlan: getRequiredPlanForFeature,
    getMessage,
    getFeatureName: getFeatureNameForFeature,
    getAllowedChannels,
  }
}
