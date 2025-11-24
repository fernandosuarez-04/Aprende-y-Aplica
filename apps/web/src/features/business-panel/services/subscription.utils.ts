/**
 * Utilidades para planes de suscripción business (sin dependencias de servidor)
 * Estas funciones pueden usarse en componentes cliente
 */

export type BusinessPlanId = 'team' | 'business' | 'enterprise'
export type BillingCycle = 'monthly' | 'yearly'

export interface PlanPricing {
  priceYearly: number
  priceMonthly: number
  yearlyPrice: string
  monthlyPrice: string
}

export interface PlanConfig {
  id: BusinessPlanId
  name: string
  tagline: string
  pricing: PlanPricing
  maxUsers: number
}

/**
 * Configuración de planes business
 */
export const BUSINESS_PLANS: Record<BusinessPlanId, PlanConfig> = {
  team: {
    id: 'team',
    name: 'Team',
    tagline: 'Perfecto para equipos pequeños',
    pricing: {
      priceYearly: 4999,
      priceMonthly: 499,
      yearlyPrice: '$4,999 /año',
      monthlyPrice: '$499/mes'
    },
    maxUsers: 10
  },
  business: {
    id: 'business',
    name: 'Business',
    tagline: 'Ideal para empresas en crecimiento',
    pricing: {
      priceYearly: 14999,
      priceMonthly: 1499,
      yearlyPrice: '$14,999 /año',
      monthlyPrice: '$1,499/mes'
    },
    maxUsers: 50
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Soluciones a medida para grandes organizaciones',
    pricing: {
      priceYearly: 0,
      priceMonthly: 0,
      yearlyPrice: 'Personalizado',
      monthlyPrice: 'Personalizado'
    },
    maxUsers: 999999
  }
}

/**
 * Obtiene la configuración de un plan por ID
 */
export function getPlanById(planId: string): PlanConfig | null {
  const normalizedPlanId = planId.toLowerCase() as BusinessPlanId
  return BUSINESS_PLANS[normalizedPlanId] || null
}

/**
 * Calcula el precio de un plan según el ciclo de facturación
 */
export function calculatePlanPrice(planId: BusinessPlanId, billingCycle: BillingCycle): number {
  const plan = BUSINESS_PLANS[planId]
  if (!plan) return 0

  if (planId === 'enterprise') return 0

  return billingCycle === 'yearly' ? plan.pricing.priceYearly : plan.pricing.priceMonthly
}

/**
 * Calcula el ahorro anual vs mensual para un plan
 */
export function calculateYearlySavings(planId: BusinessPlanId): number {
  const plan = BUSINESS_PLANS[planId]
  if (!plan || planId === 'enterprise') return 0

  const monthlyTotal = plan.pricing.priceMonthly * 12
  const savings = monthlyTotal - plan.pricing.priceYearly
  const percentage = (savings / monthlyTotal) * 100

  return Math.round(percentage)
}

/**
 * Calcula la fecha de vencimiento según el ciclo de facturación
 */
export function calculateEndDate(billingCycle: BillingCycle, startDate: Date = new Date()): Date {
  const endDate = new Date(startDate)

  if (billingCycle === 'monthly') {
    endDate.setMonth(endDate.getMonth() + 1)
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1)
  }

  return endDate
}

/**
 * Calcula el equivalente mensual de un precio anual
 */
export function calculateMonthlyEquivalent(planId: BusinessPlanId, billingCycle: BillingCycle): number {
  const plan = BUSINESS_PLANS[planId]
  if (!plan || planId === 'enterprise') return 0

  if (billingCycle === 'yearly') {
    return Math.round(plan.pricing.priceYearly / 12)
  }

  return plan.pricing.priceMonthly
}

/**
 * Formatea el precio según el ciclo de facturación
 */
export function formatPlanPrice(planId: BusinessPlanId, billingCycle: BillingCycle): string {
  const plan = BUSINESS_PLANS[planId]
  if (!plan || planId === 'enterprise') return 'Personalizado'

  if (billingCycle === 'yearly') {
    return plan.pricing.yearlyPrice
  }

  return plan.pricing.monthlyPrice
}

/**
 * Valida si un plan ID es válido
 */
export function isValidPlanId(planId: string): planId is BusinessPlanId {
  return ['team', 'business', 'enterprise'].includes(planId.toLowerCase())
}

/**
 * Valida si un ciclo de facturación es válido
 */
export function isValidBillingCycle(billingCycle: string): billingCycle is BillingCycle {
  return ['monthly', 'yearly'].includes(billingCycle.toLowerCase())
}

