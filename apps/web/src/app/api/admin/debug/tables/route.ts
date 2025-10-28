import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatApiError, logError } from '@/core/utils/api-errors'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Intentar obtener información de las tablas
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name')

    if (error) {
      logError('GET /api/admin/debug/tables - database query', error)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener información de tablas',
        tables: []
      })
    }

    return NextResponse.json({
      success: true,
      tables: tables?.map(t => t.table_name) || []
    })
  } catch (error) {
    logError('GET /api/admin/debug/tables', error)
    return NextResponse.json({
      success: false,
      ...formatApiError(error, 'Error al obtener información de tablas'),
      tables: []
    })
  }
}
