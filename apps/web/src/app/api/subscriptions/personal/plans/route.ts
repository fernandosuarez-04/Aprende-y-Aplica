import { NextRequest, NextResponse } from 'next/server';
import { PersonalSubscriptionService } from '../../../../../features/subscriptions/services/personal-subscription.service';
import { formatApiError, logError } from '@/core/utils/api-errors';

/**
 * GET /api/subscriptions/personal/plans
 * Obtiene todos los planes personales disponibles
 */
export async function GET(request: NextRequest) {
  try {
    const plans = PersonalSubscriptionService.getPersonalPlans();

    return NextResponse.json({
      success: true,
      plans,
    });
  } catch (error) {
    logError('GET /api/subscriptions/personal/plans', error);
    return NextResponse.json(
      formatApiError(error, 'Error al obtener planes personales'),
      { status: 500 }
    );
  }
}

