import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: genAIAdoption, error } = await supabase
      .from('adopcion_genai')
      .select('id, pais, indice_aipi, fuente, fecha_fuente')
      .order('indice_aipi', { ascending: false })

    if (error) {
      console.error('Error fetching GenAI adoption:', error)
      return NextResponse.json({ error: 'Failed to fetch GenAI adoption' }, { status: 500 })
    }

    return NextResponse.json(genAIAdoption || [])
  } catch (error) {
    console.error('Error in GET /api/admin/user-stats/genai-adoption:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
