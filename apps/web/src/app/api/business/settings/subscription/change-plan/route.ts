import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * POST /api/business/settings/subscription/change-plan
 * Cambia el plan de suscripción de la organización
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'No tienes una organización asignada'
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
    // Intentar obtener billing_cycle, pero si no existe (migración no ejecutada), usar 'yearly' como default
    const { data: currentOrg, error: orgError } = await supabase
      .from('organizations')
      .select('subscription_plan, subscription_status, subscription_start_date, subscription_end_date, max_users')
      .eq('id', organizationId)
      .single()

    if (orgError || !currentOrg) {
      logger.error('Error fetching organization:', orgError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener datos de la organización'
      }, { status: 500 })
    }

    // Intentar obtener billing_cycle si existe la columna
    let currentBillingCycle = 'yearly' // Default
    try {
      const { data: orgWithBilling } = await supabase
        .from('organizations')
        .select('billing_cycle')
        .eq('id', organizationId)
        .single()
      
      if (orgWithBilling?.billing_cycle) {
        currentBillingCycle = orgWithBilling.billing_cycle
      }
    } catch (e) {
      // Si la columna no existe, usar default
      logger.warn('billing_cycle column may not exist, using default: yearly')
    }

    const currentPlan = currentOrg.subscription_plan?.toLowerCase()
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
    let endDate = new Date()

    if (billingCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1)
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1)
    }

    // Definir límite de usuarios según el plan
    const maxUsersByPlan: Record<string, number> = {
      team: 10,
      business: 50,
      enterprise: 999999 // Ilimitado para enterprise
    }

    const newMaxUsers = maxUsersByPlan[newPlan] || 10

    // Preparar datos de actualización
    const updateData: Record<string, any> = {
      subscription_plan: newPlan,
      subscription_start_date: startDate.toISOString(),
      subscription_end_date: endDate.toISOString(),
      max_users: newMaxUsers,
      updated_at: new Date().toISOString()
    }

    // Intentar agregar billing_cycle si la columna existe
    try {
      // Verificar si la columna billing_cycle existe
      const { error: checkError } = await supabase
        .from('organizations')
        .select('billing_cycle')
        .eq('id', organizationId)
        .limit(1)
      
      if (!checkError) {
        // La columna existe, podemos actualizarla
        updateData.billing_cycle = billingCycle
      } else {
        logger.warn('billing_cycle column may not exist, skipping update')
      }
    } catch (e) {
      // Si hay error, continuar sin billing_cycle
      logger.warn('Could not update billing_cycle, continuing without it')
    }

    // Actualizar organización
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
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

    // TODO: NOTIFICACIÓN DE PAGO
    // ====================================
    // Cuando se implemente la API de pagos, agregar aquí:
    // 1. Enviar notificación de cambio de plan al usuario
    // 2. Registrar el cambio en el historial de transacciones
    // 3. Enviar email de confirmación con detalles del cambio
    // ====================================

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
      },
      // TODO: Agregar información de pago cuando esté disponible
      // payment: {
      //   transaction_id: paymentResult.transactionId,
      //   amount: paymentResult.amount,
      //   currency: 'MXN',
      //   next_billing_date: endDate.toISOString()
      // }
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/settings/subscription/change-plan:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al cambiar el plan de suscripción'
    }, { status: 500 })
  }
}

