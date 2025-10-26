import { NextRequest, NextResponse } from 'next/server'
import { AdminCommunitiesService } from '@/features/admin/services/adminCommunities.service'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params
    const communityData = await request.json()
    
    // Obtener información del administrador desde el token/sesión
    const adminUserId = 'admin-user-id' // TODO: Obtener del token JWT
    
    // Obtener información de la request para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const updatedCommunity = await AdminCommunitiesService.updateCommunity(
      communityId, 
      communityData, 
      adminUserId,
      { ip, userAgent }
    )

    return NextResponse.json({
      success: true,
      community: updatedCommunity
    })
  } catch (error) {
    console.error('Error in PUT /api/admin/communities/[id]:', error)
    return NextResponse.json(
      { error: 'Error al actualizar comunidad' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params
    
    // Obtener información del administrador desde el token/sesión
    const adminUserId = 'admin-user-id' // TODO: Obtener del token JWT
    
    // Obtener información de la request para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await AdminCommunitiesService.deleteCommunity(communityId, adminUserId, { ip, userAgent })

    return NextResponse.json({
      success: true,
      message: 'Comunidad eliminada correctamente'
    })
  } catch (error) {
    console.error('Error in DELETE /api/admin/communities/[id]:', error)
    return NextResponse.json(
      { error: 'Error al eliminar comunidad' },
      { status: 500 }
    )
  }
}
