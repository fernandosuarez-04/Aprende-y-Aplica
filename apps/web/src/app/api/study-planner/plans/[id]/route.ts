import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { SessionService } from '@/features/auth/services/session.service';
import type { Database } from '@/lib/supabase/types';

/**
 * DELETE /api/study-planner/plans/[id]
 * Elimina un plan de estudio
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
      .select('id, user_id, name')
      .eq('id', planId)
      .eq('user_id', currentUser.id)
      .single();

    if (planError || !plan) {
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

    // Eliminar todas las sesiones del plan primero
    const { error: deleteSessionsError } = await supabaseAdmin
      .from('study_sessions')
      .delete()
      .eq('plan_id', planId);

    if (deleteSessionsError) {
      console.error('⚠️ Error eliminando sesiones:', deleteSessionsError);
      // Continuar de todas formas
    }

    // Eliminar el plan
    const { error: deleteError } = await supabaseAdmin
      .from('study_plans')
      .delete()
      .eq('id', planId);

    if (deleteError) {
      console.error('❌ Error eliminando plan:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar el plan', details: deleteError.message },
        { status: 500 }
      );
    }

    console.log('✅ Plan eliminado:', {
      planId,
      sessionsDeleted: sessionsCount || 0,
    });

    return NextResponse.json({
      success: true,
      message: `Plan "${plan.name}" eliminado correctamente`,
      sessionsDeleted: sessionsCount || 0,
    });
  } catch (error: any) {
    console.error('Error deleting plan:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/study-planner/plans/[id]
 * Actualiza un plan de estudio
 */
export async function PATCH(
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
    const body = await request.json();

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
    const { data: existingPlan, error: planError } = await supabaseAdmin
      .from('study_plans')
      .select('id, user_id')
      .eq('id', planId)
      .eq('user_id', currentUser.id)
      .single();

    if (planError || !existingPlan) {
      return NextResponse.json(
        { error: 'Plan no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    // Preparar datos para actualizar
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) {
      if (!body.name || body.name.trim().length === 0) {
        return NextResponse.json(
          { error: 'El nombre del plan no puede estar vacío' },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }

    if (body.goal_hours_per_week !== undefined) {
      updateData.goal_hours_per_week = parseFloat(String(body.goal_hours_per_week));
    }

    if (body.start_date !== undefined) {
      updateData.start_date = body.start_date || null;
    }

    if (body.end_date !== undefined) {
      updateData.end_date = body.end_date || null;
    }

    if (body.preferred_days !== undefined) {
      if (!Array.isArray(body.preferred_days) || body.preferred_days.length === 0) {
        return NextResponse.json(
          { error: 'Debes seleccionar al menos un día de la semana' },
          { status: 400 }
        );
      }
      
      const validDays = body.preferred_days
        .map((day: any) => parseInt(String(day), 10))
        .filter((day: number) => !isNaN(day) && day >= 0 && day <= 6);
      
      if (validDays.length === 0) {
        return NextResponse.json(
          { error: 'Los días seleccionados no son válidos' },
          { status: 400 }
        );
      }
      
      updateData.preferred_days = validDays;
    }

    if (body.preferred_time_blocks !== undefined) {
      updateData.preferred_time_blocks = Array.isArray(body.preferred_time_blocks) 
        ? body.preferred_time_blocks 
        : [];
    }

    if (body.preferred_session_type !== undefined) {
      if (!['short', 'medium', 'long'].includes(body.preferred_session_type)) {
        return NextResponse.json(
          { error: 'Tipo de sesión inválido' },
          { status: 400 }
        );
      }
      updateData.preferred_session_type = body.preferred_session_type;
    }

    // Actualizar el plan
    const { data: updatedPlan, error: updateError } = await supabaseAdmin
      .from('study_plans')
      .update(updateData)
      .eq('id', planId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error actualizando plan:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar el plan', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('✅ Plan actualizado:', planId);

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
    });
  } catch (error: any) {
    console.error('Error updating plan:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

