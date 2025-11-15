import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { AdminStatisticsService } from '../../../../../features/admin/services/adminStatistics.service'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/admin/statistics/recent-activity
 * Obtener actividad reciente
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '24h'
    
    // Validar período
    const validPeriod = ['24h', '7d', '30d'].includes(period) ? period : '24h'
    
    const data = await AdminStatisticsService.getRecentActivity(validPeriod)
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('Error in recent-activity API:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener actividad reciente' },
      { status: 500 }
    )
  }
}

