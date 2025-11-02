import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { BusinessUsersServerService } from '@/features/business-panel/services/businessUsers.server.service'
import { requireBusiness } from '@/lib/auth/requireBusiness'

export async function GET() {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth
    
    if (!auth.organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes una organización asignada'
        },
        { status: 403 }
      )
    }
    
    const stats = await BusinessUsersServerService.getOrganizationStats(auth.organizationId)

    return NextResponse.json({
      success: true,
      stats: stats || {}
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/users/stats:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener estadísticas'
      },
      { status: 500 }
    )
  }
}

