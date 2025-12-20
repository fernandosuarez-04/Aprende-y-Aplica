import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';
import { getSessionCache } from '@/lib/scorm/session-cache';

export async function POST(req: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: '401' }, { status: 401 });
    }

    const supabase = await createClient();

    const { attemptId } = await req.json();

    if (!attemptId) {
      return NextResponse.json(
        { error: 'attemptId is required' },
        { status: 400 }
      );
    }

    const cache = getSessionCache(attemptId);
    if (cache.size === 0) {
      return NextResponse.json({ success: true }); // Nada que guardar
    }

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

        // Conversiones especiales
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

    // Manejar lesson_status con prioridad correcta:
    // Para SCORM 2004: success_status (passed/failed) tiene prioridad sobre completion_status
    // Para SCORM 1.2: usar lesson_status directamente
    const successStatus = cache.get('cmi.success_status');
    const completionStatus = cache.get('cmi.completion_status');
    const lessonStatus12 = cache.get('cmi.core.lesson_status');

    // Log all status values for debugging
    let scoreRaw = cache.get('cmi.score.raw') || cache.get('cmi.core.score.raw');
    const scoreMax = cache.get('cmi.score.max') || cache.get('cmi.core.score.max');

    // Si no hay score general, intentar calcularlo desde los objetivos
    if (!scoreRaw || scoreRaw === '' || scoreRaw === 'unknown') {
      const objectiveScores: number[] = [];
      const objectiveMaxScores: number[] = [];
      let objectiveIndex = 0;

      while (
        cache.has(`cmi.objectives.${objectiveIndex}.id`) ||
        cache.has(`cmi.objectives.${objectiveIndex}.success_status`) ||
        cache.has(`cmi.objectives.${objectiveIndex}.score.raw`) ||
        cache.has(`cmi.objectives.${objectiveIndex}.score.scaled`) ||
        cache.has(`cmi.objectives.${objectiveIndex}.completion_status`)
      ) {
        const objScore = cache.get(`cmi.objectives.${objectiveIndex}.score.raw`);
        const objMaxScore = cache.get(`cmi.objectives.${objectiveIndex}.score.max`);
        if (objScore && objScore !== '') {
          const parsed = parseFloat(objScore);
          if (!isNaN(parsed)) {
            objectiveScores.push(parsed);
            const maxParsed = parseFloat(objMaxScore || '100');
            objectiveMaxScores.push(isNaN(maxParsed) ? 100 : maxParsed);
          }
        }
        objectiveIndex++;
      }

      if (objectiveScores.length > 0) {
        const totalScore = objectiveScores.reduce((a, b) => a + b, 0);
        const totalMaxScore = objectiveMaxScores.reduce((a, b) => a + b, 0);
        const percentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
        scoreRaw = String(percentage);
        updateData.score_raw = percentage;
        updateData.score_max = 100; // El porcentaje ya está normalizado a 100
        console.log('[SCORM commit] Calculated score from objectives:', percentage);
      }
    }

    // Determinar success_status desde objetivos si no está definido
    let derivedSuccessStatus = successStatus;
    if (!derivedSuccessStatus || derivedSuccessStatus === 'unknown') {
      let objectiveIndex = 0;
      let passedCount = 0;
      let failedCount = 0;
      let totalObjectives = 0;

      while (
        cache.has(`cmi.objectives.${objectiveIndex}.id`) ||
        cache.has(`cmi.objectives.${objectiveIndex}.success_status`) ||
        cache.has(`cmi.objectives.${objectiveIndex}.score.raw`) ||
        cache.has(`cmi.objectives.${objectiveIndex}.score.scaled`) ||
        cache.has(`cmi.objectives.${objectiveIndex}.completion_status`)
      ) {
        const objStatus = cache.get(`cmi.objectives.${objectiveIndex}.success_status`);
        const objScoreRaw = cache.get(`cmi.objectives.${objectiveIndex}.score.raw`);
        const objScoreMax = cache.get(`cmi.objectives.${objectiveIndex}.score.max`);
        const objScoreScaled = cache.get(`cmi.objectives.${objectiveIndex}.score.scaled`);

        // Derivar success_status desde score si no está definido
        let derivedObjStatus = objStatus;
        if (!derivedObjStatus || derivedObjStatus === 'unknown') {
          if (objScoreScaled) {
            const scaled = parseFloat(objScoreScaled);
            if (!isNaN(scaled)) {
              derivedObjStatus = scaled >= 0.8 ? 'passed' : (scaled > 0 ? 'passed' : 'failed');
            }
          } else if (objScoreRaw && objScoreMax) {
            const raw = parseFloat(objScoreRaw);
            const max = parseFloat(objScoreMax);
            if (!isNaN(raw) && !isNaN(max) && max > 0) {
              derivedObjStatus = raw >= max ? 'passed' : (raw > 0 ? 'passed' : 'failed');
            }
          }
        }

        if (derivedObjStatus === 'passed') passedCount++;
        else if (derivedObjStatus === 'failed') failedCount++;
        totalObjectives++;
        objectiveIndex++;
      }

      if (totalObjectives > 0) {
        if (passedCount === totalObjectives) {
          derivedSuccessStatus = 'passed';
        } else if (failedCount > 0 && passedCount === 0) {
          derivedSuccessStatus = 'failed';
        } else if (passedCount > 0) {
          derivedSuccessStatus = passedCount > failedCount ? 'passed' : 'failed';
        }
        console.log('[SCORM commit] Derived success status from objectives:', {
          derivedSuccessStatus, passedCount, failedCount, totalObjectives
        });
      }
    }

    console.log('[SCORM commit] Status values:', {
      successStatus,
      derivedSuccessStatus,
      completionStatus,
      lessonStatus12,
      scoreRaw,
      scoreMax,
      cacheKeys: Array.from(cache.keys()).filter(k => k.includes('status') || k.includes('score'))
    });

    const effectiveSuccessStatus = (successStatus === 'passed' || successStatus === 'failed')
      ? successStatus
      : derivedSuccessStatus;

    if (effectiveSuccessStatus === 'passed' || effectiveSuccessStatus === 'failed') {
      updateData.lesson_status = effectiveSuccessStatus;
    } else if (lessonStatus12 === 'passed' || lessonStatus12 === 'failed') {
      // SCORM 1.2: passed/failed
      updateData.lesson_status = lessonStatus12;
    } else if (completionStatus === 'completed' && scoreRaw) {
      // SCORM 2004: Si hay completion_status='completed' Y un score, el quiz fue enviado
      // Determinar passed/failed basado en score
      const score = parseFloat(scoreRaw);
      const max = parseFloat(scoreMax || '100');
      const scaledPassingScore = parseFloat(cache.get('cmi.scaled_passing_score') || '0.8');
      const passThreshold = max * scaledPassingScore;

      if (!isNaN(score)) {
        updateData.lesson_status = score >= passThreshold ? 'passed' : 'failed';
        console.log('[SCORM commit] Determined status from score:', updateData.lesson_status);
      } else {
        updateData.lesson_status = completionStatus;
      }
    } else if (lessonStatus12 === 'completed' && scoreRaw) {
      // SCORM 1.2: completed con score
      updateData.lesson_status = 'passed';
    } else if (lessonStatus12) {
      // SCORM 1.2: otros estados
      updateData.lesson_status = lessonStatus12;
    } else if (completionStatus) {
      // SCORM 2004: Solo completion_status sin score
      updateData.lesson_status = completionStatus;
    }

    console.log('[SCORM commit] Final updateData:', updateData);

    // Marcar como completado si aplica
    if (
      updateData.lesson_status === 'completed' ||
      updateData.lesson_status === 'passed'
    ) {
      updateData.completed_at = new Date().toISOString();
    }

    // If session_time is provided, we need to add it to total_time
    // First get the current attempt to get existing total_time
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

        // Convert back to interval format
        const hours = Math.floor(newTotalSeconds / 3600);
        const minutes = Math.floor((newTotalSeconds % 3600) / 60);
        const seconds = newTotalSeconds % 60;
        updateData.total_time = `${hours}:${minutes}:${seconds}`;
      }
    }

    // Guardar en DB
    const { error } = await supabase
      .from('scorm_attempts')
      .update(updateData)
      .eq('id', attemptId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    // Procesar interacciones si las hay
    await saveInteractions(supabase, attemptId, cache);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to commit' }, { status: 500 });
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
  // SCORM 1.2: HHHH:MM:SS.ss → PostgreSQL interval
  // SCORM 2004: PT#H#M#S → PostgreSQL interval
  if (time.startsWith('PT')) {
    // ISO 8601 duration
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
    // SCORM 1.2 format HHHH:MM:SS.ss
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

  // Insertar cada interacción
  for (const [, data] of interactions) {
    if (data.id) {
      try {
        await supabase.from('scorm_interactions').upsert(
          {
            attempt_id: attemptId,
            interaction_id: data.id,
            interaction_type: data.type,
            learner_response: data.learner_response || data.student_response,
            correct_response: data['correct_responses.0.pattern'] || null,
            result: data.result,
            weighting: data.weighting ? parseFloat(data.weighting) : 1,
            latency: data.latency,
          },
          {
            onConflict: 'attempt_id,interaction_id',
          }
        );
      } catch {
        // Ignorar errores de interacciones individuales
      }
    }
  }
}
