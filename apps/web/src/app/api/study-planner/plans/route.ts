import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { SessionService } from '@/features/auth/services/session.service';
import { StudyPlan } from '@aprende-y-aplica/shared';
import type { Database } from '@/lib/supabase/types';

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

    // Crear cliente con Service Role Key para bypass RLS
    // Esto es necesario porque el proyecto usa autenticación personalizada
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variables de entorno faltantes para leer planes');
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

    console.log('🔍 Buscando planes para usuario:', {
      userId: currentUser.id,
      userIdType: typeof currentUser.id,
      userIdLength: currentUser.id?.length,
      userIdTrimmed: currentUser.id?.trim(),
    });

    // Verificar si el user_id coincide exactamente
    const userIdToSearch = String(currentUser.id).trim();
    console.log('🔍 User ID a buscar (trimmed):', userIdToSearch);

    // Obtener planes del usuario usando cliente admin (bypass RLS)
    const { data: plans, error: plansError } = await supabaseAdmin
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
        preferred_days: p.preferred_days,
        preferred_days_type: typeof p.preferred_days,
      })));
    }

    // Parsear preferred_days si vienen como strings desde la BD
    const parsedPlans = (plans || []).map((plan: any) => {
      if (plan.preferred_days && Array.isArray(plan.preferred_days)) {
        plan.preferred_days = plan.preferred_days.map((day: any) => {
          const parsed = parseInt(String(day), 10);
          return isNaN(parsed) ? day : parsed;
        });
      }
      return plan;
    });

    return NextResponse.json({ plans: parsedPlans });
  } catch (error) {
    console.error('Error in plans API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

