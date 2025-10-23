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
  { params }: { params: { slug: string; postId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { postId } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Obtener comentarios del post con información del usuario
    const { data: comments, error } = await (supabase as any)
      .from('community_comments')
      .select(`
        *,
        user:user_id (
          id,
          full_name,
          avatar_url,
          username
        ),
        reactions:community_reactions (
          id,
          reaction_type,
          user_id
        )
      `)
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .is('parent_comment_id', null) // Solo comentarios principales
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: 'Error al obtener comentarios' }, { status: 500 });
    }

    // Obtener respuestas para cada comentario
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment: any) => {
        const { data: replies, error: repliesError } = await (supabase as any)
          .from('community_comments')
          .select(`
            *,
            user:user_id (
              id,
              full_name,
              avatar_url,
              username
            ),
            reactions:community_reactions (
              id,
              reaction_type,
              user_id
            )
          `)
          .eq('parent_comment_id', comment.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });

        if (repliesError) {
          console.error('Error fetching replies:', repliesError);
        }

        return {
          ...comment,
          replies: replies || []
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
  { params }: { params: { slug: string; postId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { postId, slug } = params;
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
      .select(`
        *,
        user:user_id (
          id,
          full_name,
          avatar_url,
          username
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating comment:', insertError);
      return NextResponse.json({ error: 'Error al crear comentario' }, { status: 500 });
    }

    // Actualizar contador de comentarios en el post
    const { error: updateError } = await (supabase as any).rpc('increment_comment_count', {
      post_id: postId
    });

    if (updateError) {
      console.error('Error updating comment count:', updateError);
    }

    return NextResponse.json({ 
      message: 'Comentario creado exitosamente',
      comment: newComment 
    });
  } catch (error) {
    console.error('Error in comments POST:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}