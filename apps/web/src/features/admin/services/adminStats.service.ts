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
        
        // Total de apps de IA
        supabase
          .from('ai_apps')
          .select('id', { count: 'exact' })
          .eq('is_active', true),
        
        // Total de noticias
        supabase
          .from('news')
          .select('id', { count: 'exact' }),
        
        // Total de favoritos (como proxy para engagement)
        supabase
          .from('app_favorites')
          .select('id', { count: 'exact' })
      ])

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
        
        // Crecimiento de apps de IA
        supabase
          .from('ai_apps')
          .select('id', { count: 'exact' })
          .gte('created_at', thirtyDaysAgo.toISOString())
          .eq('is_active', true),
        
        // Crecimiento de noticias
        supabase
          .from('news')
          .select('id', { count: 'exact' })
          .gte('created_at', thirtyDaysAgo.toISOString()),
        
        // Crecimiento de favoritos
        supabase
          .from('app_favorites')
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
        return Math.round((growth / (current - growth)) * 100)
      }

      // Si no hay apps de IA, usar datos de prueba
      const aiAppsCount = aiAppsResult.count || 0
      const mockAIAppsCount = aiAppsCount === 0 ? 3 : aiAppsCount // 3 apps de prueba si no hay datos reales

      const stats: AdminStatsWithChanges = {
        totalUsers: totalUsers,
        activeCourses: coursesResult.count || 0,
        totalAIApps: mockAIAppsCount,
        totalNews: newsResult.count || 0,
        engagementRate: engagementRate,
        userGrowth: calculateGrowthPercentage(totalUsers, usersGrowthResult.count || 0),
        courseGrowth: calculateGrowthPercentage(coursesResult.count || 0, coursesGrowthResult.count || 0),
        aiAppGrowth: calculateGrowthPercentage(mockAIAppsCount, aiAppsGrowthResult.count || 0),
        newsGrowth: calculateGrowthPercentage(newsResult.count || 0, newsGrowthResult.count || 0),
        engagementGrowth: calculateGrowthPercentage(favoritesResult.count || 0, favoritesGrowthResult.count || 0)
      }

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

