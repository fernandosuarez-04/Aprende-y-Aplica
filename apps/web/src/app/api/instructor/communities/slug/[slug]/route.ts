import { NextRequest, NextResponse } from 'next/server'
import { requireInstructor } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de instructor
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const instructorId = auth.userId
    const { slug } = await params
    const supabase = await createClient()

    logger.log('🔄 Obteniendo comunidad del instructor por slug:', slug)

    // ✅ Obtener la comunidad solo si pertenece al instructor
    const { data: communityRow, error } = await supabase
      .from('community_stats')
      .select('*')
      .eq('slug', slug)
      .eq('creator_id', instructorId) // ✅ Solo si pertenece al instructor
      .single()

    if (error || !communityRow) {
      logger.error('❌ Error fetching instructor community by slug:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Comunidad no encontrada o no tienes permisos para acceder a ella' 
      }, { status: 404 })
    }

    // Mapear datos de la VIEW al formato AdminCommunity
    const community = {
      id: communityRow.id,
      name: communityRow.name,
      description: communityRow.description,
      slug: communityRow.slug,
      image_url: communityRow.image_url,
      member_count: communityRow.member_count || 0,
      is_active: communityRow.is_active,
      visibility: communityRow.visibility,
      access_type: communityRow.access_type,
      course_id: communityRow.course_id,
      created_at: communityRow.created_at,
      updated_at: communityRow.updated_at,
      course: communityRow.course_id_full ? {
        id: communityRow.course_id_full,
        title: communityRow.course_title,
        slug: communityRow.course_slug,
        thumbnail_url: communityRow.course_thumbnail
      } : undefined,
      creator: communityRow.creator_id ? {
        id: communityRow.creator_id,
        username: communityRow.creator_username || '',
        email: communityRow.creator_email || '',
        display_name: communityRow.creator_display_name ||
                     `${communityRow.creator_first_name || ''} ${communityRow.creator_last_name || ''}`.trim(),
        avatar: communityRow.creator_avatar
      } : undefined,
      creator_name: communityRow.creator_display_name ||
                   `${communityRow.creator_first_name || ''} ${communityRow.creator_last_name || ''}`.trim() ||
                   'Sin creador',
      stats: {
        members_count: communityRow.members_count || 0,
        admin_count: communityRow.admin_count || 0,
        moderator_count: communityRow.moderator_count || 0,
        active_members_count: communityRow.active_members_count || 0,
        posts_count: communityRow.posts_count || 0,
        pinned_posts_count: communityRow.pinned_posts_count || 0,
        total_posts_likes: communityRow.total_posts_likes || 0,
        total_posts_views: communityRow.total_posts_views || 0,
        comments_count: communityRow.comments_count || 0,
        active_comments_count: communityRow.active_comments_count || 0,
        videos_count: communityRow.videos_count || 0,
        active_videos_count: communityRow.active_videos_count || 0,
        pending_requests_count: communityRow.pending_requests_count || 0,
        approved_requests_count: communityRow.approved_requests_count || 0,
        rejected_requests_count: communityRow.rejected_requests_count || 0,
        total_reactions_count: communityRow.total_reactions_count || 0
      },
      posts_count: communityRow.posts_count || 0,
      comments_count: communityRow.comments_count || 0,
      videos_count: communityRow.videos_count || 0,
      access_requests_count: communityRow.pending_requests_count || 0
    }

    logger.log('✅ Comunidad del instructor obtenida exitosamente:', community.id)
    
    return NextResponse.json({ 
      success: true, 
      community 
    })
  } catch (error: unknown) {
    logger.error('💥 Error fetching instructor community by slug:', error)
    const message = error instanceof Error ? error.message : 'Error al obtener la comunidad'
    return NextResponse.json({ 
      success: false, 
      message 
    }, { status: 500 })
  }
}

