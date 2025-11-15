import { createClient } from '../../../lib/supabase/server'

export interface MonthlyGrowthData {
  month: string
  monthNumber: number
  year: number
  users: number
  courses: number
  communities: number
  prompts: number
  aiApps: number
}

export interface ContentDistribution {
  category: string
  count: number
  percentage: number
  color: string
}

export interface RecentActivity {
  id: string
  type: 'user_registered' | 'course_created' | 'community_created' | 'prompt_added' | 'ai_app_added'
  description: string
  timestamp: string
  timeAgo: string
  color: string
}

export class AdminStatisticsService {
  /**
   * Obtener datos de crecimiento mensual
   * @param period - Período en meses: 1, 3, 6, 12
   */
  static async getMonthlyGrowth(period: number = 8): Promise<MonthlyGrowthData[]> {
    try {
      const supabase = await createClient()
      
      // Calcular fecha de inicio
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - period)
      
      // Obtener datos de usuarios por mes
      const { data: usersData } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
      
      // Obtener datos de cursos por mes
      const { data: coursesData } = await supabase
        .from('courses')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .eq('is_active', true)
      
      // Obtener datos de comunidades por mes
      const { data: communitiesData } = await supabase
        .from('communities')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
      
      // Obtener datos de prompts por mes
      const { data: promptsData } = await supabase
        .from('ai_prompts')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .eq('is_active', true)
      
      // Obtener datos de apps de IA por mes
      const { data: aiAppsData } = await supabase
        .from('ai_apps')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
      
      // Agrupar por mes
      const monthMap = new Map<string, MonthlyGrowthData>()
      
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      
      // Inicializar todos los meses del período
      for (let i = 0; i < period; i++) {
        const date = new Date()
        date.setMonth(date.getMonth() - (period - 1 - i))
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const monthName = monthNames[date.getMonth()]
        
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, {
            month: monthName,
            monthNumber: date.getMonth() + 1,
            year: date.getFullYear(),
            users: 0,
            courses: 0,
            communities: 0,
            prompts: 0,
            aiApps: 0
          })
        }
      }
      
      // Contar usuarios por mes
      usersData?.forEach(user => {
        const date = new Date(user.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const data = monthMap.get(monthKey)
        if (data) {
          data.users++
        }
      })
      
      // Contar cursos por mes
      coursesData?.forEach(course => {
        const date = new Date(course.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const data = monthMap.get(monthKey)
        if (data) {
          data.courses++
        }
      })
      
      // Contar comunidades por mes
      communitiesData?.forEach(community => {
        const date = new Date(community.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const data = monthMap.get(monthKey)
        if (data) {
          data.communities++
        }
      })
      
      // Contar prompts por mes
      promptsData?.forEach(prompt => {
        const date = new Date(prompt.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const data = monthMap.get(monthKey)
        if (data) {
          data.prompts++
        }
      })
      
      // Contar apps de IA por mes
      aiAppsData?.forEach(app => {
        const date = new Date(app.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const data = monthMap.get(monthKey)
        if (data) {
          data.aiApps++
        }
      })
      
      // Convertir a array y ordenar por fecha
      return Array.from(monthMap.values()).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        return a.monthNumber - b.monthNumber
      })
    } catch (error) {
      console.error('Error getting monthly growth:', error)
      return []
    }
  }
  
  /**
   * Obtener distribución de contenido
   */
  static async getContentDistribution(): Promise<ContentDistribution[]> {
    try {
      const supabase = await createClient()
      
      // Obtener conteos en paralelo
      const [
        { count: coursesCount },
        { count: communitiesCount },
        { count: promptsCount },
        { count: aiAppsCount }
      ] = await Promise.all([
        supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('communities').select('id', { count: 'exact', head: true }),
        supabase.from('ai_prompts').select('prompt_id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('ai_apps').select('app_id', { count: 'exact', head: true })
      ])
      
      const total = (coursesCount || 0) + (communitiesCount || 0) + (promptsCount || 0) + (aiAppsCount || 0)
      
      if (total === 0) {
        return []
      }
      
      const distribution: ContentDistribution[] = [
        {
          category: 'Talleres',
          count: coursesCount || 0,
          percentage: Math.round(((coursesCount || 0) / total) * 100),
          color: '#3b82f6' // blue
        },
        {
          category: 'Comunidades',
          count: communitiesCount || 0,
          percentage: Math.round(((communitiesCount || 0) / total) * 100),
          color: '#10b981' // green
        },
        {
          category: 'Prompts',
          count: promptsCount || 0,
          percentage: Math.round(((promptsCount || 0) / total) * 100),
          color: '#8b5cf6' // purple
        },
        {
          category: 'Apps de IA',
          count: aiAppsCount || 0,
          percentage: Math.round(((aiAppsCount || 0) / total) * 100),
          color: '#f97316' // orange
        }
      ]
      
      return distribution.filter(item => item.count > 0)
    } catch (error) {
      console.error('Error getting content distribution:', error)
      return []
    }
  }
  
  /**
   * Obtener actividad reciente
   * @param period - Período: '24h', '7d', '30d'
   */
  static async getRecentActivity(period: string = '24h'): Promise<RecentActivity[]> {
    try {
      const supabase = await createClient()
      
      // Calcular fecha de inicio según período
      const startDate = new Date()
      switch (period) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24)
          break
        case '7d':
          startDate.setDate(startDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(startDate.getDate() - 30)
          break
        default:
          startDate.setHours(startDate.getHours() - 24)
      }
      
      const activities: RecentActivity[] = []
      
      // Obtener nuevos usuarios
      const { data: newUsers } = await supabase
        .from('users')
        .select('id, created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
      
      if (newUsers && newUsers.length > 0) {
        activities.push({
          id: `users-${newUsers[0].id}`,
          type: 'user_registered',
          description: newUsers.length > 1 ? `${newUsers.length} nuevos usuarios registrados` : '1 nuevo usuario registrado',
          timestamp: newUsers[0].created_at,
          timeAgo: this.getTimeAgo(newUsers[0].created_at),
          color: '#10b981' // green
        })
      }
      
      // Obtener nuevos cursos
      const { data: newCourses } = await supabase
        .from('courses')
        .select('id, created_at')
        .gte('created_at', startDate.toISOString())
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (newCourses && newCourses.length > 0) {
        activities.push({
          id: `courses-${newCourses[0].id}`,
          type: 'course_created',
          description: newCourses.length > 1 ? `${newCourses.length} nuevos talleres creados` : '1 nuevo taller creado',
          timestamp: newCourses[0].created_at,
          timeAgo: this.getTimeAgo(newCourses[0].created_at),
          color: '#3b82f6' // blue
        })
      }
      
      // Obtener nuevas comunidades
      const { data: newCommunities } = await supabase
        .from('communities')
        .select('id, created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
      
      if (newCommunities && newCommunities.length > 0) {
        activities.push({
          id: `communities-${newCommunities[0].id}`,
          type: 'community_created',
          description: newCommunities.length > 1 ? `${newCommunities.length} nuevas comunidades creadas` : '1 nueva comunidad creada',
          timestamp: newCommunities[0].created_at,
          timeAgo: this.getTimeAgo(newCommunities[0].created_at),
          color: '#8b5cf6' // purple
        })
      }
      
      // Obtener nuevos prompts
      const { data: newPrompts } = await supabase
        .from('ai_prompts')
        .select('prompt_id, created_at')
        .gte('created_at', startDate.toISOString())
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (newPrompts && newPrompts.length > 0) {
        activities.push({
          id: `prompts-${newPrompts[0].prompt_id}`,
          type: 'prompt_added',
          description: newPrompts.length > 1 ? `${newPrompts.length} nuevos prompts agregados` : '1 nuevo prompt agregado',
          timestamp: newPrompts[0].created_at,
          timeAgo: this.getTimeAgo(newPrompts[0].created_at),
          color: '#f97316' // orange
        })
      }
      
      // Obtener nuevas apps de IA
      const { data: newApps } = await supabase
        .from('ai_apps')
        .select('app_id, created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
      
      if (newApps && newApps.length > 0) {
        activities.push({
          id: `apps-${newApps[0].app_id}`,
          type: 'ai_app_added',
          description: newApps.length > 1 ? `${newApps.length} nuevas apps de IA agregadas` : '1 nueva app de IA agregada',
          timestamp: newApps[0].created_at,
          timeAgo: this.getTimeAgo(newApps[0].created_at),
          color: '#ec4899' // pink
        })
      }
      
      // Ordenar por timestamp (más reciente primero) y limitar a 10
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
    } catch (error) {
      console.error('Error getting recent activity:', error)
      return []
    }
  }
  
  /**
   * Calcular tiempo transcurrido desde una fecha
   */
  private static getTimeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 60) {
      return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`
    } else if (diffHours < 24) {
      return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
    } else {
      return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`
    }
  }
}

