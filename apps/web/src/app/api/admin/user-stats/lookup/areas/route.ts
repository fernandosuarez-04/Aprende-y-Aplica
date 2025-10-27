import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: areas, error } = await supabase
      .from('areas')
      .select('id, slug, nombre')
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error fetching areas:', error)
      return NextResponse.json({ error: 'Failed to fetch areas' }, { status: 500 })
    }

    return NextResponse.json(areas || [])
  } catch (error) {
    console.error('Error in GET /api/admin/user-stats/lookup/areas:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
