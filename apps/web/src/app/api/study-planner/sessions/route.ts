import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { SessionService } from '@/features/auth/services/session.service';
import { StudySession } from '@aprende-y-aplica/shared';
import type { Database } from '@/lib/supabase/types';

/**
 * GET /api/study-planner/sessions
 * Obtiene todas las sesiones de estudio del usuario
 * Query params:
 * - plan_id: Filtrar por plan específico
 * - status: Filtrar por estado (planned, in_progress, completed, cancelled, skipped)
 * - start_date: Fecha de inicio (ISO)
 * - end_date: Fecha de fin (ISO)
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await SessionService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('plan_id');
    const sessionId = searchParams.get('session_id');
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Crear cliente con Service Role Key para bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variables de entorno faltantes para leer sesiones');
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta' },
        { status: 500 }
      );
    }

    // Cliente con Service Role Key para leer (bypass RLS)
    const supabaseAdmin = createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    let query = supabaseAdmin
      .from('study_sessions')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('start_time', { ascending: true });

    if (sessionId) {
      query = query.eq('id', sessionId);
    }

    if (planId) {
      query = query.eq('plan_id', planId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('start_time', startDate);
    }

    if (endDate) {
      query = query.lte('start_time', endDate);
    }

    console.log('🔍 Buscando sesiones para usuario:', {
      userId: currentUser.id,
      planId: planId || 'todos',
      status: status || 'todos',
      startDate: startDate || 'sin límite',
      endDate: endDate || 'sin límite',
    });

    const { data: sessions, error: sessionsError } = await query;

    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Error al obtener sesiones', details: sessionsError.message },
        { status: 500 }
      );
    }

    console.log('✅ Sesiones encontradas:', {
      count: sessions?.length || 0,
      sample: sessions && sessions.length > 0 ? {
        id: sessions[0].id,
        title: sessions[0].title,
        start_time: sessions[0].start_time,
        plan_id: sessions[0].plan_id,
        status: sessions[0].status,
      } : null,
    });

    return NextResponse.json({ sessions: sessions || [] });
  } catch (error) {
    console.error('Error in sessions API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

