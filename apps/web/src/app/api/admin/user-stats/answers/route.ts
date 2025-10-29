import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    console.log('🔄 Iniciando GET /api/admin/user-stats/answers')
    const supabase = await createClient()
    
    // Obtener respuestas con información del usuario
    const { data: answers, error } = await supabase
      .from('respuestas')
      .select(`
        id,
        pregunta_id,
        valor,
        respondido_en,
        user_perfil_id,
        user_perfil!user_perfil_id (
          user_id,
          users (
            id,
            username,
            profile_picture_url,
            email
          )
        )
      `)
      .order('respondido_en', { ascending: false })

    if (error) {
      console.error('❌ Error fetching answers:', error)
      return NextResponse.json({ error: 'Failed to fetch answers', details: error.message }, { status: 500 })
    }

    console.log('✅ Answers obtenidos:', answers?.length)
    return NextResponse.json(answers || [])
  } catch (error) {
    console.error('❌ Error in GET /api/admin/user-stats/answers:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
