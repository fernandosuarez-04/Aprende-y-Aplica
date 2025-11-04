/**
 * Sistema centralizado de validación de características por plan de suscripción
 * Basado en las tablas de comparación de planes: Team, Business, Enterprise
 */

export type SubscriptionPlan = 'team' | 'business' | 'enterprise'
export type FeatureKey =
  // Administración y Gestión
  | 'panel_admin'
  | 'course_messaging'
  | 'custom_groups'
  | 'advanced_groups'
  | 'corporate_branding'
  // Análisis e Informes
  | 'basic_reports'
  | 'advanced_analytics'
  | 'skills_info'
  | 'course_analysis'
  | 'custom_dashboard'
  | 'data_export'
  // Experiencia del Usuario
  | 'full_catalog'
  | 'unlimited_certifications'
  | 'custom_certificates'
  | 'mobile_app'
  | 'offline_learning'
  | 'live_courses'
  // Notificaciones y Automatización
  | 'automatic_notifications'
  | 'smart_reminders'
  | 'external_integrations'
  | 'enterprise_sso'
  | 'calendar_integration'
  | 'data_api'
  // Soporte y Servicios
  | 'email_support'
  | 'priority_support'
  | 'dedicated_247_support'
  | 'customer_success_manager'
  | 'custom_onboarding'
  | 'strategic_consulting'
  // Canales de notificación
  | 'notification_email'
  | 'notification_push'
  | 'notification_sms'

/**
 * Mapeo de características por plan
 * true = disponible, false = no disponible
 */
const FEATURE_MAP: Record<FeatureKey, Record<SubscriptionPlan, boolean>> = {
  // Administración y Gestión
  panel_admin: {
    team: true,
    business: true,
    enterprise: true,
  },
  course_messaging: {
    team: false,
    business: true,
    enterprise: true,
  },
  custom_groups: {
    team: false,
    business: true,
    enterprise: true,
  },
  advanced_groups: {
    team: false,
    business: false,
    enterprise: true,
  },
  corporate_branding: {
    team: false,
    business: false,
    enterprise: true,
  },
  // Análisis e Informes
  basic_reports: {
    team: true,
    business: true,
    enterprise: true,
  },
  advanced_analytics: {
    team: false,
    business: true,
    enterprise: true,
  },
  skills_info: {
    team: false,
    business: true,
    enterprise: true,
  },
  course_analysis: {
    team: false,
    business: true,
    enterprise: true,
  },
  custom_dashboard: {
    team: false,
    business: false,
    enterprise: true,
  },
  data_export: {
    team: false,
    business: false,
    enterprise: true,
  },
  // Experiencia del Usuario
  full_catalog: {
    team: true,
    business: true,
    enterprise: true,
  },
  unlimited_certifications: {
    team: false,
    business: true,
    enterprise: true,
  },
  custom_certificates: {
    team: false,
    business: false,
    enterprise: true,
  },
  mobile_app: {
    team: true,
    business: true,
    enterprise: true,
  },
  offline_learning: {
    team: false,
    business: true,
    enterprise: true,
  },
  live_courses: {
    team: false,
    business: false,
    enterprise: true,
  },
  // Notificaciones y Automatización
  automatic_notifications: {
    team: true,
    business: true,
    enterprise: true,
  },
  smart_reminders: {
    team: false,
    business: true,
    enterprise: true,
  },
  external_integrations: {
    team: false,
    business: true,
    enterprise: true,
  },
  enterprise_sso: {
    team: false,
    business: true,
    enterprise: true,
  },
  calendar_integration: {
    team: false,
    business: true,
    enterprise: true,
  },
  data_api: {
    team: false,
    business: false,
    enterprise: true,
  },
  // Soporte y Servicios
  email_support: {
    team: true,
    business: true,
    enterprise: true,
  },
  priority_support: {
    team: false,
    business: true,
    enterprise: true,
  },
  dedicated_247_support: {
    team: false,
    business: false,
    enterprise: true,
  },
  customer_success_manager: {
    team: false,
    business: false,
    enterprise: true,
  },
  custom_onboarding: {
    team: false,
    business: false,
    enterprise: true,
  },
  strategic_consulting: {
    team: false,
    business: false,
    enterprise: true,
  },
  // Canales de notificación
  notification_email: {
    team: true,
    business: true,
    enterprise: true,
  },
  notification_push: {
    team: false,
    business: true,
    enterprise: true,
  },
  notification_sms: {
    team: false,
    business: false,
    enterprise: true,
  },
}

/**
 * Nombres legibles de las características
 */
const FEATURE_NAMES: Record<FeatureKey, string> = {
  panel_admin: 'Panel de administración',
  course_messaging: 'Asignación de cursos con mensajería',
  custom_groups: 'Grupos de usuarios personalizados',
  advanced_groups: 'Administración avanzada de grupos',
  corporate_branding: 'Branding corporativo',
  basic_reports: 'Reportes básicos',
  advanced_analytics: 'Analytics avanzados',
  skills_info: 'Información de habilidades',
  course_analysis: 'Análisis de cursos',
  custom_dashboard: 'Dashboard personalizado',
  data_export: 'Exportación de datos',
  full_catalog: 'Acceso a catálogo completo',
  unlimited_certifications: 'Certificaciones ilimitadas',
  custom_certificates: 'Certificados personalizados',
  mobile_app: 'Aplicación móvil',
  offline_learning: 'Offline learning',
  live_courses: 'Cursos en vivo',
  automatic_notifications: 'Notificaciones automáticas',
  smart_reminders: 'Recordatorios inteligentes',
  external_integrations: 'Integración con sistemas externos',
  enterprise_sso: 'SSO empresarial',
  calendar_integration: 'Integración con calendarios',
  data_api: 'API de datos',
  email_support: 'Soporte por email',
  priority_support: 'Soporte prioritario',
  dedicated_247_support: 'Soporte 24/7 dedicado',
  customer_success_manager: 'Customer Success Manager',
  custom_onboarding: 'Onboarding personalizado',
  strategic_consulting: 'Consultoría estratégica',
  notification_email: 'Notificaciones por Email',
  notification_push: 'Notificaciones Push',
  notification_sms: 'Notificaciones por SMS',
}

/**
 * Nombres de planes
 */
const PLAN_NAMES: Record<SubscriptionPlan, string> = {
  team: 'Team',
  business: 'Business',
  enterprise: 'Enterprise',
}

/**
 * Verifica si un plan tiene acceso a una característica
 */
export function hasFeature(plan: SubscriptionPlan | string | null | undefined, feature: FeatureKey): boolean {
  if (!plan) return false
  
  const normalizedPlan = plan.toLowerCase() as SubscriptionPlan
  if (!['team', 'business', 'enterprise'].includes(normalizedPlan)) {
    return false
  }

  const featureMap = FEATURE_MAP[feature]
  return featureMap ? featureMap[normalizedPlan] : false
}

/**
 * Obtiene el plan mínimo requerido para una característica
 */
export function getRequiredPlan(feature: FeatureKey): SubscriptionPlan | null {
  // Buscar el plan más bajo que tiene la característica
  if (hasFeature('team', feature)) return 'team'
  if (hasFeature('business', feature)) return 'business'
  if (hasFeature('enterprise', feature)) return 'enterprise'
  return null
}

/**
 * Obtiene el nombre legible de una característica
 */
export function getFeatureName(feature: FeatureKey): string {
  return FEATURE_NAMES[feature] || feature
}

/**
 * Obtiene el nombre legible de un plan
 */
export function getPlanName(plan: SubscriptionPlan | string): string {
  const normalizedPlan = plan.toLowerCase() as SubscriptionPlan
  return PLAN_NAMES[normalizedPlan] || plan
}

/**
 * Genera un mensaje explicativo para una característica y plan actual
 */
export function getFeatureMessage(feature: FeatureKey, currentPlan: SubscriptionPlan | string | null | undefined): string {
  const requiredPlan = getRequiredPlan(feature)
  
  if (!requiredPlan) {
    return `La característica "${getFeatureName(feature)}" no está disponible en ningún plan.`
  }

  const currentPlanName = currentPlan ? getPlanName(currentPlan) : 'tu plan actual'
  const requiredPlanName = getPlanName(requiredPlan)

  if (hasFeature(currentPlan, feature)) {
    return `La característica "${getFeatureName(feature)}" está disponible en ${currentPlanName}.`
  }

  return `La característica "${getFeatureName(feature)}" solo está disponible en ${requiredPlanName}. Actualiza tu plan para acceder a esta funcionalidad.`
}

/**
 * Obtiene todos los planes que tienen acceso a una característica
 */
export function getPlansWithFeature(feature: FeatureKey): SubscriptionPlan[] {
  const plans: SubscriptionPlan[] = []
  const featureMap = FEATURE_MAP[feature]

  if (featureMap) {
    if (featureMap.team) plans.push('team')
    if (featureMap.business) plans.push('business')
    if (featureMap.enterprise) plans.push('enterprise')
  }

  return plans
}

/**
 * Obtiene todas las características disponibles para un plan
 */
export function getFeaturesForPlan(plan: SubscriptionPlan | string | null | undefined): FeatureKey[] {
  if (!plan) return []
  
  const normalizedPlan = plan.toLowerCase() as SubscriptionPlan
  if (!['team', 'business', 'enterprise'].includes(normalizedPlan)) {
    return []
  }

  const features: FeatureKey[] = []
  for (const feature in FEATURE_MAP) {
    if (hasFeature(normalizedPlan, feature as FeatureKey)) {
      features.push(feature as FeatureKey)
    }
  }

  return features
}

/**
 * Obtiene los canales de notificación disponibles para un plan
 */
export function getAllowedNotificationChannels(plan: SubscriptionPlan | string | null | undefined): string[] {
  const channels: string[] = []
  
  if (hasFeature(plan, 'notification_email')) {
    channels.push('email')
  }
  if (hasFeature(plan, 'notification_push')) {
    channels.push('push')
  }
  if (hasFeature(plan, 'notification_sms')) {
    channels.push('sms')
  }

  return channels
}
