import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/business/teams/[id]/courses
 * Obtiene los cursos asignados a un equipo
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

    // Obtener asignaciones de cursos
    const { data: assignments, error: assignmentsError } = await supabase
      .from('work_team_course_assignments')
      .select(`
        id,
        team_id,
        course_id,
        assigned_by,
        assigned_at,
        due_date,
        message,
        status,
        created_at,
        updated_at
      `)
      .eq('team_id', teamId)
      .order('assigned_at', { ascending: false })

    if (assignmentsError) {
      logger.error('Error fetching team course assignments:', assignmentsError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener cursos asignados'
      }, { status: 500 })
    }

    // Enriquecer con información de cursos
    const enrichedAssignments = await Promise.all(
      (assignments || []).map(async (assignment) => {
        const { data: course } = await supabase
          .from('courses')
          .select('id, title, description, thumbnail_url, price')
          .eq('id', assignment.course_id)
          .single()

        const { data: assignedBy } = await supabase
          .from('users')
          .select('id, display_name, first_name, last_name, email')
          .eq('id', assignment.assigned_by)
          .single()

        return {
          ...assignment,
          course: course ? {
            id: course.id,
            title: course.title,
            description: course.description,
            thumbnail_url: course.thumbnail_url,
            price: course.price
          } : null,
          assigned_by_user: assignedBy ? {
            id: assignedBy.id,
            name: assignedBy.display_name || `${assignedBy.first_name || ''} ${assignedBy.last_name || ''}`.trim() || assignedBy.email,
            email: assignedBy.email
          } : null
        }
      })
    )

    return NextResponse.json({
      success: true,
      assignments: enrichedAssignments
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/teams/[id]/courses GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}



