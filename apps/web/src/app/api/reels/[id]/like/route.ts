import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Verificar autenticación (opcional para desarrollo)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      // Para desarrollo, usar un usuario por defecto
      console.warn('No user authenticated, using default user for development')
      // return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Usar usuario por defecto si no hay autenticación
    const userId = user?.id || '8365d552-f342-4cd7-ae6b-dff8063a1377'

    // Verificar si ya existe el like
    const { data: existingLike, error: checkError } = await supabase
      .from('reel_likes')
      .select('id')
      .eq('reel_id', id)
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing like:', checkError)
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
        console.error('Error removing like:', deleteError)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
      }

      // Decrementar contador en tabla reels
      const { data: currentReel, error: fetchError } = await supabase
        .from('reels')
        .select('like_count')
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('Error fetching current reel:', fetchError)
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
        console.error('Error decrementing like count:', decrementError)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
      }

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
        console.error('Error adding like:', insertError)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
      }

      // Incrementar contador en tabla reels
      const { data: currentReel, error: fetchError } = await supabase
        .from('reels')
        .select('like_count')
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('Error fetching current reel:', fetchError)
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
        console.error('Error incrementing like count:', incrementError)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
      }

      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error('Error in POST /api/reels/[id]/like:', error)
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

    // Verificar autenticación (opcional para desarrollo)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      // Para desarrollo, usar un usuario por defecto
      console.warn('No user authenticated, using default user for development')
      // return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Usar usuario por defecto si no hay autenticación
    const userId = user?.id || '8365d552-f342-4cd7-ae6b-dff8063a1377'

    // Verificar si el usuario ya le dio like
    const { data: like, error } = await supabase
      .from('reel_likes')
      .select('id')
      .eq('reel_id', id)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking like status:', error)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    return NextResponse.json({ liked: !!like })
  } catch (error) {
    console.error('Error in GET /api/reels/[id]/like:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}