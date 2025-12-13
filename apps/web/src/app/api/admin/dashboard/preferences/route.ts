import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { AdminDashboardPreferencesService } from '../../../../../features/admin/services/adminDashboardPreferences.service'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/admin/dashboard/preferences
 * Obtener preferencias del admin
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const preferences = await AdminDashboardPreferencesService.getPreferences(auth.userId)
    
    return NextResponse.json({ success: true, preferences })
  } catch (error) {
    logger.error('Error in dashboard preferences GET:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener preferencias del dashboard' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/dashboard/preferences
 * Guardar/actualizar preferencias del admin
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const body = await request.json()
    const { activity_period, growth_chart_metrics } = body
    
    // Validar activity_period
    if (activity_period && !['24h', '7d', '30d'].includes(activity_period)) {
      return NextResponse.json(
        { success: false, error: 'Período de actividad inválido' },
        { status: 400 }
      )
    }
    
    // Validar growth_chart_metrics
    if (growth_chart_metrics && !Array.isArray(growth_chart_metrics)) {
      return NextResponse.json(
        { success: false, error: 'growth_chart_metrics debe ser un array' },
        { status: 400 }
      )
    }
    
    const preferences = await AdminDashboardPreferencesService.savePreferences(auth.userId, {
      activity_period,
      growth_chart_metrics
    })
    
    return NextResponse.json({ success: true, preferences })
  } catch (error) {
    logger.error('Error in dashboard preferences POST:', error)
    return NextResponse.json(
      { success: false, error: 'Error al guardar preferencias del dashboard' },
      { status: 500 }
    )
  }
}

