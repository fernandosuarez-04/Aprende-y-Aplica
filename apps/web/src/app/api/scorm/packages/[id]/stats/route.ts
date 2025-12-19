import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: packageId } = await params;

    if (!packageId) {
      return NextResponse.json(
        { error: 'packageId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get all attempts for this package
    const { data: attempts, error: attemptsError } = await supabase
      .from('scorm_attempts')
      .select('id, user_id, lesson_status, score_raw, score_max, total_time, session_time, started_at, completed_at')
      .eq('package_id', packageId);

    if (attemptsError) {
      return NextResponse.json(
        { error: 'Failed to fetch attempts' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const totalAttempts = attempts?.length || 0;
    const uniqueUsers = new Set(attempts?.map(a => a.user_id) || []).size;

    // Get latest attempt per user for accurate completion stats
    const latestAttemptsByUser = new Map<string, any>();
    attempts?.forEach(attempt => {
      const existing = latestAttemptsByUser.get(attempt.user_id);
      if (!existing || new Date(attempt.started_at) > new Date(existing.started_at)) {
        latestAttemptsByUser.set(attempt.user_id, attempt);
      }
    });

    const latestAttempts = Array.from(latestAttemptsByUser.values());

    // Status counts (from latest attempts per user)
    const completedCount = latestAttempts.filter(a =>
      a.lesson_status === 'completed' || a.lesson_status === 'passed'
    ).length;
    const passedCount = latestAttempts.filter(a => a.lesson_status === 'passed').length;
    const failedCount = latestAttempts.filter(a => a.lesson_status === 'failed').length;
    const inProgressCount = latestAttempts.filter(a =>
      a.lesson_status === 'incomplete' ||
      a.lesson_status === 'browsed' ||
      a.lesson_status === 'not attempted'
    ).length;

    // Score calculations (only from attempts with scores)
    const attemptsWithScores = attempts?.filter(a =>
      a.score_raw !== null && a.score_max !== null && a.score_max > 0
    ) || [];

    let averageScore = 0;
    let highestScore = 0;
    let lowestScore = 100;

    if (attemptsWithScores.length > 0) {
      const scores = attemptsWithScores.map(a => (a.score_raw / a.score_max) * 100);
      averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      highestScore = Math.max(...scores);
      lowestScore = Math.min(...scores);
    }

    // Time calculations
    const parseInterval = (interval: string | null): number => {
      if (!interval) return 0;
      const match = interval.match(/(\d+):(\d+):(\d+)/);
      if (match) {
        return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]);
      }
      return 0;
    };

    const attemptsWithTime = attempts?.filter(a => a.total_time || a.session_time) || [];
    let totalTimeSeconds = 0;
    let averageTimeSeconds = 0;

    if (attemptsWithTime.length > 0) {
      totalTimeSeconds = attemptsWithTime.reduce((sum, a) => {
        return sum + parseInterval(a.total_time) + parseInterval(a.session_time);
      }, 0);
      averageTimeSeconds = totalTimeSeconds / attemptsWithTime.length;
    }

    // Format time as HH:MM:SS
    const formatTime = (seconds: number): string => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Completion rate
    const completionRate = uniqueUsers > 0 ? (completedCount / uniqueUsers) * 100 : 0;
    const passRate = completedCount > 0 ? (passedCount / completedCount) * 100 : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalAttempts,
        uniqueUsers,
        completedCount,
        passedCount,
        failedCount,
        inProgressCount,
        completionRate: Math.round(completionRate * 10) / 10,
        passRate: Math.round(passRate * 10) / 10,
        averageScore: Math.round(averageScore * 10) / 10,
        highestScore: Math.round(highestScore * 10) / 10,
        lowestScore: attemptsWithScores.length > 0 ? Math.round(lowestScore * 10) / 10 : 0,
        totalTime: formatTime(totalTimeSeconds),
        averageTime: formatTime(averageTimeSeconds),
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
