import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../features/auth/services/session.service';
import { StudyPlannerService } from '../../../../features/study-planner/services/studyPlannerService';
import type { StudyPlanInsert, StudyPlanUpdate } from '@repo/shared/types';
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

    const plans = await StudyPlannerService.getStudyPlans(user.id);

    return NextResponse.json({ success: true, data: plans });
  } catch (error) {
    logger.error('Error getting study plans:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error desconocido',
          code: 'GET_PLANS_ERROR',
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

    const body: StudyPlanInsert = await request.json();
    const plan = await StudyPlannerService.createStudyPlan({
      ...body,
      user_id: user.id,
    });

    return NextResponse.json({ success: true, data: plan }, { status: 201 });
  } catch (error) {
    logger.error('Error creating study plan:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error desconocido',
          code: 'CREATE_PLAN_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

