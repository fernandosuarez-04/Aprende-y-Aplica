import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../features/auth/services/session.service';
import { StudyPlannerService } from '../../../../features/study-planner/services/studyPlannerService';
import type { CalendarIntegrationInsert } from '@repo/shared/types';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const integrations = await StudyPlannerService.getCalendarIntegrations(
      user.id
    );

    return NextResponse.json({ success: true, data: integrations });
  } catch (error) {
    logger.error('Error getting calendar integrations:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error desconocido',
          code: 'GET_INTEGRATIONS_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body: CalendarIntegrationInsert = await request.json();
    const integration = await StudyPlannerService.createOrUpdateCalendarIntegration(
      {
        ...body,
        user_id: user.id,
      }
    );

    return NextResponse.json({ success: true, data: integration }, { status: 201 });
  } catch (error) {
    logger.error('Error creating/updating calendar integration:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error desconocido',
          code: 'CREATE_INTEGRATION_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

