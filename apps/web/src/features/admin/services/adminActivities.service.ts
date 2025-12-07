import { createClient } from '../../../lib/supabase/server'
import { logger } from '../../../lib/logger'

export interface AdminActivity {
  activity_id: string
  activity_title: string
  activity_description: string | null
  activity_type: 'reflection' | 'exercise' | 'quiz' | 'discussion' | 'ai_chat'
  activity_content: string
  ai_prompts: string | null
  activity_order_index: number
  is_required: boolean
  lesson_id: string
  created_at: string
}

export interface CreateActivityData {
  activity_title: string
  activity_description?: string
  activity_type: 'reflection' | 'exercise' | 'quiz' | 'discussion' | 'ai_chat'
  activity_content: string
  ai_prompts?: string
  is_required?: boolean
}

export interface UpdateActivityData {
  activity_title?: string
  activity_description?: string
  activity_type?: 'reflection' | 'exercise' | 'quiz' | 'discussion' | 'ai_chat'
  activity_content?: string
  ai_prompts?: string
  is_required?: boolean
}

export class AdminActivitiesService {
  static async getLessonActivities(lessonId: string): Promise<AdminActivity[]> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('lesson_activities')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('activity_order_index', { ascending: true })

      if (error) {
        logger.error('Error fetching activities', { error: error.message, lessonId })
        throw error
      }

      return data || []
    } catch (error) {
      logger.error('Error in AdminActivitiesService.getLessonActivities', { error: error instanceof Error ? error.message : String(error), lessonId })
      throw error
    }
  }

  static async getActivityById(activityId: string): Promise<AdminActivity | null> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('lesson_activities')
        .select('*')
        .eq('activity_id', activityId)
        .single()

      if (error) {
        logger.error('Error fetching activity', { error: error.message, activityId })
        throw error
      }

      return data
    } catch (error) {
      logger.error('Error in AdminActivitiesService.getActivityById', { error: error instanceof Error ? error.message : String(error), activityId })
      return null
    }
  }

  static async createActivity(lessonId: string, activityData: CreateActivityData, userId?: string): Promise<AdminActivity> {
    const supabase = await createClient()

    try {
      // Obtener el próximo order_index
      const { count } = await supabase
        .from('lesson_activities')
        .select('*', { count: 'exact', head: true })
        .eq('lesson_id', lessonId)

      const nextOrderIndex = (count || 0) + 1

      const { data, error } = await supabase
        .from('lesson_activities')
        .insert({
          lesson_id: lessonId,
          activity_title: activityData.activity_title,
          activity_description: activityData.activity_description,
          activity_type: activityData.activity_type,
          activity_content: activityData.activity_content,
          ai_prompts: activityData.ai_prompts,
          activity_order_index: nextOrderIndex,
          is_required: activityData.is_required ?? false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        logger.error('Error creating activity', { error: error.message, lessonId })
        throw error
      }

      // Traducir automáticamente la actividad a inglés y portugués
      try {
        const { translateActivityOnCreate } = await import('@/core/services/courseTranslation.service')
        await translateActivityOnCreate(
          data.activity_id,
          {
            activity_title: data.activity_title,
            activity_description: data.activity_description,
            activity_content: data.activity_content,
            ai_prompts: data.ai_prompts
          },
          userId
        )
      } catch (translationError) {
        // No fallar la creación de la actividad si falla la traducción
        logger.error('Error en traducción automática de la actividad', { 
          error: translationError instanceof Error ? translationError.message : String(translationError),
          activityId: data.activity_id 
        })
      }

      return data
    } catch (error) {
      logger.error('Error in AdminActivitiesService.createActivity', { error: error instanceof Error ? error.message : String(error), lessonId })
      throw error
    }
  }

  static async updateActivity(activityId: string, activityData: UpdateActivityData): Promise<AdminActivity> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('lesson_activities')
        .update(activityData)
        .eq('activity_id', activityId)
        .select()
        .single()

      if (error) {
        logger.error('Error updating activity', { error: error.message, activityId })
        throw error
      }

      return data
    } catch (error) {
      logger.error('Error in AdminActivitiesService.updateActivity', { error: error instanceof Error ? error.message : String(error), activityId })
      throw error
    }
  }

  static async deleteActivity(activityId: string): Promise<void> {
    const supabase = await createClient()

    try {
      const { error } = await supabase
        .from('lesson_activities')
        .delete()
        .eq('activity_id', activityId)

      if (error) {
        logger.error('Error deleting activity', { error: error.message, activityId })
        throw error
      }
    } catch (error) {
      logger.error('Error in AdminActivitiesService.deleteActivity', { error: error instanceof Error ? error.message : String(error), activityId })
      throw error
    }
  }

  static async reorderActivities(lessonId: string, activities: Array<{ activity_id: string, activity_order_index: number }>): Promise<void> {
    const supabase = await createClient()

    try {
      const updates = activities.map((activity) =>
        supabase
          .from('lesson_activities')
          .update({ activity_order_index: activity.activity_order_index })
          .eq('activity_id', activity.activity_id)
      )

      const results = await Promise.all(updates)
      const errors = results.filter(r => r.error)

      if (errors.length > 0) {
        logger.error('Error reordering activities', { errorCount: errors.length, lessonId })
        throw new Error('Error al reordenar actividades')
      }
    } catch (error) {
      logger.error('Error in AdminActivitiesService.reorderActivities', { error: error instanceof Error ? error.message : String(error), lessonId })
      throw error
    }
  }
}

