import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { SessionService } from '@/features/auth/services/session.service'

/**
 * GET /api/business/teams/[id]/feedback
 * Lista el feedback de un equipo
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
    const toUserId = searchParams.get('to_user_id')
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

    // Obtener feedback
    let query = supabase
      .from('work_team_feedback')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })

    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    if (toUserId) {
      query = query.eq('to_user_id', toUserId)
    }

    const { data: feedback, error: feedbackError } = await query

    if (feedbackError) {
      logger.error('Error fetching feedback:', feedbackError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener feedback'
      }, { status: 500 })
    }

    // Enriquecer con información de usuarios
    const enrichedFeedback = await Promise.all(
      (feedback || []).map(async (fb) => {
        const [fromUser, toUser] = await Promise.all([
          supabase.from('users').select('id, display_name, first_name, last_name, email, profile_picture_url').eq('id', fb.from_user_id).single(),
          supabase.from('users').select('id, display_name, first_name, last_name, email, profile_picture_url').eq('id', fb.to_user_id).single()
        ])

        return {
          ...fb,
          from_user: fromUser.data ? {
            id: fromUser.data.id,
            name: fromUser.data.display_name || `${fromUser.data.first_name || ''} ${fromUser.data.last_name || ''}`.trim() || fromUser.data.email,
            email: fromUser.data.email,
            profile_picture_url: fromUser.data.profile_picture_url
          } : null,
          to_user: toUser.data ? {
            id: toUser.data.id,
            name: toUser.data.display_name || `${toUser.data.first_name || ''} ${toUser.data.last_name || ''}`.trim() || toUser.data.email,
            email: toUser.data.email,
            profile_picture_url: toUser.data.profile_picture_url
          } : null
        }
      })
    )

    return NextResponse.json({
      success: true,
      feedback: enrichedFeedback
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/teams/[id]/feedback GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

/**
 * POST /api/business/teams/[id]/feedback
 * Crea feedback en el equipo
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

    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado'
      }, { status: 401 })
    }

    const { id: teamId } = await params
    const body = await request.json()
    const { to_user_id, course_id, feedback_type, content, rating, is_anonymous = false } = body

    if (!to_user_id) {
      return NextResponse.json({
        success: false,
        error: 'El usuario destinatario es requerido'
      }, { status: 400 })
    }

    if (!feedback_type || !['peer_review', 'achievement', 'suggestion', 'question'].includes(feedback_type)) {
      return NextResponse.json({
        success: false,
        error: 'Tipo de feedback inválido'
      }, { status: 400 })
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'El contenido del feedback es requerido'
      }, { status: 400 })
    }

    if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
      return NextResponse.json({
        success: false,
        error: 'La calificación debe ser un número entre 1 y 5'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar que ambos usuarios son miembros del equipo
    const [fromMember, toMember] = await Promise.all([
      supabase.from('work_team_members').select('id').eq('team_id', teamId).eq('user_id', currentUser.id).eq('status', 'active').single(),
      supabase.from('work_team_members').select('id').eq('team_id', teamId).eq('user_id', to_user_id).eq('status', 'active').single()
    ])

    if (!fromMember.data) {
      return NextResponse.json({
        success: false,
        error: 'No eres miembro de este equipo'
      }, { status: 403 })
    }

    if (!toMember.data) {
      return NextResponse.json({
        success: false,
        error: 'El usuario destinatario no es miembro de este equipo'
      }, { status: 400 })
    }

    // Crear feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from('work_team_feedback')
      .insert({
        team_id: teamId,
        from_user_id: currentUser.id,
        to_user_id: to_user_id,
        course_id: course_id || null,
        feedback_type: feedback_type,
        content: content.trim(),
        rating: rating || null,
        is_anonymous: is_anonymous
      })
      .select()
      .single()

    if (feedbackError || !feedback) {
      logger.error('Error creating feedback:', feedbackError)
      return NextResponse.json({
        success: false,
        error: 'Error al crear feedback'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      feedback: feedback,
      message: 'Feedback creado exitosamente'
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/teams/[id]/feedback POST:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}


