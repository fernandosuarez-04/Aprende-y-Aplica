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
    // Nota: subscription_type en BD es 'monthly', 'yearly', 'lifetime', 'course_access'
    // Para distinguir personal vs business, necesitamos usar course_id IS NULL para personales
    // o agregar un campo subscription_category a la tabla
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', currentUser.id)
      .is('course_id', null) // Suscripciones personales no tienen course_id asociado
      .eq('subscription_status', 'active')
      .in('subscription_type', ['monthly', 'yearly', 'lifetime']) // Excluir 'course_access'
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

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

