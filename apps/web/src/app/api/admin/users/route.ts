import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { AdminUsersService } from '@/features/admin/services/adminUsers.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    // 🚀 OPTIMIZACIÓN: Soporte para paginación
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || undefined

    logger.log('🔄 Cargando usuarios desde API...', { page, limit, search })

    const [result, stats] = await Promise.all([
      AdminUsersService.getUsers({ page, limit, search }),
      AdminUsersService.getUserStats()
    ])

    logger.log('✅ Usuarios cargados:', result.users?.length || 0, 'de', result.total)

    return NextResponse.json({
      success: true,
      users: result.users || [],
      total: result.total || 0,
      page: result.page || 1,
      totalPages: result.totalPages || 1,
      stats: stats || {}
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60'
      }
    })
  } catch (error) {
    // Log detallado del error
 console.error(' Error in /api/admin/users:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      error
    })
    logger.error('💥 Error in /api/admin/users:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener usuarios',
        details: error instanceof Error ? error.message : 'Error desconocido',
        users: [],
        total: 0
      },
      { status: 500 }
    )
  }
}
