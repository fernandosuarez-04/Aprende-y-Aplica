import { NextResponse } from 'next/server'
import { AdminStatsService } from '../../../../features/admin/services/adminStats.service'

export async function GET() {
  try {
    const stats = await AdminStatsService.getStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error in admin stats API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
