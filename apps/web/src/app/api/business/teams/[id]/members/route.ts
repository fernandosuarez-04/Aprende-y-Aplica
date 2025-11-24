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

    // Obtener miembros
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

    const validUserIds = orgUsers.map(u => u.user_id)

    // Verificar usuarios que ya son miembros
    const { data: existingMembers } = await supabase
      .from('work_team_members')
      .select('user_id')
      .eq('team_id', teamId)
      .in('user_id', validUserIds)

    const existingUserIds = existingMembers?.map(m => m.user_id) || []
    const newUserIds = validUserIds.filter(id => !existingUserIds.includes(id))

    if (newUserIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Todos los usuarios ya son miembros del equipo'
      }, { status: 400 })
    }

    // Insertar nuevos miembros
    const membersToInsert = newUserIds.map(userId => ({
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

    return NextResponse.json({
      success: true,
      members: insertedMembers,
      message: `${insertedMembers.length} miembro(s) agregado(s) exitosamente`
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/teams/[id]/members POST:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}


