import { NextResponse } from 'next/server'
import { AdminCommunitiesService } from '@/features/admin/services/adminCommunities.service'

export async function GET() {
  try {
    const communities = await AdminCommunitiesService.getAllCommunities()
    return NextResponse.json({ communities }, { status: 200 })
  } catch (error) {
    console.error('Error fetching admin communities:', error)
    return NextResponse.json({ message: 'Error fetching admin communities' }, { status: 500 })
  }
}
