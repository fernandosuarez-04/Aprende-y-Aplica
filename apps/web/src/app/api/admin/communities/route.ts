import { NextResponse } from 'next/server'
import { AdminCommunitiesService } from '@/features/admin/services/adminCommunities.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET() {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const communities = await AdminCommunitiesService.getAllCommunities()
    return NextResponse.json({ communities }, { status: 200 })
  } catch (error) {
    console.error('Error fetching admin communities:', error)
    return NextResponse.json({ message: 'Error fetching admin communities' }, { status: 500 })
  }
}
