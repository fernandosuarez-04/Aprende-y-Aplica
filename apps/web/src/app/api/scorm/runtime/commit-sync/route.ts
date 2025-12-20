import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

export async function POST(req: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: '401' }, { status: 401 });
    }

    const supabase = await createClient();

    const { attemptId, cacheData } = await req.json();

    if (!attemptId) {
      return NextResponse.json(
        { error: 'attemptId is required' },
        { status: 400 }
      );
    }

    if (!cacheData || Object.keys(cacheData).length === 0) {
      return NextResponse.json({ success: true });
    }

    // Log key values for debugging
    console.log('[SCORM commit-sync] Received cacheData keys:', Object.keys(cacheData).filter(k =>
      k.includes('status') || k.includes('score') || k.includes('time') || k.includes('exit')
    ));
    console.log('[SCORM commit-sync] Session time from client:', cacheData['cmi.session_time'] || cacheData['cmi.core.session_time']);

    // Convert cacheData object to Map-like operations
    const cache = new Map<string, string>(Object.entries(cacheData));

    // Mapear CMI keys a columnas de DB
    const updateData: Record<string, any> = {
      last_accessed_at: new Date().toISOString(),
    };

    // SCORM 1.2 y 2004 mappings (sin lesson_status - se maneja por separado)
    const mappings: Record<string, string> = {
      'cmi.core.lesson_location': 'lesson_location',
      'cmi.core.score.raw': 'score_raw',
      'cmi.core.score.min': 'score_min',
      'cmi.core.score.max': 'score_max',
      'cmi.core.session_time': 'session_time',
      'cmi.core.exit': 'exit_type',
      'cmi.suspend_data': 'suspend_data',
      // SCORM 2004
      'cmi.location': 'lesson_location',
      'cmi.score.raw': 'score_raw',
      'cmi.score.min': 'score_min',
      'cmi.score.max': 'score_max',
      'cmi.score.scaled': 'score_scaled',
      'cmi.session_time': 'session_time',
      'cmi.exit': 'exit_type',
    };

    for (const [cmiKey, dbColumn] of Object.entries(mappings)) {
      if (cache.has(cmiKey)) {
        const value = cache.get(cmiKey)!;

        if (
          dbColumn === 'score_raw' ||
          dbColumn === 'score_min' ||
          dbColumn === 'score_max'
        ) {
          const parsed = parseFloat(value);
          updateData[dbColumn] = isNaN(parsed) ? null : parsed;
        } else if (dbColumn === 'score_scaled') {
          const parsed = parseFloat(value);
          updateData[dbColumn] = isNaN(parsed) ? null : Math.max(-1, Math.min(1, parsed));
        } else if (dbColumn === 'session_time') {
          updateData[dbColumn] = parseSessionTime(value);
        } else {
          updateData[dbColumn] = value;
        }
      }
    }

    // Manejar lesson_status con prioridad correcta
    const successStatus = cache.get('cmi.success_status');
    const completionStatus = cache.get('cmi.completion_status');
    const lessonStatus12 = cache.get('cmi.core.lesson_status');
    const scoreRaw = cache.get('cmi.score.raw') || cache.get('cmi.core.score.raw');
    const scoreMax = cache.get('cmi.score.max') || cache.get('cmi.core.score.max');

    console.log('[SCORM commit-sync] Status values:', {
      successStatus,
      completionStatus,
      lessonStatus12,
      scoreRaw,
      scoreMax
    });

    if (successStatus === 'passed' || successStatus === 'failed') {
      updateData.lesson_status = successStatus;
    } else if (lessonStatus12 === 'passed' || lessonStatus12 === 'failed') {
      updateData.lesson_status = lessonStatus12;
    } else if (completionStatus === 'completed' && scoreRaw) {
      const score = parseFloat(scoreRaw);
      const max = parseFloat(scoreMax || '100');
      const scaledPassingScore = parseFloat(cache.get('cmi.scaled_passing_score') || '0.8');
      const passThreshold = max * scaledPassingScore;

      if (!isNaN(score)) {
        updateData.lesson_status = score >= passThreshold ? 'passed' : 'failed';
        console.log('[SCORM commit-sync] Determined status from score:', updateData.lesson_status);
      } else {
        updateData.lesson_status = completionStatus;
      }
    } else if (lessonStatus12 === 'completed' && scoreRaw) {
      updateData.lesson_status = 'passed';
    } else if (lessonStatus12) {
      updateData.lesson_status = lessonStatus12;
    } else if (completionStatus) {
      updateData.lesson_status = completionStatus;
    }

    // Marcar como completado si aplica
    if (
      updateData.lesson_status === 'completed' ||
      updateData.lesson_status === 'passed'
    ) {
      updateData.completed_at = new Date().toISOString();
    }

    // Manejar total_time
    if (updateData.session_time) {
      const { data: currentAttempt } = await supabase
        .from('scorm_attempts')
        .select('total_time')
        .eq('id', attemptId)
        .eq('user_id', user.id)
        .single();

      if (currentAttempt) {
        const currentTotalSeconds = parseIntervalToSeconds(currentAttempt.total_time);
        const sessionSeconds = parseIntervalToSeconds(updateData.session_time);
        const newTotalSeconds = currentTotalSeconds + sessionSeconds;

        const hours = Math.floor(newTotalSeconds / 3600);
        const minutes = Math.floor((newTotalSeconds % 3600) / 60);
        const seconds = newTotalSeconds % 60;
        updateData.total_time = `${hours}:${minutes}:${seconds}`;
      }
    }

    console.log('[SCORM commit-sync] Final updateData:', updateData);

    // Guardar en DB
    const { error } = await supabase
      .from('scorm_attempts')
      .update(updateData)
      .eq('id', attemptId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[SCORM commit-sync] Error saving:', error);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    // Procesar interacciones del cuestionario si las hay
    await saveInteractions(supabase, attemptId, cache);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SCORM commit-sync] Exception:', error);
    return NextResponse.json({ error: 'Failed to commit' }, { status: 500 });
  }
}

async function saveInteractions(
  supabase: any,
  attemptId: string,
  cache: Map<string, string>
) {
  // Buscar keys de interacciones: cmi.interactions.0.id, etc.
  const interactionKeys = Array.from(cache.keys()).filter((k) =>
    k.startsWith('cmi.interactions.')
  );

  if (interactionKeys.length === 0) return;

  console.log('[SCORM commit-sync] Found interaction keys:', interactionKeys.length);

  // Agrupar por índice de interacción
  const interactions = new Map<string, Record<string, string>>();

  for (const key of interactionKeys) {
    const match = key.match(/cmi\.interactions\.(\d+)\.(.+)/);
    if (match) {
      const [, index, field] = match;
      if (!interactions.has(index)) {
        interactions.set(index, {});
      }
      interactions.get(index)![field] = cache.get(key)!;
    }
  }

  console.log('[SCORM commit-sync] Parsed interactions count:', interactions.size);

  // Insertar cada interacción
  for (const [index, data] of interactions) {
    if (data.id) {
      try {
        const interactionData = {
          attempt_id: attemptId,
          interaction_id: data.id,
          interaction_type: data.type || null,
          learner_response: data.learner_response || data.student_response || null,
          correct_response: data['correct_responses.0.pattern'] || null,
          result: data.result || null,
          weighting: data.weighting ? parseFloat(data.weighting) : 1,
          latency: data.latency || null,
        };

        console.log(`[SCORM commit-sync] Saving interaction ${index}:`, interactionData);

        const { error } = await supabase.from('scorm_interactions').upsert(
          interactionData,
          {
            onConflict: 'attempt_id,interaction_id',
          }
        );

        if (error) {
          console.error(`[SCORM commit-sync] Error saving interaction ${index}:`, error);
        }
      } catch (err) {
        console.error(`[SCORM commit-sync] Exception saving interaction ${index}:`, err);
      }
    }
  }
}

function parseIntervalToSeconds(interval: string | null): number {
  if (!interval) return 0;
  const match = interval.match(/(\d+):(\d+):(\d+)/);
  if (match) {
    return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]);
  }
  return 0;
}

function parseSessionTime(time: string): string {
  if (time.startsWith('PT')) {
    const match = time.match(
      /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/
    );
    if (match) {
      const hours = match[1] || '0';
      const minutes = match[2] || '0';
      const seconds = match[3] || '0';
      return `${hours}:${minutes}:${seconds}`;
    }
  } else if (time.includes(':')) {
    const parts = time.split(':');
    if (parts.length >= 3) {
      const hours = parseInt(parts[0], 10) || 0;
      const minutes = parseInt(parts[1], 10) || 0;
      const seconds = parseFloat(parts[2]) || 0;
      return `${hours}:${minutes}:${Math.floor(seconds)}`;
    }
  }
  return '0:0:0';
}
