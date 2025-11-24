import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { SessionService } from '@/features/auth/services/session.service'

/**
 * GET /api/business/teams/[id]
 * Obtiene detalles de un equipo
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
    const supabase = await createClient()

    // Obtener el equipo
    const { data: team, error: teamError } = await supabase
      .from('work_teams')
      .select(`
        team_id,
        organization_id,
        name,
        description,
        team_leader_id,
        created_by,
        course_id,
        status,
        metadata,
        created_at,
        updated_at
      `)
      .eq('team_id', teamId)
      .eq('organization_id', auth.organizationId)
      .single()

    if (teamError || !team) {
      logger.error('Error fetching team:', teamError)
      return NextResponse.json({
        success: false,
        error: 'Equipo no encontrado'
      }, { status: 404 })
    }

    // Obtener información del líder
    let teamLeader = null
    if (team.team_leader_id) {
      const { data: leader } = await supabase
        .from('users')
        .select('id, display_name, first_name, last_name, email, profile_picture_url')
        .eq('id', team.team_leader_id)
        .single()
      
      if (leader) {
        teamLeader = {
          id: leader.id,
          name: leader.display_name || `${leader.first_name || ''} ${leader.last_name || ''}`.trim() || leader.email,
          email: leader.email,
          profile_picture_url: leader.profile_picture_url
        }
      }
    }

    // Obtener información del curso
    let course = null
    if (team.course_id) {
      const { data: courseData } = await supabase
        .from('courses')
        .select('id, title, thumbnail_url')
        .eq('id', team.course_id)
        .single()
      
      if (courseData) {
        course = {
          id: courseData.id,
          title: courseData.title,
          thumbnail_url: courseData.thumbnail_url
        }
      }
    }

    // Obtener conteo de miembros
    const { count: memberCount } = await supabase
      .from('work_team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .eq('status', 'active')

    const { count: activeMemberCount } = await supabase
      .from('work_team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .eq('status', 'active')

    return NextResponse.json({
      success: true,
      team: {
        ...team,
        team_leader: teamLeader,
        course: course,
        member_count: memberCount || 0,
        active_member_count: activeMemberCount || 0
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/teams/[id] GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

/**
 * PUT /api/business/teams/[id]
 * Actualiza un equipo
 */
export async function PUT(
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
    const supabase = await createClient()

    // Verificar que el equipo existe y pertenece a la organización
    const { data: existingTeam, error: existingError } = await supabase
      .from('work_teams')
      .select('team_id, organization_id')
      .eq('team_id', teamId)
      .eq('organization_id', auth.organizationId)
      .single()

    if (existingError || !existingTeam) {
      return NextResponse.json({
        success: false,
        error: 'Equipo no encontrado'
      }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, team_leader_id, course_id, status, metadata } = body

    // Construir objeto de actualización
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({
          success: false,
          error: 'El nombre del equipo no puede estar vacío'
        }, { status: 400 })
      }
      updateData.name = name.trim()
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    if (team_leader_id !== undefined) {
      updateData.team_leader_id = team_leader_id || null
    }

    if (course_id !== undefined) {
      updateData.course_id = course_id || null
    }

    if (status !== undefined) {
      if (!['active', 'inactive', 'archived'].includes(status)) {
        return NextResponse.json({
          success: false,
          error: 'Estado inválido'
        }, { status: 400 })
      }
      updateData.status = status
    }

    if (metadata !== undefined) {
      updateData.metadata = metadata || {}
    }

    // Actualizar el equipo
    const { data: updatedTeam, error: updateError } = await supabase
      .from('work_teams')
      .update(updateData)
      .eq('team_id', teamId)
      .select()
      .single()

    if (updateError || !updatedTeam) {
      logger.error('Error updating team:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar el equipo'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      team: updatedTeam,
      message: 'Equipo actualizado exitosamente'
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/teams/[id] PUT:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/business/teams/[id]
 * Elimina un equipo (soft delete - cambia status a archived)
 */
export async function DELETE(
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
    const supabase = await createClient()

    // Verificar que el equipo existe y pertenece a la organización
    const { data: existingTeam, error: existingError } = await supabase
      .from('work_teams')
      .select('team_id, organization_id')
      .eq('team_id', teamId)
      .eq('organization_id', auth.organizationId)
      .single()

    if (existingError || !existingTeam) {
      return NextResponse.json({
        success: false,
        error: 'Equipo no encontrado'
      }, { status: 404 })
    }

    // Soft delete - cambiar status a archived
    const { error: deleteError } = await supabase
      .from('work_teams')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString()
      })
      .eq('team_id', teamId)

    if (deleteError) {
      logger.error('Error deleting team:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Error al eliminar el equipo'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Equipo eliminado exitosamente'
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/teams/[id] DELETE:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

