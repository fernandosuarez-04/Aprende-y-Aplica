import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: sectors, error } = await supabase
      .from('sectores')
      .select('id, slug, nombre')
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error fetching sectors:', error)
      return NextResponse.json({ error: 'Failed to fetch sectors' }, { status: 500 })
    }

    return NextResponse.json(sectors || [])
  } catch (error) {
    console.error('Error in GET /api/admin/user-stats/lookup/sectors:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
