import { createClient } from '../../../lib/supabase/client'
import type { Database } from '../../../lib/supabase/types'

// Tipo temporal para news hasta que se actualice la base de datos
export interface NewsItem {
  id: string
  title: string
  slug: string
  intro?: string
  content: string
  hero_image_url?: string
  language: string
  status: string
  published_at?: string
  created_at: string
  updated_at: string
  author_id?: string
  category?: string
  tags?: string[]
  view_count?: number
  comment_count?: number
}

export interface NewsWithMetrics extends NewsItem {
  view_count?: number
  comment_count?: number
}

export interface NewsFilters {
  status?: string
  language?: string
  limit?: number
  offset?: number
}

export class NewsService {
  static async getPublishedNews(filters: NewsFilters = {}): Promise<NewsWithMetrics[]> {
    try {
      const supabase = createClient()
      
      let query = supabase
        .from('news')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })

      if (filters.language) {
        query = query.eq('language', filters.language)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching news:', error)
        throw new Error(`Error al obtener noticias: ${error.message}`)
      }

      // Procesar métricas si están disponibles
      const newsWithMetrics: NewsWithMetrics[] = data.map(news => ({
        ...news,
        view_count: news.metrics?.views || 0,
        comment_count: news.metrics?.comments || 0
      }))

      return newsWithMetrics
    } catch (error) {
      console.error('Error in NewsService.getPublishedNews:', error)
      throw error
    }
  }

  static async getNewsBySlug(slug: string): Promise<NewsWithMetrics | null> {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // No se encontró la noticia
        }
        console.error('Error fetching news by slug:', error)
        throw new Error(`Error al obtener noticia: ${error.message}`)
      }

      return {
        ...data,
        view_count: data.metrics?.views || 0,
        comment_count: data.metrics?.comments || 0
      }
    } catch (error) {
      console.error('Error in NewsService.getNewsBySlug:', error)
      throw error
    }
  }

  static async getFeaturedNews(limit: number = 3): Promise<NewsWithMetrics[]> {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching featured news:', error)
        throw new Error(`Error al obtener noticias destacadas: ${error.message}`)
      }

      return data.map(news => ({
        ...news,
        view_count: news.metrics?.views || 0,
        comment_count: news.metrics?.comments || 0
      }))
    } catch (error) {
      console.error('Error in NewsService.getFeaturedNews:', error)
      throw error
    }
  }

  static async getNewsCategories(): Promise<string[]> {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('news')
        .select('language')
        .eq('status', 'published')

      if (error) {
        console.error('Error fetching news categories:', error)
        throw new Error(`Error al obtener categorías: ${error.message}`)
      }

      // Extraer categorías únicas
      const categories = [...new Set(data.map(item => item.language))].filter(Boolean)
      return categories
    } catch (error) {
      console.error('Error in NewsService.getNewsCategories:', error)
      throw error
    }
  }

  static async getNewsStats(): Promise<{
    totalNews: number
    totalCategories: number
    totalViews: number
  }> {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('news')
        .select('metrics, language')
        .eq('status', 'published')

      if (error) {
        console.error('Error fetching news stats:', error)
        throw new Error(`Error al obtener estadísticas: ${error.message}`)
      }

      const totalNews = data.length
      const totalCategories = new Set(data.map(item => item.language)).size
      const totalViews = data.reduce((sum, item) => sum + (item.metrics?.views || 0), 0)

      return {
        totalNews,
        totalCategories,
        totalViews
      }
    } catch (error) {
      console.error('Error in NewsService.getNewsStats:', error)
      throw error
    }
  }

  static async incrementViewCount(slug: string): Promise<void> {
    try {
      const supabase = createClient()
      
      // Obtener la noticia actual
      const { data: news, error: fetchError } = await supabase
        .from('news')
        .select('metrics')
        .eq('slug', slug)
        .single()

      if (fetchError) {
        console.error('Error fetching news for view increment:', fetchError)
        return
      }

      // Incrementar el contador de vistas
      const currentViews = news.metrics?.views || 0
      const updatedMetrics = {
        ...news.metrics,
        views: currentViews + 1
      }

      const { error: updateError } = await supabase
        .from('news')
        .update({ 
          metrics: updatedMetrics,
          updated_at: new Date().toISOString()
        })
        .eq('slug', slug)

      if (updateError) {
        console.error('Error updating view count:', updateError)
      }
    } catch (error) {
      console.error('Error in NewsService.incrementViewCount:', error)
    }
  }
}
