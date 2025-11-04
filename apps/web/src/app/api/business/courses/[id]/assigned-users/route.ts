import { NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { SessionService } from '@/features/auth/services/session.service'

/**
 * GET /api/business/courses/[id]/assigned-users
 * Obtiene los IDs de usuarios que ya tienen el curso asignado
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    const { id: courseId } = await params
    const supabase = await createClient()

    // Obtener usuario autenticado
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser || !currentUser.organization_id) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado o sin organización'
      }, { status: 401 })
    }

    // Obtener usuarios que ya tienen el curso asignado en la organización
    const { data: assignments, error } = await supabase
      .from('organization_course_assignments')
      .select('user_id')
      .eq('organization_id', currentUser.organization_id)
      .eq('course_id', courseId)
      .in('status', ['assigned', 'in_progress'])

    if (error) {
      logger.error('Error fetching assigned users:', error)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener usuarios asignados',
        user_ids: []
      }, { status: 500 })
    }

    const userIds = (assignments || []).map(a => a.user_id)

    return NextResponse.json({
      success: true,
      user_ids: userIds
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/courses/[id]/assigned-users:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      user_ids: []
    }, { status: 500 })
  }
}

