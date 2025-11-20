import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { ProfileServerService } from '../../../../features/profile/services/profile-server.service'
import { SessionService } from '../../../../features/auth/services/session.service'

export async function GET(request: NextRequest) {
  try {
    // Usar SessionService para obtener el usuario actual
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [stats, subscriptions] = await Promise.all([
      ProfileServerService.getUserStats(user.id),
      ProfileServerService.getUserSubscriptions(user.id)
    ])

    return NextResponse.json({
      ...stats,
      subscriptions
    })
  } catch (error) {
    logger.error('Error in profile stats GET API:', error)
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

