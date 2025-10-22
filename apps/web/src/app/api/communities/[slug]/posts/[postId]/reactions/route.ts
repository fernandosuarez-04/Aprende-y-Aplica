import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../../../lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug, postId } = await params;
    
    // Obtener el usuario actual usando el sistema de sesiones personalizado
    const { SessionService } = await import('../../../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { reaction_type } = await request.json();

    if (!reaction_type) {
      return NextResponse.json({ error: 'Tipo de reacción requerido' }, { status: 400 });
    }

    // Verificar que el post existe y obtener la comunidad
    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select(`
        id,
        community_id,
        communities!inner(slug)
      `)
      .eq('id', postId)
      .eq('communities.slug', slug)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 });
    }

    // Verificar si ya existe una reacción del usuario
    const { data: existingReaction, error: existingError } = await supabase
      .from('community_reactions')
      .select('id, reaction_type')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing reaction:', existingError);
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }

    if (existingReaction) {
      if (existingReaction.reaction_type === reaction_type) {
        // Si es la misma reacción, eliminarla
        const { error: deleteError } = await supabase
          .from('community_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (deleteError) {
          console.error('Error deleting reaction:', deleteError);
          return NextResponse.json({ error: 'Error interno' }, { status: 500 });
        }

        // Actualizar contador del post
        const { error: updateError } = await supabase
          .from('community_posts')
          .update({ 
            reaction_count: supabase.raw('reaction_count - 1')
          })
          .eq('id', postId);

        if (updateError) {
          console.error('Error updating post reaction count:', updateError);
        }

        return NextResponse.json({ 
          success: true, 
          action: 'removed',
          reaction: null 
        });
      } else {
        // Si es diferente reacción, actualizarla
        const { error: updateError } = await supabase
          .from('community_reactions')
          .update({ reaction_type })
          .eq('id', existingReaction.id);

        if (updateError) {
          console.error('Error updating reaction:', updateError);
          return NextResponse.json({ error: 'Error interno' }, { status: 500 });
        }

        return NextResponse.json({ 
          success: true, 
          action: 'updated',
          reaction: reaction_type 
        });
      }
    } else {
      // Crear nueva reacción
      const { data: newReaction, error: createError } = await supabase
        .from('community_reactions')
        .insert({
          post_id: postId,
          user_id: user.id,
          reaction_type
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating reaction:', createError);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
      }

      // Actualizar contador del post
      const { error: updateError } = await supabase
        .from('community_posts')
        .update({ 
          reaction_count: supabase.raw('reaction_count + 1')
        })
        .eq('id', postId);

      if (updateError) {
        console.error('Error updating post reaction count:', updateError);
      }

      return NextResponse.json({ 
        success: true, 
        action: 'added',
        reaction: reaction_type 
      });
    }
  } catch (error) {
    console.error('Error in reactions API:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug, postId } = await params;
    
    // Obtener el usuario actual usando el sistema de sesiones personalizado
    const { SessionService } = await import('../../../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el post existe
    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select(`
        id,
        communities!inner(slug)
      `)
      .eq('id', postId)
      .eq('communities.slug', slug)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 });
    }

    // Obtener reacciones del post
    const { data: reactions, error: reactionsError } = await supabase
      .from('community_reactions')
      .select(`
        id,
        reaction_type,
        created_at,
        user:user_id (
          id,
          username,
          first_name,
          last_name
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (reactionsError) {
      console.error('Error fetching reactions:', reactionsError);
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }

    // Obtener la reacción del usuario actual
    const { data: userReaction, error: userReactionError } = await supabase
      .from('community_reactions')
      .select('reaction_type')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (userReactionError && userReactionError.code !== 'PGRST116') {
      console.error('Error fetching user reaction:', userReactionError);
    }

    return NextResponse.json({
      reactions: reactions || [],
      userReaction: userReaction?.reaction_type || null
    });
  } catch (error) {
    console.error('Error in reactions GET API:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
