import { createClient } from '../../../lib/supabase/server'

export interface AdminStats {
  totalUsers: number
  activeCourses: number
  totalAIApps: number
  totalNews: number
  totalReels: number
  engagementRate: number
}

export interface AdminStatsWithChanges extends AdminStats {
  userGrowth: number
  courseGrowth: number
  aiAppGrowth: number
  newsGrowth: number
  reelsGrowth: number
  engagementGrowth: number
}

export class AdminStatsService {
  static async getStats(): Promise<AdminStatsWithChanges> {
    try {
      console.log('🔍 AdminStatsService: Iniciando consultas a la base de datos...')
      const supabase = await createClient()
      console.log('✅ AdminStatsService: Cliente de Supabase creado')
      
      // Obtener estadísticas actuales con manejo de errores individual
      console.log('📊 AdminStatsService: Consultando tabla users...')
      const usersResult = await supabase
        .from('users')
        .select('id', { count: 'exact' })
      
      console.log('📊 AdminStatsService: Consultando tabla courses...')
      const coursesResult = await supabase
        .from('courses')
        .select('id', { count: 'exact' })
        .eq('is_active', true)
      
      console.log('📊 AdminStatsService: Consultando tabla ai_apps...')
      const aiAppsResult = await supabase
        .from('ai_apps')
        .select('app_id', { count: 'exact' })
      
      console.log('📊 AdminStatsService: Consultando tabla news...')
      const newsResult = await supabase
        .from('news')
        .select('id', { count: 'exact' })
      
      console.log('📊 AdminStatsService: Consultando tabla reels...')
      const reelsResult = await supabase
        .from('reels')
        .select('id', { count: 'exact' })
      
      console.log('📊 AdminStatsService: Consultando tabla user_favorites...')
      const favoritesResult = await supabase
        .from('user_favorites')
        .select('id', { count: 'exact' })

      console.log('📊 Resultados de consultas:')
      console.log('👥 Usuarios:', usersResult.count)
      console.log('📚 Cursos:', coursesResult.count)
      console.log('🤖 Apps de IA:', aiAppsResult.count, 'Error:', aiAppsResult.error)
      console.log('📰 Noticias:', newsResult.count)
      console.log('🎬 Reels:', reelsResult.count)
      console.log('❤️ Favoritos:', favoritesResult.count)

      // Obtener estadísticas de crecimiento (últimos 30 días)
      console.log('📈 AdminStatsService: Consultando datos de crecimiento...')
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      console.log('📈 AdminStatsService: Consultando crecimiento de usuarios...')
      const usersGrowthResult = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .gte('created_at', thirtyDaysAgo.toISOString())
      
      console.log('📈 AdminStatsService: Consultando crecimiento de cursos...')
      const coursesGrowthResult = await supabase
        .from('courses')
        .select('id', { count: 'exact' })
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('is_active', true)
      
      console.log('📈 AdminStatsService: Consultando crecimiento de apps de IA...')
      const aiAppsGrowthResult = await supabase
        .from('ai_apps')
        .select('app_id', { count: 'exact' })
        .gte('created_at', thirtyDaysAgo.toISOString())
      
      console.log('📈 AdminStatsService: Consultando crecimiento de noticias...')
      const newsGrowthResult = await supabase
        .from('news')
        .select('id', { count: 'exact' })
        .gte('created_at', thirtyDaysAgo.toISOString())
      
      console.log('📈 AdminStatsService: Consultando crecimiento de reels...')
      const reelsGrowthResult = await supabase
        .from('reels')
        .select('id', { count: 'exact' })
        .gte('created_at', thirtyDaysAgo.toISOString())
      
      console.log('📈 AdminStatsService: Consultando crecimiento de favoritos...')
      const favoritesGrowthResult = await supabase
        .from('user_favorites')
        .select('id', { count: 'exact' })
        .gte('created_at', thirtyDaysAgo.toISOString())

      // Calcular engagement rate (usuarios activos en los últimos 7 días)
      console.log('📊 AdminStatsService: Consultando engagement rate...')
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const activeUsersResult = await supabase
        .from('user_session')
        .select('user_id')
        .gte('issued_at', sevenDaysAgo.toISOString())
        .eq('revoked', false)

      console.log('📊 AdminStatsService: Engagement consultado:', activeUsersResult.data?.length || 0, 'usuarios activos')

      const totalUsers = usersResult.count || 0
      const activeUsers = new Set(activeUsersResult.data?.map(session => session.user_id)).size
      const engagementRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

      // Calcular porcentajes de crecimiento
      const calculateGrowthPercentage = (current: number, growth: number): number => {
        if (current === 0) return 0
        if (growth === 0) return 0
        if (current <= growth) return 100 // Si el crecimiento es igual o mayor al total actual
        
        const previous = current - growth
        if (previous <= 0) return 0
        
        const percentage = Math.round((growth / previous) * 100)
        return Math.max(0, Math.min(1000, percentage)) // Limitar entre 0 y 1000%
      }

      const stats: AdminStatsWithChanges = {
        totalUsers: totalUsers,
        activeCourses: coursesResult.count || 0,
        totalAIApps: aiAppsResult.count || 0,
        totalNews: newsResult.count || 0,
        totalReels: reelsResult.count || 0,
        engagementRate: engagementRate,
        userGrowth: calculateGrowthPercentage(totalUsers, usersGrowthResult.count || 0),
        courseGrowth: calculateGrowthPercentage(coursesResult.count || 0, coursesGrowthResult.count || 0),
        aiAppGrowth: calculateGrowthPercentage(aiAppsResult.count || 0, aiAppsGrowthResult.count || 0),
        newsGrowth: calculateGrowthPercentage(newsResult.count || 0, newsGrowthResult.count || 0),
        reelsGrowth: calculateGrowthPercentage(reelsResult.count || 0, reelsGrowthResult.count || 0),
        engagementGrowth: calculateGrowthPercentage(favoritesResult.count || 0, favoritesGrowthResult.count || 0)
      }

      console.log('📊 AdminStats - Apps de IA encontradas:', aiAppsResult.count || 0)
      console.log('📊 AdminStats - Apps de IA crecimiento (30 días):', aiAppsGrowthResult.count || 0)
      console.log('📊 AdminStats - Datos completos:', stats)
      console.log('✅ AdminStatsService: Estadísticas calculadas exitosamente')

      return stats
    } catch (error) {
      console.error('❌ AdminStatsService: Error completo:', error)
      console.error('❌ AdminStatsService: Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
      
      // Retornar valores por defecto en caso de error
      const defaultStats = {
        totalUsers: 0,
        activeCourses: 0,
        totalAIApps: 0,
        totalNews: 0,
        totalReels: 0,
        engagementRate: 0,
        userGrowth: 0,
        courseGrowth: 0,
        aiAppGrowth: 0,
        newsGrowth: 0,
        reelsGrowth: 0,
        engagementGrowth: 0
      }
      
      console.log('⚠️ AdminStatsService: Retornando datos por defecto:', defaultStats)
      return defaultStats
    }
  }
}
