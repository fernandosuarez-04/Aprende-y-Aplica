import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '6')
    
    logger.log('🔄 Fetching featured reels with limit:', limit)
    
    const supabase = await createClient()
    
    const { data: reels, error } = await supabase
      .from('reels')
      .select(`
        id,
        title,
        description,
        video_url,
        thumbnail_url,
        duration_seconds,
        category,
        view_count,
        like_count,
        share_count,
        comment_count,
        created_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    logger.log('📊 Featured reels query result:', { 
      count: reels?.length, 
      error: error?.message,
      reels: reels?.map(r => ({ id: r.id, title: r.title, is_active: true }))
    })

    if (error) {
      logger.error('Error fetching featured reels:', error)
      return NextResponse.json({ error: 'Failed to fetch featured reels' }, { status: 500 })
    }

    logger.log('✅ Returning featured reels:', reels?.length)
    return NextResponse.json(reels || [])
  } catch (error) {
    logger.error('Error in GET /api/reels/featured:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
