import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()
    
    const { data: areas, error } = await supabase
      .from('areas')
      .select('id, slug, nombre')
      .order('nombre', { ascending: true })

    if (error) {
      logger.error('Error fetching areas:', error)
      return NextResponse.json({ error: 'Failed to fetch areas' }, { status: 500 })
    }

    return NextResponse.json(areas || [])
  } catch (error) {
    logger.error('Error in GET /api/admin/user-stats/lookup/areas:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
