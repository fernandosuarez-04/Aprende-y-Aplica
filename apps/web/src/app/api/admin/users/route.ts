import { NextResponse } from 'next/server'
import { AdminUsersService } from '@/features/admin/services/adminUsers.service'

export async function GET() {
  try {
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
