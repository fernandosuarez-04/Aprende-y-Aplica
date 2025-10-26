import { NextResponse } from 'next/server'
import { AdminCommunitiesService } from '@/features/admin/services/adminCommunities.service'

export async function GET() {
  try {
    const stats = await AdminCommunitiesService.getCommunityStats()
    return NextResponse.json({ stats }, { status: 200 })
  } catch (error) {
    console.error('Error fetching community stats:', error)
    return NextResponse.json({ message: 'Error fetching community stats' }, { status: 500 })
  }
}
