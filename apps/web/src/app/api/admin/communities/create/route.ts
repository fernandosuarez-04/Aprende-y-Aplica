import { NextRequest, NextResponse } from 'next/server'
import { AdminCommunitiesService } from '@/features/admin/services/adminCommunities.service'
import { formatApiError, logError } from '@/core/utils/api-errors'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function POST(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth // Retornar error si no es admin

    const communityData = await request.json()

    // ✅ SEGURIDAD: Usar ID real del administrador autenticado
    const adminUserId = auth.userId

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
