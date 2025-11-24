import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * PUT /api/business/teams/[id]/objectives/[objectiveId]
 * Actualiza un objetivo
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; objectiveId: string }> }
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

    const { id: teamId, objectiveId } = await params
    const body = await request.json()
    const { title, description, target_value, current_value, metric_type, deadline, status } = body

    const supabase = await createClient()

    // Verificar que el objetivo existe y pertenece al equipo
    const { data: existingObjective, error: existingError } = await supabase
      .from('work_team_objectives')
      .select('objective_id, team_id')
      .eq('objective_id', objectiveId)
      .eq('team_id', teamId)
      .single()

    if (existingError || !existingObjective) {
      return NextResponse.json({
        success: false,
        error: 'Objetivo no encontrado'
      }, { status: 404 })
    }

    // Construir objeto de actualización
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json({
          success: false,
          error: 'El título no puede estar vacío'
        }, { status: 400 })
      }
      updateData.title = title.trim()
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    if (target_value !== undefined) {
      if (typeof target_value !== 'number' || target_value <= 0) {
        return NextResponse.json({
          success: false,
          error: 'El valor objetivo debe ser mayor a 0'
        }, { status: 400 })
      }
      updateData.target_value = target_value
    }

    if (current_value !== undefined) {
      if (typeof current_value !== 'number' || current_value < 0) {
        return NextResponse.json({
          success: false,
          error: 'El valor actual debe ser mayor o igual a 0'
        }, { status: 400 })
      }
      updateData.current_value = current_value
    }

    if (metric_type !== undefined) {
      if (!['completion_percentage', 'average_score', 'participation_rate', 'engagement_rate', 'custom'].includes(metric_type)) {
        return NextResponse.json({
          success: false,
          error: 'Tipo de métrica inválido'
        }, { status: 400 })
      }
      updateData.metric_type = metric_type
    }

    if (deadline !== undefined) {
      updateData.deadline = deadline || null
    }

    if (status !== undefined) {
      if (!['pending', 'in_progress', 'achieved', 'failed'].includes(status)) {
        return NextResponse.json({
          success: false,
          error: 'Estado inválido'
        }, { status: 400 })
      }
      updateData.status = status
    }

    // Actualizar objetivo
    const { data: updatedObjective, error: updateError } = await supabase
      .from('work_team_objectives')
      .update(updateData)
      .eq('objective_id', objectiveId)
      .select()
      .single()

    if (updateError || !updatedObjective) {
      logger.error('Error updating objective:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar objetivo'
      }, { status: 500 })
    }

    // Calcular progreso
    const progress = updatedObjective.target_value > 0
      ? Math.min((updatedObjective.current_value / updatedObjective.target_value) * 100, 100)
      : 0

    return NextResponse.json({
      success: true,
      objective: {
        ...updatedObjective,
        progress_percentage: Math.round(progress * 100) / 100
      },
      message: 'Objetivo actualizado exitosamente'
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/teams/[id]/objectives/[objectiveId] PUT:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/business/teams/[id]/objectives/[objectiveId]
 * Elimina un objetivo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; objectiveId: string }> }
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

    const { id: teamId, objectiveId } = await params
    const supabase = await createClient()

    // Verificar que el objetivo existe
    const { data: objective } = await supabase
      .from('work_team_objectives')
      .select('objective_id')
      .eq('objective_id', objectiveId)
      .eq('team_id', teamId)
      .single()

    if (!objective) {
      return NextResponse.json({
        success: false,
        error: 'Objetivo no encontrado'
      }, { status: 404 })
    }

    // Eliminar objetivo
    const { error: deleteError } = await supabase
      .from('work_team_objectives')
      .delete()
      .eq('objective_id', objectiveId)

    if (deleteError) {
      logger.error('Error deleting objective:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Error al eliminar objetivo'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Objetivo eliminado exitosamente'
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/teams/[id]/objectives/[objectiveId] DELETE:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

