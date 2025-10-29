import { createClient } from '../../../lib/supabase/server'

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

export interface CreateLessonData {
  lesson_title: string
  lesson_description?: string
  video_provider_id: string
  video_provider: 'youtube' | 'vimeo' | 'direct' | 'custom'
  duration_seconds: number
  transcript_content?: string
  is_published?: boolean
  instructor_id: string
}

export interface UpdateLessonData {
  lesson_title?: string
  lesson_description?: string
  video_provider_id?: string
  video_provider?: 'youtube' | 'vimeo' | 'direct' | 'custom'
  duration_seconds?: number
  transcript_content?: string
  is_published?: boolean
  instructor_id?: string
}

export class AdminLessonsService {
  static async getModuleLessons(moduleId: string): Promise<AdminLesson[]> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('course_lessons')
        .select(`
          lesson_id,
          lesson_title,
          lesson_description,
          lesson_order_index,
          video_provider_id,
          video_provider,
          duration_seconds,
          transcript_content,
          is_published,
          module_id,
          instructor_id,
          created_at,
          updated_at
        `)
        .eq('module_id', moduleId)
        .order('lesson_order_index', { ascending: true })

      if (error) {
        console.error('Error fetching lessons:', error)
        throw error
      }

      // Obtener nombres de instructores
      const lessonsWithInstructors = await Promise.all(
        (data || []).map(async (lesson) => {
          let instructorName = 'Instructor no asignado'
          
          if (lesson.instructor_id) {
            const { data: instructor } = await supabase
              .from('users')
              .select('display_name, first_name, last_name')
              .eq('id', lesson.instructor_id)
              .single()
            
            if (instructor) {
              instructorName = instructor.display_name || 
                `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
                'Instructor'
            }
          }

          return {
            ...lesson,
            instructor_name: instructorName
          }
        })
      )

      return lessonsWithInstructors
    } catch (error) {
      console.error('Error in AdminLessonsService.getModuleLessons:', error)
      throw error
    }
  }

  static async getLessonById(lessonId: string): Promise<AdminLesson | null> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('lesson_id', lessonId)
        .single()

      if (error) {
        console.error('Error fetching lesson:', error)
        throw error
      }

      // Obtener nombre del instructor
      if (data?.instructor_id) {
        const { data: instructor } = await supabase
          .from('users')
          .select('display_name, first_name, last_name')
          .eq('id', data.instructor_id)
          .single()
        
        if (instructor) {
          data.instructor_name = instructor.display_name || 
            `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
            'Instructor'
        }
      }

      return data
    } catch (error) {
      console.error('Error in AdminLessonsService.getLessonById:', error)
      return null
    }
  }

  static async createLesson(moduleId: string, lessonData: CreateLessonData): Promise<AdminLesson> {
    const supabase = await createClient()

    try {
      // Obtener el próximo order_index
      const { count } = await supabase
        .from('course_lessons')
        .select('*', { count: 'exact', head: true })
        .eq('module_id', moduleId)

      const nextOrderIndex = (count || 0) + 1

      const { data, error } = await supabase
        .from('course_lessons')
        .insert({
          module_id: moduleId,
          lesson_title: lessonData.lesson_title,
          lesson_description: lessonData.lesson_description,
          lesson_order_index: nextOrderIndex,
          video_provider_id: lessonData.video_provider_id,
          video_provider: lessonData.video_provider,
          duration_seconds: lessonData.duration_seconds,
          transcript_content: lessonData.transcript_content,
          is_published: lessonData.is_published ?? false,
          instructor_id: lessonData.instructor_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating lesson:', error)
        throw error
      }

      // Recalcular duración del módulo
      await this.updateModuleDuration(moduleId)

      // Obtener nombre del instructor
      if (data?.instructor_id) {
        const { data: instructor } = await supabase
          .from('users')
          .select('display_name, first_name, last_name')
          .eq('id', data.instructor_id)
          .single()
        
        if (instructor) {
          data.instructor_name = instructor.display_name || 
            `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
            'Instructor'
        }
      }

      return data
    } catch (error) {
      console.error('Error in AdminLessonsService.createLesson:', error)
      throw error
    }
  }

  static async updateLesson(lessonId: string, lessonData: UpdateLessonData): Promise<AdminLesson> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('course_lessons')
        .update({
          ...lessonData,
          updated_at: new Date().toISOString()
        })
        .eq('lesson_id', lessonId)
        .select()
        .single()

      if (error) {
        console.error('Error updating lesson:', error)
        throw error
      }

      // Recalcular duración del módulo
      if (data?.module_id) {
        await this.updateModuleDuration(data.module_id)
      }

      // Obtener nombre del instructor
      if (data?.instructor_id) {
        const { data: instructor } = await supabase
          .from('users')
          .select('display_name, first_name, last_name')
          .eq('id', data.instructor_id)
          .single()
        
        if (instructor) {
          data.instructor_name = instructor.display_name || 
            `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
            'Instructor'
        }
      }

      return data
    } catch (error) {
      console.error('Error in AdminLessonsService.updateLesson:', error)
      throw error
    }
  }

  static async deleteLesson(lessonId: string): Promise<void> {
    const supabase = await createClient()

    try {
      // Obtener el module_id antes de eliminar
      const { data: lesson } = await supabase
        .from('course_lessons')
        .select('module_id')
        .eq('lesson_id', lessonId)
        .single()

      const { error } = await supabase
        .from('course_lessons')
        .delete()
        .eq('lesson_id', lessonId)

      if (error) {
        console.error('Error deleting lesson:', error)
        throw error
      }

      // Recalcular duración del módulo si existía
      if (lesson?.module_id) {
        await this.updateModuleDuration(lesson.module_id)
      }
    } catch (error) {
      console.error('Error in AdminLessonsService.deleteLesson:', error)
      throw error
    }
  }

  static async reorderLessons(moduleId: string, lessons: Array<{ lesson_id: string, lesson_order_index: number }>): Promise<void> {
    const supabase = await createClient()

    try {
      const updates = lessons.map((lesson) =>
        supabase
          .from('course_lessons')
          .update({ lesson_order_index: lesson.lesson_order_index, updated_at: new Date().toISOString() })
          .eq('lesson_id', lesson.lesson_id)
      )

      const results = await Promise.all(updates)
      const errors = results.filter(r => r.error)

      if (errors.length > 0) {
        console.error('Error reordering lessons:', errors)
        throw new Error('Error al reordenar lecciones')
      }
    } catch (error) {
      console.error('Error in AdminLessonsService.reorderLessons:', error)
      throw error
    }
  }

  static async toggleLessonPublished(lessonId: string): Promise<AdminLesson> {
    const supabase = await createClient()

    try {
      const { data: currentLesson } = await supabase
        .from('course_lessons')
        .select('is_published')
        .eq('lesson_id', lessonId)
        .single()

      if (!currentLesson) {
        throw new Error('Lección no encontrada')
      }

      const { data, error } = await supabase
        .from('course_lessons')
        .update({
          is_published: !currentLesson.is_published,
          updated_at: new Date().toISOString()
        })
        .eq('lesson_id', lessonId)
        .select()
        .single()

      if (error) {
        console.error('Error toggling lesson published:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in AdminLessonsService.toggleLessonPublished:', error)
      throw error
    }
  }

  static async updateModuleDuration(moduleId: string): Promise<void> {
    const supabase = await createClient()

    try {
      // Sumar duración de todas las lecciones
      const { data: lessons } = await supabase
        .from('course_lessons')
        .select('duration_seconds')
        .eq('module_id', moduleId)

      const totalSeconds = lessons?.reduce((sum, lesson) => sum + (lesson.duration_seconds || 0), 0) || 0
      const totalMinutes = Math.round(totalSeconds / 60)

      // Actualizar duración del módulo
      await supabase
        .from('course_modules')
        .update({ module_duration_minutes: totalMinutes, updated_at: new Date().toISOString() })
        .eq('module_id', moduleId)

      // Obtener course_id del módulo para actualizar duración del curso
      const { data: module } = await supabase
        .from('course_modules')
        .select('course_id')
        .eq('module_id', moduleId)
        .single()

      if (module?.course_id) {
        await this.updateCourseDuration(module.course_id)
      }
    } catch (error) {
      console.error('Error in AdminLessonsService.updateModuleDuration:', error)
      throw error
    }
  }

  static async updateCourseDuration(courseId: string): Promise<void> {
    const supabase = await createClient()

    try {
      // Sumar duración de todos los módulos
      const { data: modules } = await supabase
        .from('course_modules')
        .select('module_duration_minutes')
        .eq('course_id', courseId)

      const totalMinutes = modules?.reduce((sum, module) => sum + (module.module_duration_minutes || 0), 0) || 0

      // Actualizar duración del curso
      await supabase
        .from('courses')
        .update({ duration_total_minutes: totalMinutes, updated_at: new Date().toISOString() })
        .eq('id', courseId)
    } catch (error) {
      console.error('Error in AdminLessonsService.updateCourseDuration:', error)
      throw error
    }
  }
}

