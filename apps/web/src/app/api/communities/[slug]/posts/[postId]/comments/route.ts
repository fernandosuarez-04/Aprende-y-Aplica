import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
async function createClient() {
  const cookieStore = await cookies();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Variables de entorno de Supabase faltantes');
  }
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component - ignore
          }
        },
      },
    }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Obtener el usuario actual usando el sistema de sesiones personalizado
    const { SessionService } = await import('../../../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { postId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Obtener comentarios del post
    const { data: comments, error } = await (supabase as any)
      .from('community_comments')
      .select('*')
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .is('parent_comment_id', null) // Solo comentarios principales
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: 'Error al obtener comentarios' }, { status: 500 });
    }

    // Obtener información de usuarios para los comentarios
    const userIds = [...new Set(comments.map(comment => comment.user_id))];
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, username, first_name, last_name, profile_picture_url')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    // Crear mapa de usuarios para acceso rápido
    const usersMap = new Map();
    if (users) {
      users.forEach(user => {
        usersMap.set(user.id, {
          id: user.id,
          full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
          avatar_url: user.profile_picture_url || user.avatar_url,
          username: user.username
        });
      });
    }

    // Obtener respuestas para cada comentario
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment: any) => {
        const { data: replies, error: repliesError } = await (supabase as any)
          .from('community_comments')
          .select('*')
          .eq('parent_comment_id', comment.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });

        if (repliesError) {
          console.error('Error fetching replies:', repliesError);
        }

        // Agregar información del usuario a las respuestas
        const repliesWithUsers = (replies || []).map(reply => ({
          ...reply,
          user: usersMap.get(reply.user_id) || { id: reply.user_id, full_name: 'Usuario', avatar_url: null, username: 'usuario' }
        }));

        return {
          ...comment,
          user: usersMap.get(comment.user_id) || { id: comment.user_id, full_name: 'Usuario', avatar_url: null, username: 'usuario' },
          replies: repliesWithUsers
        };
      })
    );

    // Obtener total de comentarios para paginación
    const { count: totalComments, error: countError } = await (supabase as any)
      .from('community_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .is('parent_comment_id', null);

    if (countError) {
      console.error('Error counting comments:', countError);
    }

    return NextResponse.json({
      comments: commentsWithReplies,
      pagination: {
        page,
        limit,
        total: totalComments || 0,
        totalPages: Math.ceil((totalComments || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error in comments GET:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Obtener el usuario actual usando el sistema de sesiones personalizado
    const { SessionService } = await import('../../../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { postId, slug } = await params;
    const { content, parent_comment_id } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'El contenido del comentario es requerido' }, { status: 400 });
    }

    if (content.trim().length > 1000) {
      return NextResponse.json({ error: 'El comentario es demasiado largo' }, { status: 400 });
    }

    // Obtener el community_id desde el slug
    const { data: community, error: communityError } = await (supabase as any)
      .from('communities')
      .select('id')
      .eq('slug', slug)
      .single();

    if (communityError || !community) {
      return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });
    }

    // Crear el comentario
    const { data: newComment, error: insertError } = await (supabase as any)
      .from('community_comments')
      .insert({
        post_id: postId,
        community_id: community.id,
        user_id: user.id,
        content: content.trim(),
        parent_comment_id: parent_comment_id || null
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error creating comment:', insertError);
      return NextResponse.json({ error: 'Error al crear comentario' }, { status: 500 });
    }

    // Agregar información del usuario al comentario
    const commentWithUser = {
      ...newComment,
      user: {
        id: user.id,
        full_name: user.full_name || user.first_name + ' ' + user.last_name || user.username,
        avatar_url: user.profile_picture_url,
        username: user.username
      }
    };

    // Actualizar contador de comentarios en el post
    const { error: updateError } = await (supabase as any).rpc('increment_comment_count', {
      post_id: postId
    });

    if (updateError) {
      console.error('Error updating comment count:', updateError);
    }

    return NextResponse.json({ 
      message: 'Comentario creado exitosamente',
      comment: commentWithUser 
    });
  } catch (error) {
    console.error('Error in comments POST:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}