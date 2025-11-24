import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'
import { requireInstructor } from '@/lib/auth/requireAdmin'

export async function GET(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de instructor
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()
    const instructorId = auth.userId

    logger.log('🔄 Obteniendo estadísticas de noticias del instructor:', instructorId)

    // Obtener solo las noticias del instructor actual
    const { data: allNews, error: newsError } = await supabase
      .from('news')
      .select('id, status, metrics')
      .eq('created_by', instructorId) // ✅ Solo noticias del instructor actual

    if (newsError) {
      logger.error('❌ Error fetching instructor news for stats:', newsError)
      return NextResponse.json(
        { error: 'Failed to fetch news stats' },
        { status: 500 }
      )
    }

    // Calcular estadísticas solo para las noticias del instructor
    const totalNews = allNews?.length || 0
    const publishedNews = allNews?.filter(news => news.status === 'published').length || 0
    const draftNews = allNews?.filter(news => news.status === 'draft').length || 0
    const archivedNews = allNews?.filter(news => news.status === 'archived').length || 0

    // Calcular totales de vistas y comentarios
    const totalViews = allNews?.reduce((sum, news) => {
      return sum + (news.metrics?.views || 0)
    }, 0) || 0

    const totalComments = allNews?.reduce((sum, news) => {
      return sum + (news.metrics?.comments || 0)
    }, 0) || 0

    // Calcular promedio de vistas
    const averageViews = publishedNews > 0 ? Math.round(totalViews / publishedNews) : 0

    const stats = {
      totalNews,
      publishedNews,
      draftNews,
      archivedNews,
      totalViews,
      totalComments,
      averageViews
    }

    logger.log('✅ Estadísticas de noticias del instructor calculadas:', stats)
    return NextResponse.json({ stats })
  } catch (error) {
    logger.error('💥 Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

