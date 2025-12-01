import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * DELETE /api/business/teams/[id]/members/[memberId]
 * Remueve un miembro de un equipo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
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

    const { id: teamId, memberId } = await params
    const supabase = await createClient()

    // Verificar que el equipo existe y pertenece a la organización
    const { data: team, error: teamError } = await supabase
      .from('work_teams')
      .select('team_id')
      .eq('team_id', teamId)
      .eq('organization_id', auth.organizationId)
      .single()

    if (teamError || !team) {
      return NextResponse.json({
        success: false,
        error: 'Equipo no encontrado'
      }, { status: 404 })
    }

    // Verificar que el miembro existe
    const { data: member, error: memberError } = await supabase
      .from('work_team_members')
      .select('id')
      .eq('id', memberId)
      .eq('team_id', teamId)
      .single()

    if (memberError || !member) {
      return NextResponse.json({
        success: false,
        error: 'Miembro no encontrado'
      }, { status: 404 })
    }

    // Eliminar miembro (soft delete - cambiar status a inactive)
    const { error: deleteError } = await supabase
      .from('work_team_members')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)

    if (deleteError) {
      logger.error('Error removing team member:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Error al remover miembro'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Miembro removido exitosamente'
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/teams/[id]/members/[memberId] DELETE:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}



