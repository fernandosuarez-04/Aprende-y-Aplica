import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;

    console.log('🔍 Fetching members for community:', slug);

    // Obtener el usuario actual
    const { SessionService } = await import('../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener la comunidad por slug
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id, name, slug, access_type')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (communityError || !community) {
      console.error('❌ Community error:', communityError);
      return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });
    }

    console.log('✅ Community found:', community.name);

    // Intentar obtener miembros reales de la base de datos
    let members = [];
    
    try {
      // Primero intentar con la relación directa
      const { data: membersData, error: membersError } = await supabase
        .from('community_members')
        .select(`
          id,
          role,
          joined_at,
          user_id,
          users!inner (
            id,
            email,
            first_name,
            last_name,
            username,
            profile_picture_url,
            linkedin_url,
            github_url,
            website_url,
            bio,
            location,
            created_at,
            points
          )
        `)
        .eq('community_id', community.id)
        .eq('is_active', true)
        .order('joined_at', { ascending: true });

      if (membersError) {
        console.log('⚠️ Error with direct join, trying alternative approach:', membersError.message);
        
        // Si falla el join, intentar obtener miembros por community_id directamente
        const { data: membersData2, error: membersError2 } = await supabase
          .from('community_members')
          .select('*')
          .eq('community_id', community.id)
          .eq('is_active', true);

        if (membersError2) {
          console.log('⚠️ Error with community_members table:', membersError2.message);
          throw new Error('No se pudo acceder a la tabla community_members');
        }

        // Si tenemos datos pero sin join, obtener información de usuarios por separado
        if (membersData2 && membersData2.length > 0) {
          const userIds = membersData2.map(m => m.user_id);
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, email, first_name, last_name, username, profile_picture_url, linkedin_url, github_url, website_url, bio, location, created_at, points')
            .in('id', userIds);

          if (usersError) {
            console.log('⚠️ Error fetching users:', usersError.message);
            throw new Error('No se pudo obtener información de usuarios');
          }

          // Combinar datos de miembros y usuarios
          members = membersData2.map(member => {
            const user = usersData?.find(u => u.id === member.user_id);
            return {
              ...member,
              users: user || {
                id: member.user_id,
                email: 'usuario@ejemplo.com',
                first_name: 'Usuario',
                last_name: 'Sin nombre',
                username: 'usuario',
                profile_picture_url: null,
                linkedin_url: null,
                github_url: null,
                website_url: null,
                bio: null,
                location: null,
                created_at: new Date().toISOString(),
                points: 0
              }
            };
          });
        }
      } else {
        members = membersData || [];
      }
    } catch (error) {
      console.log('⚠️ Error accessing real data, using mock data:', error);
      members = [];
    }

    // Si no hay miembros reales, retornar array vacío
    if (members.length === 0) {
      console.log('📝 No members found for this community');
    }

    // Obtener estadísticas de cada miembro (si es posible)
    const membersWithStats = await Promise.all(
      members.map(async (member) => {
        const userId = member.user_id || member.users.id;
        let stats = {
          posts_count: 0,
          comments_count: 0,
          reactions_given: 0,
          reactions_received: 0,
          points: 0
        };

        try {
          // Obtener puntos reales del usuario desde la tabla users
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('points')
            .eq('id', userId)
            .single();

          if (userError) {
            console.log('⚠️ Error getting user points for', userId, ':', userError.message);
            // Si no se pueden obtener puntos de la base de datos, usar los puntos del objeto member.users si están disponibles
            stats.points = member.users?.points || 0;
          } else {
            stats.points = userData?.points || 0; // Usar puntos reales de la base de datos
          }

          // Intentar obtener estadísticas reales de actividad
          const [postsResult, commentsResult, reactionsGivenResult, reactionsReceivedResult] = await Promise.allSettled([
            supabase.from('community_posts').select('id').eq('community_id', community.id).eq('user_id', userId),
            supabase.from('community_comments').select('id').eq('community_id', community.id).eq('user_id', userId),
            supabase.from('community_reactions').select('id').eq('user_id', userId),
            supabase.from('community_reactions').select('id, community_posts!inner(user_id)').eq('community_posts.user_id', userId)
          ]);

          if (postsResult.status === 'fulfilled' && postsResult.value.data) {
            stats.posts_count = postsResult.value.data.length;
          }
          if (commentsResult.status === 'fulfilled' && commentsResult.value.data) {
            stats.comments_count = commentsResult.value.data.length;
          }
          if (reactionsGivenResult.status === 'fulfilled' && reactionsGivenResult.value.data) {
            stats.reactions_given = reactionsGivenResult.value.data.length;
          }
          if (reactionsReceivedResult.status === 'fulfilled' && reactionsReceivedResult.value.data) {
            stats.reactions_received = reactionsReceivedResult.value.data.length;
          }

        } catch (error) {
          console.log('⚠️ Error getting stats for user', userId, ':', error);
          // Mantener estadísticas en 0 si hay error
          stats = {
            posts_count: 0,
            comments_count: 0,
            reactions_given: 0,
            reactions_received: 0,
            points: 0
          };
        }

        return {
          id: member.id,
          role: member.role,
          joined_at: member.joined_at,
          user: {
            id: member.users.id,
            email: member.users.email,
            first_name: member.users.first_name,
            last_name: member.users.last_name,
            username: member.users.username,
            profile_picture_url: member.users.profile_picture_url,
            linkedin_url: member.users.linkedin_url,
            github_url: member.users.github_url,
            portfolio_url: member.users.website_url, // Usar website_url como portafolio
            bio: member.users.bio,
            location: member.users.location,
            created_at: member.users.created_at
          },
          stats
        };
      })
    );

    // Ordenar por puntos (descendente) y luego por fecha de unión
    membersWithStats.sort((a, b) => {
      if (b.stats.points !== a.stats.points) {
        return b.stats.points - a.stats.points;
      }
      return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
    });

    // Asignar rangos
    const membersWithRanks = membersWithStats.map((member, index) => ({
      ...member,
      rank: index + 1,
      total_members: membersWithStats.length
    }));

    console.log('✅ Returning mock members:', membersWithRanks.length);

    return NextResponse.json({
      community: {
        id: community.id,
        name: community.name,
        slug: community.slug,
        access_type: community.access_type
      },
      members: membersWithRanks,
      total: membersWithRanks.length
    });

  } catch (error) {
    console.error('❌ Error in members API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
