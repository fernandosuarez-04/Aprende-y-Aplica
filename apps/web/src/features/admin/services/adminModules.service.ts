import { createClient } from '../../../lib/supabase/server'

export interface AdminModule {
  module_id: string
  module_title: string
  module_description: string | null
  module_order_index: number
  module_duration_minutes: number
  is_required: boolean
  is_published: boolean
  course_id: string
  created_at: string
  updated_at: string
  lessons?: AdminLesson[] // Opcional para vista anidada
}

export interface AdminLesson {
  lesson_id: string
  lesson_title: string
  lesson_description: string | null
  lesson_order_index: number
  video_provider_id: string
  video_provider: 'youtube' | 'vimeo' | 'direct' | 'custom'
  duration_seconds: number
  transcript_content: string | null
  is_published: boolean
  module_id: string
  instructor_id: string
  instructor_name?: string // Calculado
  created_at: string
  updated_at: string
}

export interface CreateModuleData {
  module_title: string
  module_description?: string
  is_required?: boolean
  is_published?: boolean
}

export interface UpdateModuleData {
  module_title?: string
  module_description?: string
  is_required?: boolean
  is_published?: boolean
}

export class AdminModulesService {
  static async getCourseModules(courseId: string): Promise<AdminModule[]> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('course_modules')
        .select(`
          module_id,
          module_title,
          module_description,
          module_order_index,
          module_duration_minutes,
          is_required,
          is_published,
          course_id,
          created_at,
          updated_at
        `)
        .eq('course_id', courseId)
        .order('module_order_index', { ascending: true })

      if (error) {
        console.error('Error fetching modules:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in AdminModulesService.getCourseModules:', error)
      throw error
    }
  }

  static async getModuleById(moduleId: string): Promise<AdminModule | null> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('course_modules')
        .select('*')
        .eq('module_id', moduleId)
        .single()

      if (error) {
        console.error('Error fetching module:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in AdminModulesService.getModuleById:', error)
      return null
    }
  }

  static async createModule(courseId: string, moduleData: CreateModuleData): Promise<AdminModule> {
    const supabase = await createClient()

    try {
      // Obtener el próximo order_index
      const { count } = await supabase
        .from('course_modules')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId)

      const nextOrderIndex = (count || 0) + 1

      const { data, error } = await supabase
        .from('course_modules')
        .insert({
          course_id: courseId,
          module_title: moduleData.module_title,
          module_description: moduleData.module_description,
          module_order_index: nextOrderIndex,
          module_duration_minutes: 0,
          is_required: moduleData.is_required ?? true,
          is_published: moduleData.is_published ?? false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating module:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in AdminModulesService.createModule:', error)
      throw error
    }
  }

  static async updateModule(moduleId: string, moduleData: UpdateModuleData): Promise<AdminModule> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('course_modules')
        .update({
          ...moduleData,
          updated_at: new Date().toISOString()
        })
        .eq('module_id', moduleId)
        .select()
        .single()

      if (error) {
        console.error('Error updating module:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in AdminModulesService.updateModule:', error)
      throw error
    }
  }

  static async deleteModule(moduleId: string): Promise<void> {
    const supabase = await createClient()

    try {
      const { error } = await supabase
        .from('course_modules')
        .delete()
        .eq('module_id', moduleId)

      if (error) {
        console.error('Error deleting module:', error)
        throw error
      }

      // También se eliminarán las lecciones en cascada según BD.sql
    } catch (error) {
      console.error('Error in AdminModulesService.deleteModule:', error)
      throw error
    }
  }

  static async reorderModules(courseId: string, modules: Array<{ module_id: string, module_order_index: number }>): Promise<void> {
    const supabase = await createClient()

    try {
      // Actualizar cada módulo con su nuevo order_index
      const updates = modules.map((module) =>
        supabase
          .from('course_modules')
          .update({ module_order_index: module.module_order_index, updated_at: new Date().toISOString() })
          .eq('module_id', module.module_id)
      )

      const results = await Promise.all(updates)
      const errors = results.filter(r => r.error)

      if (errors.length > 0) {
        console.error('Error reordering modules:', errors)
        throw new Error('Error al reordenar módulos')
      }
    } catch (error) {
      console.error('Error in AdminModulesService.reorderModules:', error)
      throw error
    }
  }

  static async toggleModulePublished(moduleId: string): Promise<AdminModule> {
    const supabase = await createClient()

    try {
      // Obtener el estado actual
      const { data: currentModule } = await supabase
        .from('course_modules')
        .select('is_published')
        .eq('module_id', moduleId)
        .single()

      if (!currentModule) {
        throw new Error('Módulo no encontrado')
      }

      const { data, error } = await supabase
        .from('course_modules')
        .update({
          is_published: !currentModule.is_published,
          updated_at: new Date().toISOString()
        })
        .eq('module_id', moduleId)
        .select()
        .single()

      if (error) {
        console.error('Error toggling module published:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in AdminModulesService.toggleModulePublished:', error)
      throw error
    }
  }

  static async calculateModuleDuration(moduleId: string): Promise<number> {
    const supabase = await createClient()

    try {
      // Sumar la duración de todas las lecciones del módulo
      const { data: lessons, error } = await supabase
        .from('course_lessons')
        .select('duration_seconds')
        .eq('module_id', moduleId)

      if (error) {
        console.error('Error calculating module duration:', error)
        throw error
      }

      const totalSeconds = lessons?.reduce((sum, lesson) => sum + (lesson.duration_seconds || 0), 0) || 0
      const totalMinutes = Math.round(totalSeconds / 60)

      // Actualizar el módulo
      await supabase
        .from('course_modules')
        .update({ module_duration_minutes: totalMinutes })
        .eq('module_id', moduleId)

      return totalMinutes
    } catch (error) {
      console.error('Error in AdminModulesService.calculateModuleDuration:', error)
      throw error
    }
  }
}

