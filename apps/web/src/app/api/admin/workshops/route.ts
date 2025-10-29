import { NextResponse } from 'next/server'
import { AdminWorkshopsService } from '@/features/admin/services/adminWorkshops.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET() {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const workshops = await AdminWorkshopsService.getAllWorkshops()
    return NextResponse.json({ workshops }, { status: 200 })
  } catch (error) {
    console.error('Error fetching admin workshops:', error)
    return NextResponse.json({ message: 'Error fetching admin workshops' }, { status: 500 })
  }
}
