import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../../features/auth/services/session.service';
import LessonTrackingService from '../../../../../features/study-planner/services/lesson-tracking.service';

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const user = await SessionService.getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { lessonId, checkpoint, maxReached, totalDuration, playbackRate } = body;

        if (!lessonId) {
            return NextResponse.json({ error: 'Missing lessonId' }, { status: 400 });
        }

        const success = await LessonTrackingService.updateVideoProgress(
            lessonId,
            checkpoint || 0,
            maxReached || 0,
            totalDuration || 0,
            playbackRate || 1
        );

        return NextResponse.json({ success });
    } catch (error: any) {
        console.error('Error in progress tracking:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
