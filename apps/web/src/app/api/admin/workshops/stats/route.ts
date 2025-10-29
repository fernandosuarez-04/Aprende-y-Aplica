import { NextResponse } from 'next/server'
import { AdminWorkshopsService } from '@/features/admin/services/adminWorkshops.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const stats = await AdminWorkshopsService.getWorkshopStats()
    return NextResponse.json({ stats }, { status: 200 })
  } catch (error) {
    console.error('Error fetching workshop stats:', error)
    return NextResponse.json({ message: 'Error fetching workshop stats' }, { status: 500 })
  }
}
