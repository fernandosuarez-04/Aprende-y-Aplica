import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

interface RouteContext {
  params: Promise<{ orgSlug: string }>
}

/**
 * POST /api/[orgSlug]/business/subscription/change-plan
 * Cambia el plan de suscripción de la organización especificada
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { orgSlug } = await context.params

    if (!orgSlug) {
      return NextResponse.json({
        success: false,
        error: 'Slug de organización requerido'
      }, { status: 400 })
    }

    // Verificar autenticación y acceso a esta organización específica
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    // Verificar que el usuario sea owner o admin
    if (!auth.isOrgAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Solo los administradores pueden cambiar el plan de suscripción'
      }, { status: 403 })
    }

    const body = await request.json()
    const { planId, billingCycle }: { planId: string; billingCycle: 'monthly' | 'yearly' } = body

    // Validaciones
    if (!planId || !billingCycle) {
      return NextResponse.json({
        success: false,
        error: 'planId y billingCycle son requeridos'
      }, { status: 400 })
    }

    // Validar que el plan existe
    const validPlans = ['team', 'business', 'enterprise']
    if (!validPlans.includes(planId.toLowerCase())) {
      return NextResponse.json({
        success: false,
        error: 'Plan inválido. Los planes válidos son: team, business, enterprise'
      }, { status: 400 })
    }

    // Validar que el ciclo de facturación es válido
    if (!['monthly', 'yearly'].includes(billingCycle.toLowerCase())) {
      return NextResponse.json({
        success: false,
        error: 'Ciclo de facturación inválido. Los valores válidos son: monthly, yearly'
      }, { status: 400 })
    }

    // Enterprise requiere contacto de ventas
    if (planId.toLowerCase() === 'enterprise') {
      return NextResponse.json({
        success: false,
        error: 'Para el plan Enterprise, por favor contacta con nuestro equipo de ventas.',
        requiresSalesContact: true
      }, { status: 400 })
    }

    const supabase = await createClient()
    const organizationId = auth.organizationId

    // Obtener datos actuales de la organización
    const { data: currentOrg, error: orgError } = await supabase
      .from('organizations')
      .select('subscription_plan, subscription_status, subscription_start_date, subscription_end_date, max_users, billing_cycle')
      .eq('id', organizationId)
      .single()

    if (orgError || !currentOrg) {
      logger.error('Error fetching organization:', orgError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener datos de la organización'
      }, { status: 500 })
    }

    const currentPlan = currentOrg.subscription_plan?.toLowerCase()
    const currentBillingCycle = currentOrg.billing_cycle || 'yearly'
    const newPlan = planId.toLowerCase()

    // Si ya tiene el mismo plan y el mismo ciclo, no hacer nada
    if (currentPlan === newPlan && currentBillingCycle === billingCycle) {
      return NextResponse.json({
        success: true,
        message: 'Ya tienes este plan activo',
        organization: {
          ...currentOrg,
          subscription_plan: newPlan,
          billing_cycle: billingCycle
        }
      })
    }

    // Calcular fechas de suscripción
    const now = new Date()
    const startDate = now
    const endDate = new Date()

    if (billingCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1)
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1)
    }

    // Definir límite de usuarios según el plan
    const maxUsersByPlan: Record<string, number> = {
      team: 10,
      business: 50,
      enterprise: 999999
    }

    const newMaxUsers = maxUsersByPlan[newPlan] || 10

    // Actualizar organización
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update({
        subscription_plan: newPlan,
        billing_cycle: billingCycle,
        subscription_start_date: startDate.toISOString(),
        subscription_end_date: endDate.toISOString(),
        max_users: newMaxUsers,
        updated_at: new Date().toISOString()
      })
      .eq('id', organizationId)
      .select()
      .single()

    if (updateError || !updatedOrg) {
      logger.error('Error updating organization subscription:', updateError)
      return NextResponse.json({
        success: false,
        error: `Error al actualizar el plan de suscripción: ${updateError?.message || 'Error desconocido'}`
      }, { status: 500 })
    }

    logger.info('Subscription plan changed successfully', {
      organizationId,
      fromPlan: currentPlan,
      toPlan: newPlan,
      billingCycle,
      maxUsers: newMaxUsers
    })

    return NextResponse.json({
      success: true,
      message: 'Plan actualizado exitosamente',
      organization: updatedOrg,
      subscription: {
        plan: newPlan,
        billing_cycle: billingCycle,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        max_users: newMaxUsers
      }
    })
  } catch (error) {
    logger.error('💥 Error in POST /api/[orgSlug]/business/subscription/change-plan:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al cambiar el plan de suscripción'
    }, { status: 500 })
  }
}
