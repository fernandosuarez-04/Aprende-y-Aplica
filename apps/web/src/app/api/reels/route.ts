import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    
    const supabase = await createClient()
    
    let query = supabase
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
        created_at,
        users!reels_created_by_fkey (
          id,
          username,
          profile_picture_url
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data: reels, error } = await query

    logger.log('📊 Reels query result:', { 
      count: reels?.length, 
      error: error?.message,
      sample: reels?.[0] ? {
        id: reels[0].id,
        title: reels[0].title,
        hasUsers: !!reels[0].users,
        usersData: reels[0].users
      } : null
    })

    if (error) {
      logger.error('Error fetching reels:', error)
      return NextResponse.json({ error: 'Failed to fetch reels' }, { status: 500 })
    }

    logger.log('✅ Returning reels:', reels?.length)
    return NextResponse.json(reels || [])
  } catch (error) {
    logger.error('Error in GET /api/reels:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
