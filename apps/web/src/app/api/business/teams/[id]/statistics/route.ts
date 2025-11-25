import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/business/teams/[id]/statistics
 * Obtiene estadísticas de un equipo
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
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
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

    // Obtener miembros del equipo
    const { data: members, error: membersError } = await supabase
      .from('work_team_members')
      .select('user_id, status')
      .eq('team_id', teamId)

    if (membersError) {
      logger.error('Error fetching team members:', membersError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener miembros'
      }, { status: 500 })
    }

    const totalMembers = members?.length || 0
    const activeMembers = members?.filter(m => m.status === 'active').length || 0
    const memberUserIds = members?.map(m => m.user_id) || []

    // Calcular estadísticas básicas
    let averageCompletionPercentage = 0
    let averageScore = 0
    let totalInteractions = 0
    let totalMessages = 0
    let totalFeedbackGiven = 0

    if (memberUserIds.length > 0) {
      // Calcular progreso promedio si hay curso específico
      if (courseId) {
        const { data: enrollments } = await supabase
          .from('user_course_enrollments')
          .select('overall_progress_percentage')
          .eq('course_id', courseId)
          .in('user_id', memberUserIds)

        if (enrollments && enrollments.length > 0) {
          const totalProgress = enrollments.reduce((sum, e) => sum + (e.overall_progress_percentage || 0), 0)
          averageCompletionPercentage = totalProgress / enrollments.length
        }
      }

      // Contar mensajes
      let messagesQuery = supabase
        .from('work_team_messages')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)

      if (courseId) {
        messagesQuery = messagesQuery.eq('course_id', courseId)
      }

      if (startDate) {
        messagesQuery = messagesQuery.gte('created_at', startDate)
      }

      if (endDate) {
        messagesQuery = messagesQuery.lte('created_at', endDate)
      }

      const { count: messagesCount } = await messagesQuery
      totalMessages = messagesCount || 0

      // Contar feedback
      let feedbackQuery = supabase
        .from('work_team_feedback')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)

      if (courseId) {
        feedbackQuery = feedbackQuery.eq('course_id', courseId)
      }

      if (startDate) {
        feedbackQuery = feedbackQuery.gte('created_at', startDate)
      }

      if (endDate) {
        feedbackQuery = feedbackQuery.lte('created_at', endDate)
      }

      const { count: feedbackCount } = await feedbackQuery
      totalFeedbackGiven = feedbackCount || 0

      // Total de interacciones (mensajes + feedback)
      totalInteractions = totalMessages + totalFeedbackGiven
    }

    // Crear objeto de estadísticas
    const statistics = {
      stat_id: `temp-${teamId}-${Date.now()}`,
      team_id: teamId,
      course_id: courseId || null,
      stat_date: new Date().toISOString().split('T')[0],
      total_members: totalMembers,
      active_members: activeMembers,
      average_completion_percentage: Math.round(averageCompletionPercentage * 100) / 100,
      average_score: Math.round(averageScore * 100) / 100,
      total_interactions: totalInteractions,
      total_messages: totalMessages,
      total_feedback_given: totalFeedbackGiven,
      metadata: {},
      calculated_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      statistics: [statistics]
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/teams/[id]/statistics GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}



