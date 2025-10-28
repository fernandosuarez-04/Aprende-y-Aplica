import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;
    
    console.log('🔍 Fetching posts for community slug:', slug);
    
    // Obtener el usuario actual usando el sistema de sesiones personalizado
    const { SessionService } = await import('../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      console.log('⚠️ User not authenticated');
    } else {
      console.log('✅ User authenticated:', user.id);
    }

    // Primero obtener la comunidad por slug
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id, access_type')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (communityError || !community) {
      console.error('❌ Community not found:', communityError);
      return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });
    }

    // Verificar acceso según el tipo de comunidad
    if (community.access_type === 'invitation_only') {
      if (!user) {
        console.log('🔒 User not authenticated for private community');
        return NextResponse.json({ 
          error: 'Debes iniciar sesión para ver esta comunidad',
          requires_auth: true 
        }, { status: 401 });
      }

      const { data: membership } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', community.id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!membership) {
        console.log('🔒 User not member of private community');
        return NextResponse.json({ 
          error: 'No tienes acceso a esta comunidad',
          requires_membership: true 
        }, { status: 403 });
      }
    } else if (community.slug === 'profesionales') {
      // Lógica especial para Profesionales
      if (!user) {
        console.log('🔓 Free community: user not authenticated, showing limited content');
        // Permitir ver posts pero no crear
      } else {
        // Verificar si el usuario tiene membresía en otras comunidades
        const { data: allMemberships } = await supabase
          .from('community_members')
          .select('community_id')
          .eq('user_id', user.id)
          .eq('is_active', true);

        const hasOtherMemberships = allMemberships && allMemberships.length > 0;
        
        if (hasOtherMemberships) {
          console.log('🔒 User has other memberships: blocking access to Profesionales posts');
          return NextResponse.json({ 
            error: 'Ya perteneces a otra comunidad',
            requires_membership: true 
          }, { status: 403 });
        } else {
          console.log('🔓 Free community: authenticated user has access to Profesionales');
        }
      }
    }

    // Obtener posts de la comunidad
    const { data: posts, error: postsError } = await supabase
      .from('community_posts')
      .select(`
        *,
        user:user_id (
          id,
          username,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .eq('community_id', community.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (postsError) {
      console.error('❌ Error fetching posts:', postsError);
      return NextResponse.json({ error: 'Error al obtener posts' }, { status: 500 });
    }

    console.log('📊 Found posts:', posts?.length || 0);
    
    // Debug: ver todos los attachment_types
    const attachmentTypes = posts?.map(p => p.attachment_type).filter(Boolean);
    console.log('🔍 Attachment types found:', [...new Set(attachmentTypes)]);

    // ✅ OPTIMIZACIÓN: Obtener TODAS las reacciones del usuario en 1 sola query
    let userReactionsMap: Record<string, string> = {};
    if (user && posts && posts.length > 0) {
      const postIds = posts.map(post => post.id);
      const { data: reactions } = await supabase
        .from('community_reactions')
        .select('post_id, reaction_type')
        .eq('user_id', user.id)
        .in('post_id', postIds);

      // Crear mapa para acceso O(1)
      if (reactions) {
        userReactionsMap = reactions.reduce((acc, r) => {
          acc[r.post_id] = r.reaction_type;
          return acc;
        }, {} as Record<string, string>);
      }
    }

    // Enriquecer posts con información del usuario
    const enrichedPosts = posts?.map(post => {
      const userReaction = userReactionsMap[post.id] || null;
      
      // Debug: verificar datos de encuestas
      if (post.attachment_type === 'poll') {
        console.log('✅ Poll post found with data:', {
          id: post.id,
          question: post.attachment_data?.question,
          options: post.attachment_data?.options,
          votes: post.attachment_data?.votes
        });
      }
      
      return {
        ...post,
        user_has_liked: userReaction === 'like',
        user_reaction_type: userReaction
      };
    }) || [];

    return NextResponse.json({
      posts: enrichedPosts,
      total: enrichedPosts.length
    });

  } catch (error) {
    console.error('❌ Error in posts API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;
    
    // Obtener el usuario actual usando el sistema de sesiones personalizado
    const { SessionService } = await import('../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { title, content, attachment_url, attachment_type, attachment_data } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'El contenido es requerido' }, { status: 400 });
    }

    // Obtener la comunidad por slug
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (communityError || !community) {
      return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });
    }

    // Verificar que el usuario es miembro
    // Buscar por ID directo primero, luego por email si no encuentra
    let membership = null;
    
    // Intentar con el ID directo de auth.users
    const { data: directMembership } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', community.id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    
    if (directMembership) {
      membership = directMembership;
    } else {
      // Si no encuentra con el ID directo, buscar por email en public.users
      const { data: userByEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();
      
      if (userByEmail) {
        const { data: emailMembership } = await supabase
          .from('community_members')
          .select('id')
          .eq('community_id', community.id)
          .eq('user_id', userByEmail.id)
          .eq('is_active', true)
          .single();
        
        membership = emailMembership;
      }
    }

    if (!membership) {
      return NextResponse.json({ 
        error: 'Debes ser miembro para crear posts' 
      }, { status: 403 });
    }

    // Crear el post
    const { data: newPost, error: postError } = await supabase
      .from('community_posts')
      .insert({
        community_id: community.id,
        user_id: user.id,
        title: title || null,
        content: content.trim(),
        attachment_url: attachment_url || null,
        attachment_type: attachment_type || null,
        attachment_data: attachment_data || null,
        likes_count: 0,
        comment_count: 0,
        reaction_count: 0,
        is_pinned: false,
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

    if (postError) {
      console.error('❌ Error creating post:', postError);
      return NextResponse.json({ error: 'Error al crear el post' }, { status: 500 });
    }

    console.log('✅ Post created successfully:', newPost.id);

    return NextResponse.json({
      post: newPost,
      success: true
    });

  } catch (error) {
    console.error('❌ Error in create post API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
