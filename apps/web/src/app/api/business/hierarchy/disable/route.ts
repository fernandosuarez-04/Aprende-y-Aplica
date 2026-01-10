import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/business/hierarchy/disable
 * Desactiva la jerarquía (vuelve a modo plano)
 */
export async function POST() {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      );
    }

    // Solo el owner o admin puede desactivar la jerarquía
    if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Solo el propietario o administrador puede desactivar la jerarquía' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Desactivar la jerarquía
    const { error } = await supabase
      .from('organizations')
      .update({ hierarchy_enabled: false })
      .eq('id', auth.organizationId);

    if (error) {
      logger.error('Error desactivando jerarquía:', error);
      return NextResponse.json(
        { success: false, error: 'Error al desactivar la jerarquía' },
        { status: 500 }
      );
    }

    logger.info('Jerarquía desactivada para organización:', auth.organizationId);

    return NextResponse.json({
      success: true,
      enabled: false,
      message: 'Jerarquía desactivada. La estructura se mantiene pero no se aplican restricciones.'
    });
  } catch (error) {
    logger.error('Error en POST /api/business/hierarchy/disable:', error);
    return NextResponse.json(
      { success: false, error: 'Error al desactivar la jerarquía' },
      { status: 500 }
    );
  }
}
