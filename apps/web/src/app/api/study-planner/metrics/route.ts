import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../features/auth/services/session.service';
import { StudyPlannerService } from '../../../../features/study-planner/services/studyPlannerService';
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'learning'; // 'learning' | 'habits'

    if (type === 'habits') {
      const stats = await StudyPlannerService.getStudyHabitStats(user.id);
      return NextResponse.json({ success: true, data: stats });
    } else {
      const metrics = await StudyPlannerService.getLearningMetrics(user.id);
      return NextResponse.json({ success: true, data: metrics });
    }
  } catch (error) {
    logger.error('Error getting study metrics:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error desconocido',
          code: 'GET_METRICS_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

