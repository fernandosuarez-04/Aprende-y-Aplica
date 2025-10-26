import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Datos de ejemplo para comunidades
    const sampleCommunities = [
      {
        name: 'Ecos de Liderazgo',
        description: 'Comunidad cerrada por invitación.',
        slug: 'ecos-de-liderazgo',
        image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
        member_count: 7,
        is_active: true,
        visibility: 'private',
        access_type: 'invite_only'
      },
      {
        name: 'Profesionales',
        description: 'Espacio abierto para perfiles sin cursos activos.',
        slug: 'profesionales',
        image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
        member_count: 0,
        is_active: true,
        visibility: 'public',
        access_type: 'open'
      },
      {
        name: 'Openminder',
        description: 'Comunidad cerrada por invitación.',
        slug: 'openminder',
        image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
        member_count: 5,
        is_active: true,
        visibility: 'private',
        access_type: 'invite_only'
      }
    ]

    // Insertar comunidades
    const { data: communities, error: communitiesError } = await supabase
      .from('communities')
      .insert(sampleCommunities)
      .select()

    if (communitiesError) {
      console.error('Error inserting communities:', communitiesError)
      return NextResponse.json({ error: 'Error inserting communities' }, { status: 500 })
    }

    // Crear algunos posts de ejemplo para cada comunidad
    const samplePosts = [
      {
        community_id: communities[0].id,
        user_id: '00000000-0000-0000-0000-000000000001', // ID de ejemplo
        title: 'Bienvenidos a Ecos de Liderazgo',
        content: 'Esta es una comunidad exclusiva para líderes.',
        likes_count: 5,
        comments_count: 2
      },
      {
        community_id: communities[1].id,
        user_id: '00000000-0000-0000-0000-000000000001',
        title: 'Espacio para Profesionales',
        content: 'Comparte tu experiencia profesional aquí.',
        likes_count: 3,
        comments_count: 1
      },
      {
        community_id: communities[2].id,
        user_id: '00000000-0000-0000-0000-000000000001',
        title: 'Openminder Community',
        content: 'Bienvenidos a nuestra comunidad privada.',
        likes_count: 8,
        comments_count: 4
      }
    ]

    const { error: postsError } = await supabase
      .from('community_posts')
      .insert(samplePosts)

    if (postsError) {
      console.warn('Error inserting sample posts:', postsError)
    }

    return NextResponse.json({
      success: true,
      message: 'Sample data inserted successfully',
      communities: communities.length
    })
  } catch (error) {
    console.error('Error in seed endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
