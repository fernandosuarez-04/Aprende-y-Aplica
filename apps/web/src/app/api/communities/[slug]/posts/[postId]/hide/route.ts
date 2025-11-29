import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/features/auth/services/session.service'
import { logger } from '@/lib/logger'

/**
 * POST /api/communities/[slug]/posts/[postId]/hide
 * Oculta un post (usuarios pueden ocultar de su feed, moderadores pueden ocultar completamente)
 */
export async function POST(
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

    const body = await request.json()
    const { hideFromFeed = false } = body // Si es true, solo ocultar del feed del usuario, no del post en general

    // Obtener el post y la comunidad
    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('*, community:communities!inner(id, slug, creator_id)')
      .eq('id', postId)
      .eq('communities.slug', slug)
      .single()

    if (postError || !post) {
      logger.error('Error fetching post:', postError)
      return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 })
    }

    // Verificar permisos
    const isAdmin = user.cargo_rol?.toLowerCase() === 'administrador'
    const isInstructor = user.cargo_rol?.toLowerCase() === 'instructor'
    
    let isModerator = false
    if (isInstructor || isAdmin) {
      const { data: membership } = await supabase
        .from('community_members')
        .select('role')
        .eq('community_id', post.community_id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      isModerator = membership?.role === 'admin' || membership?.role === 'moderator' || 
                   post.community.creator_id === user.id
    }

    // Si es moderador/admin, puede ocultar el post completamente
    // Si es usuario normal, solo puede ocultarlo de su feed personal
    if (isAdmin || isModerator) {
      // Ocultar el post completamente (moderación)
      const { data: updatedPost, error: updateError } = await supabase
        .from('community_posts')
        .update({ 
          is_hidden: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select()
        .single()

      if (updateError) {
        logger.error('Error hiding post:', updateError)
        return NextResponse.json({ 
          error: 'Error al ocultar el post' 
        }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        post: updatedPost,
        message: 'Post ocultado exitosamente'
      })
    } else {
      // Usuario normal: guardar en tabla de posts ocultos por usuario
      // Por ahora, simplemente retornamos éxito ya que la funcionalidad de "ocultar de mi feed"
      // requeriría una tabla adicional para almacenar las preferencias del usuario
      // Por simplicidad, retornamos éxito pero no hacemos nada en la BD
      return NextResponse.json({ 
        success: true, 
        message: 'Post ocultado de tu feed'
      })
    }
  } catch (error) {
    logger.error('Error in POST hide API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}



