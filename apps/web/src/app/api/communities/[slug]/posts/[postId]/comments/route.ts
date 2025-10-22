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

    const { content, parent_id } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'El contenido del comentario es requerido' }, { status: 400 });
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

    // Si es una respuesta a un comentario, verificar que el comentario padre existe
    if (parent_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from('community_comments')
        .select('id')
        .eq('id', parent_id)
        .eq('post_id', postId)
        .single();

      if (parentError || !parentComment) {
        return NextResponse.json({ error: 'Comentario padre no encontrado' }, { status: 404 });
      }
    }

    // Crear el comentario
    const { data: newComment, error: commentError } = await supabase
      .from('community_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
        parent_id: parent_id || null,
        likes_count: 0,
        is_edited: false
      })
      .select(`
        *,
        user:user_id (
          id,
          email,
          username,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .single();

    if (commentError) {
      console.error('Error creating comment:', commentError);
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }

    // Actualizar contador de comentarios del post
    const { error: updateError } = await supabase
      .from('community_posts')
      .update({ 
        comments_count: supabase.raw('comments_count + 1')
      })
      .eq('id', postId);

    if (updateError) {
      console.error('Error updating post comments count:', updateError);
    }

    return NextResponse.json({ 
      success: true, 
      comment: newComment 
    });
  } catch (error) {
    console.error('Error in comments POST API:', error);
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

    // Obtener comentarios del post (solo comentarios principales, no respuestas)
    const { data: comments, error: commentsError } = await supabase
      .from('community_comments')
      .select(`
        *,
        user:user_id (
          id,
          email,
          username,
          first_name,
          last_name,
          profile_picture_url
        ),
        replies:community_comments!parent_id (
          *,
          user:user_id (
            id,
            email,
            username,
            first_name,
            last_name,
            profile_picture_url
          )
        )
      `)
      .eq('post_id', postId)
      .is('parent_id', null)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }

    return NextResponse.json({
      comments: comments || []
    });
  } catch (error) {
    console.error('Error in comments GET API:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
