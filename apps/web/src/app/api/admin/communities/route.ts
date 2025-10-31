import { NextRequest, NextResponse } from 'next/server'
import { AdminCommunitiesService } from '@/features/admin/services/adminCommunities.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { cacheHeaders } from '@/lib/utils/cache-headers'
import { logger } from '@/lib/utils/logger'

/**
 * ✅ ISSUE #19: GET con soporte para paginación cursor-based
 * Query params:
 * - limit: Número de items por página (default: 20, max: 100)
 * - cursor: ID de la última comunidad vista (para siguiente página)
 * - search: Búsqueda por nombre o descripción
 * - visibility: Filtro por visibilidad (public, private)
 * - isActive: Filtro por estado activo (true, false)
 * - paginated: Si es 'false', devuelve todas (legacy behavior)
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    
    // ✅ ISSUE #19: Soporte para paginación (opt-in para mantener compatibilidad)
    const isPaginated = searchParams.get('paginated') !== 'false'

    if (isPaginated) {
      // Modo paginado (nuevo)
      const limit = Math.min(
        parseInt(searchParams.get('limit') || '20'),
        100  // Máximo 100 items por página
      )
      const cursor = searchParams.get('cursor') || undefined
      const search = searchParams.get('search') || undefined
      const visibility = searchParams.get('visibility') || undefined
      const isActive = searchParams.get('isActive') === 'true' 
        ? true 
        : searchParams.get('isActive') === 'false' 
        ? false 
        : undefined

      const result = await AdminCommunitiesService.getCommunitiesPaginated({
        limit,
        cursor,
        search,
        visibility,
        isActive
      })

      // Importar utilidades de cache
      const { withCache, privateCache } = await import('@/core/utils/cache-headers')

      return withCache(
        NextResponse.json(result, { status: 200 }),
        privateCache // No cache - datos de admin (privados)
      )
    } else {
      // Modo sin paginación (legacy - mantener compatibilidad con código existente)
      const communities = await AdminCommunitiesService.getAllCommunities()
      
      // Importar utilidades de cache
      const { withCache, privateCache } = await import('@/core/utils/cache-headers')
      
      return withCache(
        NextResponse.json({ communities }, { status: 200 }),
        privateCache // No cache - datos de admin (privados)
      )
    }
  } catch (error) {
    logger.error('Error fetching admin communities:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Error fetching admin communities',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
