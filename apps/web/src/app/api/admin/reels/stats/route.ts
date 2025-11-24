import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    logger.log('🔄 Iniciando GET /api/admin/reels/stats')
    const supabase = await createClient()
    logger.log('✅ Supabase client creado para stats')
    
    // Obtener estadísticas generales
    const { data: totalReels, error: totalError } = await supabase
      .from('reels')
      .select('id', { count: 'exact' })

    logger.log('📊 Total reels:', totalReels?.length, 'Error:', totalError)

    const { data: activeReels, error: activeError } = await supabase
      .from('reels')
      .select('id', { count: 'exact' })
      .eq('is_active', true)

    const { data: featuredReels, error: featuredError } = await supabase
      .from('reels')
      .select('id', { count: 'exact' })
      .eq('is_featured', true)

    // Obtener estadísticas de engagement
    const { data: engagementStats, error: engagementError } = await supabase
      .from('reels')
      .select('view_count, like_count, share_count, comment_count')

    logger.log('📊 Engagement stats:', engagementStats?.length, 'Error:', engagementError)

    if (totalError || activeError || featuredError || engagementError) {
      logger.error('❌ Error fetching reel stats:', { totalError, activeError, featuredError, engagementError })
      return NextResponse.json({ error: 'Failed to fetch reel stats', details: { totalError, activeError, featuredError, engagementError } }, { status: 500 })
    }

    // Calcular totales de engagement
    const totalViews = engagementStats?.reduce((sum, reel) => sum + (reel.view_count || 0), 0) || 0
    const totalLikes = engagementStats?.reduce((sum, reel) => sum + (reel.like_count || 0), 0) || 0
    const totalShares = engagementStats?.reduce((sum, reel) => sum + (reel.share_count || 0), 0) || 0
    const totalComments = engagementStats?.reduce((sum, reel) => sum + (reel.comment_count || 0), 0) || 0

    // Calcular crecimiento (comparar con el mes anterior)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: previousMonthReels, error: previousError } = await supabase
      .from('reels')
      .select('id', { count: 'exact' })
      .lt('created_at', thirtyDaysAgo.toISOString())

    const currentTotal = totalReels?.length || 0
    const previousTotal = previousMonthReels?.length || 0
    
    const growthPercentage = previousTotal > 0 
      ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100)
      : currentTotal > 0 ? 100 : 0

    const stats = {
      totalReels: currentTotal,
      activeReels: activeReels?.length || 0,
      featuredReels: featuredReels?.length || 0,
      totalViews,
      totalLikes,
      totalShares,
      totalComments,
      growthPercentage: Math.max(0, Math.min(1000, growthPercentage)) // Clamp between 0 and 1000%
    }

    logger.log('📊 Reel stats calculadas:', stats)

    return NextResponse.json(stats)
  } catch (error) {
    logger.error('❌ Error in GET /api/admin/reels/stats:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
