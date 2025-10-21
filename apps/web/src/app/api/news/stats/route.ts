import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('news')
      .select('metrics, language')
      .eq('status', 'published')

    if (error) {
      console.error('Error fetching news stats:', error)
      return NextResponse.json(
        { 
          error: 'Error al obtener estadísticas',
          message: error.message
        },
        { status: 500 }
      )
    }

    const totalNews = data.length
    const totalCategories = new Set(data.map(item => item.language)).size
    const totalViews = data.reduce((sum, item) => sum + (item.metrics?.views || 0), 0)

    return NextResponse.json({
      totalNews,
      totalCategories,
      totalViews
    })
  } catch (error) {
    console.error('Error in news stats API:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
