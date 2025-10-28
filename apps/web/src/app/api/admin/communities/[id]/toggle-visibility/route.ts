import { NextRequest, NextResponse } from 'next/server'
import { AdminCommunitiesService } from '@/features/admin/services/adminCommunities.service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params
    const adminUserId = 'admin-user-id' // TODO: Obtener del token JWT
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const updatedCommunity = await AdminCommunitiesService.toggleCommunityVisibility(
      communityId,
      adminUserId,
      { ip, userAgent }
    )

    return NextResponse.json({ 
      success: true, 
      community: updatedCommunity 
    })
  } catch (error: unknown) {
    console.error('Error toggling community visibility via API:', error)
    const message = error instanceof Error ? error.message : 'Error al cambiar visibilidad de la comunidad';
    return NextResponse.json({ 
      success: false, 
      message 
    }, { status: 500 })
  }
}
