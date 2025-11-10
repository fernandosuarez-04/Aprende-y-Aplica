import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { AdminDashboardLayoutService } from '../../../../../features/admin/services/adminDashboardLayout.service'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/admin/dashboard/layout
 * Obtener layout personalizado del admin actual
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const layout = await AdminDashboardLayoutService.getLayout(auth.userId)
    
    return NextResponse.json({ success: true, layout })
  } catch (error) {
    logger.error('Error in dashboard layout GET:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener layout del dashboard' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/dashboard/layout
 * Guardar/actualizar layout personalizado
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const body = await request.json()
    const { name, layout_config, is_default } = body
    
    if (!name || !layout_config) {
      return NextResponse.json(
        { success: false, error: 'Nombre y configuración de layout son requeridos' },
        { status: 400 }
      )
    }
    
    const layout = await AdminDashboardLayoutService.saveLayout(auth.userId, {
      name,
      layout_config,
      is_default: is_default !== undefined ? is_default : true
    })
    
    return NextResponse.json({ success: true, layout })
  } catch (error) {
    logger.error('Error in dashboard layout POST:', error)
    return NextResponse.json(
      { success: false, error: 'Error al guardar layout del dashboard' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/dashboard/layout
 * Restaurar layout por defecto
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    await AdminDashboardLayoutService.resetLayout(auth.userId)
    
    return NextResponse.json({ success: true, message: 'Layout restaurado a valores por defecto' })
  } catch (error) {
    logger.error('Error in dashboard layout DELETE:', error)
    return NextResponse.json(
      { success: false, error: 'Error al restaurar layout' },
      { status: 500 }
    )
  }
}

