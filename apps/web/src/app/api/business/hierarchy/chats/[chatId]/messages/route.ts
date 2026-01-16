import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

// Crear cliente con service_role que bypasea RLS
function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Configuración de Supabase incompleta');
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey);
}

interface RouteParams {
  params: Promise<{ chatId: string }>;
}

/**
 * POST /api/business/hierarchy/chats/[chatId]/messages
 * Envía un mensaje en un chat
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      );
    }

    const { chatId } = await params;
    const body = await request.json();
    const { content, message_type = 'text', metadata } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'El contenido del mensaje es requerido' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Verificar que el chat existe y el usuario es participante
    const { data: chat } = await supabase
      .from('hierarchy_chats')
      .select('id, organization_id')
      .eq('id', chatId)
      .eq('organization_id', auth.organizationId)
      .eq('is_active', true)
      .single();

    if (!chat) {
      return NextResponse.json(
        { success: false, error: 'Chat no encontrado' },
        { status: 404 }
      );
    }

    const { data: participant } = await supabase
      .from('hierarchy_chat_participants')
      .select('id')
      .eq('chat_id', chatId)
      .eq('user_id', auth.userId)
      .eq('is_active', true)
      .single();

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'No tienes acceso a este chat' },
        { status: 403 }
      );
    }

    // Crear el mensaje
    const { data: message, error: messageError } = await supabase
      .from('hierarchy_chat_messages')
      .insert({
        chat_id: chatId,
        organization_id: auth.organizationId,
        sender_id: auth.userId,
        content: content.trim(),
        message_type: message_type || 'text',
        metadata: metadata || {}
      })
      .select(`
        *,
        sender:users!hierarchy_chat_messages_sender_id_fkey(
          id,
          display_name,
          first_name,
          last_name,
          email,
          profile_picture_url
        )
      `)
      .single();

    if (messageError || !message) {
      logger.error('Error creando mensaje:', messageError);
      return NextResponse.json(
        { success: false, error: 'Error al enviar el mensaje' },
        { status: 500 }
      );
    }

    logger.info('Mensaje enviado:', { chatId, messageId: message.id });

    return NextResponse.json({
      success: true,
      message
    });
  } catch (error) {
    logger.error('Error en POST /api/business/hierarchy/chats/[chatId]/messages:', error);
    return NextResponse.json(
      { success: false, error: 'Error al enviar el mensaje' },
      { status: 500 }
    );
  }
}

