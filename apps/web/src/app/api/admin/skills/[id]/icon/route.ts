import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { requireAdmin } from '@/lib/auth/requireAdmin'

/**
 * DELETE /api/admin/skills/[id]/icon
 * Elimina el icono de una skill del storage y actualiza la base de datos
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: skillId } = await params

    // Usar Service Role Key para bypass de RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceKey) {
      logger.error('Missing SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json({
        success: false,
        error: 'Configuración del servidor incompleta'
      }, { status: 500 })
    }

    // Crear cliente con service role key para bypass de RLS
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Obtener la skill para obtener su slug
    const { data: existingSkill, error: fetchError } = await supabaseAdmin
      .from('skills')
      .select('skill_id, slug, icon_url')
      .eq('skill_id', skillId)
      .single()

    if (fetchError || !existingSkill) {
      logger.error('Error fetching skill:', fetchError)
      return NextResponse.json({
        success: false,
        error: 'Skill no encontrada'
      }, { status: 404 })
    }

    // Si no hay icono, retornar éxito (ya está eliminado)
    if (!existingSkill.icon_url) {
      return NextResponse.json({
        success: true,
        message: 'La skill no tiene icono para eliminar'
      })
    }

    // Eliminar icono del storage (intentar diferentes extensiones)
    const iconExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']
    let deletedFromStorage = false

    for (const ext of iconExtensions) {
      const iconPath = `${existingSkill.slug}-icon.${ext}`
      const { error: storageError } = await supabaseAdmin.storage
        .from('Skills')
        .remove([iconPath])

      if (!storageError) {
        deletedFromStorage = true
        logger.log(`Icono eliminado del storage: ${iconPath}`)
        // No romper el loop, intentar todas las extensiones por si acaso
      }
    }

    // Actualizar icon_url a null en la base de datos
    const { error: updateError } = await supabaseAdmin
      .from('skills')
      .update({
        icon_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('skill_id', skillId)

    if (updateError) {
      logger.error('Error actualizando icon_url en la base de datos:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar la base de datos'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Icono eliminado correctamente',
      deletedFromStorage
    })
  } catch (error) {
    logger.error('💥 Error in /api/admin/skills/[id]/icon DELETE:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

