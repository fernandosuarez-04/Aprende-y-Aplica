import { NextRequest, NextResponse } from 'next/server'
import { AdminCommunitiesService } from '@/features/admin/services/adminCommunities.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { id: communityId } = await params
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')

    const requests = await AdminCommunitiesService.getCommunityAccessRequests(communityId, page, limit)

    return NextResponse.json({ 
      success: true, 
      requests 
    })
  } catch (error: unknown) {
    console.error('Error fetching access requests via API:', error)
    const message = error instanceof Error ? error.message : 'Error al obtener las solicitudes';
    return NextResponse.json({ 
      success: false, 
      message 
    }, { status: 500 })
  }
}
