import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { SubscriptionService } from '@/features/business-panel/services/subscription.service'
import { SessionService } from '@/features/auth/services/session.service'

/**
 * POST /api/business/hierarchy/courses/assign
 * Asigna cursos a todos los usuarios de una entidad de jerarquía (región, zona o equipo)
 * Requiere: membresía activa Y que la organización haya adquirido los cursos primero
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado'
      }, { status: 401 })
    }

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'No tienes una organización asignada'
      }, { status: 403 })
    }

    const organizationId = auth.organizationId

    // Validar que la organización tenga membresía activa
    const hasSubscription = await SubscriptionService.hasActiveSubscription(currentUser.id)
    if (!hasSubscription) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere una membresía activa (Team/Enterprise) para asignar cursos'
      }, { status: 403 })
    }

    const body = await request.json()
    const { entity_type, entity_id, course_ids, start_date, due_date, approach, message } = body

    // Validar parámetros
    if (!entity_type || !entity_id || !course_ids || !Array.isArray(course_ids) || course_ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere entity_type (region|zone|team), entity_id y course_ids (array no vacío)'
      }, { status: 400 })
    }

    if (!['region', 'zone', 'team'].includes(entity_type)) {
      return NextResponse.json({
        success: false,
        error: 'entity_type debe ser: region, zone o team'
      }, { status: 400 })
    }

    // Validar UUIDs
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entity_id)) {
      return NextResponse.json({
        success: false,
        error: 'entity_id debe ser un UUID válido'
      }, { status: 400 })
    }

    for (const courseId of course_ids) {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId)) {
        return NextResponse.json({
          success: false,
          error: `course_id inválido: ${courseId}`
        }, { status: 400 })
      }
    }

    const supabase = await createClient()

    // Verificar que la entidad existe y pertenece a la organización
    let entityQuery
    if (entity_type === 'region') {
      entityQuery = supabase.from('organization_regions').select('id, name').eq('id', entity_id).eq('organization_id', organizationId).single()
    } else if (entity_type === 'zone') {
      entityQuery = supabase.from('organization_zones').select('id, name').eq('id', entity_id).eq('organization_id', organizationId).single()
    } else {
      entityQuery = supabase.from('organization_teams').select('id, name').eq('id', entity_id).eq('organization_id', organizationId).single()
    }

    const { data: entity, error: entityError } = await entityQuery

    if (entityError || !entity) {
      logger.error(`Error validando ${entity_type}:`, entityError)
      return NextResponse.json({
        success: false,
        error: `${entity_type} no encontrado o no pertenece a tu organización`
      }, { status: 404 })
    }

    // Obtener todos los usuarios de la entidad
    let usersQuery
    if (entity_type === 'region') {
      usersQuery = supabase
        .from('organization_users')
        .select('user_id')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .eq('region_id', entity_id)
    } else if (entity_type === 'zone') {
      usersQuery = supabase
        .from('organization_users')
        .select('user_id')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .eq('zone_id', entity_id)
    } else {
      usersQuery = supabase
        .from('organization_users')
        .select('user_id')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .eq('team_id', entity_id)
    }

    const { data: orgUsers, error: usersError } = await usersQuery

    if (usersError) {
      logger.error('Error obteniendo usuarios de la entidad:', usersError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener usuarios de la entidad'
      }, { status: 500 })
    }

    if (!orgUsers || orgUsers.length === 0) {
      return NextResponse.json({
        success: false,
        error: `No hay usuarios activos en este ${entity_type}`
      }, { status: 400 })
    }

    const user_ids = orgUsers.map(u => u.user_id)

    // Validar que la organización haya adquirido todos los cursos
    const { data: orgPurchases, error: purchaseError } = await supabase
      .from('organization_course_purchases')
      .select('course_id')
      .eq('organization_id', organizationId)
      .in('course_id', course_ids)
      .eq('access_status', 'active')

    if (purchaseError) {
      logger.error('Error validando compras de cursos:', purchaseError)
      return NextResponse.json({
        success: false,
        error: 'Error al validar cursos adquiridos'
      }, { status: 500 })
    }

    const purchasedCourseIds = orgPurchases?.map(p => p.course_id) || []
    const missingCourses = course_ids.filter(id => !purchasedCourseIds.includes(id))

    if (missingCourses.length > 0) {
      return NextResponse.json({
        success: false,
        error: `La organización no ha adquirido los siguientes cursos: ${missingCourses.join(', ')}`
      }, { status: 403 })
    }

    // Validar fechas si están presentes
    if (start_date && due_date) {
      const startDateObj = new Date(start_date)
      const dueDateObj = new Date(due_date)
      
      if (startDateObj > dueDateObj) {
        return NextResponse.json({
          success: false,
          error: 'La fecha de inicio no puede ser posterior a la fecha límite'
        }, { status: 400 })
      }
    }

    // Validar approach si está presente
    if (approach && !['fast', 'balanced', 'long', 'custom'].includes(approach)) {
      return NextResponse.json({
        success: false,
        error: 'Enfoque inválido. Debe ser: fast, balanced, long o custom'
      }, { status: 400 })
    }

    // Procesar cada curso
    const results = []
    
    for (const courseId of course_ids) {
      // Obtener información del curso
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('id', courseId)
        .single()

      if (courseError || !course) {
        logger.warn(`Curso ${courseId} no encontrado, saltando...`)
        results.push({
          course_id: courseId,
          success: false,
          error: 'Curso no encontrado'
        })
        continue
      }

      // Verificar asignaciones existentes
      const { data: existingAssignments } = await supabase
        .from('organization_course_assignments')
        .select('user_id')
        .eq('course_id', courseId)
        .in('user_id', user_ids)
        .in('status', ['assigned', 'in_progress'])

      const existingUserIds = existingAssignments?.map(a => a.user_id) || []
      const newUserIds = user_ids.filter(id => !existingUserIds.includes(id))

      if (newUserIds.length === 0) {
        results.push({
          course_id: courseId,
          course_title: course.title,
          success: true,
          assigned_count: 0,
          already_assigned_count: user_ids.length,
          message: 'Todos los usuarios ya tenían este curso asignado'
        })
        continue
      }

      // Crear asignaciones
      const assignments = newUserIds.map(userId => ({
        organization_id: organizationId,
        user_id: userId,
        course_id: courseId,
        assigned_by: currentUser.id,
        assigned_at: new Date().toISOString(),
        due_date: due_date || null,
        start_date: start_date || null,
        approach: approach || null,
        message: message && message.trim() ? message.trim() : null,
        status: 'assigned',
        completion_percentage: 0
      }))

      const { data: createdAssignments, error: assignError } = await supabase
        .from('organization_course_assignments')
        .insert(assignments)
        .select()

      if (assignError || !createdAssignments) {
        logger.error(`Error asignando curso ${courseId}:`, assignError)
        results.push({
          course_id: courseId,
          course_title: course.title,
          success: false,
          error: assignError?.message || 'Error al asignar el curso'
        })
        continue
      }

      // Crear enrollments para usuarios que no tengan uno
      const enrollmentsToCreate = []
      for (const userId of newUserIds) {
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
            organization_id: organizationId,
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
          logger.warn(`Error creando enrollments para curso ${courseId}:`, enrollError)
          // No fallamos, solo lo registramos
        }
      }

      results.push({
        course_id: courseId,
        course_title: course.title,
        success: true,
        assigned_count: createdAssignments.length,
        already_assigned_count: existingUserIds.length
      })
    }

    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)

    logger.info(`✅ Asignación de cursos completada para ${entity_type} ${entity_id}:`, {
      total_courses: course_ids.length,
      successful: successful.length,
      failed: failed.length,
      total_users: user_ids.length
    })

    return NextResponse.json({
      success: failed.length === 0,
      message: failed.length === 0
        ? `${successful.length} curso(s) asignado(s) exitosamente a ${user_ids.length} usuario(s)`
        : `${successful.length} curso(s) asignado(s), ${failed.length} fallaron`,
      data: {
        entity_type,
        entity_id,
        entity_name: entity.name,
        total_users: user_ids.length,
        results
      }
    })
  } catch (error: any) {
    logger.error('Error inesperado en POST /api/business/hierarchy/courses/assign:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor'
    }, { status: 500 })
  }
}

