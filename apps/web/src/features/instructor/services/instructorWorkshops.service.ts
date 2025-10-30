import { createClient } from '@/lib/supabase/server'

export interface InstructorWorkshop {
  id: string
  title: string
  description: string
  category: string
  level: string
  duration_total_minutes: number
  instructor_id: string
  is_active: boolean
  thumbnail_url?: string
  slug: string
  price?: number
  average_rating?: number
  student_count: number
  review_count: number
  learning_objectives?: any
  approval_status?: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

export interface WorkshopFormData {
  title: string
  description: string
  category: string
  level: string
  duration_total_minutes: number
  thumbnail_url?: string
  slug: string
  price?: number
  learning_objectives?: any
  is_active?: boolean
}

export class InstructorWorkshopsService {
  /**
   * Obtiene todos los talleres del instructor
   */
  static async getInstructorWorkshops(instructorId: string): Promise<InstructorWorkshop[]> {
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
          approval_status,
          approved_by,
          approved_at,
          rejection_reason,
          created_at,
          updated_at
        `)
        .eq('instructor_id', instructorId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching instructor workshops:', error)
        throw error
      }

      return (data || []) as InstructorWorkshop[]
    } catch (error) {
      console.error('Error in InstructorWorkshopsService.getInstructorWorkshops:', error)
      throw error
    }
  }

  /**
   * Crea un nuevo taller para el instructor
   */
  static async createWorkshop(instructorId: string, workshopData: WorkshopFormData): Promise<InstructorWorkshop> {
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
          instructor_id: instructorId,
          is_active: workshopData.is_active || false,
          thumbnail_url: workshopData.thumbnail_url,
          slug: workshopData.slug || workshopData.title.toLowerCase().replace(/\s+/g, '-'),
          price: workshopData.price || 0,
          average_rating: 0,
          student_count: 0,
          review_count: 0,
          learning_objectives: workshopData.learning_objectives || [],
          approval_status: 'pending', // Los nuevos talleres requieren aprobación
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
          approval_status,
          approved_by,
          approved_at,
          rejection_reason,
          created_at,
          updated_at
        `)
        .single()

      if (error) {
        console.error('Error creating workshop:', error)
        throw error
      }

      return data as InstructorWorkshop
    } catch (error) {
      console.error('Error in InstructorWorkshopsService.createWorkshop:', error)
      throw error
    }
  }

  /**
   * Actualiza un taller existente del instructor
   */
  static async updateWorkshop(workshopId: string, instructorId: string, workshopData: Partial<WorkshopFormData>): Promise<InstructorWorkshop> {
    const supabase = await createClient()

    try {
      // Verificar que el taller pertenezca al instructor
      const { data: existingWorkshop } = await supabase
        .from('courses')
        .select('instructor_id, approval_status')
        .eq('id', workshopId)
        .single()

      if (!existingWorkshop || existingWorkshop.instructor_id !== instructorId) {
        throw new Error('No tienes permiso para editar este taller')
      }

      // Si el taller estaba aprobado y se edita, debe volver a pending para nueva aprobación
      const updateData: any = {
        ...workshopData,
        updated_at: new Date().toISOString()
      }

      // Si el taller fue aprobado anteriormente y se edita, requiere nueva aprobación
      if (existingWorkshop.approval_status === 'approved' && Object.keys(workshopData).length > 0) {
        updateData.approval_status = 'pending'
        updateData.approved_by = null
        updateData.approved_at = null
        updateData.rejection_reason = null
      }

      const { data, error } = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', workshopId)
        .eq('instructor_id', instructorId)
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
          approval_status,
          approved_by,
          approved_at,
          rejection_reason,
          created_at,
          updated_at
        `)
        .single()

      if (error) {
        console.error('Error updating workshop:', error)
        throw error
      }

      return data as InstructorWorkshop
    } catch (error) {
      console.error('Error in InstructorWorkshopsService.updateWorkshop:', error)
      throw error
    }
  }

  /**
   * Obtiene un taller por id (sin restricciones de instructor, para vista previa)
   */
  static async getWorkshopById(workshopId: string): Promise<InstructorWorkshop | null> {
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
          approval_status,
          approved_by,
          approved_at,
          rejection_reason,
          created_at,
          updated_at
        `)
        .eq('id', workshopId)
        .single()

      if (error) {
        if ((error as any)?.code === 'PGRST116') return null
        throw error
      }

      return (data || null) as InstructorWorkshop | null
    } catch (error) {
      console.error('Error in InstructorWorkshopsService.getWorkshopById:', error)
      throw error
    }
  }
}
