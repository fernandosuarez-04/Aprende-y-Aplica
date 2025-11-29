import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { SessionService } from '@/features/auth/services/session.service'

/**
 * GET /api/business/teams
 * Lista todos los equipos de la organización
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'No tienes una organización asignada'
      }, { status: 403 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'

    // Obtener equipos de la organización
    const { data: teams, error: teamsError } = await supabase
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
      .eq('organization_id', auth.organizationId)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (teamsError) {
      logger.error('Error fetching teams:', teamsError)
      // Si la tabla no existe, dar un mensaje más claro
      if (teamsError.code === '42P01' || teamsError.message?.includes('does not exist')) {
        return NextResponse.json({
          success: false,
          error: 'Las tablas de equipos no existen en la base de datos. Por favor, ejecuta el script SQL para crear las tablas.'
        }, { status: 500 })
      }
      return NextResponse.json({
        success: false,
        error: teamsError.message || 'Error al obtener equipos'
      }, { status: 500 })
    }

    // Obtener conteo de miembros para cada equipo
    const teamIds = teams?.map(t => t.team_id) || []
    let memberCounts: Record<string, { total: number; active: number }> = {}

    if (teamIds.length > 0) {
      const { data: members, error: membersError } = await supabase
        .from('work_team_members')
        .select('team_id, status')
        .in('team_id', teamIds)

      if (!membersError && members) {
        teamIds.forEach(teamId => {
          const teamMembers = members.filter(m => m.team_id === teamId)
          memberCounts[teamId] = {
            total: teamMembers.length,
            active: teamMembers.filter(m => m.status === 'active').length
          }
        })
      }
    }

    // Enriquecer equipos con información adicional
    const enrichedTeams = await Promise.all(
      (teams || []).map(async (team) => {
        const memberCount = memberCounts[team.team_id] || { total: 0, active: 0 }

        // Obtener información del líder si existe
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

        // Obtener información del curso si existe
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

        return {
          ...team,
          team_leader: teamLeader,
          course: course,
          member_count: memberCount.total,
          active_member_count: memberCount.active
        }
      })
    )

    return NextResponse.json({
      success: true,
      teams: enrichedTeams
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/teams GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

/**
 * POST /api/business/teams
 * Crea un nuevo equipo
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { name, description, team_leader_id, course_id, member_ids, metadata } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'El nombre del equipo es requerido'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Crear el equipo
    const { data: team, error: teamError } = await supabase
      .from('work_teams')
      .insert({
        organization_id: auth.organizationId,
        name: name.trim(),
        description: description?.trim() || null,
        team_leader_id: team_leader_id || null,
        created_by: currentUser.id,
        course_id: course_id || null,
        status: 'active',
        metadata: metadata || {}
      })
      .select()
      .single()

    if (teamError || !team) {
      logger.error('Error creating team:', teamError)
      return NextResponse.json({
        success: false,
        error: 'Error al crear el equipo'
      }, { status: 500 })
    }

    // Agregar miembros si se proporcionaron
    if (member_ids && Array.isArray(member_ids) && member_ids.length > 0) {
      // Validar que los usuarios pertenezcan a la organización
      const { data: orgUsers, error: orgUsersError } = await supabase
        .from('organization_users')
        .select('user_id')
        .eq('organization_id', auth.organizationId)
        .in('user_id', member_ids)
        .eq('status', 'active')

      if (orgUsersError) {
        logger.error('Error validating organization users:', orgUsersError)
        // Continuar sin miembros, el equipo ya está creado
      } else if (orgUsers && orgUsers.length > 0) {
        const validUserIds = orgUsers.map(u => u.user_id)
        
        // Agregar el líder como miembro si no está en la lista
        const allMemberIds = team_leader_id && !validUserIds.includes(team_leader_id)
          ? [...validUserIds, team_leader_id]
          : validUserIds

        const membersToInsert = allMemberIds.map(userId => ({
          team_id: team.team_id,
          user_id: userId,
          role: userId === team_leader_id ? 'leader' : 'member',
          status: 'active'
        }))

        const { error: membersError } = await supabase
          .from('work_team_members')
          .insert(membersToInsert)

        if (membersError) {
          logger.error('Error adding team members:', membersError)
          // Continuar, el equipo ya está creado
        }
      }
    } else if (team_leader_id) {
      // Si solo hay líder, agregarlo como miembro
      const { error: leaderError } = await supabase
        .from('work_team_members')
        .insert({
          team_id: team.team_id,
          user_id: team_leader_id,
          role: 'leader',
          status: 'active'
        })

      if (leaderError) {
        logger.error('Error adding team leader as member:', leaderError)
      }
    }

    // Obtener el equipo completo con relaciones
    const { data: fullTeam, error: fullTeamError } = await supabase
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
      .eq('team_id', team.team_id)
      .single()

    if (fullTeamError || !fullTeam) {
      logger.error('Error fetching created team:', fullTeamError)
      return NextResponse.json({
        success: false,
        error: 'Equipo creado pero error al obtener detalles'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      team: fullTeam,
      message: 'Equipo creado exitosamente'
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/teams POST:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

