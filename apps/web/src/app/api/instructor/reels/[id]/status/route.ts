import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireInstructor } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'

/**
 * PATCH /api/instructor/reels/[id]/status
 * Cambia el estado activo/inactivo de un reel del instructor actual
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
      .select('is_active, created_by')
      .eq('id', id)
      .single()

    if (fetchError || !currentReel) {
      logger.error('❌ Error fetching reel:', fetchError)
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 })
    }

    if (currentReel.created_by !== instructorId) {
      logger.warn('Instructor attempted to toggle status of reel they did not create', {
        instructorId,
        reelId: id,
        reelOwner: currentReel.created_by
      })
      return NextResponse.json(
        { error: 'No tienes permiso para modificar este reel' },
        { status: 403 }
      )
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
      .eq('created_by', instructorId) // ✅ Doble verificación de seguridad
      .select()
      .single()

    if (error) {
      logger.error('❌ Error toggling instructor reel status:', error)
      return NextResponse.json({ error: 'Failed to toggle reel status' }, { status: 500 })
    }

    logger.log('✅ Estado del reel del instructor actualizado exitosamente:', updatedReel)
    return NextResponse.json(updatedReel)
  } catch (error) {
    logger.error('💥 Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

