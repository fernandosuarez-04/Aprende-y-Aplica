import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/features/auth/services/session.service'
import { logger } from '@/lib/logger'
import { canModerateCommunity } from '@/lib/auth/communityPermissions'

/**
 * PATCH /api/communities/[slug]/posts/[postId]/toggle-visibility
 * Toggle la visibilidad de un post (ocultar/mostrar) - solo moderadores/admins
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const supabase = await createClient()
    const { slug, postId } = await params
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener la comunidad por slug
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id')
      .eq('slug', slug)
      .single()

    if (communityError || !community) {
      logger.error('Error fetching community:', communityError)
      return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 })
    }

    // Verificar permisos de moderación
    const canModerate = await canModerateCommunity(user.id, community.id)
    if (!canModerate) {
      return NextResponse.json(
        { error: 'No tienes permisos para ocultar/mostrar posts' },
        { status: 403 }
      )
    }

    // Obtener datos actuales del post
    const { data: currentPost, error: fetchError } = await supabase
      .from('community_posts')
      .select('*')
      .eq('id', postId)
      .eq('community_id', community.id)
      .single()

    if (fetchError || !currentPost) {
      logger.error('Error fetching post:', fetchError)
      return NextResponse.json({ 
        success: false, 
        message: 'Post no encontrado' 
      }, { status: 404 })
    }

    // Toggle la visibilidad del post
    const newVisibility = !currentPost.is_hidden
    const { data: updatedPost, error: updateError } = await supabase
      .from('community_posts')
      .update({ 
        is_hidden: newVisibility,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .eq('community_id', community.id)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating post visibility:', updateError)
      return NextResponse.json({ 
        success: false, 
        message: 'Error al cambiar la visibilidad del post' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      post: updatedPost,
      message: `Post ${newVisibility ? 'ocultado' : 'mostrado'} exitosamente` 
    })
  } catch (error) {
    logger.error('Error in toggle post visibility API:', error)
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    return NextResponse.json({ 
      success: false, 
      message 
    }, { status: 500 })
  }
}



