import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'

// ✅ GET: Listar todas las solicitudes de creación de comunidades
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'pending', 'approved', 'rejected', o null para todas

    logger.log('🔄 Obteniendo solicitudes de comunidades, status:', status || 'all')

    let query = supabase
      .from('community_creation_requests')
      .select(`
        *,
        requester:users!community_creation_requests_requester_id_fkey(
          id,
          display_name,
          first_name,
          last_name,
          email,
          profile_picture_url,
          cargo_rol
        ),
        reviewer:users!community_creation_requests_reviewed_by_fkey(
          id,
          display_name,
          first_name,
          last_name,
          email
        ),
        course:courses(
          id,
          title,
          slug,
          thumbnail_url
        )
      `)
      .order('created_at', { ascending: false })

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query = query.eq('status', status)
    }

    const { data: requests, error } = await query

    if (error) {
      logger.error('❌ Error fetching community requests:', error)
      return NextResponse.json(
        { 
          success: false,
          error: 'Error al obtener las solicitudes'
        },
        { status: 500 }
      )
    }

    // Mapear datos
    const mappedRequests = (requests || []).map((request: any) => ({
      id: request.id,
      requester_id: request.requester_id,
      requester: request.requester ? {
        id: request.requester.id,
        display_name: request.requester.display_name ||
                     `${request.requester.first_name || ''} ${request.requester.last_name || ''}`.trim() ||
                     'Usuario sin nombre',
        email: request.requester.email,
        profile_picture_url: request.requester.profile_picture_url,
        role: request.requester.cargo_rol
      } : null,
      name: request.name,
      description: request.description,
      slug: request.slug,
      image_url: request.image_url,
      visibility: request.visibility,
      access_type: request.access_type,
      course_id: request.course_id,
      course: request.course || null,
      status: request.status,
      requester_note: request.requester_note,
      rejection_reason: request.rejection_reason,
      reviewed_by: request.reviewed_by,
      reviewer: request.reviewer ? {
        id: request.reviewer.id,
        display_name: request.reviewer.display_name ||
                     `${request.reviewer.first_name || ''} ${request.reviewer.last_name || ''}`.trim() ||
                     'Administrador',
        email: request.reviewer.email
      } : null,
      reviewed_at: request.reviewed_at,
      created_at: request.created_at,
      updated_at: request.updated_at
    }))

    logger.log('✅ Solicitudes obtenidas exitosamente:', mappedRequests.length)
    
    return NextResponse.json({
      success: true,
      requests: mappedRequests,
      counts: {
        total: requests?.length || 0,
        pending: requests?.filter((r: any) => r.status === 'pending').length || 0,
        approved: requests?.filter((r: any) => r.status === 'approved').length || 0,
        rejected: requests?.filter((r: any) => r.status === 'rejected').length || 0
      }
    }, { status: 200 })
  } catch (error) {
    logger.error('💥 Error fetching community requests:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Error al obtener las solicitudes',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

