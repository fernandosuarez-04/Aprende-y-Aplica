import { createClient } from '../../../lib/supabase/server'

export interface AdminPrompt {
  prompt_id: string
  title: string
  slug: string
  description: string
  content: string
  tags: string[] | string | null
  difficulty_level: string
  estimated_time_min?: number // Hacer opcional ya que puede no existir
  use_cases?: string // Hacer opcional
  tips?: string // Hacer opcional
  is_featured: boolean
  is_verified: boolean
  view_count: number
  like_count: number
  download_count: number
  rating: number
  rating_count: number
  is_active: boolean
  created_at: string
  updated_at: string
  category_id: string
  author_id: string
  // Relaciones
  category?: {
    category_id: string
    name: string
    slug: string
    description: string
    icon: string
    color: string
  }
  author?: {
    id: string
    first_name: string
    last_name: string
    display_name: string
    email: string
  }
}

export interface AdminCategory {
  category_id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PromptStats {
  totalPrompts: number
  activePrompts: number
  featuredPrompts: number
  totalLikes: number
  totalViews: number
  totalDownloads: number
  averageRating: number
}

export class AdminPromptsService {
  static async getPrompts(): Promise<AdminPrompt[]> {
    const supabase = await createClient()

    try {
      console.log('🔄 AdminPromptsService.getPrompts: Iniciando...')
      
      const { data, error } = await supabase
        .from('ai_prompts')
        .select(`
          prompt_id,
          title,
          slug,
          description,
          content,
          tags,
          difficulty_level,
          is_featured,
          is_verified,
          view_count,
          like_count,
          download_count,
          rating,
          rating_count,
          is_active,
          created_at,
          updated_at,
          category_id,
          author_id,
          ai_categories!inner(
            category_id,
            name,
            slug,
            description,
            icon,
            color
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching prompts:', error)
        throw error
      }

      console.log('✅ Prompts obtenidos:', data?.length || 0)

      // Obtener información de autores
      const promptsWithAuthors = await Promise.all(
        (data || []).map(async (prompt) => {
          let authorInfo = null
          
          if (prompt.author_id) {
            const { data: author } = await supabase
              .from('users')
              .select('id, first_name, last_name, display_name, email')
              .eq('id', prompt.author_id)
              .single()
            
            if (author) {
              authorInfo = author
            }
          }

          return {
            ...prompt,
            category: prompt.ai_categories,
            author: authorInfo
          }
        })
      )

      console.log('✅ Prompts con autores procesados:', promptsWithAuthors.length)
      return promptsWithAuthors
    } catch (error) {
      console.error('💥 Error in AdminPromptsService.getPrompts:', error)
      throw error
    }
  }

  static async getCategories(): Promise<AdminCategory[]> {
    const supabase = await createClient()

    try {
      console.log('🔄 AdminPromptsService.getCategories: Iniciando...')
      
      const { data, error } = await supabase
        .from('ai_categories')
        .select(`
          category_id,
          name,
          slug,
          description,
          icon,
          color,
          is_active,
          created_at,
          updated_at
        `)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) {
        console.error('❌ Error fetching categories:', error)
        throw error
      }

      console.log('✅ Categorías obtenidas:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('💥 Error in AdminPromptsService.getCategories:', error)
      throw error
    }
  }

  static async getPromptStats(): Promise<PromptStats> {
    const supabase = await createClient()

    try {
      console.log('🔄 AdminPromptsService.getPromptStats: Iniciando...')
      
      // Obtener estadísticas básicas
      const { count: totalPrompts, error: totalError } = await supabase
        .from('ai_prompts')
        .select('*', { count: 'exact', head: true })

      if (totalError) {
        console.warn('Error counting total prompts:', totalError)
      }

      const { count: activePrompts, error: activeError } = await supabase
        .from('ai_prompts')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      if (activeError) {
        console.warn('Error counting active prompts:', activeError)
      }

      const { count: featuredPrompts, error: featuredError } = await supabase
        .from('ai_prompts')
        .select('*', { count: 'exact', head: true })
        .eq('is_featured', true)

      if (featuredError) {
        console.warn('Error counting featured prompts:', featuredError)
      }

      // Obtener estadísticas agregadas
      const { data: statsData, error: statsError } = await supabase
        .from('ai_prompts')
        .select('like_count, view_count, download_count, rating, rating_count')
        .eq('is_active', true)

      if (statsError) {
        console.warn('Error fetching prompt stats:', statsError)
      }

      const stats = statsData || []
      const totalLikes = stats.reduce((sum, prompt) => sum + (prompt.like_count || 0), 0)
      const totalViews = stats.reduce((sum, prompt) => sum + (prompt.view_count || 0), 0)
      const totalDownloads = stats.reduce((sum, prompt) => sum + (prompt.download_count || 0), 0)
      
      const validRatings = stats.filter(p => p.rating && p.rating > 0)
      const averageRating = validRatings.length > 0 
        ? validRatings.reduce((sum, prompt) => sum + (prompt.rating || 0), 0) / validRatings.length
        : 0

      const result = {
        totalPrompts: totalPrompts || 0,
        activePrompts: activePrompts || 0,
        featuredPrompts: featuredPrompts || 0,
        totalLikes,
        totalViews,
        totalDownloads,
        averageRating: Math.round(averageRating * 10) / 10
      }

      console.log('✅ Estadísticas de prompts calculadas:', result)
      return result
    } catch (error) {
      console.error('💥 Error in AdminPromptsService.getPromptStats:', error)
      throw error
    }
  }

  static async createPrompt(promptData: Partial<AdminPrompt>, adminUserId: string): Promise<AdminPrompt> {
    const supabase = await createClient()

    try {
      console.log('🔄 AdminPromptsService.createPrompt: Iniciando...')
      console.log('📋 Datos a insertar:', promptData)
      
      const { data, error } = await supabase
        .from('ai_prompts')
        .insert({
          title: promptData.title,
          slug: promptData.slug || promptData.title?.toLowerCase().replace(/\s+/g, '-'),
          description: promptData.description,
          content: promptData.content,
          tags: promptData.tags && typeof promptData.tags === 'string' && promptData.tags.trim() 
            ? promptData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
            : [],
          difficulty_level: promptData.difficulty_level || 'beginner',
          is_featured: promptData.is_featured || false,
          is_verified: promptData.is_verified || false,
          view_count: 0,
          like_count: 0,
          download_count: 0,
          rating: 0,
          rating_count: 0,
          is_active: promptData.is_active || true,
          category_id: promptData.category_id,
          author_id: promptData.author_id || adminUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          prompt_id,
          title,
          slug,
          description,
          content,
          tags,
          difficulty_level,
          is_featured,
          is_verified,
          view_count,
          like_count,
          download_count,
          rating,
          rating_count,
          is_active,
          created_at,
          updated_at,
          category_id,
          author_id
        `)
        .single()

      if (error) {
        console.error('❌ Error creating prompt:', error)
        throw error
      }

      console.log('✅ Prompt creado exitosamente:', data)
      return data
    } catch (error) {
      console.error('💥 Error in AdminPromptsService.createPrompt:', error)
      throw error
    }
  }

  static async updatePrompt(promptId: string, promptData: Partial<AdminPrompt>): Promise<AdminPrompt> {
    const supabase = await createClient()

    try {
      console.log('🔄 AdminPromptsService.updatePrompt: Iniciando...')
      console.log('📋 Datos a actualizar:', promptData)
      
      // Solo incluir campos que sabemos que existen en la BD
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      // Campos básicos que sabemos que existen
      if (promptData.title !== undefined) updateData.title = promptData.title
      if (promptData.description !== undefined) updateData.description = promptData.description
      if (promptData.content !== undefined) updateData.content = promptData.content
      
      // Manejar tags como array si es necesario
      if (promptData.tags !== undefined) {
        if (promptData.tags && typeof promptData.tags === 'string' && promptData.tags.trim()) {
          // Convertir string a array
          updateData.tags = promptData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        } else {
          // Array vacío para tags vacíos
          updateData.tags = []
        }
      }
      
      if (promptData.difficulty_level !== undefined) updateData.difficulty_level = promptData.difficulty_level
      if (promptData.is_featured !== undefined) updateData.is_featured = promptData.is_featured
      if (promptData.is_verified !== undefined) updateData.is_verified = promptData.is_verified
      if (promptData.is_active !== undefined) updateData.is_active = promptData.is_active
      if (promptData.category_id !== undefined) updateData.category_id = promptData.category_id

      console.log('📋 Datos filtrados para actualizar:', updateData)
      
      const { data, error } = await supabase
        .from('ai_prompts')
        .update(updateData)
        .eq('prompt_id', promptId)
        .select(`
          prompt_id,
          title,
          slug,
          description,
          content,
          tags,
          difficulty_level,
          is_featured,
          is_verified,
          view_count,
          like_count,
          download_count,
          rating,
          rating_count,
          is_active,
          created_at,
          updated_at,
          category_id,
          author_id
        `)
        .single()

      if (error) {
        console.error('❌ Error updating prompt:', error)
        throw error
      }

      console.log('✅ Prompt actualizado exitosamente:', data)
      return data
    } catch (error) {
      console.error('💥 Error in AdminPromptsService.updatePrompt:', error)
      throw error
    }
  }

  static async deletePrompt(promptId: string): Promise<void> {
    const supabase = await createClient()

    try {
      console.log('🔄 AdminPromptsService.deletePrompt: Iniciando...')
      
      const { error } = await supabase
        .from('ai_prompts')
        .delete()
        .eq('prompt_id', promptId)

      if (error) {
        console.error('❌ Error deleting prompt:', error)
        throw error
      }

      console.log('✅ Prompt eliminado exitosamente')
    } catch (error) {
      console.error('💥 Error in AdminPromptsService.deletePrompt:', error)
      throw error
    }
  }

  static async togglePromptStatus(promptId: string, isActive: boolean): Promise<AdminPrompt> {
    const supabase = await createClient()

    try {
      console.log('🔄 AdminPromptsService.togglePromptStatus: Iniciando...')
      
      const { data, error } = await supabase
        .from('ai_prompts')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('prompt_id', promptId)
        .select(`
          prompt_id,
          title,
          is_active
        `)
        .single()

      if (error) {
        console.error('❌ Error toggling prompt status:', error)
        throw error
      }

      console.log('✅ Estado del prompt actualizado:', data)
      return data
    } catch (error) {
      console.error('💥 Error in AdminPromptsService.togglePromptStatus:', error)
      throw error
    }
  }

  static async togglePromptFeatured(promptId: string, isFeatured: boolean): Promise<AdminPrompt> {
    const supabase = await createClient()

    try {
      console.log('🔄 AdminPromptsService.togglePromptFeatured: Iniciando...')
      
      const { data, error } = await supabase
        .from('ai_prompts')
        .update({ 
          is_featured: isFeatured,
          updated_at: new Date().toISOString()
        })
        .eq('prompt_id', promptId)
        .select(`
          prompt_id,
          title,
          is_featured
        `)
        .single()

      if (error) {
        console.error('❌ Error toggling prompt featured:', error)
        throw error
      }

      console.log('✅ Estado destacado del prompt actualizado:', data)
      return data
    } catch (error) {
      console.error('💥 Error in AdminPromptsService.togglePromptFeatured:', error)
      throw error
    }
  }
}
