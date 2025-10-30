import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateReelData } from '@/features/admin/services/adminReels.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { CreateReelSchema } from '@/lib/schemas/content.schema'
import { z } from 'zod'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    console.log('🔄 Iniciando GET /api/admin/reels')
    const supabase = await createClient()
    console.log('✅ Supabase client creado')
    
    const { data: reels, error } = await supabase
      .from('reels')
      .select(`
        id,
        title,
        description,
        video_url,
        thumbnail_url,
        duration_seconds,
        category,
        language,
        is_featured,
        is_active,
        view_count,
        like_count,
        share_count,
        comment_count,
        created_by,
        created_at,
        updated_at,
        published_at
      `)
      .order('created_at', { ascending: false })

    console.log('📊 Resultado de la consulta:', { reels: reels?.length, error })

    if (error) {
      console.error('❌ Error fetching reels:', error)
      return NextResponse.json({ error: 'Failed to fetch reels', details: error.message }, { status: 500 })
    }

    console.log('✅ Reels obtenidos exitosamente:', reels?.length)
    return NextResponse.json(reels || [])
  } catch (error) {
    console.error('❌ Error in GET /api/admin/reels:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()
    
    // ✅ SEGURIDAD: Validar datos de entrada con Zod
    const bodyRaw = await request.json()
    const body = CreateReelSchema.parse({
      ...bodyRaw,
      author_id: bodyRaw.created_by || auth.userId
    })
    
    console.log('🔄 Creando nuevo reel con datos:', JSON.stringify(body, null, 2))

    const { data: newReel, error } = await supabase
      .from('reels')
      .insert([{
        title: body.title,
        description: body.description,
        video_url: body.video_url,
        thumbnail_url: body.thumbnail_url,
        duration_seconds: body.duration_seconds,
        category: body.category,
        language: body.language,
        is_featured: body.is_featured,
        is_active: body.is_active,
        created_by: body.created_by,
        published_at: body.published_at || new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating reel:', error)
      return NextResponse.json({ error: 'Failed to create reel' }, { status: 500 })
    }

    return NextResponse.json(newReel, { status: 201 })
  } catch (error) {
    // ✅ SEGURIDAD: Manejo específico de errores de validación
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Datos inválidos',
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }, { status: 400 })
    }
    
    console.error('Error in POST /api/admin/reels:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
