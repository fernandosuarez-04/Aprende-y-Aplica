/**
 * Servicio para manejar cambio de planes de suscripción business
 * Este archivo contiene funciones que requieren acceso al servidor
 * Para funciones de utilidad sin dependencias de servidor, ver subscription.utils.ts
 */

import 'server-only'

import type { BusinessPlanId, BillingCycle } from './subscription.utils'

/**
 * Servicio estático para verificar suscripciones
 */
export class SubscriptionService {
  /**
   * Verifica si un usuario tiene una suscripción activa (Team, Business o Enterprise)
   * Verifica la suscripción a nivel de organización
   */
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      console.log('🔍 [SubscriptionService] Checking subscription for user:', userId)

      // Obtener la organización del usuario (primero de users, luego de organization_users)
      let organizationId: string | null = null

      // Método 1: Buscar organization_id directamente en la tabla users
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', userId)
        .single()

      if (!userError && user?.organization_id) {
        organizationId = user.organization_id
        console.log('✅ [SubscriptionService] Found organization_id from users table:', organizationId)
      } else {
        console.log('⚠️ [SubscriptionService] No organization_id in users table, checking organization_users...')

        // Método 2: Buscar en la tabla organization_users
        const { data: orgUser, error: orgUserError } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle()

        if (!orgUserError && orgUser?.organization_id) {
          organizationId = orgUser.organization_id
          console.log('✅ [SubscriptionService] Found organization_id from organization_users table:', organizationId)
        }
      }

      if (!organizationId) {
        console.log('❌ [SubscriptionService] No organization found for user')
        return false
      }

      // Verificar suscripción de la organización (con fechas)
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, subscription_plan, subscription_status, subscription_end_date, is_active')
        .eq('id', organizationId)
        .single()

      if (orgError || !organization) {
        console.log('❌ [SubscriptionService] Organization not found:', orgError?.message)
        // Si no hay organización, intentar verificar en la tabla subscriptions
        return await this.checkSubscriptionTable(userId, organizationId)
      }

      console.log('📊 [SubscriptionService] Organization info:', {
        name: organization.name,
        plan: organization.subscription_plan,
        status: organization.subscription_status,
        is_active: organization.is_active,
        end_date: organization.subscription_end_date
      })

      // Verificar que la organización esté activa
      if (!organization.is_active) {
        console.log('❌ [SubscriptionService] Organization is not active')
        return false
      }

      // Verificar que el plan sea Team, Business o Enterprise
      const plan = organization.subscription_plan?.toLowerCase()?.trim()
      const validPlans = ['team', 'business', 'enterprise']

      if (!plan || !validPlans.includes(plan)) {
        console.log('⚠️ [SubscriptionService] Invalid plan, checking subscriptions table...')
        // Si el plan no es válido, verificar en la tabla subscriptions
        return await this.checkSubscriptionTable(userId, organizationId)
      }

      // Verificar que el estado sea activo o trial
      const status = organization.subscription_status?.toLowerCase()?.trim()
      const activeStatuses = ['active', 'trial']

      if (!status || !activeStatuses.includes(status)) {
        console.log('❌ [SubscriptionService] Subscription status is not active:', status)
        return false
      }

      // Verificar que la suscripción no haya expirado
      if (organization.subscription_end_date) {
        const endDate = new Date(organization.subscription_end_date)
        const now = new Date()

        if (endDate < now) {
          console.log('❌ [SubscriptionService] Subscription has expired:', endDate)
          return false
        }
      }

      console.log('✅ [SubscriptionService] User has active subscription!')
      return true
    } catch (error) {
      console.error('💥 [SubscriptionService] Error checking subscription:', error)
      return false
    }
  }

  /**
   * Verifica suscripción en la tabla subscriptions como respaldo
   */
  private static async checkSubscriptionTable(userId: string, organizationId: string): Promise<boolean> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      // Buscar suscripción activa en la tabla subscriptions
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('plan_id, subscription_status, end_date')
        .eq('organization_id', organizationId)
        .eq('subscription_status', 'active')
        .maybeSingle()

      if (subError || !subscription) {
        return false
      }

      // Verificar que el plan sea Team, Business o Enterprise
      const plan = subscription.plan_id?.toLowerCase()?.trim()
      const validPlans = ['team', 'business', 'enterprise']

      if (!plan || !validPlans.includes(plan)) {
        return false
      }

      // Verificar que la suscripción no haya expirado
      if (subscription.end_date) {
        const endDate = new Date(subscription.end_date)
        const now = new Date()

        if (endDate < now) {
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Error checking subscription table:', error)
      return false
    }
  }

  /**
   * Calcula el período de facturación actual basado en subscription_start_date y billing_cycle
   */
  static calculateBillingPeriod(
    subscriptionStartDate: string | null,
    billingCycle: 'monthly' | 'yearly' | null
  ): { start: Date; end: Date } | null {
    if (!subscriptionStartDate || !billingCycle) {
      return null
    }

    const startDate = new Date(subscriptionStartDate)
    const now = new Date()

    // Calcular cuántos períodos han pasado desde el inicio
    let periodsPassed = 0
    if (billingCycle === 'monthly') {
      const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 +
        (now.getMonth() - startDate.getMonth())
      periodsPassed = Math.floor(monthsDiff)
    } else {
      // yearly
      const yearsDiff = now.getFullYear() - startDate.getFullYear()
      periodsPassed = Math.floor(yearsDiff)
    }

    // Calcular el inicio del período actual
    const currentPeriodStart = new Date(startDate)
    if (billingCycle === 'monthly') {
      currentPeriodStart.setMonth(startDate.getMonth() + periodsPassed)
    } else {
      currentPeriodStart.setFullYear(startDate.getFullYear() + periodsPassed)
    }

    // Calcular el fin del período actual
    const currentPeriodEnd = new Date(currentPeriodStart)
    if (billingCycle === 'monthly') {
      currentPeriodEnd.setMonth(currentPeriodStart.getMonth() + 1)
    } else {
      currentPeriodEnd.setFullYear(currentPeriodStart.getFullYear() + 1)
    }

    return {
      start: currentPeriodStart,
      end: currentPeriodEnd
    }
  }

  /**
   * Cuenta cursos comprados por la organización en el período de facturación actual
   */
  static async getOrganizationMonthlyCourseCount(
    organizationId: string,
    billingPeriodStart: Date,
    billingPeriodEnd: Date
  ): Promise<number> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { count, error } = await supabase
        .from('organization_course_purchases')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('access_status', 'active')
        .gte('purchased_at', billingPeriodStart.toISOString())
        .lt('purchased_at', billingPeriodEnd.toISOString())

      if (error) {
        console.error('Error counting organization courses:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Error in getOrganizationMonthlyCourseCount:', error)
      return 0
    }
  }

  /**
   * Verifica si la organización puede comprar más cursos (dentro del límite de 10 por período)
   */
  static async canOrganizationPurchaseCourse(
    organizationId: string,
    maxCourses: number = 10
  ): Promise<{ canPurchase: boolean; currentCount: number; maxCourses: number; billingPeriod: { start: Date; end: Date } | null }> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      // Obtener información de la organización
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('subscription_start_date, billing_cycle')
        .eq('id', organizationId)
        .single()

      if (orgError || !organization) {
        return {
          canPurchase: false,
          currentCount: 0,
          maxCourses,
          billingPeriod: null
        }
      }

      // Calcular período de facturación actual
      const billingPeriod = this.calculateBillingPeriod(
        organization.subscription_start_date,
        organization.billing_cycle as 'monthly' | 'yearly' | null
      )

      if (!billingPeriod) {
        return {
          canPurchase: false,
          currentCount: 0,
          maxCourses,
          billingPeriod: null
        }
      }

      // Contar cursos comprados en el período actual
      const currentCount = await this.getOrganizationMonthlyCourseCount(
        organizationId,
        billingPeriod.start,
        billingPeriod.end
      )

      return {
        canPurchase: currentCount < maxCourses,
        currentCount,
        maxCourses,
        billingPeriod
      }
    } catch (error) {
      console.error('Error in canOrganizationPurchaseCourse:', error)
      return {
        canPurchase: false,
        currentCount: 0,
        maxCourses,
        billingPeriod: null
      }
    }
  }
}
