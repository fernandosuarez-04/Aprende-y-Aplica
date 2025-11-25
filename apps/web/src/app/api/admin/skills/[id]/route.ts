import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { requireAdmin } from '@/lib/auth/requireAdmin'

/**
 * GET /api/admin/skills/[id]
 * Obtiene una skill específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: skillId } = await params
    const supabase = await createClient()

    const { data: skill, error } = await supabase
      .from('skills')
      .select('*')
      .eq('skill_id', skillId)
      .single()

    if (error || !skill) {
      return NextResponse.json({
        success: false,
        error: 'Skill no encontrada'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      skill
    })
  } catch (error) {
    logger.error('💥 Error in /api/admin/skills/[id] GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

/**
 * PUT /api/admin/skills/[id]
 * Actualiza una skill
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: skillId } = await params
    const body = await request.json()

    const supabase = await createClient()

    // Verificar que la skill existe y obtener su slug actual
    const { data: existingSkill, error: fetchError } = await supabase
      .from('skills')
      .select('skill_id, slug')
      .eq('skill_id', skillId)
      .single()

    if (fetchError || !existingSkill) {
      logger.error('Error fetching existing skill:', fetchError)
      return NextResponse.json({
        success: false,
        error: 'Skill no encontrada'
      }, { status: 404 })
    }

    // Si se está cambiando el slug, verificar que no exista en otra skill
    if (body.slug && body.slug !== existingSkill.slug) {
      const { data: slugExists, error: slugCheckError } = await supabase
        .from('skills')
        .select('skill_id')
        .eq('slug', body.slug)
        .neq('skill_id', skillId) // Excluir la skill actual
        .maybeSingle()

      if (slugCheckError) {
        logger.error('Error checking slug:', slugCheckError)
        return NextResponse.json({
          success: false,
          error: 'Error al verificar el slug'
        }, { status: 500 })
      }

      if (slugExists) {
        return NextResponse.json({
          success: false,
          error: 'Ya existe una skill con ese slug'
        }, { status: 400 })
      }
    }

    const { data: skill, error } = await supabase
      .from('skills')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('skill_id', skillId)
      .select()
      .single()

    if (error) {
      logger.error('Error updating skill:', error)
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar la skill'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      skill
    })
  } catch (error) {
    logger.error('💥 Error in /api/admin/skills/[id] PUT:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/skills/[id]
 * Elimina una skill (soft delete)
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

    // Verificar que la skill existe
    const { data: existingSkill, error: fetchError } = await supabaseAdmin
      .from('skills')
      .select('skill_id, slug')
      .eq('skill_id', skillId)
      .single()

    if (fetchError || !existingSkill) {
      logger.error('Error fetching skill:', fetchError)
      return NextResponse.json({
        success: false,
        error: 'Skill no encontrada'
      }, { status: 404 })
    }

    // Eliminar badges de storage primero
    const { data: badges } = await supabaseAdmin
      .from('skill_badges')
      .select('storage_path')
      .eq('skill_id', skillId)

    if (badges && badges.length > 0) {
      const filesToDelete = badges
        .map(b => b.storage_path)
        .filter((path): path is string => path !== null && path !== undefined)
      
      if (filesToDelete.length > 0) {
        // Eliminar archivos del storage
        const { error: storageError } = await supabaseAdmin.storage
          .from('Skills')
          .remove(filesToDelete)
        
        if (storageError) {
          logger.warn('Error deleting badge files from storage:', storageError)
          // Continuar aunque falle la eliminación de archivos
        }
      }
    }

    // Eliminar icono de storage si existe
    if (existingSkill.slug) {
      // Intentar eliminar el icono (puede tener diferentes extensiones)
      const iconExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']
      for (const ext of iconExtensions) {
        const iconPath = `${existingSkill.slug}-icon.${ext}`
        await supabaseAdmin.storage
          .from('Skills')
          .remove([iconPath])
          .catch(() => {
            // Ignorar errores si el archivo no existe
          })
      }
    }

    // Soft delete: marcar como inactiva
    const { error: updateError } = await supabaseAdmin
      .from('skills')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('skill_id', skillId)

    if (updateError) {
      logger.error('Error deleting skill:', updateError)
      return NextResponse.json({
        success: false,
        error: `Error al eliminar la skill: ${updateError.message || 'Error desconocido'}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Skill eliminada correctamente'
    })
  } catch (error) {
    logger.error('💥 Error in /api/admin/skills/[id] DELETE:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

