import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireInstructor } from '@/lib/auth/requireAdmin'
import { CreateReelSchema } from '@/lib/schemas/content.schema'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/instructor/reels
 * Obtiene todos los reels del instructor actual
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de instructor
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()
    const instructorId = auth.userId

    logger.log('🔄 Obteniendo reels del instructor:', instructorId)

    // Obtener solo los reels del instructor actual
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
      .eq('created_by', instructorId) // ✅ Solo reels del instructor actual
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('❌ Error fetching instructor reels:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reels' },
        { status: 500 }
      )
    }

    logger.log('✅ Reels del instructor obtenidos exitosamente:', reels?.length || 0)
    return NextResponse.json(reels || [])
  } catch (error) {
    logger.error('💥 Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/instructor/reels
 * Crea un nuevo reel para el instructor actual
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de instructor
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()
    const instructorId = auth.userId
    const bodyRaw = await request.json()
    
    // ✅ SEGURIDAD: Validar campos básicos con Zod
    const basicValidation = CreateReelSchema.pick({
      title: true,
      description: true,
      video_url: true,
      category: true
    }).parse({
      title: bodyRaw.title,
      description: bodyRaw.description || '',
      video_url: bodyRaw.video_url,
      category: bodyRaw.category || 'general'
    })
    
    const body = bodyRaw
    logger.log('🔄 Creando nuevo reel del instructor con datos:', JSON.stringify(body, null, 2))

    const { data: newReel, error } = await supabase
      .from('reels')
      .insert({
        title: body.title,
        description: body.description,
        video_url: body.video_url,
        thumbnail_url: body.thumbnail_url,
        duration_seconds: body.duration_seconds || 0,
        category: body.category || 'general',
        language: body.language || 'es',
        is_featured: body.is_featured || false,
        is_active: body.is_active !== undefined ? body.is_active : true,
        created_by: instructorId, // ✅ Asignar automáticamente al instructor actual
        published_at: body.published_at || (body.is_active ? new Date().toISOString() : null),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        view_count: 0,
        like_count: 0,
        share_count: 0,
        comment_count: 0
      })
      .select()
      .single()

    if (error) {
      logger.error('❌ Error creating instructor reel:', error)
      return NextResponse.json(
        { error: 'Failed to create reel' },
        { status: 500 }
      )
    }

    logger.log('✅ Reel del instructor creado exitosamente:', newReel)
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
    
    logger.error('💥 Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

