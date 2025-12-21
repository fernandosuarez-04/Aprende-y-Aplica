
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * GET /api/study-planner/status
 * 
 * Verifica si el usuario actual tiene un plan de estudio activo.
 * Retorna { hasPlan: boolean, planId?: string }
 */
export async function GET(request: NextRequest) {
    try {
        const user = await SessionService.getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'No autenticado' },
                { status: 401 }
            );
        }

        const supabase = createClient();

        // Consultar el plan más reciente del usuario
        const { data: plans, error } = await supabase
            .from('study_plans')
            .select('id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Error verificando estado del plan de estudio:', error);
            return NextResponse.json(
                { success: false, error: 'Error al verificar estado del plan' },
                { status: 500 }
            );
        }

        const hasPlan = plans && plans.length > 0;

        return NextResponse.json({
            success: true,
            hasPlan,
            planId: hasPlan ? plans[0].id : null
        });

    } catch (error) {
        console.error('Error interno en status de study planner:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
