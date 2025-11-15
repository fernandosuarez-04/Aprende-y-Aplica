import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { StudyPlannerService } from '../../../../../features/study-planner/services/studyPlannerService';
import { logger } from '@/lib/utils/logger';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    await StudyPlannerService.deleteCalendarIntegration(id, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting calendar integration:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error desconocido',
          code: 'DELETE_INTEGRATION_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

