import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/features/auth/services/session.service'
import { logger } from '@/lib/logger'

/**
 * PATCH /api/users/[userId]/skills/[skillId]/display
 * Actualiza la visibilidad de una skill del usuario
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; skillId: string }> }
) {
  try {
    const { userId, skillId } = await params
    const currentUser = await SessionService.getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado'
      }, { status: 401 })
    }

    // Verificar que el usuario solo pueda actualizar sus propias skills
    if (currentUser.id !== userId) {
      return NextResponse.json({
        success: false,
        error: 'No autorizado para actualizar esta skill'
      }, { status: 403 })
    }

    const body = await request.json()
    const { is_displayed } = body

    if (typeof is_displayed !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'is_displayed debe ser un booleano'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Actualizar is_displayed
    const { error: updateError } = await supabase
      .from('user_skills')
      .update({ is_displayed })
      .eq('user_id', userId)
      .eq('skill_id', skillId)

    if (updateError) {
      logger.error('Error updating skill display:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar la visibilidad de la skill'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Visibilidad de skill actualizada correctamente'
    })
  } catch (error) {
    logger.error('💥 Error in /api/users/[userId]/skills/[skillId]/display PATCH:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

