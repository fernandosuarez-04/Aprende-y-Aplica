import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // TODO: Agregar verificación de admin cuando esté funcionando
    // const { data: { user }, error: authError } = await supabase.auth.getUser()
    // 
    // if (authError || !user) {
    //   return NextResponse.json(
    //     { error: 'No autorizado' },
    //     { status: 401 }
    //   )
    // }

    // Obtener estadísticas básicas
    const { count: totalApps, error: totalError } = await supabase
      .from('ai_apps')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      console.warn('Error counting total apps:', totalError)
    }

    const { count: activeApps, error: activeError } = await supabase
      .from('ai_apps')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (activeError) {
      console.warn('Error counting active apps:', activeError)
    }

    const { count: featuredApps, error: featuredError } = await supabase
      .from('ai_apps')
      .select('*', { count: 'exact', head: true })
      .eq('is_featured', true)

    if (featuredError) {
      console.warn('Error counting featured apps:', featuredError)
    }

    const { count: verifiedApps, error: verifiedError } = await supabase
      .from('ai_apps')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', true)

    if (verifiedError) {
      console.warn('Error counting verified apps:', verifiedError)
    }

    // Obtener estadísticas agregadas
    const { data: statsData, error: statsError } = await supabase
      .from('ai_apps')
      .select('like_count, view_count, rating, rating_count')
      .eq('is_active', true)

    if (statsError) {
      console.warn('Error fetching app stats:', statsError)
    }

    const stats = statsData || []
    const totalLikes = stats.reduce((sum, app) => sum + (app.like_count || 0), 0)
    const totalViews = stats.reduce((sum, app) => sum + (app.view_count || 0), 0)
    
    const validRatings = stats.filter(a => a.rating && a.rating > 0)
    const averageRating = validRatings.length > 0 
      ? validRatings.reduce((sum, app) => sum + (app.rating || 0), 0) / validRatings.length
      : 0

    const result = {
      totalApps: totalApps || 0,
      activeApps: activeApps || 0,
      featuredApps: featuredApps || 0,
      totalLikes,
      totalViews,
      averageRating: Math.round(averageRating * 10) / 10,
      verifiedApps: verifiedApps || 0
    }

    return NextResponse.json({ stats: result })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
