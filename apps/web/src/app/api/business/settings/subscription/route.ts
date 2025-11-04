import { NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/business/settings/subscription
 * Obtiene información de suscripción de la organización
 */
export async function GET() {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'No tienes una organización asignada'
      }, { status: 403 })
    }

    const supabase = await createClient()
    const organizationId = auth.organizationId

    // Obtener datos de la organización (incluye información de suscripción)
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('subscription_plan, subscription_status, subscription_start_date, subscription_end_date')
      .eq('id', organizationId)
      .single()

    if (orgError) {
      logger.error('Error fetching organization subscription:', orgError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener datos de suscripción'
      }, { status: 500 })
    }

    // Obtener suscripciones activas del usuario (business user) - ordenadas por fecha de creación descendente
    const { data: userSubscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', auth.userId)
      .eq('subscription_status', 'active')
      .order('created_at', { ascending: false })

    if (subsError) {
      logger.error('Error fetching user subscriptions:', subsError)
    }

    // Usar las fechas de la suscripción activa del usuario si están disponibles, 
    // o usar las fechas de la organización como respaldo
    const activeSubscription = userSubscriptions && userSubscriptions.length > 0 ? userSubscriptions[0] : null
    
    // Priorizar fechas de la suscripción activa del usuario, luego las de la organización
    const startDate = activeSubscription?.start_date || organization.subscription_start_date
    const endDate = activeSubscription?.end_date || activeSubscription?.next_billing_date || organization.subscription_end_date

    // Calcular información adicional
    const now = new Date()
    const endDateObj = endDate ? new Date(endDate) : null
    const isExpired = endDateObj ? endDateObj < now : false
    const daysUntilExpiration = endDateObj ? Math.ceil((endDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
    const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration <= 30 && daysUntilExpiration > 0

    return NextResponse.json({
      success: true,
      subscription: {
        plan: organization.subscription_plan || 'team',
        status: organization.subscription_status || 'active',
        start_date: startDate,
        end_date: endDate,
        is_expired: isExpired,
        days_until_expiration: daysUntilExpiration,
        is_expiring_soon: isExpiringSoon,
        user_subscriptions: userSubscriptions || [],
        active_subscription: activeSubscription
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/settings/subscription:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener datos de suscripción'
    }, { status: 500 })
  }
}

