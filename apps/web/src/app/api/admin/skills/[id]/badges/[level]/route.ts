import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { requireAdmin } from '@/lib/auth/requireAdmin'

/**
 * DELETE /api/admin/skills/[id]/badges/[level]
 * Eliminar badge de un nivel específico
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; level: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

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

    // Usar Service Role Key para eliminar del storage (bypass RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (supabaseServiceKey && badge.storage_path) {
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })

      const { error: storageError } = await supabaseAdmin.storage
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

