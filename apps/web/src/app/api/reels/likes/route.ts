import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación - OBLIGATORIA
    const { SessionService } = await import('@/features/auth/services/session.service')
    let user = null
    try {
      user = await SessionService.getCurrentUser()
    } catch (authError) {
      logger.error('Error getting current user:', authError)
    }

    if (!user || !user.id) {
      logger.warn('❌ Intento de obtener likes sin autenticación')
      return NextResponse.json(
        { error: 'Debes estar autenticado para ver tus likes' },
        { status: 401 }
      )
    }

    const userId = user.id
    logger.log(`✅ Usuario autenticado para obtener likes: ${userId} (${user.username || user.email})`)

    // Obtener todos los likes del usuario
    const { data: likes, error } = await supabase
      .from('reel_likes')
      .select('reel_id')
      .eq('user_id', userId)

    if (error) {
      logger.error('Error loading user likes:', error)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    // Retornar array de IDs de reels que el usuario ha dado like
    const likedReelIds = likes?.map(like => like.reel_id) || []
    logger.log('✅ Found liked reel IDs:', likedReelIds) // Debug
    return NextResponse.json(likedReelIds)
  } catch (error) {
    logger.error('Error in GET /api/reels/likes:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
