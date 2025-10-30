import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { AdminUsersService } from '@/features/admin/services/adminUsers.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET() {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    logger.log('🔄 Cargando usuarios desde API...')
    
    const [users, stats] = await Promise.all([
      AdminUsersService.getUsers(),
      AdminUsersService.getUserStats()
    ])

    logger.log('✅ Usuarios cargados:', users?.length || 0)

    return NextResponse.json({
      success: true,
      users: users || [],
      stats: stats || {}
    })
  } catch (error) {
    logger.error('💥 Error in /api/admin/users:', error)
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
