import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Verificar autenticación (temporalmente comentado)
    // const { data: { user }, error: authError } = await supabase.auth.getUser()
    // if (authError || !user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Obtener el reel actual
    const { data: currentReel, error: fetchError } = await supabase
      .from('reels')
      .select('is_active')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching reel:', fetchError)
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 })
    }

    // Toggle del estado
    const newStatus = !currentReel.is_active

    const { data: updatedReel, error } = await supabase
      .from('reels')
      .update({ 
        is_active: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error toggling reel status:', error)
      return NextResponse.json({ error: 'Failed to toggle reel status' }, { status: 500 })
    }

    return NextResponse.json(updatedReel)
  } catch (error) {
    console.error('Error in PATCH /api/admin/reels/[id]/status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
