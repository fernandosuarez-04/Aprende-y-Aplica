import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { SubscriptionService } from '@/features/business-panel/services/subscription.service'
import { SessionService } from '@/features/auth/services/session.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const supabase = await createClient()

    // Obtener información del curso
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        category,
        level,
        instructor_id,
        duration_total_minutes,
        thumbnail_url,
        slug,
        is_active,
        price,
        average_rating,
        student_count,
        review_count,
        learning_objectives,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (courseError || !course) {
      logger.error('Error fetching course:', courseError)
      return NextResponse.json({ 
        success: false,
        error: 'Curso no encontrado'
      }, { status: 404 })
    }

    // Obtener información del instructor
    let instructor = null
    if (course.instructor_id) {
      const { data: instructorData, error: instructorError } = await supabase
        .from('users')
        .select('id, first_name, last_name, display_name, username, email, profile_picture_url, bio, linkedin_url, github_url, website_url, location, cargo_rol, type_rol')
        .eq('id', course.instructor_id)
        .single()

      if (!instructorError && instructorData) {
        const name = instructorData.display_name || 
          `${instructorData.first_name || ''} ${instructorData.last_name || ''}`.trim() || 
          instructorData.username || 
          'Instructor'
        
        instructor = {
          id: instructorData.id,
          name,
          email: instructorData.email || '',
          profile_picture_url: instructorData.profile_picture_url,
          bio: instructorData.bio,
          linkedin_url: instructorData.linkedin_url,
          github_url: instructorData.github_url,
          website_url: instructorData.website_url,
          location: instructorData.location,
          cargo_rol: instructorData.cargo_rol,
          type_rol: instructorData.type_rol
        }
      }
    }

    // Obtener módulos del curso
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select(`
        module_id,
        module_title,
        module_description,
        module_order_index,
        module_duration_minutes,
        is_required,
        is_published
      `)
      .eq('course_id', id)
      .eq('is_published', true)
      .order('module_order_index', { ascending: true })

    // Obtener lecciones para cada módulo
    const modulesWithLessons = await Promise.all(
      (modules || []).map(async (module: any) => {
        const { data: lessons, error: lessonsError } = await supabase
          .from('course_lessons')
          .select(`
            lesson_id,
            lesson_title,
            lesson_description,
            lesson_order_index,
            duration_seconds,
            video_provider,
            video_provider_id,
            is_published
          `)
          .eq('module_id', module.module_id)
          .eq('is_published', true)
          .order('lesson_order_index', { ascending: true })

        return {
          ...module,
          lessons: lessons || []
        }
      })
    )

    // Obtener reviews recientes
    const { data: reviews, error: reviewsError } = await supabase
      .from('course_reviews')
      .select(`
        review_id,
        review_title,
        review_content,
        rating,
        is_verified,
        created_at,
        user_id,
        users!inner (display_name, first_name, last_name, username, profile_picture_url)
      `)
      .eq('course_id', id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(10)

    // Calcular estadísticas de módulos y lecciones
    const totalModules = modulesWithLessons.length
    const totalLessons = modulesWithLessons.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)
    const totalDuration = modulesWithLessons.reduce((sum, m) => {
      const moduleDuration = m.module_duration_minutes || 0
      const lessonsDuration = (m.lessons || []).reduce((s: number, l: any) => 
        s + (l.duration_seconds ? Math.floor(l.duration_seconds / 60) : 0), 0
      )
      return sum + Math.max(moduleDuration, lessonsDuration)
    }, 0)

    // Verificar membresía y estado de compra del usuario
    const currentUser = await SessionService.getCurrentUser()
    let hasSubscription = false
    let isPurchased = false
    let canAssign = false

    if (currentUser) {
      // Verificar membresía activa
      hasSubscription = await SubscriptionService.hasActiveSubscription(currentUser.id)

      // Verificar si el usuario ya adquirió el curso
      const { data: purchase } = await supabase
        .from('course_purchases')
        .select('purchase_id')
        .eq('user_id', currentUser.id)
        .eq('course_id', course.id)
        .eq('access_status', 'active')
        .maybeSingle()

      isPurchased = !!purchase
      canAssign = hasSubscription && isPurchased
    }

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        instructor: instructor,
        duration: course.duration_total_minutes,
        thumbnail_url: course.thumbnail_url,
        slug: course.slug,
        price: course.price,
        rating: course.average_rating || 0,
        student_count: course.student_count || 0,
        review_count: course.review_count || 0,
        learning_objectives: course.learning_objectives || [],
        created_at: course.created_at,
        updated_at: course.updated_at,
        stats: {
          total_modules: totalModules,
          total_lessons: totalLessons,
          total_duration_minutes: totalDuration
        },
        modules: modulesWithLessons,
        reviews: reviews?.map((review: any) => ({
          id: review.review_id,
          title: review.review_title,
          content: review.review_content,
          rating: review.rating,
          is_verified: review.is_verified,
          created_at: review.created_at,
          user: {
            name: review.users?.display_name || 
              `${review.users?.first_name || ''} ${review.users?.last_name || ''}`.trim() || 
              review.users?.username || 
              'Usuario',
            profile_picture_url: review.users?.profile_picture_url
          }
        })) || [],
        subscription_status: {
          has_subscription: hasSubscription,
          is_purchased: isPurchased,
          can_assign: canAssign
        }
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/courses/[id]:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener detalles del curso'
    }, { status: 500 })
  }
}

