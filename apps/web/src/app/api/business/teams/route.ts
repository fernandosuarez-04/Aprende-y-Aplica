import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { SessionService } from '@/features/auth/services/session.service'

/**
 * GET /api/business/teams
 * Lista todos los equipos de la organización
 * 🚀 OPTIMIZADO: Eliminado problema N+1, todas las queries en paralelo
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

    // 🚀 OPTIMIZACIÓN: Una sola query para obtener equipos
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
        image_url,
        created_at,
        updated_at
      `)
      .eq('organization_id', auth.organizationId)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (teamsError) {
      logger.error('Error fetching teams:', teamsError)
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

    if (!teams || teams.length === 0) {
      return NextResponse.json({
        success: true,
        teams: []
      }, {
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60'
        }
      })
    }

    // 🚀 OPTIMIZACIÓN: Recopilar todos los IDs necesarios
    const teamIds = teams.map(t => t.team_id)
    const leaderIds = [...new Set(teams.map(t => t.team_leader_id).filter(Boolean))]
    const courseIds = [...new Set(teams.map(t => t.course_id).filter(Boolean))]

    // 🚀 OPTIMIZACIÓN: Ejecutar todas las queries dependientes en paralelo
    // Antes: N queries por cada equipo (problema N+1)
    // Después: 3 queries en paralelo independientes del número de equipos
    const [
      { data: members, error: membersError },
      { data: leaders },
      { data: courses }
    ] = await Promise.all([
      // Query de miembros (una sola query para todos los equipos)
      supabase
        .from('work_team_members')
        .select('team_id, status')
        .in('team_id', teamIds),

      // Query de líderes (una sola query para todos los líderes)
      leaderIds.length > 0
        ? supabase
            .from('users')
            .select('id, display_name, first_name, last_name, email, profile_picture_url')
            .in('id', leaderIds)
        : Promise.resolve({ data: [] }),

      // Query de cursos (una sola query para todos los cursos)
      courseIds.length > 0
        ? supabase
            .from('courses')
            .select('id, title, thumbnail_url')
            .in('id', courseIds)
        : Promise.resolve({ data: [] })
    ])

    if (membersError) {
      logger.error('Error fetching members:', membersError)
    }

    // 🚀 OPTIMIZACIÓN: Crear mapas para búsqueda O(1)
    // Mapa de conteo de miembros por equipo
    const memberCounts: Record<string, { total: number; active: number }> = {}
    teamIds.forEach(teamId => {
      const teamMembers = (members || []).filter(m => m.team_id === teamId)
      memberCounts[teamId] = {
        total: teamMembers.length,
        active: teamMembers.filter(m => m.status === 'active').length
      }
    })

    // Mapa de líderes
    const leadersMap = new Map((leaders || []).map(leader => [
      leader.id,
      {
        id: leader.id,
        name: leader.display_name || `${leader.first_name || ''} ${leader.last_name || ''}`.trim() || leader.email,
        email: leader.email,
        profile_picture_url: leader.profile_picture_url
      }
    ]))

    // Mapa de cursos
    const coursesMap = new Map((courses || []).map(course => [
      course.id,
      {
        id: course.id,
        title: course.title,
        thumbnail_url: course.thumbnail_url
      }
    ]))

    // 🚀 OPTIMIZACIÓN: Enriquecer equipos sin queries adicionales
    const enrichedTeams = teams.map(team => ({
      ...team,
      team_leader: team.team_leader_id ? leadersMap.get(team.team_leader_id) || null : null,
      course: team.course_id ? coursesMap.get(team.course_id) || null : null,
      member_count: memberCounts[team.team_id]?.total || 0,
      active_member_count: memberCounts[team.team_id]?.active || 0
    }))

    return NextResponse.json({
      success: true,
      teams: enrichedTeams
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60'
      }
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
    const { name, description, team_leader_id, course_id, member_ids, metadata, image_url } = body

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
        metadata: metadata || {},
        image_url: image_url || null
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
        image_url,
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
