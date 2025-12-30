import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SessionService } from '../../../features/auth/services/session.service';
import type { Database } from '../../../lib/supabase/types';

// Crear cliente admin para bypass RLS si es necesario
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Variables de Supabase no configuradas');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// GET: Verificar si el usuario ya vio un tour específico
export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autenticación usando SessionService (soporta legacy + refresh tokens)
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Obtener el tour_id
    const { searchParams } = new URL(request.url);
    const tourId = searchParams.get('tourId');

    if (!tourId) {
      return NextResponse.json({ error: 'tourId es requerido' }, { status: 400 });
    }

    // 3. Consultar DB con cliente admin
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('user_tour_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('tour_id', tourId)
      .maybeSingle(); // Usar maybeSingle es más limpio que catch error

    if (error) {
      console.error('Error al verificar tour:', error);
      return NextResponse.json({ error: 'Error al verificar tour' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      hasSeenTour: !!data,
      tourProgress: data || null
    });
  } catch (error) {
    console.error('Error en GET /api/tours:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST: Registrar progreso del tour
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { tourId, action, stepReached } = body;

    if (!tourId || !action) {
      return NextResponse.json({ error: 'tourId y action son requeridos' }, { status: 400 });
    }

    // Validar acción
    const validActions = ['start', 'step', 'complete', 'skip'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    }

    // 3. Operar DB con cliente admin
    const supabase = createAdminClient();

    // Buscar registro existente
    const { data: existing } = await supabase
      .from('user_tour_progress')
      .select('id, step_reached')
      .eq('user_id', user.id)
      .eq('tour_id', tourId)
      .maybeSingle();

    let result;

    if (existing) {
      // Actualizar registro existente
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      if (action === 'complete') {
        updateData.completed_at = new Date().toISOString();
      } else if (action === 'skip') {
        updateData.skipped_at = new Date().toISOString();
      }

      if (stepReached !== undefined && stepReached > (existing.step_reached || 0)) {
        updateData.step_reached = stepReached;
      }

      result = await supabase
        .from('user_tour_progress')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Crear nuevo registro
      const insertData: Record<string, unknown> = {
        user_id: user.id,
        tour_id: tourId,
        step_reached: stepReached || 0
      };

      if (action === 'complete') {
        insertData.completed_at = new Date().toISOString();
      } else if (action === 'skip') {
        insertData.skipped_at = new Date().toISOString();
      }

      result = await supabase
        .from('user_tour_progress')
        .insert(insertData)
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error al guardar progreso del tour:', result.error);
      return NextResponse.json({ error: 'Error al guardar progreso' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tourProgress: result.data
    });
  } catch (error) {
    console.error('Error en POST /api/tours:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
