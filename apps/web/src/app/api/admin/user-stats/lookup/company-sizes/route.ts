import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()
    
    const { data: companySizes, error } = await supabase
      .from('tamanos_empresa')
      .select('id, slug, nombre, min_empleados, max_empleados')
      .order('min_empleados', { ascending: true })

    if (error) {
      logger.error('Error fetching company sizes:', error)
      return NextResponse.json({ error: 'Failed to fetch company sizes' }, { status: 500 })
    }

    return NextResponse.json(companySizes || [])
  } catch (error) {
    logger.error('Error in GET /api/admin/user-stats/lookup/company-sizes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
