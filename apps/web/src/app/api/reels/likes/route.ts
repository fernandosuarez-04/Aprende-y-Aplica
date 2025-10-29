import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación (opcional para desarrollo)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.warn('No user authenticated, using default user for development')
    }

    // Usar usuario por defecto si no hay autenticación
    const userId = user?.id || '8365d552-f342-4cd7-ae6b-dff8063a1377'
    console.log('🔍 Loading likes for user:', userId) // Debug

    // Obtener todos los likes del usuario
    const { data: likes, error } = await supabase
      .from('reel_likes')
      .select('reel_id')
      .eq('user_id', userId)

    if (error) {
      console.error('Error loading user likes:', error)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    // Retornar array de IDs de reels que el usuario ha dado like
    const likedReelIds = likes?.map(like => like.reel_id) || []
    console.log('✅ Found liked reel IDs:', likedReelIds) // Debug
    return NextResponse.json(likedReelIds)
  } catch (error) {
    console.error('Error in GET /api/reels/likes:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
