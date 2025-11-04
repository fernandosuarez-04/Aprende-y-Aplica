import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { SubscriptionService } from '@/features/business-panel/services/subscription.service'
import { SessionService } from '@/features/auth/services/session.service'

/**
 * POST /api/business/courses/[id]/assign
 * Asigna un curso a usuarios de la organización
 * Requiere: membresía activa Y que el usuario haya adquirido el curso primero
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    const { id: courseId } = await params
    const supabase = await createClient()

    // Obtener usuario autenticado
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado'
      }, { status: 401 })
    }

    // Validar que el usuario tenga membresía activa
    const hasSubscription = await SubscriptionService.hasActiveSubscription(currentUser.id)
    if (!hasSubscription) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere una membresía activa para asignar cursos'
      }, { status: 403 })
    }

    // Verificar que el usuario haya adquirido el curso primero
    const { data: purchase } = await supabase
      .from('course_purchases')
      .select('purchase_id')
      .eq('user_id', currentUser.id)
      .eq('course_id', courseId)
      .eq('access_status', 'active')
      .single()

    if (!purchase) {
      return NextResponse.json({
        success: false,
        error: 'Debes adquirir el curso primero antes de asignarlo'
      }, { status: 403 })
    }

    // Verificar que el curso exista y esté activo
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .eq('is_active', true)
      .single()

    if (courseError || !course) {
      logger.error('Error fetching course:', courseError)
      return NextResponse.json({
        success: false,
        error: 'Curso no encontrado'
      }, { status: 404 })
    }

    // Obtener organización del usuario
    if (!currentUser.organization_id) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organización'
      }, { status: 400 })
    }

    // Parsear body de la request
    const body = await request.json()
    const { user_ids, due_date, message } = body

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Debes seleccionar al menos un usuario'
      }, { status: 400 })
    }

    // Validar que todos los usuarios pertenezcan a la misma organización
    const { data: orgUsers, error: orgUsersError } = await supabase
      .from('organization_users')
      .select('user_id, organization_id, status')
      .in('user_id', user_ids)
      .eq('organization_id', currentUser.organization_id)
      .eq('status', 'active')

    if (orgUsersError) {
      logger.error('Error validating organization users:', orgUsersError)
      return NextResponse.json({
        success: false,
        error: 'Error al validar usuarios'
      }, { status: 500 })
    }

    if (!orgUsers || orgUsers.length !== user_ids.length) {
      return NextResponse.json({
        success: false,
        error: 'Algunos usuarios no pertenecen a tu organización o no están activos'
      }, { status: 400 })
    }

    // Verificar que los usuarios no tengan ya el curso asignado
    const { data: existingAssignments } = await supabase
      .from('organization_course_assignments')
      .select('user_id')
      .eq('course_id', courseId)
      .in('user_id', user_ids)
      .in('status', ['assigned', 'in_progress'])

    const existingUserIds = existingAssignments?.map(a => a.user_id) || []
    const newUserIds = user_ids.filter(id => !existingUserIds.includes(id))

    if (newUserIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Todos los usuarios seleccionados ya tienen este curso asignado'
      }, { status: 400 })
    }

    // Crear asignaciones para los usuarios que no tienen el curso
    const assignments = newUserIds.map(userId => ({
      organization_id: currentUser.organization_id,
      user_id: userId,
      course_id: courseId,
      assigned_by: currentUser.id,
      assigned_at: new Date().toISOString(),
      due_date: due_date || null,
      message: message && message.trim() ? message.trim() : null,
      status: 'assigned',
      completion_percentage: 0
    }))

    const { data: createdAssignments, error: assignError } = await supabase
      .from('organization_course_assignments')
      .insert(assignments)
      .select()

    if (assignError || !createdAssignments) {
      logger.error('Error creating assignments:', assignError)
      return NextResponse.json({
        success: false,
        error: 'Error al asignar el curso'
      }, { status: 500 })
    }

    // Crear enrollments para usuarios que no tengan uno
    const enrollmentsToCreate = []
    for (const userId of newUserIds) {
      // Verificar si ya existe enrollment
      const { data: existingEnrollment } = await supabase
        .from('user_course_enrollments')
        .select('enrollment_id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single()

      if (!existingEnrollment) {
        enrollmentsToCreate.push({
          user_id: userId,
          course_id: courseId,
          enrollment_status: 'active',
          overall_progress_percentage: 0,
          enrolled_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString()
        })
      }
    }

    if (enrollmentsToCreate.length > 0) {
      const { error: enrollError } = await supabase
        .from('user_course_enrollments')
        .insert(enrollmentsToCreate)

      if (enrollError) {
        logger.warn('Error creating enrollments:', enrollError)
        // No fallamos, solo lo registramos
      }
    }

    return NextResponse.json({
      success: true,
      message: `Curso asignado exitosamente a ${createdAssignments.length} usuario(s)`,
      data: {
        course_id: courseId,
        course_title: course.title,
        assigned_count: createdAssignments.length,
        already_assigned_count: existingUserIds.length,
        assignments: createdAssignments.map(a => ({
          assignment_id: a.id,
          user_id: a.user_id
        }))
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/courses/[id]/assign:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

