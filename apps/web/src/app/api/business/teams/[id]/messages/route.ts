import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { SessionService } from '@/features/auth/services/session.service'

/**
 * GET /api/business/teams/[id]/messages
 * Lista los mensajes de un equipo
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
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

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

    // Obtener mensajes
    let query = supabase
      .from('work_team_messages')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    const { data: messages, error: messagesError } = await query

    if (messagesError) {
      logger.error('Error fetching messages:', messagesError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener mensajes'
      }, { status: 500 })
    }

    // Enriquecer con información de usuarios
    const enrichedMessages = await Promise.all(
      (messages || []).map(async (message) => {
        const { data: sender } = await supabase
          .from('users')
          .select('id, display_name, first_name, last_name, email, profile_picture_url')
          .eq('id', message.sender_id)
          .single()

        return {
          ...message,
          sender: sender ? {
            id: sender.id,
            name: sender.display_name || `${sender.first_name || ''} ${sender.last_name || ''}`.trim() || sender.email,
            email: sender.email,
            profile_picture_url: sender.profile_picture_url,
            display_name: sender.display_name
          } : null
        }
      })
    )

    return NextResponse.json({
      success: true,
      messages: enrichedMessages
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/teams/[id]/messages GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

/**
 * POST /api/business/teams/[id]/messages
 * Crea un mensaje en el equipo
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
    const { content, course_id, message_type = 'text', reply_to_message_id } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'El contenido del mensaje es requerido'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar que el equipo existe y el usuario es miembro
    const { data: teamMember } = await supabase
      .from('work_team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', currentUser.id)
      .eq('status', 'active')
      .single()

    if (!teamMember) {
      return NextResponse.json({
        success: false,
        error: 'No eres miembro de este equipo'
      }, { status: 403 })
    }

    // Crear mensaje
    const { data: message, error: messageError } = await supabase
      .from('work_team_messages')
      .insert({
        team_id: teamId,
        course_id: course_id || null,
        sender_id: currentUser.id,
        content: content.trim(),
        message_type: message_type,
        reply_to_message_id: reply_to_message_id || null
      })
      .select()
      .single()

    if (messageError || !message) {
      logger.error('Error creating message:', messageError)
      return NextResponse.json({
        success: false,
        error: 'Error al enviar mensaje'
      }, { status: 500 })
    }

    // Obtener información del remitente
    const { data: sender } = await supabase
      .from('users')
      .select('id, display_name, first_name, last_name, email, profile_picture_url')
      .eq('id', currentUser.id)
      .single()

    return NextResponse.json({
      success: true,
      message: {
        ...message,
        sender: sender ? {
          id: sender.id,
          name: sender.display_name || `${sender.first_name || ''} ${sender.last_name || ''}`.trim() || sender.email,
          email: sender.email,
          profile_picture_url: sender.profile_picture_url,
          display_name: sender.display_name
        } : null
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/teams/[id]/messages POST:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}



