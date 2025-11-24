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
      const supabase = await createClient()
      // ✅ OPTIMIZACIÓN: Paralelizar todas las consultas independientes con Promise.all()
      // ANTES: 11 consultas secuenciales (~1 segundo cada una = 11 segundos total)
      // DESPUÉS: 11 consultas paralelas (~1 segundo total = 11x más rápido)

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const [
        usersResult,
        coursesResult,
        aiAppsResult,
        newsResult,
        reelsResult,
        favoritesResult,
        usersGrowthResult,
        coursesGrowthResult,
        aiAppsGrowthResult,
        newsGrowthResult,
        reelsGrowthResult,
        favoritesGrowthResult,
        activeUsersResult,
      ] = await Promise.all([
        // Estadísticas actuales
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('courses').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('ai_apps').select('app_id', { count: 'exact' }),
        supabase.from('news').select('id', { count: 'exact' }),
        supabase.from('reels').select('id', { count: 'exact' }),
        supabase.from('user_favorites').select('id', { count: 'exact' }),

        // Estadísticas de crecimiento (últimos 30 días)
        supabase.from('users').select('id', { count: 'exact' }).gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('courses').select('id', { count: 'exact' }).gte('created_at', thirtyDaysAgo.toISOString()).eq('is_active', true),
        supabase.from('ai_apps').select('app_id', { count: 'exact' }).gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('news').select('id', { count: 'exact' }).gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('reels').select('id', { count: 'exact' }).gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('user_favorites').select('id', { count: 'exact' }).gte('created_at', thirtyDaysAgo.toISOString()),

        // Engagement rate (últimos 7 días)
        supabase.from('user_session').select('user_id').gte('issued_at', sevenDaysAgo.toISOString()).eq('revoked', false),
      ])

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

      // console.log('Crecimiento de AI Apps:', aiAppsGrowthResult.count || 0)
      return stats
    } catch (error) {
      // console.error('❌ AdminStatsService: Error completo:', error)
      // console.error('❌ AdminStatsService: Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
      
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
      
      return defaultStats
    }
  }
}

