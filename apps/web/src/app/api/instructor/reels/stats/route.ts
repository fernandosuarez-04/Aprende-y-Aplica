import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'
import { requireInstructor } from '@/lib/auth/requireAdmin'

/**
 * GET /api/instructor/reels/stats
 * Obtiene estadísticas de reels del instructor actual
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de instructor
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()
    const instructorId = auth.userId

    logger.log('🔄 Obteniendo estadísticas de reels del instructor:', instructorId)

    // Obtener solo los reels del instructor actual
    const { data: allReels, error: reelsError } = await supabase
      .from('reels')
      .select('id, is_active, is_featured, view_count, like_count, share_count, comment_count, created_at')
      .eq('created_by', instructorId) // ✅ Solo reels del instructor actual

    if (reelsError) {
      logger.error('❌ Error fetching instructor reels for stats:', reelsError)
      return NextResponse.json(
        { error: 'Failed to fetch reels stats' },
        { status: 500 }
      )
    }

    // Calcular estadísticas solo para los reels del instructor
    const totalReels = allReels?.length || 0
    const activeReels = allReels?.filter(reel => reel.is_active).length || 0
    const featuredReels = allReels?.filter(reel => reel.is_featured).length || 0

    // Calcular totales de vistas, likes, shares y comentarios
    const totalViews = allReels?.reduce((sum, reel) => sum + (reel.view_count || 0), 0) || 0
    const totalLikes = allReels?.reduce((sum, reel) => sum + (reel.like_count || 0), 0) || 0
    const totalShares = allReels?.reduce((sum, reel) => sum + (reel.share_count || 0), 0) || 0
    const totalComments = allReels?.reduce((sum, reel) => sum + (reel.comment_count || 0), 0) || 0

    // Calcular crecimiento (comparar este mes con el mes pasado)
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    const thisMonthReels = allReels?.filter(reel => 
      new Date(reel.created_at) >= thisMonthStart
    ).length || 0

    const lastMonthReels = allReels?.filter(reel => {
      const createdAt = new Date(reel.created_at)
      return createdAt >= lastMonthStart && createdAt <= lastMonthEnd
    }).length || 0

    const growthPercentage = lastMonthReels > 0 
      ? Math.round(((thisMonthReels - lastMonthReels) / lastMonthReels) * 100)
      : (thisMonthReels > 0 ? 100 : 0)

    const stats = {
      totalReels,
      activeReels,
      featuredReels,
      totalViews,
      totalLikes,
      totalShares,
      totalComments,
      growthPercentage
    }

    logger.log('✅ Estadísticas de reels del instructor calculadas:', stats)
    return NextResponse.json(stats)
  } catch (error) {
    logger.error('💥 Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

