import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()
    const { status } = body

    if (!status || !['draft', 'published', 'archived'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be draft, published, or archived' },
        { status: 400 }
      )
    }

    console.log('🔄 Cambiando estado de noticia con ID:', id, 'a:', status)

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    // Si se cambia a publicado y no tiene fecha de publicación, agregarla
    if (status === 'published') {
      const { data: currentNews } = await supabase
        .from('news')
        .select('published_at')
        .eq('id', id)
        .single()

      if (!currentNews?.published_at) {
        updateData.published_at = new Date().toISOString()
      }
    }

    const { data: updatedNews, error } = await supabase
      .from('news')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating news status:', error)
      return NextResponse.json(
        { error: 'Failed to update news status' },
        { status: 500 }
      )
    }

    console.log('✅ Estado de noticia actualizado exitosamente:', updatedNews)
    return NextResponse.json({ news: updatedNews })
  } catch (error) {
    console.error('💥 Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
