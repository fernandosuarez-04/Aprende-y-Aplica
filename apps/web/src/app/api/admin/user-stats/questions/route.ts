import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    logger.log('🔄 Iniciando GET /api/admin/user-stats/questions')
    const supabase = await createClient()
    
    // Obtener preguntas sin relaciones complejas primero
    const { data: questions, error } = await supabase
      .from('preguntas')
      .select(`
        id,
        codigo,
        section,
        bloque,
        area_id,
        exclusivo_rol_id,
        texto,
        tipo,
        opciones,
        locale,
        peso,
        escala,
        scoring,
        created_at,
        respuesta_correcta
      `)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('❌ Error fetching questions:', error)
      return NextResponse.json({ error: 'Failed to fetch questions', details: error.message }, { status: 500 })
    }

    logger.log('✅ Questions obtenidos:', questions?.length)
    return NextResponse.json(questions || [])
  } catch (error) {
    logger.error('❌ Error in GET /api/admin/user-stats/questions:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
