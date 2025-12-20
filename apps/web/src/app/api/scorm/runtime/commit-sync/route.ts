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
    let scoreRaw = cache.get('cmi.score.raw') || cache.get('cmi.core.score.raw');
    const scoreMax = cache.get('cmi.score.max') || cache.get('cmi.core.score.max');

    // Log valores exactos para debugging
    console.log('[SCORM commit-sync] Raw values from cache:', {
      'cmi.score.raw': cache.get('cmi.score.raw'),
      'cmi.core.score.raw': cache.get('cmi.core.score.raw'),
      'cmi.success_status': successStatus,
      'cmi.completion_status': completionStatus
    });

    // Log all objective-related keys for debugging
    const objectiveKeys = Array.from(cache.keys()).filter(k => k.startsWith('cmi.objectives.'));
    console.log('[SCORM commit-sync] All objective keys in cache:', objectiveKeys.slice(0, 30));

    // Si no hay score general, intentar calcularlo desde los objetivos
    if (!scoreRaw || scoreRaw === '' || scoreRaw === 'unknown') {
      const objectiveScores: number[] = [];
      const objectiveMaxScores: number[] = [];
      let objectiveIndex = 0;

      // Buscar objetivos por cualquier campo (id, success_status, score.raw, etc.)
      while (
        cache.has(`cmi.objectives.${objectiveIndex}.id`) ||
        cache.has(`cmi.objectives.${objectiveIndex}.success_status`) ||
        cache.has(`cmi.objectives.${objectiveIndex}.score.raw`) ||
        cache.has(`cmi.objectives.${objectiveIndex}.score.scaled`) ||
        cache.has(`cmi.objectives.${objectiveIndex}.completion_status`)
      ) {
        const objScore = cache.get(`cmi.objectives.${objectiveIndex}.score.raw`);
        const objMaxScore = cache.get(`cmi.objectives.${objectiveIndex}.score.max`);
        console.log(`[SCORM commit-sync] Objective ${objectiveIndex}: score.raw=${objScore}, score.max=${objMaxScore}`);

        if (objScore && objScore !== '') {
          const parsed = parseFloat(objScore);
          if (!isNaN(parsed)) {
            objectiveScores.push(parsed);
            // Also get max score for percentage calculation
            const maxParsed = parseFloat(objMaxScore || '100');
            objectiveMaxScores.push(isNaN(maxParsed) ? 100 : maxParsed);
          }
        }
        objectiveIndex++;
      }

      if (objectiveScores.length > 0) {
        // Calculate total score as sum of all objective scores
        const totalScore = objectiveScores.reduce((a, b) => a + b, 0);
        const totalMaxScore = objectiveMaxScores.reduce((a, b) => a + b, 0);
        // Calculate percentage
        const percentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
        scoreRaw = String(percentage);
        console.log('[SCORM commit-sync] Calculated score from objectives:', {
          totalScore, totalMaxScore, percentage, objectiveScores, objectiveMaxScores
        });

        // También actualizar el updateData con este score
        updateData.score_raw = percentage;
      }
    }

    // Determinar success_status desde objetivos si no está definido
    let derivedSuccessStatus = successStatus;
    if (!derivedSuccessStatus || derivedSuccessStatus === 'unknown') {
      let objectiveIndex = 0;
      let passedCount = 0;
      let failedCount = 0;
      let totalObjectives = 0;

      // Buscar objetivos por cualquier campo (id, success_status, score.raw, etc.)
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
          // Si tiene score.scaled >= 0.8 (80%), considerar passed
          if (objScoreScaled) {
            const scaled = parseFloat(objScoreScaled);
            if (!isNaN(scaled)) {
              derivedObjStatus = scaled >= 0.8 ? 'passed' : (scaled > 0 ? 'passed' : 'failed');
            }
          }
          // O si score.raw >= score.max (100%), considerar passed
          else if (objScoreRaw && objScoreMax) {
            const raw = parseFloat(objScoreRaw);
            const max = parseFloat(objScoreMax);
            if (!isNaN(raw) && !isNaN(max) && max > 0) {
              derivedObjStatus = raw >= max ? 'passed' : (raw > 0 ? 'passed' : 'failed');
            }
          }
        }

        console.log(`[SCORM commit-sync] Objective ${objectiveIndex} status: original=${objStatus}, derived=${derivedObjStatus}`);

        if (derivedObjStatus === 'passed') passedCount++;
        else if (derivedObjStatus === 'failed') failedCount++;
        totalObjectives++;
        objectiveIndex++;
      }

      if (totalObjectives > 0) {
        // Si todos los objetivos están pasados, marcar como passed
        // Si hay algún failed, marcar como failed
        // Si tiene scores pero no status explícito, usar el conteo
        if (passedCount === totalObjectives) {
          derivedSuccessStatus = 'passed';
        } else if (failedCount > 0 && passedCount === 0) {
          derivedSuccessStatus = 'failed';
        } else if (passedCount > 0) {
          // Al menos algunos pasaron - considerar como passed si la mayoría pasó
          derivedSuccessStatus = passedCount > failedCount ? 'passed' : 'failed';
        }
        console.log('[SCORM commit-sync] Derived success status from objectives:', {
          derivedSuccessStatus, passedCount, failedCount, totalObjectives
        });
      }
    }

    console.log('[SCORM commit-sync] Status values:', {
      successStatus,
      derivedSuccessStatus,
      completionStatus,
      lessonStatus12,
      scoreRaw,
      scoreMax
    });

    // Usar derivedSuccessStatus si el successStatus original no es válido
    const effectiveSuccessStatus = (successStatus === 'passed' || successStatus === 'failed')
      ? successStatus
      : derivedSuccessStatus;

    if (effectiveSuccessStatus === 'passed' || effectiveSuccessStatus === 'failed') {
      updateData.lesson_status = effectiveSuccessStatus;
      console.log('[SCORM commit-sync] Using effective success status:', effectiveSuccessStatus);
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

  // Log todas las keys encontradas para debugging
  console.log('[SCORM commit-sync] Found interaction keys:', interactionKeys);

  // Agrupar por índice de interacción
  const interactions = new Map<string, Record<string, string>>();

  for (const key of interactionKeys) {
    // Regex mejorado para capturar campos anidados como correct_responses.0.pattern
    const match = key.match(/^cmi\.interactions\.(\d+)\.(.+)$/);
    if (match) {
      const [, index, field] = match;
      if (!interactions.has(index)) {
        interactions.set(index, {});
      }
      interactions.get(index)![field] = cache.get(key)!;
      console.log(`[SCORM commit-sync] Parsed interaction field: index=${index}, field=${field}, value=${cache.get(key)}`);
    } else {
      console.log(`[SCORM commit-sync] Key did not match regex: ${key}`);
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
