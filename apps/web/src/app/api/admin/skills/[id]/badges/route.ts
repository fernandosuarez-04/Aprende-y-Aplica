import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { requireAuth } from '@/lib/auth/requireAuth'

/**
 * GET /api/admin/skills/[id]/badges
 * Obtener todos los badges de una skill
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
        error: 'No tienes permisos para ver badges'
      }, { status: 403 })
    }

    const { id: skillId } = await params
    const supabase = await createClient()

    const { data: badges, error } = await supabase
      .from('skill_badges')
      .select('*')
      .eq('skill_id', skillId)
      .order('level', { ascending: true })

    if (error) {
      logger.error('Error fetching badges:', error)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener badges'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      badges: badges || []
    })
  } catch (error) {
    logger.error('💥 Error in /api/admin/skills/[id]/badges GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

