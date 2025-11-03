import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../../../features/auth/services/session.service';
import { createClient } from '../../../../../../lib/supabase/server';
import { formatApiError, logError } from '@/core/utils/api-errors';

/**
 * POST /api/subscriptions/personal/[id]/cancel
 * Cancela una suscripción personal
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await SessionService.getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const supabase = await createClient();

    // Verificar que la suscripción pertenece al usuario
    // Suscripciones personales tienen course_id IS NULL
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('subscription_id', id)
      .eq('user_id', currentUser.id)
      .is('course_id', null) // Suscripciones personales no tienen course_id
      .single();

    if (fetchError || !subscription) {
      return NextResponse.json(
        { error: 'Suscripción no encontrada' },
        { status: 404 }
      );
    }

    if (subscription.subscription_status === 'cancelled') {
      return NextResponse.json(
        { error: 'La suscripción ya está cancelada' },
        { status: 400 }
      );
    }

    // Actualizar suscripción a cancelada
    // Nota: La tabla no tiene campo cancelled_at ni auto_renew, solo subscription_status
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        subscription_status: 'cancelled',
      })
      .eq('subscription_id', id)
      .select()
      .single();

    if (updateError) {
      logError('POST /api/subscriptions/personal/[id]/cancel - update error', updateError);
      return NextResponse.json(
        formatApiError(updateError, 'Error al cancelar suscripción'),
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
      message: 'Suscripción cancelada exitosamente',
    });
  } catch (error) {
    logError('POST /api/subscriptions/personal/[id]/cancel', error);
    return NextResponse.json(
      formatApiError(error, 'Error al cancelar suscripción'),
      { status: 500 }
    );
  }
}

