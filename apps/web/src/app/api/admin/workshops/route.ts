import { NextResponse } from 'next/server'
import { AdminWorkshopsService } from '@/features/admin/services/adminWorkshops.service'

export async function GET() {
  try {
    const workshops = await AdminWorkshopsService.getAllWorkshops()
    return NextResponse.json({ workshops }, { status: 200 })
  } catch (error) {
    console.error('Error fetching admin workshops:', error)
    return NextResponse.json({ message: 'Error fetching admin workshops' }, { status: 500 })
  }
}
