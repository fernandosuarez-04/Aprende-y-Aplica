import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/features/auth/services/session.service'
import { logger } from '@/lib/utils/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Verificar autenticación - OBLIGATORIA
    let user = null
    try {
      user = await SessionService.getCurrentUser()
    } catch (authError) {
      logger.error('Error getting current user:', authError)
    }

    if (!user || !user.id) {
      logger.warn('❌ Intento de dar like sin autenticación')
      return NextResponse.json(
        { error: 'Debes estar autenticado para dar like' },
        { status: 401 }
      )
    }

    const userId = user.id
    logger.log(`✅ Usuario autenticado para like: ${userId} (${user.username || user.email})`)

    // Verificar si ya existe el like
    const { data: existingLike, error: checkError } = await supabase
      .from('reel_likes')
      .select('id')
      .eq('reel_id', id)
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      logger.error('Error checking existing like:', checkError)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    if (existingLike) {
      // Quitar el like
      const { error: deleteError } = await supabase
        .from('reel_likes')
        .delete()
        .eq('reel_id', id)
        .eq('user_id', userId)

      if (deleteError) {
        logger.error('Error removing like:', deleteError)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
      }

      // Decrementar contador en tabla reels
      const { data: currentReel, error: fetchError } = await supabase
        .from('reels')
        .select('like_count')
        .eq('id', id)
        .single()

      if (fetchError) {
        logger.error('Error fetching current reel:', fetchError)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
      }

      const newLikeCount = Math.max((currentReel.like_count || 0) - 1, 0)
      
      const { error: decrementError } = await supabase
        .from('reels')
        .update({ 
          like_count: newLikeCount
        })
        .eq('id', id)

      if (decrementError) {
        logger.error('Error decrementing like count:', decrementError)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
      }

      logger.log(`✅ Like removido por usuario ${userId} del reel ${id}`)
      return NextResponse.json({ liked: false })
    } else {
      // Agregar el like
      const { error: insertError } = await supabase
        .from('reel_likes')
        .insert({
          reel_id: id,
          user_id: userId
        })

      if (insertError) {
        logger.error('Error adding like:', insertError)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
      }

      // Incrementar contador en tabla reels
      const { data: currentReel, error: fetchError } = await supabase
        .from('reels')
        .select('like_count')
        .eq('id', id)
        .single()

      if (fetchError) {
        logger.error('Error fetching current reel:', fetchError)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
      }

      const newLikeCount = (currentReel.like_count || 0) + 1
      
      const { error: incrementError } = await supabase
        .from('reels')
        .update({ 
          like_count: newLikeCount
        })
        .eq('id', id)

      if (incrementError) {
        logger.error('Error incrementing like count:', incrementError)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
      }

      // Crear notificación para el autor del reel (en background)
      (async () => {
        try {
          // Obtener información del reel para saber quién es el autor
          const { data: reel } = await supabase
            .from('reels')
            .select('user_id')
            .eq('id', id)
            .single();

          if (reel && reel.user_id && reel.user_id !== userId) {
            const { AutoNotificationsService } = await import('@/features/notifications/services/auto-notifications.service');
            await AutoNotificationsService.notifyReelLiked(
              id,
              reel.user_id,
              userId
            );
          }
        } catch (notificationError) {
          // Error silenciado para no afectar el flujo principal
        }
      })().catch(() => {}); // Fire and forget

      logger.log(`✅ Like agregado por usuario ${userId} al reel ${id}`)
      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    logger.error('Error in POST /api/reels/[id]/like:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Verificar autenticación - OBLIGATORIA
    let user = null
    try {
      user = await SessionService.getCurrentUser()
    } catch (authError) {
      logger.error('Error getting current user:', authError)
    }

    if (!user || !user.id) {
      logger.warn('❌ Intento de verificar like sin autenticación')
      return NextResponse.json(
        { error: 'Debes estar autenticado para verificar likes' },
        { status: 401 }
      )
    }

    const userId = user.id

    // Verificar si el usuario ya le dio like
    const { data: like, error } = await supabase
      .from('reel_likes')
      .select('id')
      .eq('reel_id', id)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      logger.error('Error checking like status:', error)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    return NextResponse.json({ liked: !!like })
  } catch (error) {
    logger.error('Error in GET /api/reels/[id]/like:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}