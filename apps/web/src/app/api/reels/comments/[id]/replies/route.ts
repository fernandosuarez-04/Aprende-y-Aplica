import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Obtener respuestas del comentario con información del usuario
    const { data: replies, error } = await supabase
      .from('reel_comment_replies')
      .select(`
        id,
        content,
        created_at,
        users (
          id,
          username,
          profile_picture_url
        )
      `)
      .eq('comment_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching replies:', error)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    return NextResponse.json(replies || [])
  } catch (error) {
    console.error('Error in GET /api/reels/comments/[id]/replies:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'La respuesta no puede estar vacía' }, { status: 400 })
    }

    // Verificar autenticación (opcional para desarrollo)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.warn('No user authenticated, using default user for development')
    }

    // Usar usuario por defecto si no hay autenticación
    const userId = user?.id || '8365d552-f342-4cd7-ae6b-dff8063a1377'

    // Crear la respuesta
    const { data: newReply, error: insertError } = await supabase
      .from('reel_comment_replies')
      .insert({
        comment_id: id,
        user_id: userId,
        content: content.trim()
      })
      .select(`
        id,
        content,
        created_at,
        users (
          id,
          username,
          profile_picture_url
        )
      `)
      .single()

    if (insertError) {
      console.error('Error creating reply:', insertError)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    // Obtener el reel_id del comentario para actualizar el contador
    const { data: comment, error: commentError } = await supabase
      .from('reel_comments')
      .select('reel_id')
      .eq('id', id)
      .single()

    if (commentError) {
      console.error('Error fetching comment:', commentError)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    // Calcular el nuevo contador total (comentarios + respuestas)
    const { data: commentsCount, error: commentsError } = await supabase
      .from('reel_comments')
      .select('id', { count: 'exact' })
      .eq('reel_id', comment.reel_id)
      .eq('is_active', true)

    if (commentsError) {
      console.error('Error counting comments:', commentsError)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    // Contar respuestas de todos los comentarios de este reel
    const { data: repliesCount, error: repliesError } = await supabase
      .from('reel_comment_replies')
      .select('id', { count: 'exact' })
      .in('comment_id', commentsCount?.map(c => c.id) || [])
      .eq('is_active', true)

    if (repliesError) {
      console.error('Error counting replies:', repliesError)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    const totalCount = (commentsCount?.length || 0) + (repliesCount?.length || 0)
    
    const { error: updateError } = await supabase
      .from('reels')
      .update({ 
        comment_count: totalCount
      })
      .eq('id', comment.reel_id)

    if (updateError) {
      console.error('Error updating comment count:', updateError)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    return NextResponse.json(newReply)
  } catch (error) {
    console.error('Error in POST /api/reels/comments/[id]/replies:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
