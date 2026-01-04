import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { AdminStatsService } from '../../../../features/admin/services/adminStats.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { withCacheHeaders, cacheHeaders } from '@/lib/utils/cache-headers'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const stats = await AdminStatsService.getStats()

    // OPTIMIZADO: Agregar cache para estadísticas admin
    // Las estadísticas no cambian cada segundo, cache de 1 minuto reduce carga
    return withCacheHeaders(
      NextResponse.json(stats),
      cacheHeaders.dynamic // Cache 30 seg - estadísticas cambian frecuentemente pero no cada request
    )
  } catch (error) {
    logger.error('Error in admin stats API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
