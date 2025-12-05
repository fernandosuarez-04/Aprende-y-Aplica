import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    logger.log('🔄 Iniciando GET /api/admin/user-stats/stats/genai')
    const supabase = await createClient()
    
    // Obtener todos los registros de adopción GenAI usando paginación
    let allGenAIAdoption: any[] = []
    let page = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
      const { data: genAIAdoption, error } = await supabase
        .from('adopcion_genai')
        .select('id, pais, indice_aipi, fuente, fecha_fuente')
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (error) {
        logger.error('❌ Error fetching GenAI adoption for stats:', error)
        return NextResponse.json({ error: 'Failed to fetch GenAI adoption', details: error.message }, { status: 500 })
      }

      if (genAIAdoption && genAIAdoption.length > 0) {
        allGenAIAdoption = [...allGenAIAdoption, ...genAIAdoption]
        hasMore = genAIAdoption.length === pageSize
        page++
      } else {
        hasMore = false
      }
    }

    const totalRecords = allGenAIAdoption.length
    const genAIAdoption = allGenAIAdoption
    
    // Calcular índice AIPI promedio
    const totalAIPI = genAIAdoption?.reduce((sum, record) => sum + record.indice_aipi, 0) || 0
    const averageAIPIIndex = totalRecords > 0 ? totalAIPI / totalRecords : 0

    // Países únicos con datos
    const uniqueCountries = new Set(genAIAdoption?.map(record => record.pais) || [])
    const countriesWithData = uniqueCountries.size

    // Top países por índice AIPI
    const topCountries = genAIAdoption
      ?.sort((a, b) => b.indice_aipi - a.indice_aipi)
      .slice(0, 10)
      .map(record => ({
        country: record.pais,
        index: record.indice_aipi
      })) || []

    const stats = {
      totalRecords,
      averageAIPIIndex: Math.round(averageAIPIIndex * 100) / 100,
      countriesWithData,
      topCountries
    }

    logger.log('✅ GenAI stats calculadas:', stats)
    return NextResponse.json(stats)
  } catch (error) {
    logger.error('❌ Error in GET /api/admin/user-stats/stats/genai:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
