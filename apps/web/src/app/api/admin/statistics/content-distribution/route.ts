import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { AdminStatisticsService } from '../../../../../features/admin/services/adminStatistics.service'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/admin/statistics/content-distribution
 * Obtener distribución de contenido
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const data = await AdminStatisticsService.getContentDistribution()
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('Error in content-distribution API:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener distribución de contenido' },
      { status: 500 }
    )
  }
}

