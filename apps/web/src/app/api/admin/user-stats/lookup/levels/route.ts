import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()
    
    const { data: levels, error } = await supabase
      .from('niveles')
      .select('id, slug, nombre')
      .order('nombre', { ascending: true })

    if (error) {
      logger.error('Error fetching levels:', error)
      return NextResponse.json({ error: 'Failed to fetch levels' }, { status: 500 })
    }

    return NextResponse.json(levels || [])
  } catch (error) {
    logger.error('Error in GET /api/admin/user-stats/lookup/levels:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
