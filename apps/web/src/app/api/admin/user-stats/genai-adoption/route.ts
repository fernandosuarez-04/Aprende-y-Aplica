import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()
    
    const { data: genAIAdoption, error } = await supabase
      .from('adopcion_genai')
      .select('id, pais, indice_aipi, fuente, fecha_fuente')
      .order('indice_aipi', { ascending: false })

    if (error) {
      logger.error('Error fetching GenAI adoption:', error)
      return NextResponse.json({ error: 'Failed to fetch GenAI adoption' }, { status: 500 })
    }

    return NextResponse.json(genAIAdoption || [])
  } catch (error) {
    logger.error('Error in GET /api/admin/user-stats/genai-adoption:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
