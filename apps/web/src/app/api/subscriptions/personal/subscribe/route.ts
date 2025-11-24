import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { PersonalSubscriptionService } from '../../../../../features/subscriptions/services/personal-subscription.service';
import { createClient } from '../../../../../lib/supabase/server';
import { formatApiError, logError } from '@/core/utils/api-errors';
import { PersonalPlanId, BillingCycle } from '../../../../../features/subscriptions/types/subscription.types';

/**
 * POST /api/subscriptions/personal/subscribe
 * Crea una nueva suscripción personal
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await SessionService.getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId, billingCycle }: { planId: PersonalPlanId; billingCycle: BillingCycle } = body;

    if (!planId || !billingCycle) {
      return NextResponse.json(
        { error: 'planId y billingCycle son requeridos' },
        { status: 400 }
      );
    }

    // Validar que el plan existe
    const plan = PersonalSubscriptionService.getPlanById(planId);
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      );
    }

    // Calcular precio y fechas
    const price = PersonalSubscriptionService.calculatePrice(plan, billingCycle);
    const startDate = new Date();
    const endDate = new Date();
    
    if (billingCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const supabase = await createClient();

    // Verificar si ya tiene una suscripción activa
    // Buscar suscripciones personales (course_id IS NULL)
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('subscription_id')
      .eq('user_id', currentUser.id)
      .is('course_id', null) // Suscripciones personales no tienen course_id
      .eq('subscription_status', 'active')
      .maybeSingle();

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'Ya tienes una suscripción activa. Cancela la actual antes de crear una nueva.' },
        { status: 400 }
      );
    }

    // Crear nueva suscripción
    // IMPORTANTE: La tabla subscriptions tiene estos campos válidos:
    // - subscription_type: 'monthly', 'yearly', 'lifetime', 'course_access' (NO 'personal')
    // - subscription_status: 'active', 'paused', 'cancelled', 'expired' (NO 'pending')
    // - Campos: user_id, price_cents, start_date, end_date, next_billing_date, course_id
    // Para suscripciones personales, usamos course_id = NULL para distinguirlas
    // TODO: Necesitamos agregar campos plan_id (basic/premium/pro) y subscription_category (personal/business) a la tabla
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: currentUser.id,
        subscription_type: billingCycle === 'monthly' ? 'monthly' : 'yearly',
        subscription_status: 'active', // Usar 'active' ya que 'pending' no existe en el CHECK constraint
        price_cents: price * 100,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        next_billing_date: billingCycle === 'monthly' 
          ? new Date(endDate.getTime()).toISOString()
          : new Date(endDate.getFullYear(), endDate.getMonth(), startDate.getDate()).toISOString(),
        course_id: null, // NULL para suscripciones personales (sin curso asociado)
      })
      .select()
      .single();

    if (subscriptionError) {
      logError('POST /api/subscriptions/personal/subscribe - insert error', subscriptionError);
      return NextResponse.json(
        formatApiError(subscriptionError, 'Error al crear suscripción'),
        { status: 500 }
      );
    }

    // TODO: Integrar con sistema de pagos (Stripe, PayPal, etc.)
    // Por ahora solo creamos el registro en estado 'pending'

    return NextResponse.json({
      success: true,
      subscription,
      message: 'Suscripción creada. Redirigiendo a página de pago...',
    });
  } catch (error) {
    logError('POST /api/subscriptions/personal/subscribe', error);
    return NextResponse.json(
      formatApiError(error, 'Error al crear suscripción'),
      { status: 500 }
    );
  }
}

