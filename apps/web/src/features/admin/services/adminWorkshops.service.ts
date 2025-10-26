import { createClient } from '../../../lib/supabase/server'
import { AuditLogService } from './auditLog.service'

export interface AdminWorkshop {
  id: string
  title: string
  description: string
  category: string
  level: string // Cambiado de 'difficulty' a 'level'
  duration_total_minutes: number // Cambiado de 'duration' a 'duration_total_minutes'
  instructor_id: string
  instructor_name?: string
  is_active: boolean // Cambiado de 'status' a 'is_active'
  thumbnail_url?: string // Cambiado de 'image_url' a 'thumbnail_url'
  slug: string
  price?: number
  average_rating?: number
  student_count: number // Cambiado de 'current_students' a 'student_count'
  review_count: number
  learning_objectives?: any // JSONB
  created_at: string
  updated_at: string
}

export interface WorkshopStats {
  totalWorkshops: number
  activeWorkshops: number
  totalStudents: number
  averageDuration: number
  totalInstructors: number
}

export class AdminWorkshopsService {
  static async getAllWorkshops(): Promise<AdminWorkshop[]> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          category,
          level,
          duration_total_minutes,
          instructor_id,
          is_active,
          thumbnail_url,
          slug,
          price,
          average_rating,
          student_count,
          review_count,
          learning_objectives,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching workshops:', error)
        throw error
      }

      // Obtener información del instructor para cada taller
      const workshopsWithInstructors = await Promise.all(
        (data || []).map(async (workshop) => {
          if (workshop.instructor_id) {
            const { data: instructor } = await supabase
              .from('users')
              .select('display_name, first_name, last_name')
              .eq('id', workshop.instructor_id)
              .single()

            return {
              ...workshop,
              instructor_name: instructor?.display_name || 
                             `${instructor?.first_name || ''} ${instructor?.last_name || ''}`.trim() ||
                             'Instructor no asignado'
            }
          }
          return {
            ...workshop,
            instructor_name: 'Instructor no asignado'
          }
        })
      )

      return workshopsWithInstructors
    } catch (error) {
      console.error('Error in AdminWorkshopsService.getAllWorkshops:', error)
      throw error
    }
  }

  static async getWorkshopStats(): Promise<WorkshopStats> {
    const supabase = await createClient()

    try {
      // Obtener estadísticas básicas
      const { count: totalWorkshops } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })

      const { count: activeWorkshops } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Obtener total de estudiantes (suma de student_count)
      const { data: coursesData } = await supabase
        .from('courses')
        .select('student_count')

      const totalStudents = coursesData ? coursesData.reduce((sum, course) => sum + (course.student_count || 0), 0) : 0

      // Obtener duración promedio
      const { data: durationData } = await supabase
        .from('courses')
        .select('duration_total_minutes')
        .not('duration_total_minutes', 'is', null)

      const averageDuration = durationData && durationData.length > 0
        ? Math.round(durationData.reduce((sum, course) => sum + (course.duration_total_minutes || 0), 0) / durationData.length)
        : 0

      // Obtener total de instructores únicos
      const { count: totalInstructors } = await supabase
        .from('courses')
        .select('instructor_id', { count: 'exact', head: true })
        .not('instructor_id', 'is', null)

      return {
        totalWorkshops: totalWorkshops || 0,
        activeWorkshops: activeWorkshops || 0,
        totalStudents: totalStudents || 0,
        averageDuration,
        totalInstructors: totalInstructors || 0
      }
    } catch (error) {
      console.error('Error in AdminWorkshopsService.getWorkshopStats:', error)
      throw error
    }
  }

  static async createWorkshop(workshopData: Partial<AdminWorkshop>, adminUserId: string, requestInfo?: { ip?: string, userAgent?: string }): Promise<AdminWorkshop> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          title: workshopData.title,
          description: workshopData.description,
          category: workshopData.category,
          level: workshopData.level,
          duration_total_minutes: workshopData.duration_total_minutes,
          instructor_id: workshopData.instructor_id,
          is_active: workshopData.is_active || false,
          thumbnail_url: workshopData.thumbnail_url,
          slug: workshopData.slug || workshopData.title.toLowerCase().replace(/\s+/g, '-'),
          price: workshopData.price,
          average_rating: 0,
          student_count: 0,
          review_count: 0,
          learning_objectives: workshopData.learning_objectives,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          id,
          title,
          description,
          category,
          level,
          duration_total_minutes,
          instructor_id,
          is_active,
          thumbnail_url,
          slug,
          price,
          average_rating,
          student_count,
          review_count,
          learning_objectives,
          created_at,
          updated_at
        `)
        .single()

      if (error) {
        console.error('Error creating workshop:', error)
        throw error
      }

      // Registrar en el log de auditoría
      await AuditLogService.logAction({
        user_id: adminUserId, // En este caso, el admin es quien crea
        admin_user_id: adminUserId,
        action: 'CREATE',
        table_name: 'courses',
        record_id: data.id,
        old_values: null,
        new_values: workshopData,
        ip_address: requestInfo?.ip,
        user_agent: requestInfo?.userAgent
      })

      return data
    } catch (error) {
      console.error('Error in AdminWorkshopsService.createWorkshop:', error)
      throw error
    }
  }

  static async updateWorkshop(workshopId: string, workshopData: Partial<AdminWorkshop>, adminUserId: string, requestInfo?: { ip?: string, userAgent?: string }): Promise<AdminWorkshop> {
    const supabase = await createClient()

    try {
      // Obtener datos anteriores para el log de auditoría
      const { data: oldData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', workshopId)
        .single()

      const { data, error } = await supabase
        .from('courses')
        .update({
          title: workshopData.title,
          description: workshopData.description,
          category: workshopData.category,
          level: workshopData.level,
          duration_total_minutes: workshopData.duration_total_minutes,
          instructor_id: workshopData.instructor_id,
          is_active: workshopData.is_active,
          thumbnail_url: workshopData.thumbnail_url,
          slug: workshopData.slug,
          price: workshopData.price,
          learning_objectives: workshopData.learning_objectives,
          updated_at: new Date().toISOString()
        })
        .eq('id', workshopId)
        .select(`
          id,
          title,
          description,
          category,
          level,
          duration_total_minutes,
          instructor_id,
          is_active,
          thumbnail_url,
          slug,
          price,
          average_rating,
          student_count,
          review_count,
          learning_objectives,
          created_at,
          updated_at
        `)
        .single()

      if (error) {
        console.error('Error updating workshop:', error)
        throw error
      }

      // Registrar en el log de auditoría
      await AuditLogService.logAction({
        user_id: adminUserId,
        admin_user_id: adminUserId,
        action: 'UPDATE',
        table_name: 'courses',
        record_id: workshopId,
        old_values: oldData,
        new_values: workshopData,
        ip_address: requestInfo?.ip,
        user_agent: requestInfo?.userAgent
      })

      return data
    } catch (error) {
      console.error('Error in AdminWorkshopsService.updateWorkshop:', error)
      throw error
    }
  }

  static async deleteWorkshop(workshopId: string, adminUserId: string, requestInfo?: { ip?: string, userAgent?: string }): Promise<void> {
    const supabase = await createClient()

    try {
      // Obtener datos del taller antes de eliminarlo para el log de auditoría
      const { data: workshopData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', workshopId)
        .single()

      // Eliminar el taller (las inscripciones se manejan automáticamente si hay CASCADE)
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', workshopId)

      if (error) {
        console.error('Error deleting workshop:', error)
        throw error
      }

      // Registrar en el log de auditoría
      await AuditLogService.logAction({
        user_id: adminUserId,
        admin_user_id: adminUserId,
        action: 'DELETE',
        table_name: 'courses',
        record_id: workshopId,
        old_values: workshopData,
        new_values: null,
        ip_address: requestInfo?.ip,
        user_agent: requestInfo?.userAgent
      })
    } catch (error) {
      console.error('Error in AdminWorkshopsService.deleteWorkshop:', error)
      throw error
    }
  }

  static async getInstructors(): Promise<Array<{ id: string, name: string }>> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, display_name, first_name, last_name')
        .in('cargo_rol', ['Instructor', 'Administrador'])
        .order('display_name')

      if (error) {
        console.error('Error fetching instructors:', error)
        throw error
      }

      return (data || []).map(user => ({
        id: user.id,
        name: user.display_name || 
              `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
              'Instructor sin nombre'
      }))
    } catch (error) {
      console.error('Error in AdminWorkshopsService.getInstructors:', error)
      throw error
    }
  }
}
