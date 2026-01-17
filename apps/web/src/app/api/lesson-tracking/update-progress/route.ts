import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * POST /api/lesson-tracking/update-progress
 * 
 * Actualiza el progreso del video en la tabla lesson_tracking.
 * Maneja tanto actualizaciones de tracking existente como creación de nuevo tracking.
 * 
 * Request body:
 * {
 *   lessonId: string;
 *   trackingId?: string;
 *   checkpoint: number;
 *   maxReached: number;
 *   totalDuration: number;
 *   playbackRate: number;
 * }
 * 
 * @returns { success: boolean, trackingId?: string, error?: string }
 */
export async function POST(request: NextRequest) {
    try {
        // Use SessionService to get user (matches app's custom auth system)
        const user = await SessionService.getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Create Supabase client for database operations
        const supabase = await createClient();

        const body = await request.json();
        const { lessonId, trackingId, checkpoint, maxReached, totalDuration, playbackRate } = body;

        // Validaciones
        if (!lessonId) {
            return NextResponse.json({ error: 'lessonId is required' }, { status: 400 });
        }

        if (typeof checkpoint !== 'number' || typeof maxReached !== 'number' || typeof totalDuration !== 'number') {
            return NextResponse.json({
                error: 'checkpoint, maxReached, and totalDuration must be numbers'
            }, { status: 400 });
        }

        const now = new Date().toISOString();

        // Si hay trackingId, intentar actualizar ese registro específico
        if (trackingId) {
            const { error } = await supabase
                .from('lesson_tracking')
                .update({
                    video_checkpoint_seconds: checkpoint,
                    video_max_seconds: maxReached,
                    video_total_duration_seconds: totalDuration,
                    video_playback_rate: playbackRate || 1.0,
                    last_activity_at: now,
                    updated_at: now
                })
                .eq('id', trackingId)
                .eq('user_id', user.id); // Seguridad: solo actualizar si es del usuario

            if (error) {
                console.error('[Update Progress] Error updating tracking:', error);
                return NextResponse.json({
                    error: 'Failed to update tracking',
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined
                }, { status: 500 });
            }

            return NextResponse.json({ success: true, trackingId });
        }

        // Si no hay trackingId, buscar o crear tracking
        const { data: existingTracking } = await supabase
            .from('lesson_tracking')
            .select('id, video_max_seconds')
            .eq('user_id', user.id)
            .eq('lesson_id', lessonId)
            .eq('status', 'in_progress')
            .order('last_activity_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existingTracking) {
            // Actualizar tracking existente
            // Calcular nuevo máximo (nunca decrece)
            const newMax = Math.max(existingTracking.video_max_seconds || 0, maxReached);

            const { error } = await supabase
                .from('lesson_tracking')
                .update({
                    video_checkpoint_seconds: checkpoint,
                    video_max_seconds: newMax,
                    video_total_duration_seconds: totalDuration,
                    video_playback_rate: playbackRate || 1.0,
                    last_activity_at: now,
                    updated_at: now
                })
                .eq('id', existingTracking.id);

            if (error) {
                console.error('[Update Progress] Error updating existing tracking:', error);
                return NextResponse.json({
                    error: 'Failed to update existing tracking',
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined
                }, { status: 500 });
            }

            return NextResponse.json({ success: true, trackingId: existingTracking.id });
        }

        // Crear nuevo tracking si no existe
        const { data: newTracking, error: insertError } = await supabase
            .from('lesson_tracking')
            .insert({
                user_id: user.id,
                lesson_id: lessonId,
                status: 'in_progress',
                started_at: now,
                video_started_at: now,
                video_checkpoint_seconds: checkpoint,
                video_max_seconds: maxReached,
                video_total_duration_seconds: totalDuration,
                video_playback_rate: playbackRate || 1.0,
                last_activity_at: now
            })
            .select('id')
            .single();

        if (insertError) {
            console.error('[Update Progress] Error creating tracking:', insertError);
            return NextResponse.json({
                error: 'Failed to create tracking',
                details: process.env.NODE_ENV === 'development' ? insertError.message : undefined
            }, { status: 500 });
        }

        return NextResponse.json({ success: true, trackingId: newTracking.id });
    } catch (error) {
        console.error('[Update Progress] Unexpected error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? String(error) : undefined
        }, { status: 500 });
    }
}
