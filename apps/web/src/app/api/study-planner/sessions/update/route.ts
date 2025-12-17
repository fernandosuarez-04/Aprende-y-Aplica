/**
 * API Endpoint: Update Study Sessions
 * 
 * PUT /api/study-planner/sessions/update
 * 
 * Actualiza las sesiones de estudio existentes con nuevos horarios
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/features/auth/services/session.service';
import { createClient } from '@supabase/supabase-js';

// Crear cliente admin para bypass de RLS
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Variables de Supabase no configuradas');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

interface UpdateSessionRequest {
  planId: string;
  updates: Array<{
    sessionId?: string;
    dateStr: string;
    originalStartTime: string;
    newStartTime: string;
    newEndTime: string;
  }>;
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'No autorizado'
      }, { status: 401 });
    }

    const body: UpdateSessionRequest = await request.json();

    if (!body.planId || !body.updates || !Array.isArray(body.updates) || body.updates.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'planId y updates son requeridos'
      }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verificar que el plan pertenece al usuario
    const { data: plan, error: planError } = await supabase
      .from('study_plans')
      .select('id')
      .eq('id', body.planId)
      .eq('user_id', user.id)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ 
        success: false,
        error: 'Plan no encontrado o no autorizado'
      }, { status: 404 });
    }

    // Obtener todas las sesiones del plan con más información para debugging
    const { data: allSessions, error: sessionsError } = await supabase
      .from('study_sessions')
      .select('id, start_time, end_time, plan_id, title')
      .eq('plan_id', body.planId)
      .eq('user_id', user.id)
      .order('start_time', { ascending: true });
    
    console.log(`📋 Sesiones encontradas en el plan: ${allSessions?.length || 0}`);
    if (allSessions && allSessions.length > 0) {
      console.log(`📋 Primeras 5 sesiones:`, allSessions.slice(0, 5).map(s => ({
        id: s.id,
        title: s.title,
        start_time: s.start_time,
        date: new Date(s.start_time).toLocaleDateString('es-ES'),
        hour: new Date(s.start_time).getHours(),
        min: new Date(s.start_time).getMinutes()
      })));
    }

    if (sessionsError) {
      console.error('Error obteniendo sesiones:', sessionsError);
      return NextResponse.json({ 
        success: false,
        error: 'Error al obtener sesiones'
      }, { status: 500 });
    }

    if (!allSessions || allSessions.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'No se encontraron sesiones para actualizar'
      }, { status: 404 });
    }

    // Mapear actualizaciones a sesiones
    let updatedCount = 0;
    const errors: string[] = [];
    
    console.log(`🔄 Procesando ${body.updates.length} actualizaciones...`);

    for (const update of body.updates) {
      console.log(`🔄 Procesando actualización:`, {
        dateStr: update.dateStr,
        originalStartTime: update.originalStartTime,
        newStartTime: update.newStartTime,
        newEndTime: update.newEndTime
      });
      try {
        // Parsear fecha y hora original
        const dateParts = update.dateStr.split('-');
        const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        
        // Parsear hora original
        const originalTimeMatch = update.originalStartTime.match(/(\d{1,2}):(\d{2})/);
        if (!originalTimeMatch) {
          errors.push(`Formato de hora inválido: ${update.originalStartTime}`);
          continue;
        }

        const originalHour = parseInt(originalTimeMatch[1]);
        const originalMin = parseInt(originalTimeMatch[2]);

        // Crear fecha/hora original para comparar
        const originalStartDateTime = new Date(date);
        originalStartDateTime.setHours(originalHour, originalMin, 0, 0);

        // Buscar sesión que coincida con fecha y hora original
        // Normalizar fechas para comparación (solo fecha, sin hora)
        const originalDateOnly = new Date(date);
        originalDateOnly.setHours(0, 0, 0, 0);
        
        // Usar fecha/hora original en UTC para comparación más precisa
        const originalStartISO = originalStartDateTime.toISOString();
        
        console.log(`🔍 Buscando sesión:`, {
          dateStr: update.dateStr,
          originalStartTime: update.originalStartTime,
          originalHour,
          originalMin,
          originalStartISO,
          originalStartDateTime: originalStartDateTime.toLocaleString('es-ES')
        });
        
        const matchingSession = allSessions.find(session => {
          const sessionStart = new Date(session.start_time);
          const sessionDateOnly = new Date(sessionStart);
          sessionDateOnly.setHours(0, 0, 0, 0);
          
          // Comparar fecha (solo día, mes, año) - usar getTime() para evitar problemas de zona horaria
          const sameDate = sessionDateOnly.getTime() === originalDateOnly.getTime();
          
          if (!sameDate) {
            return false;
          }
          
          // Comparar hora (con tolerancia de 1 minuto)
          const sessionHour = sessionStart.getHours();
          const sessionMin = sessionStart.getMinutes();
          
          const hourMatch = sessionHour === originalHour;
          const minMatch = Math.abs(sessionMin - originalMin) <= 1;
          
          const matches = hourMatch && minMatch;
          
          if (matches) {
            console.log(`✅ Sesión candidata encontrada:`, {
              sessionId: session.id,
              sessionStart: session.start_time,
              sessionHour,
              sessionMin,
              originalHour,
              originalMin
            });
          }
          
          return matches;
        });

        if (!matchingSession) {
          // Log detallado para debugging
          console.log(`🔍 No se encontró sesión para:`, {
            dateStr: update.dateStr,
            originalStartTime: update.originalStartTime,
            originalHour,
            originalMin,
            availableSessions: allSessions.map(s => ({
              id: s.id,
              start_time: s.start_time,
              date: new Date(s.start_time).toDateString(),
              hour: new Date(s.start_time).getHours(),
              min: new Date(s.start_time).getMinutes()
            }))
          });
          errors.push(`No se encontró sesión para ${update.dateStr} a las ${update.originalStartTime}`);
          continue;
        }
        
        console.log(`✅ Sesión encontrada:`, {
          sessionId: matchingSession.id,
          originalStart: matchingSession.start_time,
          newStart: `${update.newStartTime}`,
          newEnd: `${update.newEndTime}`
        });

        // Parsear nuevos horarios
        const newStartMatch = update.newStartTime.match(/(\d{1,2}):(\d{2})/);
        const newEndMatch = update.newEndTime.match(/(\d{1,2}):(\d{2})/);
        
        if (!newStartMatch || !newEndMatch) {
          errors.push(`Formato de hora inválido: ${update.newStartTime} o ${update.newEndTime}`);
          continue;
        }

        const newStartHour = parseInt(newStartMatch[1]);
        const newStartMin = parseInt(newStartMatch[2]);
        const newEndHour = parseInt(newEndMatch[1]);
        const newEndMin = parseInt(newEndMatch[2]);

        // Crear nuevas fechas/horas
        const newStartDateTime = new Date(date);
        newStartDateTime.setHours(newStartHour, newStartMin, 0, 0);
        
        const newEndDateTime = new Date(date);
        newEndDateTime.setHours(newEndHour, newEndMin, 0, 0);

        // Validar que endTime sea después de startTime
        if (newEndDateTime <= newStartDateTime) {
          errors.push(`Hora de fin debe ser posterior a hora de inicio para ${update.dateStr}`);
          continue;
        }

        // Actualizar sesión en la BD
        const { error: updateError } = await supabase
          .from('study_sessions')
          .update({
            start_time: newStartDateTime.toISOString(),
            end_time: newEndDateTime.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', matchingSession.id)
          .eq('user_id', user.id);

        if (updateError) {
          console.error(`Error actualizando sesión ${matchingSession.id}:`, updateError);
          errors.push(`Error actualizando sesión para ${update.dateStr}: ${updateError.message}`);
        } else {
          updatedCount++;
          console.log(`✅ Sesión ${matchingSession.id} actualizada: ${update.originalStartTime} → ${update.newStartTime}`);
        }
      } catch (error: any) {
        console.error(`Error procesando actualización para ${update.dateStr}:`, error);
        errors.push(`Error procesando ${update.dateStr}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: updatedCount > 0,
      data: {
        updatedCount,
        totalUpdates: body.updates.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error: any) {
    console.error('Error en PUT /api/study-planner/sessions/update:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Error interno del servidor'
    }, { status: 500 });
  }
}

