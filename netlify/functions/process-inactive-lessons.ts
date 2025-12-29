/**
 * Netlify Scheduled Function: Process Inactive Lessons
 *
 * Esta función se ejecuta cada 5 minutos para detectar y cerrar
 * lecciones/sesiones por inactividad.
 *
 * Flujos manejados:
 * - Flujo B: Lecciones con LIA → 5min sin mensajes = cierre
 * - Flujo C: Lecciones sin quiz/LIA → 5min sin actividad = cierre
 */

import { createClient } from "@supabase/supabase-js";
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

// Tipos
interface LessonTracking {
  id: string;
  user_id: string;
  lesson_id: string;
  session_id: string | null;
  status: string;
  lia_first_message_at: string | null;
  lia_last_message_at: string | null;
  post_content_start_at: string | null;
  last_activity_at: string | null;
  next_analysis_at: string | null;
}

// Constantes
const INACTIVITY_THRESHOLD_MINUTES = 5;
const NEXT_ANALYSIS_INTERVAL_MINUTES = 5;

/**
 * Crea cliente de Supabase con Service Role Key
 */
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Variables de Supabase no configuradas");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Procesa un tracking individual por inactividad
 */
async function processTracking(
  supabase: ReturnType<typeof createAdminClient>,
  tracking: LessonTracking
): Promise<{ completed: boolean; reason?: string }> {
  const now = new Date();
  const inactivityThresholdMs = INACTIVITY_THRESHOLD_MINUTES * 60 * 1000;

  // Flujo B: Verificar inactividad LIA
  if (tracking.lia_first_message_at && tracking.lia_last_message_at) {
    const lastLiaMessage = new Date(tracking.lia_last_message_at);
    const timeSinceLastMessage = now.getTime() - lastLiaMessage.getTime();

    if (timeSinceLastMessage >= inactivityThresholdMs) {
      // Completar por inactividad LIA
      const completedAt = new Date(
        lastLiaMessage.getTime() + inactivityThresholdMs
      );

      await supabase
        .from("lesson_tracking")
        .update({
          status: "completed",
          completed_at: completedAt.toISOString(),
          end_trigger: "lia_inactivity_5m",
          updated_at: now.toISOString(),
        })
        .eq("id", tracking.id);

      return { completed: true, reason: "lia_inactivity_5m" };
    }
  }

  // Flujo C: Verificar inactividad general
  if (tracking.last_activity_at) {
    const lastActivity = new Date(tracking.last_activity_at);
    const timeSinceLastActivity = now.getTime() - lastActivity.getTime();

    if (timeSinceLastActivity >= inactivityThresholdMs) {
      // Completar por inactividad general
      const completedAt = new Date(
        lastActivity.getTime() + inactivityThresholdMs
      );

      await supabase
        .from("lesson_tracking")
        .update({
          status: "completed",
          completed_at: completedAt.toISOString(),
          end_trigger: "activity_inactivity_5m",
          updated_at: now.toISOString(),
        })
        .eq("id", tracking.id);

      return { completed: true, reason: "activity_inactivity_5m" };
    }
  }

  // No completado, programar siguiente análisis
  const nextAnalysis = new Date(
    now.getTime() + NEXT_ANALYSIS_INTERVAL_MINUTES * 60 * 1000
  );

  await supabase
    .from("lesson_tracking")
    .update({
      next_analysis_at: nextAnalysis.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", tracking.id);

  return { completed: false };
}

/**
 * Cierra la study_session si corresponde
 */
async function checkAndCloseSession(
  supabase: ReturnType<typeof createAdminClient>,
  sessionId: string,
  completionMethod: string
): Promise<void> {
  if (!sessionId) return;

  // Verificar si hay más trackings pendientes para esta sesión
  const { data: pendingTrackings, error } = await supabase
    .from("lesson_tracking")
    .select("id")
    .eq("session_id", sessionId)
    .eq("status", "in_progress");

  if (error) {
    console.error("Error verificando trackings pendientes:", error);
    return;
  }

  // Si no hay más trackings pendientes, cerrar la sesión
  if (!pendingTrackings || pendingTrackings.length === 0) {
    const now = new Date();

    await supabase
      .from("study_sessions")
      .update({
        status: "completed",
        completed_at: now.toISOString(),
        completion_method: completionMethod,
        updated_at: now.toISOString(),
      })
      .eq("id", sessionId)
      .eq("status", "in_progress");

    console.log(`✅ Sesión ${sessionId} cerrada automáticamente`);
  }
}

/**
 * Handler principal de la función programada
 */
const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  console.log("🔄 [Cron] Iniciando process-inactive-lessons...");

  try {
    const supabase = createAdminClient();
    const now = new Date();

    // Buscar trackings pendientes de análisis
    const { data: trackings, error } = await supabase
      .from("lesson_tracking")
      .select("*")
      .eq("status", "in_progress")
      .lte("next_analysis_at", now.toISOString())
      .order("next_analysis_at", { ascending: true })
      .limit(100); // Procesar en lotes

    if (error) {
      console.error("❌ Error obteniendo trackings:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }

    if (!trackings || trackings.length === 0) {
      console.log("ℹ️ No hay trackings pendientes de análisis");
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No trackings to process",
          processed: 0,
        }),
      };
    }

    console.log(`📊 Procesando ${trackings.length} trackings...`);

    let completedCount = 0;
    let updatedCount = 0;

    for (const tracking of trackings) {
      const result = await processTracking(supabase, tracking);

      if (result.completed) {
        completedCount++;
        console.log(`✅ Tracking ${tracking.id} completado: ${result.reason}`);

        // Verificar si cerrar la sesión
        if (tracking.session_id && result.reason) {
          await checkAndCloseSession(
            supabase,
            tracking.session_id,
            result.reason
          );
        }
      } else {
        updatedCount++;
      }
    }

    console.log(
      `🏁 Resultado: ${completedCount} completados, ${updatedCount} reprogramados`
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Processing complete",
        processed: trackings.length,
        completed: completedCount,
        rescheduled: updatedCount,
      }),
    };
  } catch (error: any) {
    console.error("❌ Error en process-inactive-lessons:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

export { handler };
