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
 * POST /api/business/hierarchy/chats/[chatId]/read
 * Marca los mensajes de un chat como leídos
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
    const { last_read_at } = body;

    const supabase = createServiceClient();

    // Verificar que el usuario es participante
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

    // Actualizar last_read_at y resetear unread_count
    const readAt = last_read_at || new Date().toISOString();
    const { error: updateError } = await supabase
      .from('hierarchy_chat_participants')
      .update({
        last_read_at: readAt,
        unread_count: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', participant.id);

    if (updateError) {
      logger.error('Error marcando mensajes como leídos:', updateError);
      return NextResponse.json(
        { success: false, error: 'Error al marcar mensajes como leídos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mensajes marcados como leídos'
    });
  } catch (error) {
    logger.error('Error en POST /api/business/hierarchy/chats/[chatId]/read:', error);
    return NextResponse.json(
      { success: false, error: 'Error al marcar mensajes como leídos' },
      { status: 500 }
    );
  }
}

