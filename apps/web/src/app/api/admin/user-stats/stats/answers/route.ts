import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    logger.log('🔄 Iniciando GET /api/admin/user-stats/stats/answers')
    const supabase = await createClient()
    
    // Obtener respuestas sin relaciones complejas
    const { data: answers, error } = await supabase
      .from('respuestas')
      .select(`
        id,
        pregunta_id,
        user_perfil_id
      `)

    if (error) {
      logger.error('❌ Error fetching answers for stats:', error)
      return NextResponse.json({ error: 'Failed to fetch answers', details: error.message }, { status: 500 })
    }

    const totalAnswers = answers?.length || 0
    
    // Respuestas por pregunta (simplificado)
    const answersByQuestion = answers?.reduce((acc: any[], answer) => {
      const questionId = `Pregunta ${answer.pregunta_id}`
      const existing = acc.find(item => item.question === questionId)
      if (existing) {
        existing.count++
      } else {
        acc.push({ question: questionId, count: 1 })
      }
      return acc
    }, []) || []

    // Respuestas por usuario (simplificado)
    const answersByUser = answers?.reduce((acc: any[], answer) => {
      const userId = `Usuario ${answer.user_perfil_id.slice(0, 8)}`
      const existing = acc.find(item => item.user === userId)
      if (existing) {
        existing.count++
      } else {
        acc.push({ user: userId, count: 1 })
      }
      return acc
    }, []) || []

    // Calcular promedio de respuestas por usuario
    const uniqueUsers = new Set(answers?.map(answer => answer.user_perfil_id) || [])
    const averageAnswersPerUser = uniqueUsers.size > 0 ? totalAnswers / uniqueUsers.size : 0

    const stats = {
      totalAnswers,
      answersByQuestion: answersByQuestion.sort((a, b) => b.count - a.count).slice(0, 10),
      answersByUser: answersByUser.sort((a, b) => b.count - a.count).slice(0, 10),
      averageAnswersPerUser: Math.round(averageAnswersPerUser * 100) / 100
    }

    logger.log('✅ Answer stats calculadas:', stats)
    return NextResponse.json(stats)
  } catch (error) {
    logger.error('❌ Error in GET /api/admin/user-stats/stats/answers:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
