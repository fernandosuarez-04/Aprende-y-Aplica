import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/business/teams/[id]/members
 * Lista los miembros de un equipo
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

    // Obtener miembros activos
    const { data: members, error: membersError } = await supabase
      .from('work_team_members')
      .select(`
        id,
        team_id,
        user_id,
        role,
        joined_at,
        status,
        created_at,
        updated_at
      `)
      .eq('team_id', teamId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true })

    if (membersError) {
      logger.error('Error fetching team members:', membersError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener miembros'
      }, { status: 500 })
    }

    // Enriquecer con información de usuarios
    const enrichedMembers = await Promise.all(
      (members || []).map(async (member) => {
        const { data: user } = await supabase
          .from('users')
          .select('id, display_name, first_name, last_name, email, profile_picture_url')
          .eq('id', member.user_id)
          .single()

        return {
          ...member,
          user: user ? {
            id: user.id,
            name: user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
            email: user.email,
            profile_picture_url: user.profile_picture_url,
            display_name: user.display_name
          } : null
        }
      })
    )

    return NextResponse.json({
      success: true,
      members: enrichedMembers
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/teams/[id]/members GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

/**
 * POST /api/business/teams/[id]/members
 * Agrega miembros a un equipo
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

    const { id: teamId } = await params
    const body = await request.json()
    const { user_ids, role = 'member' } = body

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Debes proporcionar al menos un usuario'
      }, { status: 400 })
    }

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

    // Validar que los usuarios pertenezcan a la organización
    const { data: orgUsers, error: orgUsersError } = await supabase
      .from('organization_users')
      .select('user_id')
      .eq('organization_id', auth.organizationId)
      .in('user_id', user_ids)
      .eq('status', 'active')

    if (orgUsersError) {
      logger.error('Error validating organization users:', orgUsersError)
      return NextResponse.json({
        success: false,
        error: 'Error al validar usuarios'
      }, { status: 500 })
    }

    if (!orgUsers || orgUsers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Ninguno de los usuarios pertenece a tu organización'
      }, { status: 400 })
    }

    const validUserIds = orgUsers.map((u: any) => u.user_id)

    // Verificar usuarios que ya son miembros (activos o inactivos)
    const { data: existingMembers } = await supabase
      .from('work_team_members')
      .select('id, user_id, status')
      .eq('team_id', teamId)
      .in('user_id', validUserIds)

    // Separar en miembros activos e inactivos
    const activeUserIds = existingMembers?.filter((m: any) => m.status === 'active').map((m: any) => m.user_id) || []
    const inactiveMemberRecords = existingMembers?.filter((m: any) => m.status === 'inactive') || []
    const inactiveUserIds = inactiveMemberRecords.map((m: any) => m.user_id)

    // Usuarios a insertar (completamente nuevos)
    const newUserIds = validUserIds.filter((id: string) => !activeUserIds.includes(id) && !inactiveUserIds.includes(id))

    // Usuarios a reactivar (existían pero estaban inactivos)
    const usersToReactivate = validUserIds.filter((id: string) => inactiveUserIds.includes(id))
    const recordsToReactivate = inactiveMemberRecords.filter((m: any) => usersToReactivate.includes(m.user_id))

    if (newUserIds.length === 0 && usersToReactivate.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Todos los usuarios ya son miembros activos del equipo'
      }, { status: 400 })
    }

    let addedCount = 0

    // Reactivar miembros inactivos
    if (recordsToReactivate.length > 0) {
      const idsToReactivate = recordsToReactivate.map((m: any) => m.id)
      const { error: reactivateError } = await supabase
        .from('work_team_members')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .in('id', idsToReactivate)

      if (reactivateError) {
        logger.error('Error reactivating team members:', reactivateError)
      } else {
        addedCount += recordsToReactivate.length
      }
    }

    // Insertar nuevos miembros
    if (newUserIds.length > 0) {
      const membersToInsert = newUserIds.map((userId: string) => ({
        team_id: teamId,
        user_id: userId,
        role: role,
        status: 'active'
      }))

      const { data: insertedMembers, error: insertError } = await supabase
        .from('work_team_members')
        .insert(membersToInsert)
        .select()

      if (insertError || !insertedMembers) {
        logger.error('Error adding team members:', insertError)
        return NextResponse.json({
          success: false,
          error: 'Error al agregar miembros'
        }, { status: 500 })
      }
      addedCount += insertedMembers.length
    }

    return NextResponse.json({
      success: true,
      message: `${addedCount} miembro(s) agregado(s) exitosamente`
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/teams/[id]/members POST:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}



