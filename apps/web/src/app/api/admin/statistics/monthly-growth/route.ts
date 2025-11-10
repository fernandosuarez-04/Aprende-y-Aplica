import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { AdminStatisticsService } from '../../../../../features/admin/services/adminStatistics.service'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/admin/statistics/monthly-growth
 * Obtener datos de crecimiento mensual
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { searchParams } = new URL(request.url)
    const period = parseInt(searchParams.get('period') || '8', 10)
    
    // Validar período (1-12 meses)
    const validPeriod = Math.max(1, Math.min(12, period))
    
    const data = await AdminStatisticsService.getMonthlyGrowth(validPeriod)
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('Error in monthly-growth API:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener datos de crecimiento mensual' },
      { status: 500 }
    )
  }
}

