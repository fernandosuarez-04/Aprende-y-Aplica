import { NextRequest, NextResponse } from 'next/server'
import { AdminCommunitiesService } from '@/features/admin/services/adminCommunities.service'
import { formatApiError, logError } from '@/core/utils/api-errors'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando creación de comunidad...')

    const communityData = await request.json()
    console.log('📋 Datos recibidos:', communityData)

    // Obtener información del administrador desde el token/sesión
    const adminUserId = 'admin-user-id' // TODO: Obtener del token JWT

    // Obtener información de la request para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    console.log('🔧 Llamando a AdminCommunitiesService.createCommunity...')
    const newCommunity = await AdminCommunitiesService.createCommunity(
      communityData,
      adminUserId,
      { ip, userAgent }
    )

    console.log('✅ Comunidad creada exitosamente:', newCommunity)
    return NextResponse.json({
      success: true,
      community: newCommunity
    })
  } catch (error) {
    logError('POST /api/admin/communities/create', error)
    return NextResponse.json(
      formatApiError(error, 'Error al crear comunidad'),
      { status: 500 }
    )
  }
}
