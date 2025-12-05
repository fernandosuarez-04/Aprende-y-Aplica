import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * Verifica si el usuario actual tiene un plan de estudios creado
 * GET /api/study-planner/plans/check
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener el usuario actual usando el sistema de sesiones
    const currentUser = await SessionService.getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, hasPlan: false, error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Verificar si el usuario tiene un plan de estudios
    const { data: plans, error: plansError } = await supabase
      .from('study_plans')
      .select('id, name, created_at')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (plansError) {
      console.error('Error al verificar planes:', plansError);
      return NextResponse.json(
        { success: false, hasPlan: false, error: 'Error al verificar planes' },
        { status: 500 }
      );
    }

    const hasPlan = plans && plans.length > 0;

    return NextResponse.json({
      success: true,
      hasPlan,
      plan: hasPlan ? plans[0] : null,
    });
  } catch (error) {
    console.error('Error en check plan:', error);
    return NextResponse.json(
      { success: false, hasPlan: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}





