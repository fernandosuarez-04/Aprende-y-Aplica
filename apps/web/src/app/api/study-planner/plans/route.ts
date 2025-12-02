import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';
import { StudyPlan } from '@aprende-y-aplica/shared';

/**
 * GET /api/study-planner/plans
 * Obtiene todos los planes de estudio del usuario
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

    const supabase = await createClient();

    console.log('🔍 Buscando planes para usuario:', {
      userId: currentUser.id,
      userIdType: typeof currentUser.id,
      userIdLength: currentUser.id?.length,
      userIdTrimmed: currentUser.id?.trim(),
    });

    // Verificar si el user_id coincide exactamente
    const userIdToSearch = String(currentUser.id).trim();
    console.log('🔍 User ID a buscar (trimmed):', userIdToSearch);

    // Primero, verificar si hay planes sin filtrar para debug
    const { data: allPlans, error: allPlansError } = await supabase
      .from('study_plans')
      .select('id, user_id, name')
      .limit(10);

    console.log('📊 Todos los planes (primeras 10):', allPlans?.map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      user_id_type: typeof p.user_id,
      user_id_length: p.user_id?.length,
      name: p.name,
    })));

    // Obtener planes del usuario - usar ID con trim para asegurar coincidencia
    const { data: plans, error: plansError } = await supabase
      .from('study_plans')
      .select('*')
      .eq('user_id', userIdToSearch)
      .order('created_at', { ascending: false });

    console.log('🔍 Query ejecutada:', {
      userId: currentUser.id,
      plansFound: plans?.length || 0,
      error: plansError?.message,
    });

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError);
      return NextResponse.json(
        { error: 'Error al obtener planes', details: plansError.message },
        { status: 500 }
      );
    }

    console.log('✅ Planes encontrados:', plans?.length || 0);
    if (plans && plans.length > 0) {
      console.log('📋 Planes:', plans.map((p: any) => ({
        id: p.id,
        name: p.name,
        user_id: p.user_id,
        created_at: p.created_at,
      })));
    }

    return NextResponse.json({ plans: plans || [] });
  } catch (error) {
    console.error('Error in plans API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

