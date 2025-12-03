import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { SessionService } from '@/features/auth/services/session.service';
import type { Database } from '@/lib/supabase/types';

/**
 * DELETE /api/study-planner/routes/[id]
 * Elimina una ruta de aprendizaje
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

    const { id: routeId } = await params;

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

    // Verificar que la ruta pertenece al usuario
    console.log('🔍 Buscando ruta:', {
      routeId,
      userId: currentUser.id,
      userIdType: typeof currentUser.id,
    });

    // Primero verificar si la ruta existe
    const { data: routeExists, error: checkError } = await supabaseAdmin
      .from('learning_routes')
      .select('id, user_id, name')
      .eq('id', routeId)
      .single();

    if (checkError || !routeExists) {
      console.error('❌ Ruta no encontrada:', {
        routeId,
        error: checkError?.message,
      });
      return NextResponse.json(
        { error: 'Ruta no encontrada', details: 'La ruta especificada no existe' },
        { status: 404 }
      );
    }

    // Verificar que pertenece al usuario
    if (routeExists.user_id !== currentUser.id) {
      console.error('❌ Ruta no autorizada:', {
        routeId,
        routeUserId: routeExists.user_id,
        currentUserId: currentUser.id,
        match: routeExists.user_id === currentUser.id,
      });
      return NextResponse.json(
        { error: 'No autorizado', details: 'Esta ruta no pertenece a tu cuenta' },
        { status: 403 }
      );
    }

    const route = routeExists;

    // Verificar si hay planes asociados a esta ruta
    const { data: plansWithRoute } = await supabaseAdmin
      .from('study_plans')
      .select('id, name')
      .eq('learning_route_id', routeId)
      .limit(1);

    if (plansWithRoute && plansWithRoute.length > 0) {
      return NextResponse.json(
        { 
          error: 'No se puede eliminar la ruta porque tiene planes de estudio asociados',
          details: `Hay ${plansWithRoute.length} plan(es) asociado(s) a esta ruta. Elimina los planes primero.`
        },
        { status: 400 }
      );
    }

    // Eliminar cursos asociados a la ruta
    const { error: deleteCoursesError } = await supabaseAdmin
      .from('learning_route_courses')
      .delete()
      .eq('route_id', routeId);

    if (deleteCoursesError) {
      console.error('⚠️ Error eliminando cursos de la ruta:', deleteCoursesError);
      // Continuar de todas formas
    }

    // Eliminar la ruta
    const { error: deleteError } = await supabaseAdmin
      .from('learning_routes')
      .delete()
      .eq('id', routeId);

    if (deleteError) {
      console.error('❌ Error eliminando ruta:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar la ruta', details: deleteError.message },
        { status: 500 }
      );
    }

    console.log('✅ Ruta eliminada:', routeId);

    return NextResponse.json({
      success: true,
      message: `Ruta "${route.name}" eliminada correctamente`,
    });
  } catch (error: any) {
    console.error('Error deleting route:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/study-planner/routes/[id]
 * Actualiza una ruta de aprendizaje
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

    const { id: routeId } = await params;
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

    // Verificar que la ruta pertenece al usuario
    const { data: existingRoute, error: routeError } = await supabaseAdmin
      .from('learning_routes')
      .select('id, user_id')
      .eq('id', routeId)
      .eq('user_id', currentUser.id)
      .single();

    if (routeError || !existingRoute) {
      return NextResponse.json(
        { error: 'Ruta no encontrada o no autorizada' },
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
          { error: 'El nombre de la ruta no puede estar vacío' },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }

    if (body.is_active !== undefined) {
      updateData.is_active = body.is_active;
    }

    // Actualizar la ruta
    const { data: updatedRoute, error: updateError } = await supabaseAdmin
      .from('learning_routes')
      .update(updateData)
      .eq('id', routeId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error actualizando ruta:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar la ruta', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('✅ Ruta actualizada:', routeId);

    return NextResponse.json({
      success: true,
      route: updatedRoute,
    });
  } catch (error: any) {
    console.error('Error updating route:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
