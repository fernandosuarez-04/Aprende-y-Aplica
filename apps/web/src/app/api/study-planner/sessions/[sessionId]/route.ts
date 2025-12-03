import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { SessionService } from '@/features/auth/services/session.service';
import type { Database } from '@/lib/supabase/types';

/**
 * PATCH /api/study-planner/sessions/[sessionId]
 * Actualiza una sesión de estudio
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const currentUser = await SessionService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { sessionId } = await params;
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

    // Verificar que la sesión pertenece al usuario
    const { data: existingSession, error: fetchError } = await supabaseAdmin
      .from('study_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .eq('user_id', currentUser.id)
      .single();

    if (fetchError || !existingSession) {
      return NextResponse.json(
        { error: 'Sesión no encontrada o no autorizada' },
        { status: 404 }
      );
    }

    // Preparar datos para actualizar (solo campos permitidos)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.status) {
      updateData.status = body.status;
      
      // Si se marca como completada, agregar completed_at
      if (body.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }

    if (body.actual_duration_minutes !== undefined) {
      updateData.actual_duration_minutes = body.actual_duration_minutes;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    // Actualizar la sesión
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('study_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error actualizando sesión:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar la sesión', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('✅ Sesión actualizada:', {
      sessionId,
      status: updatedSession?.status,
    });

    return NextResponse.json({ 
      success: true,
      session: updatedSession 
    });
  } catch (error: any) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/study-planner/sessions/[sessionId]
 * Obtiene una sesión específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const currentUser = await SessionService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { sessionId } = await params;

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

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('study_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', currentUser.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ session });
  } catch (error: any) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

