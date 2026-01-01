import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { requireBusinessUser } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'

/**
 * API para obtener la lista de equipos a los que pertenece el usuario
 * GET /api/business-user/my-team
 */
export async function GET() {
  try {
    console.log('🔵 [my-team] Starting API call')
    
    const auth = await requireBusinessUser()
    if (auth instanceof NextResponse) {
      console.log('🔴 [my-team] Auth failed - returning response')
      return auth
    }

    console.log('🟢 [my-team] Auth passed, userId:', auth.userId)

    if (!auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    const userId = auth.userId

    console.log('🔵 [my-team] Fetching memberships for user:', userId)

    // Paso 1: Obtener todas las membresías del usuario
    const { data: memberships, error: membershipError } = await supabase
      .from('work_team_members')
      .select('id, team_id, role, status, joined_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('joined_at', { ascending: false })

    console.log('🔵 [my-team] Memberships result:', { 
      count: memberships?.length || 0, 
      error: membershipError?.message 
    })

    if (membershipError) {
      console.error('🔴 [my-team] Membership error:', membershipError)
      return NextResponse.json(
        { success: false, error: 'Error al obtener información de equipos' },
        { status: 500 }
      )
    }

    if (!memberships || memberships.length === 0) {
      console.log('🟡 [my-team] User has no team memberships')
      return NextResponse.json({
        success: true,
        hasTeams: false,
        teams: [],
        totalTeams: 0
      })
    }

    console.log('🔵 [my-team] Found memberships:', memberships.length)

    // Paso 2: Obtener información de todos los equipos
    // Nota: No incluimos 'slug' por si la migración no se ha ejecutado
    const teamIds = memberships.map(m => m.team_id)
    
    console.log('🔵 [my-team] Fetching teams for IDs:', teamIds)

    const { data: teams, error: teamsError } = await supabase
      .from('work_teams')
      .select('team_id, name, description, image_url, status, created_at, team_leader_id')
      .in('team_id', teamIds)
      .eq('status', 'active')

    console.log('🔵 [my-team] Teams result:', { count: teams?.length || 0, error: teamsError?.message })

    if (teamsError) {
      console.error('🔴 [my-team] Teams error:', teamsError)
      return NextResponse.json(
        { success: false, error: 'Error al obtener equipos' },
        { status: 500 }
      )
    }

    // Paso 3: Obtener conteo de miembros por equipo
    const { data: memberCounts, error: countError } = await supabase
      .from('work_team_members')
      .select('team_id')
      .in('team_id', teamIds)
      .eq('status', 'active')

    if (countError) {
      logger.error('Error fetching member counts:', countError)
    }

    // Crear mapa de conteo de miembros
    const memberCountMap: Record<string, number> = {}
    ;(memberCounts || []).forEach(m => {
      memberCountMap[m.team_id] = (memberCountMap[m.team_id] || 0) + 1
    })

    // Crear mapa de membresías
    const membershipMap = new Map(memberships.map(m => [m.team_id, m]))

    // Paso 4: Obtener información de líderes
    const leaderIds = [...new Set((teams || []).map(t => t.team_leader_id).filter(Boolean))]
    let leadersData: any[] = []

    if (leaderIds.length > 0) {
      const { data: leaders } = await supabase
        .from('users')
        .select('id, first_name, last_name, username, profile_picture_url')
        .in('id', leaderIds)

      leadersData = leaders || []
    }

    const leadersMap = new Map(leadersData.map(l => [l.id, l]))

    // Función para generar slug desde el nombre si no existe
    const generateSlug = (name: string, teamId: string): string => {
      let slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      
      if (!slug) slug = 'equipo'
      
      // Agregar sufijo del ID para unicidad
      return `${slug}-${teamId.substring(0, 8)}`
    }

    // Transformar equipos
    const transformedTeams = (teams || []).map(team => {
      const membership = membershipMap.get(team.team_id)
      const leader = team.team_leader_id ? leadersMap.get(team.team_leader_id) : null

      return {
        id: team.team_id,
        // Generar slug desde el nombre si no existe en la BD
        slug: generateSlug(team.name, team.team_id),
        name: team.name,
        description: team.description,
        image_url: team.image_url,
        status: team.status,
        created_at: team.created_at,
        member_count: memberCountMap[team.team_id] || 0,
        my_role: membership?.role || 'member',
        joined_at: membership?.joined_at,
        leader: leader ? {
          id: leader.id,
          name: `${leader.first_name || ''} ${leader.last_name || ''}`.trim() || leader.username || 'Líder',
          profile_picture_url: leader.profile_picture_url
        } : null
      }
    })

    logger.log('✅ Teams list prepared:', {
      totalTeams: transformedTeams.length,
      userId
    })

    return NextResponse.json({
      success: true,
      hasTeams: transformedTeams.length > 0,
      teams: transformedTeams,
      totalTeams: transformedTeams.length
    })
  } catch (error) {
    logger.error('💥 Error in /api/business-user/my-team:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
