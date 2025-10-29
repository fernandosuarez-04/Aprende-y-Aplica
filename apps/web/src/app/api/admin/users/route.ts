import { NextResponse } from 'next/server'
import { AdminUsersService } from '@/features/admin/services/adminUsers.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET() {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    console.log('🔄 Cargando usuarios desde API...')
    
    const [users, stats] = await Promise.all([
      AdminUsersService.getUsers(),
      AdminUsersService.getUserStats()
    ])

    console.log('✅ Usuarios cargados:', users?.length || 0)

    return NextResponse.json({
      success: true,
      users: users || [],
      stats: stats || {}
    })
  } catch (error) {
    console.error('💥 Error in /api/admin/users:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener usuarios',
        users: []
      },
      { status: 500 }
    )
  }
}
