import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    console.log('🔄 Iniciando GET /api/admin/user-stats/lookup/roles')
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
      console.error('❌ Error fetching roles:', error)
      return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 })
    }

    console.log('✅ Roles obtenidos:', roles?.length)
    return NextResponse.json(roles || [])
  } catch (error) {
    console.error('❌ Error in GET /api/admin/user-stats/lookup/roles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
