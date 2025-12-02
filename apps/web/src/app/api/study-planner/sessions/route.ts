import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';
import { StudySession } from '@aprende-y-aplica/shared';

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
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const supabase = await createClient();

    let query = supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('start_time', { ascending: true });

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

    console.log('🔍 Buscando sesiones para usuario:', currentUser.id);

    const { data: sessions, error: sessionsError } = await query;

    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Error al obtener sesiones', details: sessionsError.message },
        { status: 500 }
      );
    }

    console.log('✅ Sesiones encontradas:', sessions?.length || 0);

    return NextResponse.json({ sessions: sessions || [] });
  } catch (error) {
    console.error('Error in sessions API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

