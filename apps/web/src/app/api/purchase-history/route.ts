import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { SessionService } from '../../../features/auth/services/session.service';
import { formatApiError, logError } from '@/core/utils/api-errors';

export async function GET(request: NextRequest) {
  try {
    // Obtener usuario usando el sistema de sesiones
    const currentUser = await SessionService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const userId = currentUser.id;

    // Obtener compras de cursos
    const { data: coursePurchases, error: purchasesError } = await supabase
      .from('course_purchases')
      .select(`
        purchase_id,
        course_id,
        final_price_cents,
        currency,
        purchased_at,
        access_status,
        expires_at,
        transaction_id,
        courses:course_id (
          id,
          title,
          description,
          thumbnail_url,
          slug,
          price
        ),
        transactions:transaction_id (
          transaction_id,
          transaction_status,
          processed_at
        )
      `)
      .eq('user_id', userId)
      .order('purchased_at', { ascending: false });

    if (purchasesError) {
      logError('GET /api/purchase-history - course_purchases query', purchasesError);
    }

    // Obtener suscripciones
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select(`
        subscription_id,
        subscription_type,
        subscription_status,
        price_cents,
        start_date,
        end_date,
        next_billing_date,
        course_id,
        courses:course_id (
          id,
          title,
          description,
          thumbnail_url,
          slug,
          price
        )
      `)
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    if (subscriptionsError) {
      logError('GET /api/purchase-history - subscriptions query', subscriptionsError);
    }

    // Formatear datos
    const formattedPurchases = (coursePurchases || []).map((purchase: any) => ({
      id: purchase.purchase_id,
      type: 'course',
      title: purchase.courses?.title || 'Curso sin título',
      description: purchase.courses?.description || '',
      thumbnail_url: purchase.courses?.thumbnail_url,
      slug: purchase.courses?.slug,
      price: purchase.final_price_cents ? (purchase.final_price_cents / 100).toFixed(2) : '0.00',
      currency: purchase.currency || 'USD',
      purchased_at: purchase.purchased_at,
      status: purchase.access_status || 'active',
      transaction_status: purchase.transactions?.transaction_status || 'completed',
      expires_at: purchase.expires_at,
      course_id: purchase.course_id,
    }));

    const formattedSubscriptions = (subscriptions || []).map((subscription: any) => ({
      id: subscription.subscription_id,
      type: 'subscription',
      subscription_type: subscription.subscription_type,
      title: subscription.courses?.title 
        ? `Suscripción: ${subscription.courses.title}` 
        : subscription.subscription_type === 'monthly' 
          ? 'Suscripción Mensual'
          : subscription.subscription_type === 'yearly'
          ? 'Suscripción Anual'
          : subscription.subscription_type === 'lifetime'
          ? 'Suscripción de por vida'
          : 'Suscripción',
      description: subscription.courses?.description || '',
      thumbnail_url: subscription.courses?.thumbnail_url,
      slug: subscription.courses?.slug,
      price: subscription.price_cents ? (subscription.price_cents / 100).toFixed(2) : '0.00',
      currency: 'USD',
      purchased_at: subscription.start_date,
      status: subscription.subscription_status,
      subscription_status: subscription.subscription_status,
      start_date: subscription.start_date,
      end_date: subscription.end_date,
      next_billing_date: subscription.next_billing_date,
      course_id: subscription.course_id,
    }));

    // Combinar y ordenar por fecha
    const allPurchases = [...formattedPurchases, ...formattedSubscriptions].sort(
      (a, b) => new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime()
    );

    return NextResponse.json({
      purchases: allPurchases,
      total: allPurchases.length,
      courses: formattedPurchases.length,
      subscriptions: formattedSubscriptions.length,
    });
  } catch (error) {
    logError('GET /api/purchase-history', error);
    return NextResponse.json(
      formatApiError(error, 'Error al obtener historial de compras'),
      { status: 500 }
    );
  }
}

