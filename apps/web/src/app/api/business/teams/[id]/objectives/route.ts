import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { SessionService } from '@/features/auth/services/session.service'

/**
 * GET /api/business/teams/[id]/objectives
 * Lista los objetivos de un equipo
 */
export async function GET(
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

    const { id: teamId } = await params
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')
    const supabase = await createClient()

    // Verificar que el equipo existe
    const { data: team } = await supabase
      .from('work_teams')
      .select('team_id')
      .eq('team_id', teamId)
      .eq('organization_id', auth.organizationId)
      .single()

    if (!team) {
      return NextResponse.json({
        success: false,
        error: 'Equipo no encontrado'
      }, { status: 404 })
    }

    // Obtener objetivos
    let query = supabase
      .from('work_team_objectives')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })

    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    const { data: objectives, error: objectivesError } = await query

    if (objectivesError) {
      logger.error('Error fetching objectives:', objectivesError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener objetivos'
      }, { status: 500 })
    }

    // Calcular progreso para cada objetivo
    const enrichedObjectives = (objectives || []).map(obj => {
      const progress = obj.target_value > 0
        ? Math.min((obj.current_value / obj.target_value) * 100, 100)
        : 0

      return {
        ...obj,
        progress_percentage: Math.round(progress * 100) / 100
      }
    })

    return NextResponse.json({
      success: true,
      objectives: enrichedObjectives
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/teams/[id]/objectives GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

/**
 * POST /api/business/teams/[id]/objectives
 * Crea un objetivo para un equipo
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

    const { id: teamId } = await params
    const body = await request.json()
    const { title, description, course_id, target_value, metric_type, deadline } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'El título del objetivo es requerido'
      }, { status: 400 })
    }

    if (!target_value || typeof target_value !== 'number' || target_value <= 0) {
      return NextResponse.json({
        success: false,
        error: 'El valor objetivo debe ser un número mayor a 0'
      }, { status: 400 })
    }

    if (!metric_type || !['completion_percentage', 'average_score', 'participation_rate', 'engagement_rate', 'custom'].includes(metric_type)) {
      return NextResponse.json({
        success: false,
        error: 'Tipo de métrica inválido'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar que el equipo existe
    const { data: team } = await supabase
      .from('work_teams')
      .select('team_id')
      .eq('team_id', teamId)
      .eq('organization_id', auth.organizationId)
      .single()

    if (!team) {
      return NextResponse.json({
        success: false,
        error: 'Equipo no encontrado'
      }, { status: 404 })
    }

    // Crear objetivo
    const { data: objective, error: objectiveError } = await supabase
      .from('work_team_objectives')
      .insert({
        team_id: teamId,
        course_id: course_id || null,
        title: title.trim(),
        description: description?.trim() || null,
        target_value: target_value,
        current_value: 0,
        metric_type: metric_type,
        deadline: deadline || null,
        status: 'pending',
        created_by: currentUser.id
      })
      .select()
      .single()

    if (objectiveError || !objective) {
      logger.error('Error creating objective:', objectiveError)
      return NextResponse.json({
        success: false,
        error: 'Error al crear objetivo'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      objective: {
        ...objective,
        progress_percentage: 0
      },
      message: 'Objetivo creado exitosamente'
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/teams/[id]/objectives POST:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

