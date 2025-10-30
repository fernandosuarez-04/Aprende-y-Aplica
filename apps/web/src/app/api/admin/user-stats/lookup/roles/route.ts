import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    logger.log('🔄 Iniciando GET /api/admin/user-stats/lookup/roles')
    const supabase = await createClient()
    
    const { data: roles, error } = await supabase
      .from('roles')
      .select(`
        id,
        slug,
        nombre,
        area_id,
        areas!roles_area_id_fkey (
          id,
          nombre,
          slug
        )
      `)
      .order('nombre', { ascending: true })

    if (error) {
      logger.error('❌ Error fetching roles:', error)
      return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 })
    }

    logger.log('✅ Roles obtenidos:', roles?.length)
    return NextResponse.json(roles || [])
  } catch (error) {
    logger.error('❌ Error in GET /api/admin/user-stats/lookup/roles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
