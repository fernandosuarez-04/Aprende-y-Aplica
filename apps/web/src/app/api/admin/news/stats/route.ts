import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()

    console.log('🔄 Obteniendo estadísticas de noticias...')

    // Obtener todas las noticias con sus métricas
    const { data: allNews, error: newsError } = await supabase
      .from('news')
      .select('id, status, metrics')

    if (newsError) {
      console.error('❌ Error fetching news for stats:', newsError)
      return NextResponse.json(
        { error: 'Failed to fetch news stats' },
        { status: 500 }
      )
    }

    // Calcular estadísticas
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

    console.log('✅ Estadísticas de noticias calculadas:', stats)
    return NextResponse.json({ stats })
  } catch (error) {
    console.error('💥 Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
