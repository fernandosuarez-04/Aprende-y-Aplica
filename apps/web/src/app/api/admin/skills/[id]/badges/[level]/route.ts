import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { requireAuth } from '@/lib/auth/requireAuth'

/**
 * DELETE /api/admin/skills/[id]/badges/[level]
 * Eliminar badge de un nivel específico
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; level: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    // Verificar que es administrador
    if (auth.user.cargo_rol !== 'Administrador') {
      return NextResponse.json({
        success: false,
        error: 'No tienes permisos para eliminar badges'
      }, { status: 403 })
    }

    const { id: skillId, level } = await params
    const supabase = await createClient()

    // Validar nivel
    const validLevels = ['green', 'bronze', 'silver', 'gold', 'diamond']
    if (!validLevels.includes(level)) {
      return NextResponse.json({
        success: false,
        error: 'Nivel inválido'
      }, { status: 400 })
    }

    // Obtener badge para obtener storage_path
    const { data: badge, error: fetchError } = await supabase
      .from('skill_badges')
      .select('storage_path')
      .eq('skill_id', skillId)
      .eq('level', level)
      .single()

    if (fetchError || !badge) {
      return NextResponse.json({
        success: false,
        error: 'Badge no encontrado'
      }, { status: 404 })
    }

    // Eliminar archivo del storage
    if (badge.storage_path) {
      const { error: storageError } = await supabase.storage
        .from('Skills')
        .remove([badge.storage_path])

      if (storageError) {
        logger.error('Error deleting badge from storage:', storageError)
        // Continuar aunque falle el storage, eliminar de BD
      }
    }

    // Eliminar registro de la BD
    const { error: deleteError } = await supabase
      .from('skill_badges')
      .delete()
      .eq('skill_id', skillId)
      .eq('level', level)

    if (deleteError) {
      logger.error('Error deleting badge from database:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Error al eliminar el badge'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Badge eliminado correctamente'
    })
  } catch (error) {
    logger.error('💥 Error in /api/admin/skills/[id]/badges/[level] DELETE:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

