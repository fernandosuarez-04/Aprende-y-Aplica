import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Verificar autenticación
    const { SessionService } = await import('../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('🔍 Toggling like for reel:', id, 'by user:', user.id);

    // Verificar si el reel existe
    const { data: reel, error: reelError } = await supabase
      .from('reels')
      .select('id, is_active')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (reelError || !reel) {
      console.error('❌ Reel not found:', reelError);
      return NextResponse.json({ error: 'Reel no encontrado' }, { status: 404 });
    }

    // Verificar si ya existe un like
    const { data: existingLike } = await supabase
      .from('reel_likes')
      .select('id')
      .eq('reel_id', id)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      // Eliminar el like
      const { error: deleteError } = await supabase
        .from('reel_likes')
        .delete()
        .eq('reel_id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('❌ Error removing like:', deleteError);
        return NextResponse.json({ error: 'Error al quitar el like' }, { status: 500 });
      }

      console.log('✅ Like removed successfully');
      return NextResponse.json({
        liked: false,
        message: 'Like removido'
      });
    } else {
      // Agregar el like
      const { error: insertError } = await supabase
        .from('reel_likes')
        .insert({
          reel_id: id,
          user_id: user.id
        });

      if (insertError) {
        console.error('❌ Error adding like:', insertError);
        return NextResponse.json({ error: 'Error al agregar el like' }, { status: 500 });
      }

      console.log('✅ Like added successfully');
      return NextResponse.json({
        liked: true,
        message: 'Like agregado'
      });
    }

  } catch (error) {
    console.error('❌ Error in reel like API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Verificar autenticación
    const { SessionService } = await import('../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar si el usuario ya dio like
    const { data: like } = await supabase
      .from('reel_likes')
      .select('id')
      .eq('reel_id', id)
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      liked: !!like
    });

  } catch (error) {
    console.error('❌ Error in reel like status API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
