import { createClient } from '../../../lib/supabase/server'
import { sanitizeSlug, generateUniqueSlugAsync } from '../../../lib/slug'
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
  instructor_profile_picture_url?: string | null
  is_active: boolean // Cambiado de 'status' a 'is_active'
  thumbnail_url?: string // Cambiado de 'image_url' a 'thumbnail_url'
  slug: string
  price?: number
  average_rating?: number
  student_count: number // Cambiado de 'current_students' a 'student_count'
  review_count: number
  learning_objectives?: any // JSONB
  approval_status?: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
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
          approval_status,
          approved_by,
          approved_at,
          rejection_reason,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })

      if (error) {
        // console.error('Error fetching workshops:', error)
        throw error
      }

      // Obtener información del instructor y duración real de módulos para cada taller
      const workshopsWithInstructors = await Promise.all(
        (data || []).map(async (workshop) => {
          // Obtener instructor
          let instructorName = 'Instructor no asignado'
          let instructorProfilePicture: string | null = null

          if (workshop.instructor_id) {
            const { data: instructor } = await supabase
              .from('users')
              .select('display_name, first_name, last_name, profile_picture_url')
              .eq('id', workshop.instructor_id)
              .single()

            if (instructor) {
              instructorName = instructor.display_name ||
                `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
                'Instructor no asignado'
              instructorProfilePicture = instructor.profile_picture_url || null
            }
          }

          // Calcular duración total real desde los módulos
          const { data: modules } = await supabase
            .from('course_modules')
            .select('module_duration_minutes')
            .eq('course_id', workshop.id)

          const calculatedDuration = (modules || []).reduce(
            (sum: number, m: any) => sum + (m.module_duration_minutes || 0),
            0
          )

          // Usar la duración calculada si es mayor que 0, sino usar la almacenada
          const realDuration = calculatedDuration > 0 ? calculatedDuration : (workshop.duration_total_minutes || 0)

          return {
            ...workshop,
            duration_total_minutes: realDuration,
            instructor_name: instructorName,
            instructor_profile_picture_url: instructorProfilePicture
          }
        })
      )

      return workshopsWithInstructors
    } catch (error) {
      // console.error('Error in AdminWorkshopsService.getAllWorkshops:', error)
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
      // console.error('Error in AdminWorkshopsService.getWorkshopStats:', error)
      throw error
    }
  }

  static async createWorkshop(workshopData: Partial<AdminWorkshop>, adminUserId: string, requestInfo?: { ip?: string, userAgent?: string }): Promise<AdminWorkshop> {

    const supabase = await createClient()

    try {
      // ✅ SEGURIDAD: Sanitizar y generar slug único
      let slug: string;

      if (workshopData.slug) {
        slug = sanitizeSlug(workshopData.slug);
      } else if (workshopData.title) {
        slug = sanitizeSlug(workshopData.title);
      } else {
        throw new Error('Se requiere título o slug para crear el taller');
      }

      // Verificar unicidad
      slug = await generateUniqueSlugAsync(slug, async (testSlug) => {
        const { data } = await supabase
          .from('courses')
          .select('slug')
          .eq('slug', testSlug)
          .single();
        return !!data;
      });

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
          slug,
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
        console.error('[AdminWorkshopsService.createWorkshop] ❌ Error creando curso en BD:', error);
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

      // Traducir automáticamente el curso a inglés y portugués
      // IMPORTANTE: Esta operación debe completarse ANTES de devolver la respuesta
      // para evitar que se interrumpa cuando la página se refresca

      // EJECUTAR TRADUCCIÓN DE FORMA SÍNCRONA - NO CONTINUAR HASTA QUE TERMINE

      try {

        const translationModule = await import('@/core/services/courseTranslation.service');
        const { translateCourseOnCreate } = translationModule;

        const courseDataForTranslation = {
          title: data.title || '',
          description: data.description || null,
          learning_objectives: data.learning_objectives || null
        };

        // AWAIT aquí es crítico: debe completarse antes de devolver la respuesta
        const translationResult = await translateCourseOnCreate(
          data.id,
          courseDataForTranslation,
          adminUserId,
          supabase // Pasar el cliente de Supabase existente
        );


        if (!translationResult.success) {
          console.error('[AdminWorkshopsService] ❌ La traducción NO fue exitosa');
          console.error('[AdminWorkshopsService] Errores:', translationResult.errors);
        } else {

        }

      } catch (translationError) {
        // No fallar la creación del curso si falla la traducción
        console.error('[AdminWorkshopsService] ========== ERROR EN TRADUCCIÓN ==========');
        console.error('[AdminWorkshopsService] ❌ EXCEPCIÓN en traducción automática del curso');
        console.error('[AdminWorkshopsService] Tipo de error:', translationError?.constructor?.name || typeof translationError);
        if (translationError instanceof Error) {
          console.error('[AdminWorkshopsService] Mensaje:', translationError.message);
          console.error('[AdminWorkshopsService] Stack trace:', translationError.stack);
        } else {
          console.error('[AdminWorkshopsService] Error (no es instancia de Error):', JSON.stringify(translationError, null, 2));
        }
        // No lanzar el error para que la creación del curso se complete exitosamente
      }

      return data
    } catch (error) {
      // console.error('Error in AdminWorkshopsService.createWorkshop:', error)
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

      // Preparar datos de actualización
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      // Campos básicos
      if (workshopData.title !== undefined) updateData.title = workshopData.title
      if (workshopData.description !== undefined) updateData.description = workshopData.description
      if (workshopData.category !== undefined) updateData.category = workshopData.category
      if (workshopData.level !== undefined) updateData.level = workshopData.level
      if (workshopData.duration_total_minutes !== undefined) updateData.duration_total_minutes = workshopData.duration_total_minutes
      if (workshopData.instructor_id !== undefined) updateData.instructor_id = workshopData.instructor_id
      if (workshopData.is_active !== undefined) updateData.is_active = workshopData.is_active
      if (workshopData.thumbnail_url !== undefined) updateData.thumbnail_url = workshopData.thumbnail_url
      if (workshopData.slug !== undefined) updateData.slug = workshopData.slug
      if (workshopData.price !== undefined) updateData.price = workshopData.price
      if (workshopData.learning_objectives !== undefined) updateData.learning_objectives = workshopData.learning_objectives

      // Campos de aprobación
      if (workshopData.approval_status !== undefined) {
        updateData.approval_status = workshopData.approval_status

        // Si se aprueba, establecer approved_by y approved_at
        if (workshopData.approval_status === 'approved') {
          updateData.approved_by = adminUserId
          updateData.approved_at = new Date().toISOString()
          updateData.rejection_reason = null // Limpiar razón de rechazo si se aprueba
        }

        // Si se rechaza, limpiar approved_by y approved_at
        if (workshopData.approval_status === 'rejected') {
          updateData.approved_by = null
          updateData.approved_at = null
        }

        // Si vuelve a pending, limpiar todo
        if (workshopData.approval_status === 'pending') {
          updateData.approved_by = null
          updateData.approved_at = null
          updateData.rejection_reason = null
        }
      }

      if (workshopData.rejection_reason !== undefined) {
        updateData.rejection_reason = workshopData.rejection_reason
      }

      const { data, error } = await supabase
        .from('courses')
        .update(updateData)
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
          approval_status,
          approved_by,
          approved_at,
          rejection_reason,
          created_at,
          updated_at
        `)
        .single()

      if (error) {
        // console.error('Error updating workshop:', error)
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
      // console.error('Error in AdminWorkshopsService.updateWorkshop:', error)
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
        // console.error('Error deleting workshop:', error)
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
      // console.error('Error in AdminWorkshopsService.deleteWorkshop:', error)
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
        // console.error('Error fetching instructors:', error)
        throw error
      }

      return (data || []).map(user => ({
        id: user.id,
        name: user.display_name ||
          `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
          'Instructor sin nombre'
      }))
    } catch (error) {
      // console.error('Error in AdminWorkshopsService.getInstructors:', error)
      throw error
    }
  }
}
