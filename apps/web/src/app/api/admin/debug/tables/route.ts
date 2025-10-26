import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      console.error('Error getting tables:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        tables: []
      })
    }

    return NextResponse.json({
      success: true,
      tables: tables?.map(t => t.table_name) || []
    })
  } catch (error) {
    console.error('Error in debug tables API:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      tables: []
    })
  }
}
