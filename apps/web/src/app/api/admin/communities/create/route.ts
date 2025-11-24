import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { AdminCommunitiesService } from '@/features/admin/services/adminCommunities.service'
import { formatApiError, logError } from '@/core/utils/api-errors'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { CreateCommunitySchema } from '@/lib/schemas/community.schema'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth // Retornar error si no es admin

    // ✅ SEGURIDAD: Validar datos de entrada con Zod
    const body = await request.json()
    const communityData = CreateCommunitySchema.parse(body)

    // ✅ SEGURIDAD: Usar ID real del administrador autenticado
    const adminUserId = auth.userId

    // Obtener información de la request para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    logger.log('🔧 Llamando a AdminCommunitiesService.createCommunity...')
    const newCommunity = await AdminCommunitiesService.createCommunity(
      communityData,
      adminUserId,
      { ip, userAgent }
    )

    logger.log('✅ Comunidad creada exitosamente:', newCommunity)
    return NextResponse.json({
      success: true,
      community: newCommunity
    })
  } catch (error) {
    // ✅ SEGURIDAD: Manejo específico de errores de validación
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Datos inválidos',
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }, { status: 400 })
    }
    
    logError('POST /api/admin/communities/create', error)
    return NextResponse.json(
      formatApiError(error, 'Error al crear comunidad'),
      { status: 500 }
    )
  }
}
