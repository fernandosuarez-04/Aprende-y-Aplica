import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { requireBusinessUser } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'

/**
 * API para obtener la información de un equipo específico
 * El slug puede ser el slug real o un slug generado "nombre-teamid"
 * GET /api/business-user/teams/[slug]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await requireBusinessUser()
    if (auth instanceof NextResponse) {
      return auth
    }

    if (!auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    const { slug } = await params
    const supabase = await createClient()
    const userId = auth.userId

    logger.log('👥 Fetching team by slug:', slug, 'for user:', userId)

    // Extraer el team_id del slug (formato: nombre-abc12345)
    // El slug generado termina con los primeros 8 caracteres del UUID
    const slugParts = slug.split('-')
    const possibleTeamIdPrefix = slugParts[slugParts.length - 1]

    // Primero intentar buscar por slug exacto (si la columna existe)
    // Luego buscar por team_id que empiece con el prefijo
    let team = null
    let teamError = null

    // Buscar equipos del usuario y filtrar por el slug
    const { data: memberships } = await supabase
      .from('work_team_members')
      .select('team_id')
      .eq('user_id', userId)
      .eq('status', 'active')

    if (!memberships || memberships.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No tienes acceso a ningún equipo' },
        { status: 403 }
      )
    }

    const teamIds = memberships.map(m => m.team_id)

    console.log('🔵 [teams/slug] Looking for slug:', slug, 'in teams:', teamIds)

    // Buscar el equipo que coincida con el prefijo del ID
    const { data: teams, error: fetchError } = await supabase
      .from('work_teams')
      .select('team_id, name, description, image_url, status, created_at, team_leader_id, organization_id')
      .in('team_id', teamIds)
      .eq('status', 'active')

    console.log('🔵 [teams/slug] Teams found:', teams?.length || 0, 'error:', fetchError?.message)

    teamError = fetchError

    if (teams && teams.length > 0) {
      // Buscar el equipo que coincida con el slug
      team = teams.find(t => {
        // Generar el slug esperado para este equipo
        const generatedSlug = t.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
        
        const fullGeneratedSlug = `${generatedSlug || 'equipo'}-${t.team_id.substring(0, 8)}`
        
        console.log('🔵 [teams/slug] Comparing:', { input: slug, generated: fullGeneratedSlug })
        
        // Comparar el slug generado con el slug de la URL
        return fullGeneratedSlug === slug
      })
    }

    if (teamError || !team) {
      logger.error('Team not found:', teamError)
      return NextResponse.json(
        { success: false, error: 'Equipo no encontrado' },
        { status: 404 }
      )
    }

    // Paso 2: Verificar que el usuario es miembro del equipo
    const { data: membership, error: membershipError } = await supabase
      .from('work_team_members')
      .select('id, role, status, joined_at')
      .eq('team_id', team.team_id)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      logger.error('User is not a member of this team')
      return NextResponse.json(
        { success: false, error: 'No tienes acceso a este equipo' },
        { status: 403 }
      )
    }

    // Paso 3: Obtener todos los miembros del equipo
    const { data: membersData, error: membersError } = await supabase
      .from('work_team_members')
      .select('id, user_id, role, status, joined_at')
      .eq('team_id', team.team_id)
      .eq('status', 'active')

    if (membersError) {
      logger.error('Error fetching team members:', membersError)
    }

    // Paso 4: Obtener información de los usuarios miembros
    const memberUserIds = (membersData || []).map(m => m.user_id)
    let usersData: any[] = []
    
    if (memberUserIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, username, email, profile_picture_url')
        .in('id', memberUserIds)

      if (usersError) {
        logger.error('Error fetching users:', usersError)
      } else {
        usersData = users || []
      }
    }

    const usersMap = new Map(usersData.map(u => [u.id, u]))

    // Paso 5: Obtener cursos asignados al equipo
    const { data: teamCourses, error: coursesError } = await supabase
      .from('work_team_course_assignments')
      .select('id, course_id, status, assigned_at, due_date')
      .eq('team_id', team.team_id)
      .in('status', ['assigned', 'in_progress', 'completed'])
      .order('assigned_at', { ascending: false })

    if (coursesError) {
      logger.error('Error fetching team courses:', coursesError)
    }

    // Paso 6: Obtener información de los cursos
    const courseIds = (teamCourses || []).map(c => c.course_id)
    let coursesData: any[] = []

    if (courseIds.length > 0) {
      const { data: courses, error: coursesFetchError } = await supabase
        .from('courses')
        .select('id, title, slug, thumbnail_url')
        .in('id', courseIds)

      if (coursesFetchError) {
        logger.error('Error fetching courses:', coursesFetchError)
      } else {
        coursesData = courses || []
      }
    }

    const coursesMap = new Map(coursesData.map(c => [c.id, c]))

    // Paso 7: Obtener información del líder del equipo
    let leader = null
    if (team.team_leader_id) {
      const { data: leaderData } = await supabase
        .from('users')
        .select('id, first_name, last_name, username, profile_picture_url')
        .eq('id', team.team_leader_id)
        .single()
      
      if (leaderData) {
        leader = {
          id: leaderData.id,
          name: `${leaderData.first_name || ''} ${leaderData.last_name || ''}`.trim() || leaderData.username || 'Líder',
          profile_picture_url: leaderData.profile_picture_url
        }
      }
    }

    // Generar slug para respuesta
    const generateSlug = (name: string, teamId: string): string => {
      let slugStr = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      
      if (!slugStr) slugStr = 'equipo'
      return `${slugStr}-${teamId.substring(0, 8)}`
    }

    // Transformar miembros
    const transformedMembers = (membersData || []).map((m: any) => {
      const user = usersMap.get(m.user_id)
      return {
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        joined_at: m.joined_at,
        name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Usuario' : 'Usuario',
        email: user?.email || '',
        profile_picture_url: user?.profile_picture_url || null,
        isCurrentUser: m.user_id === userId
      }
    })

    // Transformar cursos
    const transformedCourses = (teamCourses || []).map((c: any) => {
      const course = coursesMap.get(c.course_id)
      return {
        id: c.id,
        course_id: c.course_id,
        title: course?.title || 'Curso sin título',
        slug: course?.slug || '',
        thumbnail_url: course?.thumbnail_url || null,
        status: c.status,
        assigned_at: c.assigned_at,
        due_date: c.due_date
      }
    })

    logger.log('✅ Team data prepared:', {
      teamId: team.team_id,
      teamName: team.name,
      membersCount: transformedMembers.length,
      coursesCount: transformedCourses.length
    })

    return NextResponse.json({
      success: true,
      team: {
        id: team.team_id,
        slug: generateSlug(team.name, team.team_id),
        name: team.name,
        description: team.description,
        image_url: team.image_url,
        status: team.status,
        created_at: team.created_at,
        leader: leader,
        member_count: transformedMembers.length
      },
      membership: {
        id: membership.id,
        role: membership.role,
        joined_at: membership.joined_at
      },
      members: transformedMembers,
      courses: transformedCourses
    })
  } catch (error) {
    logger.error('💥 Error in /api/business-user/teams/[slug]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
