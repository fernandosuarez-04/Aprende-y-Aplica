import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { SessionService } from '@/features/auth/services/session.service'
import { SubscriptionService } from '@/features/business-panel/services/subscription.service'

/**
 * POST /api/business/teams/[id]/assign-course
 * Asigna un curso a un equipo completo
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'No tienes una organización asignada'
      }, { status: 403 })
    }

    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado'
      }, { status: 401 })
    }

    // Validar que la organización tenga membresía activa
    const hasSubscription = await SubscriptionService.hasActiveSubscription(currentUser.id)
    if (!hasSubscription) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere una membresía activa (Team/Enterprise) para asignar cursos'
      }, { status: 403 })
    }

    const { id: teamId } = await params
    const body = await request.json()
    const { course_id, due_date, message } = body

    if (!course_id) {
      return NextResponse.json({
        success: false,
        error: 'El ID del curso es requerido'
      }, { status: 400 })
    }

    // Validar y formatear la fecha límite si existe
    let formattedDueDate: string | null = null
    if (due_date) {
      try {
        // El input date devuelve YYYY-MM-DD, convertirlo a Date
        const date = new Date(due_date + 'T00:00:00') // Agregar hora para evitar problemas de zona horaria
        if (!isNaN(date.getTime())) {
          // Asegurar que la fecha sea al menos hoy
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          date.setHours(0, 0, 0, 0)
          
          if (date < today) {
            return NextResponse.json({
              success: false,
              error: 'La fecha límite no puede ser anterior a hoy'
            }, { status: 400 })
          }
          // Convertir a formato ISO para PostgreSQL (YYYY-MM-DDTHH:mm:ss.sssZ)
          formattedDueDate = date.toISOString()
        }
      } catch (err) {
        logger.warn('Error parsing due_date:', err)
        // Si hay error, simplemente no asignamos fecha límite
      }
    }

    const supabase = await createClient()

    // Verificar que el equipo existe y pertenece a la organización
    const { data: team, error: teamError } = await supabase
      .from('work_teams')
      .select('team_id, organization_id')
      .eq('team_id', teamId)
      .eq('organization_id', auth.organizationId)
      .eq('status', 'active')
      .single()

    if (teamError || !team) {
      return NextResponse.json({
        success: false,
        error: 'Equipo no encontrado o inactivo'
      }, { status: 404 })
    }

    // Verificar que la organización haya comprado el curso
    const { data: orgPurchase } = await supabase
      .from('organization_course_purchases')
      .select('purchase_id')
      .eq('organization_id', auth.organizationId)
      .eq('course_id', course_id)
      .eq('access_status', 'active')
      .maybeSingle()

    if (!orgPurchase) {
      return NextResponse.json({
        success: false,
        error: 'Tu organización debe adquirir el curso primero antes de poder asignarlo'
      }, { status: 403 })
    }

    // Verificar que el curso existe y está activo
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', course_id)
      .eq('is_active', true)
      .single()

    if (courseError || !course) {
      return NextResponse.json({
        success: false,
        error: 'Curso no encontrado o inactivo'
      }, { status: 404 })
    }

    // Verificar si ya existe una asignación del curso a este equipo
    const { data: existingAssignment } = await supabase
      .from('work_team_course_assignments')
      .select('id')
      .eq('team_id', teamId)
      .eq('course_id', course_id)
      .maybeSingle()

    if (existingAssignment) {
      return NextResponse.json({
        success: false,
        error: 'Este curso ya está asignado a este equipo'
      }, { status: 400 })
    }

    // Obtener miembros activos del equipo
    const { data: teamMembers, error: membersError } = await supabase
      .from('work_team_members')
      .select('user_id')
      .eq('team_id', teamId)
      .eq('status', 'active')

    if (membersError) {
      logger.error('Error fetching team members:', membersError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener miembros del equipo'
      }, { status: 500 })
    }

    if (!teamMembers || teamMembers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'El equipo no tiene miembros activos'
      }, { status: 400 })
    }

    const memberUserIds = teamMembers.map(m => m.user_id)

    // Crear asignación del curso al equipo
    const { data: teamAssignment, error: assignmentError } = await supabase
      .from('work_team_course_assignments')
      .insert({
        team_id: teamId,
        course_id: course_id,
        assigned_by: currentUser.id,
        due_date: formattedDueDate,
        message: message?.trim() || null,
        status: 'assigned'
      })
      .select()
      .single()

    if (assignmentError || !teamAssignment) {
      logger.error('Error creating team course assignment:', assignmentError)
      return NextResponse.json({
        success: false,
        error: 'Error al asignar curso al equipo'
      }, { status: 500 })
    }

    // Crear asignaciones individuales para cada miembro del equipo
    const individualAssignments = memberUserIds.map(userId => ({
      organization_id: auth.organizationId,
      user_id: userId,
      course_id: course_id,
      assigned_by: currentUser.id,
      assigned_at: new Date().toISOString(),
      due_date: formattedDueDate,
      message: message?.trim() || null,
      status: 'assigned',
      completion_percentage: 0
    }))

    const { data: createdAssignments, error: assignError } = await supabase
      .from('organization_course_assignments')
      .insert(individualAssignments)
      .select()

    if (assignError) {
      logger.error('Error creating individual assignments:', assignError)
      // No revertimos la asignación del equipo, solo lo registramos
      logger.warn('Team assignment created but individual assignments failed')
    }

    // Crear enrollments para usuarios que no tengan uno
    const enrollmentsToCreate = []
    for (const userId of memberUserIds) {
      // Verificar si ya existe enrollment
      const { data: existingEnrollment } = await supabase
        .from('user_course_enrollments')
        .select('enrollment_id')
        .eq('user_id', userId)
        .eq('course_id', course_id)
        .single()

      if (!existingEnrollment) {
        enrollmentsToCreate.push({
          user_id: userId,
          course_id: course_id,
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

    logger.info('✅ Course assigned to team:', {
      teamId,
      courseId: course_id,
      membersCount: memberUserIds.length
    })

    return NextResponse.json({
      success: true,
      message: `Curso asignado exitosamente a ${memberUserIds.length} miembro(s) del equipo`,
      data: {
        assignment: teamAssignment,
        members_assigned: memberUserIds.length,
        course_id: course_id,
        course_title: course.title
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/teams/[id]/assign-course:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}


