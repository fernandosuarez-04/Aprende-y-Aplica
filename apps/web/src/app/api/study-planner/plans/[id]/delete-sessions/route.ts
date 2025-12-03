import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { SessionService } from '@/features/auth/services/session.service';
import type { Database } from '@/lib/supabase/types';

/**
 * DELETE /api/study-planner/plans/[id]/delete-sessions
 * Elimina todas las sesiones de estudio de un plan
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await SessionService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id: planId } = await params;

    // Crear cliente con Service Role Key para bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variables de entorno faltantes');
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verificar que el plan pertenece al usuario
    const { data: plan, error: planError } = await supabaseAdmin
      .from('study_plans')
      .select('id, user_id')
      .eq('id', planId)
      .eq('user_id', currentUser.id)
      .single();

    if (planError || !plan) {
      console.error('❌ Error obteniendo plan:', planError);
      return NextResponse.json(
        { error: 'Plan no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    // Contar sesiones antes de eliminar
    const { count: sessionsCount } = await supabaseAdmin
      .from('study_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('plan_id', planId);

    // Eliminar todas las sesiones del plan
    const { error: deleteError } = await supabaseAdmin
      .from('study_sessions')
      .delete()
      .eq('plan_id', planId);

    if (deleteError) {
      console.error('❌ Error eliminando sesiones:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar las sesiones', details: deleteError.message },
        { status: 500 }
      );
    }

    console.log('✅ Sesiones eliminadas:', {
      planId,
      sessionsDeleted: sessionsCount || 0,
    });

    return NextResponse.json({
      success: true,
      message: `Se eliminaron ${sessionsCount || 0} sesión(es) del plan`,
      sessionsDeleted: sessionsCount || 0,
    });
  } catch (error: any) {
    console.error('Error deleting sessions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

