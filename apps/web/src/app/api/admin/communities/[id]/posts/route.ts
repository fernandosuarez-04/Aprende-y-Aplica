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

    const posts = await AdminCommunitiesService.getCommunityPosts(communityId)

    return NextResponse.json({ 
      success: true, 
      posts 
    })
  } catch (error: unknown) {
    console.error('Error fetching community posts via API:', error)
    const message = error instanceof Error ? error.message : 'Error al obtener los posts';
    return NextResponse.json({ 
      success: false, 
      message 
    }, { status: 500 })
  }
}
