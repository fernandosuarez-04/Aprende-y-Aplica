import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; postId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { postId } = params;

    // Obtener todas las reacciones del post
    const { data: reactions, error } = await supabase
      .from('community_reactions')
      .select(`
        *,
        user:user_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reactions:', error);
      return NextResponse.json({ error: 'Error al obtener reacciones' }, { status: 500 });
    }

    // Agrupar reacciones por tipo
    const groupedReactions = reactions.reduce((acc, reaction) => {
      const type = reaction.reaction_type;
      if (!acc[type]) {
        acc[type] = {
          type,
          count: 0,
          users: [],
          hasUserReacted: false
        };
      }
      acc[type].count++;
      acc[type].users.push({
        id: reaction.user.id,
        name: reaction.user.full_name,
        avatar: reaction.user.avatar_url
      });
      
      // Verificar si el usuario actual ha reaccionado
      if (reaction.user_id === user.id) {
        acc[type].hasUserReacted = true;
      }
      
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({ reactions: groupedReactions });
  } catch (error) {
    console.error('Error in reactions GET:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string; postId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { postId } = params;
    const { reaction_type } = await request.json();

    if (!reaction_type) {
      return NextResponse.json({ error: 'Tipo de reacción requerido' }, { status: 400 });
    }

    // Verificar si el usuario ya reaccionó con este tipo
    const { data: existingReaction, error: checkError } = await supabase
      .from('community_reactions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .eq('reaction_type', reaction_type)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing reaction:', checkError);
      return NextResponse.json({ error: 'Error al verificar reacción' }, { status: 500 });
    }

    if (existingReaction) {
      // Si ya existe, eliminar la reacción (toggle)
      const { error: deleteError } = await supabase
        .from('community_reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (deleteError) {
        console.error('Error deleting reaction:', deleteError);
        return NextResponse.json({ error: 'Error al eliminar reacción' }, { status: 500 });
      }

      // Actualizar contador en el post
      const { error: updateError } = await supabase.rpc('decrement_reaction_count', {
        post_id: postId
      });

      if (updateError) {
        console.error('Error updating reaction count:', updateError);
      }

      return NextResponse.json({ message: 'Reacción eliminada', action: 'removed' });
    } else {
      // Crear nueva reacción
      const { data: newReaction, error: insertError } = await supabase
        .from('community_reactions')
        .insert({
          post_id: postId,
          user_id: user.id,
          reaction_type
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating reaction:', insertError);
        return NextResponse.json({ error: 'Error al crear reacción' }, { status: 500 });
      }

      // Actualizar contador en el post
      const { error: updateError } = await supabase.rpc('increment_reaction_count', {
        post_id: postId
      });

      if (updateError) {
        console.error('Error updating reaction count:', updateError);
      }

      return NextResponse.json({ 
        message: 'Reacción agregada', 
        action: 'added',
        reaction: newReaction 
      });
    }
  } catch (error) {
    console.error('Error in reactions POST:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}