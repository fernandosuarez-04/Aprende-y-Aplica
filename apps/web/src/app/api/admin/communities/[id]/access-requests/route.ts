import { NextRequest, NextResponse } from 'next/server'
import { AdminCommunitiesService } from '@/features/admin/services/adminCommunities.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')

    const requests = await AdminCommunitiesService.getCommunityAccessRequests(communityId, page, limit)

    return NextResponse.json({ 
      success: true, 
      requests 
    })
  } catch (error: any) {
    console.error('Error fetching access requests via API:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Error al obtener las solicitudes' 
    }, { status: 500 })
  }
}
