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
  params: Promise<{ chatId: string; messageId: string }>;
}

/**
 * PUT /api/business/hierarchy/chats/[chatId]/messages/[messageId]
 * Actualiza un mensaje (solo el autor puede editarlo)
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      );
    }

    const { chatId, messageId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'El contenido del mensaje es requerido' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Verificar que el mensaje existe y pertenece al usuario
    const { data: existingMessage } = await supabase
      .from('hierarchy_chat_messages')
      .select('id, sender_id, chat_id, is_deleted')
      .eq('id', messageId)
      .eq('chat_id', chatId)
      .single();

    if (!existingMessage) {
      return NextResponse.json(
        { success: false, error: 'Mensaje no encontrado' },
        { status: 404 }
      );
    }

    if (existingMessage.sender_id !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Solo puedes editar tus propios mensajes' },
        { status: 403 }
      );
    }

    if (existingMessage.is_deleted) {
      return NextResponse.json(
        { success: false, error: 'No puedes editar un mensaje eliminado' },
        { status: 400 }
      );
    }

    // Actualizar el mensaje
    const { data: updatedMessage, error: updateError } = await supabase
      .from('hierarchy_chat_messages')
      .update({
        content: content.trim(),
        is_edited: true,
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
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

    if (updateError || !updatedMessage) {
      logger.error('Error actualizando mensaje:', updateError);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar el mensaje' },
        { status: 500 }
      );
    }

    logger.info('Mensaje actualizado:', { messageId });

    return NextResponse.json({
      success: true,
      message: updatedMessage
    });
  } catch (error) {
    logger.error('Error en PUT /api/business/hierarchy/chats/[chatId]/messages/[messageId]:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el mensaje' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/business/hierarchy/chats/[chatId]/messages/[messageId]
 * Elimina un mensaje (soft delete)
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      );
    }

    const { chatId, messageId } = await params;
    const supabase = createServiceClient();

    // Verificar que el mensaje existe y pertenece al usuario
    const { data: existingMessage } = await supabase
      .from('hierarchy_chat_messages')
      .select('id, sender_id, is_deleted')
      .eq('id', messageId)
      .eq('chat_id', chatId)
      .single();

    if (!existingMessage) {
      return NextResponse.json(
        { success: false, error: 'Mensaje no encontrado' },
        { status: 404 }
      );
    }

    if (existingMessage.sender_id !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Solo puedes eliminar tus propios mensajes' },
        { status: 403 }
      );
    }

    if (existingMessage.is_deleted) {
      return NextResponse.json(
        { success: false, error: 'El mensaje ya está eliminado' },
        { status: 400 }
      );
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('hierarchy_chat_messages')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (deleteError) {
      logger.error('Error eliminando mensaje:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Error al eliminar el mensaje' },
        { status: 500 }
      );
    }

    logger.info('Mensaje eliminado:', { messageId });

    return NextResponse.json({
      success: true,
      message: 'Mensaje eliminado correctamente'
    });
  } catch (error) {
    logger.error('Error en DELETE /api/business/hierarchy/chats/[chatId]/messages/[messageId]:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar el mensaje' },
      { status: 500 }
    );
  }
}

