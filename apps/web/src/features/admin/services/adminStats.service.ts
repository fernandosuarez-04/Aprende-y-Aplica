import { createClient } from '../../../lib/supabase/server'

export interface AdminStats {
  totalUsers: number
  activeCourses: number
  totalAIApps: number
  totalNews: number
  engagementRate: number
}

export interface AdminStatsWithChanges extends AdminStats {
  userGrowth: number
  courseGrowth: number
  aiAppGrowth: number
  newsGrowth: number
  engagementGrowth: number
}

export class AdminStatsService {
  static async getStats(): Promise<AdminStatsWithChanges> {
    const supabase = await createClient()

    try {
      console.log('🔍 AdminStatsService: Iniciando consultas a la base de datos...')
      
      // Obtener estadísticas actuales
      const [
        usersResult,
        coursesResult,
        aiAppsResult,
        newsResult,
        favoritesResult
      ] = await Promise.all([
        // Total de usuarios
        supabase
          .from('users')
          .select('id', { count: 'exact' }),
        
        // Cursos activos
        supabase
          .from('courses')
          .select('id', { count: 'exact' })
          .eq('is_active', true),
        
        // Total de apps de IA (todas, no solo las activas)
        supabase
          .from('ai_apps')
          .select('app_id', { count: 'exact' }),
        
        // Total de noticias
        supabase
          .from('news')
          .select('id', { count: 'exact' }),
        
        // Total de favoritos (como proxy para engagement)
        supabase
          .from('user_favorites')
          .select('id', { count: 'exact' })
      ])

      console.log('📊 Resultados de consultas:')
      console.log('👥 Usuarios:', usersResult.count)
      console.log('📚 Cursos:', coursesResult.count)
      console.log('🤖 Apps de IA:', aiAppsResult.count, 'Error:', aiAppsResult.error)
      console.log('📰 Noticias:', newsResult.count)
      console.log('❤️ Favoritos:', favoritesResult.count)

      // Obtener estadísticas de crecimiento (últimos 30 días)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const [
        usersGrowthResult,
        coursesGrowthResult,
        aiAppsGrowthResult,
        newsGrowthResult,
        favoritesGrowthResult
      ] = await Promise.all([
        // Crecimiento de usuarios
        supabase
          .from('users')
          .select('id', { count: 'exact' })
          .gte('created_at', thirtyDaysAgo.toISOString()),
        
        // Crecimiento de cursos
        supabase
          .from('courses')
          .select('id', { count: 'exact' })
          .gte('created_at', thirtyDaysAgo.toISOString())
          .eq('is_active', true),
        
        // Crecimiento de apps de IA (todas, no solo las activas)
        supabase
          .from('ai_apps')
          .select('app_id', { count: 'exact' })
          .gte('created_at', thirtyDaysAgo.toISOString()),
        
        // Crecimiento de noticias
        supabase
          .from('news')
          .select('id', { count: 'exact' })
          .gte('created_at', thirtyDaysAgo.toISOString()),
        
        // Crecimiento de favoritos
        supabase
          .from('user_favorites')
          .select('id', { count: 'exact' })
          .gte('created_at', thirtyDaysAgo.toISOString())
      ])

      // Calcular engagement rate (usuarios activos en los últimos 7 días)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const activeUsersResult = await supabase
        .from('user_session')
        .select('user_id')
        .gte('issued_at', sevenDaysAgo.toISOString())
        .eq('revoked', false)

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
        engagementRate: engagementRate,
        userGrowth: calculateGrowthPercentage(totalUsers, usersGrowthResult.count || 0),
        courseGrowth: calculateGrowthPercentage(coursesResult.count || 0, coursesGrowthResult.count || 0),
        aiAppGrowth: calculateGrowthPercentage(aiAppsResult.count || 0, aiAppsGrowthResult.count || 0),
        newsGrowth: calculateGrowthPercentage(newsResult.count || 0, newsGrowthResult.count || 0),
        engagementGrowth: calculateGrowthPercentage(favoritesResult.count || 0, favoritesGrowthResult.count || 0)
      }

      console.log('📊 AdminStats - Apps de IA encontradas:', aiAppsResult.count || 0)
      console.log('📊 AdminStats - Apps de IA crecimiento (30 días):', aiAppsGrowthResult.count || 0)
      console.log('📊 AdminStats - Datos completos:', stats)

      return stats
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      
      // Retornar valores por defecto en caso de error
      return {
        totalUsers: 0,
        activeCourses: 0,
        totalAIApps: 0,
        totalNews: 0,
        engagementRate: 0,
        userGrowth: 0,
        courseGrowth: 0,
        aiAppGrowth: 0,
        newsGrowth: 0,
        engagementGrowth: 0
      }
    }
  }
}
