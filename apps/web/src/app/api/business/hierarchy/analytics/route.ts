import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // region, zone, team
  const id = searchParams.get('id')

  if (!type || !id) {
    return NextResponse.json(
      { success: false, error: 'Missing type or id' },
      { status: 400 }
    )
  }

  try {
    const supabase = createClient()
    
    // Call the RPC function
    const { data, error } = await supabase.rpc('get_hierarchy_analytics', {
      p_entity_type: type,
      p_entity_id: id
    })

    if (error) {
      console.error('Error fetching analytics:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { analytics: data }
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
