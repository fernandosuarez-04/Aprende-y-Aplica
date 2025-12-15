/**
 * API Endpoint: Get Study Sessions
 * 
 * GET /api/study-planner/sessions
 * 
 * Obtiene las sesiones de estudio del usuario en un rango de fechas
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../features/auth/services/session.service';
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

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ 
        error: 'No autorizado',
        sessions: []
      }, { status: 401 });
    }

    // Obtener parámetros de fecha
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (!startDateParam || !endDateParam) {
      return NextResponse.json({ 
        error: 'Faltan parámetros startDate y endDate',
        sessions: []
      }, { status: 400 });
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    // Obtener sesiones de estudio del usuario en el rango de fechas
    const supabase = createAdminClient();
    
    // Primero verificar si el usuario tiene un plan activo
    const { data: activePlan, error: planError } = await supabase
      .from('study_plans')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // Si no hay plan activo, retornar array vacío
    if (planError || !activePlan) {
      return NextResponse.json({ 
        sessions: [],
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalSessions: 0,
        hasActivePlan: false
      });
    }
    
    // Solo obtener sesiones que pertenezcan al plan activo
    const { data: sessions, error } = await supabase
      .from('study_sessions')
      .select(`
        id,
        title,
        description,
        start_time,
        end_time,
        status,
        course_id,
        lesson_id,
        is_ai_generated,
        session_type
      `)
      .eq('user_id', user.id)
      .eq('plan_id', activePlan.id)
      .gte('start_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error obteniendo sesiones de estudio:', error);
      return NextResponse.json({ 
        error: 'Error al obtener sesiones',
        sessions: []
      }, { status: 500 });
    }

    return NextResponse.json({ 
      sessions: sessions || [],
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalSessions: sessions?.length || 0
    });

  } catch (error: any) {
    console.error('Error en GET /api/study-planner/sessions:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor',
      sessions: []
    }, { status: 500 });
  }
}

