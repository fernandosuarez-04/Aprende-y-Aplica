import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { BusinessUsersServerService } from '@/features/business-panel/services/businessUsers.server.service'
import { requireBusiness } from '@/lib/auth/requireBusiness'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    const { userId } = await params
    
    await BusinessUsersServerService.suspendUser(
      auth.organizationId,
      userId
    )

    return NextResponse.json({
      success: true,
      message: 'Usuario suspendido exitosamente'
    })
  } catch (error) {
    logger.error('💥 Error in suspend:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Error al suspender usuario'
      },
      { status: 500 }
    )
  }
}

