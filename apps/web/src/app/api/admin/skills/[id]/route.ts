import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { requireAuth } from '@/lib/auth/requireAuth'

/**
 * GET /api/admin/skills/[id]
 * Obtiene una skill específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    // Verificar que es administrador
    if (auth.user.cargo_rol !== 'Administrador') {
      return NextResponse.json({
        success: false,
        error: 'No tienes permisos para ver skills'
      }, { status: 403 })
    }

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
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    // Verificar que es administrador
    if (auth.user.cargo_rol !== 'Administrador') {
      return NextResponse.json({
        success: false,
        error: 'No tienes permisos para editar skills'
      }, { status: 403 })
    }

    const { id: skillId } = await params
    const body = await request.json()

    const supabase = await createClient()

    // Verificar que la skill existe
    const { data: existingSkill, error: fetchError } = await supabase
      .from('skills')
      .select('skill_id')
      .eq('skill_id', skillId)
      .single()

    if (fetchError || !existingSkill) {
      return NextResponse.json({
        success: false,
        error: 'Skill no encontrada'
      }, { status: 404 })
    }

    // Si se está cambiando el slug, verificar que no exista
    if (body.slug && body.slug !== existingSkill.slug) {
      const { data: slugExists } = await supabase
        .from('skills')
        .select('skill_id')
        .eq('slug', body.slug)
        .single()

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
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    // Verificar que es administrador
    if (auth.user.cargo_rol !== 'Administrador') {
      return NextResponse.json({
        success: false,
        error: 'No tienes permisos para eliminar skills'
      }, { status: 403 })
    }

    const { id: skillId } = await params
    const supabase = await createClient()

    // Verificar que la skill existe
    const { data: existingSkill, error: fetchError } = await supabase
      .from('skills')
      .select('skill_id')
      .eq('skill_id', skillId)
      .single()

    if (fetchError || !existingSkill) {
      return NextResponse.json({
        success: false,
        error: 'Skill no encontrada'
      }, { status: 404 })
    }

    // Soft delete: marcar como inactiva
    const { error } = await supabase
      .from('skills')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('skill_id', skillId)

    if (error) {
      logger.error('Error deleting skill:', error)
      return NextResponse.json({
        success: false,
        error: 'Error al eliminar la skill'
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

