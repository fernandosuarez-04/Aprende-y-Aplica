import { createClient } from '../../../lib/supabase/client'

export interface InstructorNews {
  id: string
  title: string
  slug: string
  subtitle?: string
  language: string
  hero_image_url?: string
  tldr?: any
  intro?: string
  sections?: any
  metrics?: any
  links?: any
  cta?: any
  status: string
  published_at?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface NewsStats {
  totalNews: number
  publishedNews: number
  draftNews: number
  archivedNews: number
  totalViews: number
  totalComments: number
  averageViews: number
}

export class InstructorNewsService {
  static async getNews(): Promise<InstructorNews[]> {
    try {
      console.log('🔄 InstructorNewsService.getNews: Iniciando...')
      
      const response = await fetch('/api/instructor/news', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch news')
      }

      const data = await response.json()
      console.log('✅ Noticias del instructor obtenidas exitosamente:', data.news?.length || 0)
      return data.news || []
    } catch (error) {
      console.error('💥 Error in InstructorNewsService.getNews:', error)
      throw error
    }
  }

  static async getNewsStats(): Promise<NewsStats> {
    try {
      console.log('🔄 InstructorNewsService.getNewsStats: Iniciando...')
      
      const response = await fetch('/api/instructor/news/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch news stats')
      }

      const data = await response.json()
      console.log('✅ Estadísticas de noticias del instructor obtenidas:', data.stats)
      return data.stats
    } catch (error) {
      console.error('💥 Error in InstructorNewsService.getNewsStats:', error)
      throw error
    }
  }

  static async createNews(newsData: Partial<InstructorNews>): Promise<InstructorNews> {
    try {
      console.log('🔄 InstructorNewsService.createNews: Iniciando...')
      console.log('📋 Datos a insertar:', newsData)
      
      const response = await fetch('/api/instructor/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newsData)
      })

      if (!response.ok) {
        throw new Error('Failed to create news')
      }

      const data = await response.json()
      console.log('✅ Noticia del instructor creada exitosamente:', data.news)
      return data.news
    } catch (error) {
      console.error('💥 Error in InstructorNewsService.createNews:', error)
      throw error
    }
  }

  static async updateNews(newsId: string, newsData: Partial<InstructorNews>): Promise<InstructorNews> {
    try {
      console.log('🔄 InstructorNewsService.updateNews: Iniciando...')
      console.log('📋 Datos a actualizar:', newsData)
      
      const response = await fetch(`/api/instructor/news/${newsId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newsData)
      })

      if (!response.ok) {
        throw new Error('Failed to update news')
      }

      const data = await response.json()
      console.log('✅ Noticia del instructor actualizada exitosamente:', data.news)
      return data.news
    } catch (error) {
      console.error('💥 Error in InstructorNewsService.updateNews:', error)
      throw error
    }
  }

  static async deleteNews(newsId: string): Promise<void> {
    try {
      console.log('🔄 InstructorNewsService.deleteNews: Iniciando...')
      
      const response = await fetch(`/api/instructor/news/${newsId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete news')
      }

      console.log('✅ Noticia del instructor eliminada exitosamente')
    } catch (error) {
      console.error('💥 Error in InstructorNewsService.deleteNews:', error)
      throw error
    }
  }

  static async toggleNewsStatus(newsId: string, status: 'draft' | 'published' | 'archived'): Promise<void> {
    try {
      console.log('🔄 InstructorNewsService.toggleNewsStatus: Iniciando...')
      
      const response = await fetch(`/api/instructor/news/${newsId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        throw new Error('Failed to toggle news status')
      }

      console.log('✅ Estado de noticia del instructor actualizado exitosamente')
    } catch (error) {
      console.error('💥 Error in InstructorNewsService.toggleNewsStatus:', error)
      throw error
    }
  }

  static async getNewsById(newsId: string): Promise<InstructorNews> {
    try {
      console.log('🔄 InstructorNewsService.getNewsById: Iniciando...')
      
      const response = await fetch(`/api/instructor/news/${newsId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch news')
      }

      const data = await response.json()
      console.log('✅ Noticia del instructor obtenida exitosamente:', data.news)
      return data.news
    } catch (error) {
      console.error('💥 Error in InstructorNewsService.getNewsById:', error)
      throw error
    }
  }
}

