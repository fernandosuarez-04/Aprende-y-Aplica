import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { createClient } from '../../../../../lib/supabase/server';
import { formatApiError, logError } from '@/core/utils/api-errors';

/**
 * GET /api/subscriptions/personal/current
 * Obtiene la suscripción personal activa del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await SessionService.getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Buscar suscripción personal activa
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('subscription_type', 'personal')
      .eq('subscription_status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (no hay suscripción)
      logError('GET /api/subscriptions/personal/current - subscription query', subscriptionError);
    }

    if (!subscription) {
      return NextResponse.json({
        success: true,
        subscription: null,
      });
    }

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    logError('GET /api/subscriptions/personal/current', error);
    return NextResponse.json(
      formatApiError(error, 'Error al obtener suscripción actual'),
      { status: 500 }
    );
  }
}

