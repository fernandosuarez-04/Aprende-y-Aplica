import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireInstructor } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'

/**
 * PATCH /api/instructor/reels/[id]/featured
 * Cambia el estado destacado de un reel del instructor actual
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()
    const { id } = await params
    const instructorId = auth.userId

    // ✅ SEGURIDAD: Verificar que el reel pertenece al instructor
    const { data: currentReel, error: fetchError } = await supabase
      .from('reels')
      .select('is_featured, created_by')
      .eq('id', id)
      .single()

    if (fetchError || !currentReel) {
      logger.error('❌ Error fetching reel:', fetchError)
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 })
    }

    if (currentReel.created_by !== instructorId) {
      logger.warn('Instructor attempted to toggle featured of reel they did not create', {
        instructorId,
        reelId: id,
        reelOwner: currentReel.created_by
      })
      return NextResponse.json(
        { error: 'No tienes permiso para modificar este reel' },
        { status: 403 }
      )
    }

    // Toggle del destacado
    const newFeatured = !currentReel.is_featured

    const { data: updatedReel, error } = await supabase
      .from('reels')
      .update({ 
        is_featured: newFeatured,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('created_by', instructorId) // ✅ Doble verificación de seguridad
      .select()
      .single()

    if (error) {
      logger.error('❌ Error toggling instructor reel featured:', error)
      return NextResponse.json({ error: 'Failed to toggle reel featured' }, { status: 500 })
    }

    logger.log('✅ Estado destacado del reel del instructor actualizado exitosamente:', updatedReel)
    return NextResponse.json(updatedReel)
  } catch (error) {
    logger.error('💥 Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

