import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    logger.log('🔄 Iniciando GET /api/admin/user-stats/stats/questions')
    const supabase = await createClient()
    
    // Obtener preguntas sin relaciones complejas
    const { data: questions, error } = await supabase
      .from('preguntas')
      .select(`
        id,
        codigo,
        section,
        tipo,
        area_id
      `)

    if (error) {
      logger.error('❌ Error fetching questions for stats:', error)
      return NextResponse.json({ error: 'Failed to fetch questions', details: error.message }, { status: 500 })
    }

    const totalQuestions = questions?.length || 0
    
    // Preguntas por área (simplificado)
    const questionsByArea = questions?.reduce((acc: any[], question) => {
      const areaName = `Área ${question.area_id || 'Sin área'}`
      const existing = acc.find(item => item.area === areaName)
      if (existing) {
        existing.count++
      } else {
        acc.push({ area: areaName, count: 1 })
      }
      return acc
    }, []) || []

    // Preguntas por tipo
    const questionsByType = questions?.reduce((acc: any[], question) => {
      const type = question.tipo || 'Sin tipo'
      const existing = acc.find(item => item.type === type)
      if (existing) {
        existing.count++
      } else {
        acc.push({ type, count: 1 })
      }
      return acc
    }, []) || []

    // Preguntas por sección
    const questionsBySection = questions?.reduce((acc: any[], question) => {
      const section = question.section || 'Sin sección'
      const existing = acc.find(item => item.section === section)
      if (existing) {
        existing.count++
      } else {
        acc.push({ section, count: 1 })
      }
      return acc
    }, []) || []

    const stats = {
      totalQuestions,
      questionsByArea: questionsByArea.sort((a, b) => b.count - a.count),
      questionsByType: questionsByType.sort((a, b) => b.count - a.count),
      questionsBySection: questionsBySection.sort((a, b) => b.count - a.count)
    }

    logger.log('✅ Question stats calculadas:', stats)
    return NextResponse.json(stats)
  } catch (error) {
    logger.error('❌ Error in GET /api/admin/user-stats/stats/questions:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
