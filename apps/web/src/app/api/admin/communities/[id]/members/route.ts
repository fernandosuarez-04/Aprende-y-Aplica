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

    const members = await AdminCommunitiesService.getCommunityMembers(communityId, page, limit)

    return NextResponse.json({ 
      success: true, 
      members 
    })
  } catch (error: any) {
    console.error('Error fetching community members via API:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Error al obtener los miembros' 
    }, { status: 500 })
  }
}
