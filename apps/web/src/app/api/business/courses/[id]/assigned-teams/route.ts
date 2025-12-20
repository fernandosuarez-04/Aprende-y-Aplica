import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/business/courses/[id]/assigned-teams
 * Obtiene los IDs de los equipos que ya tienen asignado este curso
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

        const { id: courseId } = await params

        if (!courseId) {
            return NextResponse.json({
                success: false,
                error: 'El ID del curso es requerido'
            }, { status: 400 })
        }

        const supabase = await createClient()

        // Obtener los equipos que ya tienen el curso asignado
        // Primero obtenemos los equipos de la organización
        const { data: orgTeams, error: teamsError } = await supabase
            .from('work_teams')
            .select('team_id')
            .eq('organization_id', auth.organizationId)
            .eq('status', 'active')

        if (teamsError) {
            logger.error('Error fetching organization teams:', teamsError)
            return NextResponse.json({
                success: false,
                error: 'Error al obtener equipos'
            }, { status: 500 })
        }

        const orgTeamIds = orgTeams?.map(t => t.team_id) || []

        if (orgTeamIds.length === 0) {
            return NextResponse.json({
                success: true,
                team_ids: []
            })
        }

        // Buscar asignaciones existentes para este curso y estos equipos
        const { data: assignments, error: assignError } = await supabase
            .from('work_team_course_assignments')
            .select('team_id')
            .eq('course_id', courseId)
            .in('team_id', orgTeamIds)

        if (assignError) {
            logger.error('Error fetching team course assignments:', assignError)
            return NextResponse.json({
                success: false,
                error: 'Error al obtener asignaciones'
            }, { status: 500 })
        }

        const assignedTeamIds = assignments?.map(a => a.team_id) || []

        logger.info(`✅ Found ${assignedTeamIds.length} teams already assigned to course ${courseId}`)

        return NextResponse.json({
            success: true,
            team_ids: assignedTeamIds
        })

    } catch (error) {
        logger.error('💥 Error in /api/business/courses/[id]/assigned-teams:', error)
        return NextResponse.json({
            success: false,
            error: 'Error interno del servidor'
        }, { status: 500 })
    }
}
