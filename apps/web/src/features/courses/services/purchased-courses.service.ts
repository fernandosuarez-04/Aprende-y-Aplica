import { createClient } from '@/lib/supabase/server';

export interface PurchasedCourse {
  purchase_id: string;
  course_id: string;
  course_title: string;
  course_description: string;
  course_thumbnail: string;
  course_slug: string;
  course_category: string;
  instructor_name: string;
  access_status: 'active' | 'suspended' | 'expired' | 'cancelled';
  purchased_at: string;
  access_granted_at: string;
  expires_at?: string;
  enrollment_id: string;
  enrollment_status: string;
  progress_percentage: number;
  last_accessed_at: string;
  started_at: string;
  course_duration_minutes: number;
  estimated_duration?: number;
  difficulty?: string;
}

export class PurchasedCoursesService {
  /**
   * Obtiene todos los cursos comprados por el usuario
   */
  static async getUserPurchasedCourses(userId: string): Promise<PurchasedCourse[]> {
    try {
      const supabase = await createClient();

      // ✅ OPTIMIZACIÓN: Nested JOIN para incluir instructor en la misma query
      // ANTES: 2 consultas (compras+cursos, instructores batch)
      // DESPUÉS: 1 query total con nested JOIN
      const { data, error } = await supabase
        .from('course_purchases')
        .select(`
          purchase_id,
          access_status,
          purchased_at,
          access_granted_at,
          expires_at,
          enrollment_id,
          courses!inner (
            id,
            title,
            description,
            thumbnail_url,
            slug,
            category,
            duration_total_minutes,
            level,
            instructor_id,
            instructor:users!instructor_id (
              id,
              first_name,
              last_name,
              username
            )
          ),
          user_course_enrollments (
            enrollment_status,
            overall_progress_percentage,
            last_accessed_at,
            started_at
          )
        `)
        .eq('user_id', userId)
        .eq('access_status', 'active')
        .order('purchased_at', { ascending: false });

      if (error) {
        // console.error('Error fetching purchased courses:', error);
        throw error;
      }

      // Transformar los datos al formato esperado
      const purchasedCourses: PurchasedCourse[] = (data || []).map((purchase: any) => {
        const course = purchase.courses;
        const enrollment = purchase.user_course_enrollments?.[0] || {};

        // ✅ Instructor info ya viene del nested JOIN
        const instructor = course.instructor;
        const instructorName = instructor
          ? `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() || instructor.username || 'Instructor'
          : 'Instructor';

        return {
          purchase_id: purchase.purchase_id,
          course_id: course.id,
          course_title: course.title,
          course_description: course.description || '',
          course_thumbnail: course.thumbnail_url || '',
          course_slug: course.slug,
          course_category: course.category,
          instructor_name: instructorName,
          access_status: purchase.access_status,
          purchased_at: purchase.purchased_at,
          access_granted_at: purchase.access_granted_at,
          expires_at: purchase.expires_at,
          enrollment_id: purchase.enrollment_id || '',
          enrollment_status: enrollment.enrollment_status || 'active',
          progress_percentage: enrollment.overall_progress_percentage || 0,
          last_accessed_at: enrollment.last_accessed_at || purchase.purchased_at,
          started_at: enrollment.started_at || purchase.purchased_at,
          course_duration_minutes: course.duration_total_minutes || 0,
          estimated_duration: course.duration_total_minutes || 0,
          difficulty: course.level || 'beginner'
        };
      });

      return purchasedCourses;
    } catch (error) {
      // console.error('Error in PurchasedCoursesService.getUserPurchasedCourses:', error);
      throw error;
    }
  }

  /**
   * Verifica si un usuario ha comprado un curso específico
   */
  static async isCoursePurchased(userId: string, courseId: string): Promise<boolean> {
    try {
      const supabase = await createClient();
      
      const { data, error } = await supabase
        .from('course_purchases')
        .select('purchase_id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('access_status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        // console.error('Error checking purchase:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      // console.error('Error in PurchasedCoursesService.isCoursePurchased:', error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas del usuario
   */
  static async getUserLearningStats(userId: string): Promise<{
    total_courses: number;
    completed_courses: number;
    in_progress_courses: number;
    total_time_minutes: number;
    average_progress: number;
  }> {
    try {
      const supabase = await createClient();
      
      // Obtener todos los cursos comprados
      const { data: purchases } = await supabase
        .from('course_purchases')
        .select(`
          courses!inner (
            id,
            duration_total_minutes
          ),
          user_course_enrollments (
            enrollment_status,
            overall_progress_percentage
          )
        `)
        .eq('user_id', userId)
        .eq('access_status', 'active');

      if (!purchases) {
        return {
          total_courses: 0,
          completed_courses: 0,
          in_progress_courses: 0,
          total_time_minutes: 0,
          average_progress: 0
        };
      }

      let completed_courses = 0;
      let in_progress_courses = 0;
      let total_progress = 0;
      let total_time = 0;

      purchases.forEach((purchase: any) => {
        const enrollment = purchase.user_course_enrollments?.[0];
        const course = purchase.courses;
        
        if (course) {
          total_time += course.duration_total_minutes || 0;
        }

        if (enrollment) {
          const status = enrollment.enrollment_status;
          const progress = enrollment.overall_progress_percentage || 0;
          
          if (status === 'completed') {
            completed_courses++;
          } else if (progress > 0 && progress < 100) {
            in_progress_courses++;
          }
          
          total_progress += progress;
        }
      });

      return {
        total_courses: purchases.length,
        completed_courses,
        in_progress_courses,
        total_time_minutes: total_time,
        average_progress: purchases.length > 0 ? total_progress / purchases.length : 0
      };
    } catch (error) {
      // console.error('Error in PurchasedCoursesService.getUserLearningStats:', error);
      throw error;
    }
  }
}

