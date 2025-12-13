import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { requireAdmin } from '@/lib/auth/requireAdmin'

/**
 * GET /api/admin/skills/[id]/badges
 * Obtener todos los badges de una skill
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: skillId } = await params
    
    // Usar Service Role Key para bypass de RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceKey) {
      logger.error('Missing SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json({
        success: false,
        error: 'Configuración del servidor incompleta'
      }, { status: 500 })
    }

    // Crear cliente con service role key para bypass de RLS
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    })

    const { data: badges, error } = await supabaseAdmin
      .from('skill_badges')
      .select('*')
      .eq('skill_id', skillId)
      .order('level', { ascending: true })

    if (error) {
      logger.error('Error fetching badges:', error)
      logger.error('Badge fetch error details:', JSON.stringify(error, null, 2))
      return NextResponse.json({
        success: false,
        error: `Error al obtener badges: ${error.message || error.code || 'Error desconocido'}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      badges: badges || []
    })
  } catch (error) {
    logger.error('💥 Error in /api/admin/skills/[id]/badges GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

/**
 * POST /api/admin/skills/[id]/badges
 * Crear un badge para una skill (asociar badge existente en storage)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: skillId } = await params
    const body = await request.json()
    const { level, badge_url, storage_path } = body

    if (!level || !badge_url || !storage_path) {
      return NextResponse.json({
        success: false,
        error: 'Faltan parámetros requeridos (level, badge_url, storage_path)'
      }, { status: 400 })
    }

    // Validar nivel
    const validLevels = ['green', 'bronze', 'silver', 'gold', 'diamond']
    if (!validLevels.includes(level)) {
      return NextResponse.json({
        success: false,
        error: 'Nivel inválido'
      }, { status: 400 })
    }

    // Usar Service Role Key para bypass de RLS (similar al endpoint de upload)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceKey) {
      logger.error('Missing SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json({
        success: false,
        error: 'Configuración del servidor incompleta'
      }, { status: 500 })
    }

    // Crear cliente con service role key para bypass de RLS
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    })

    // Verificar si el badge ya existe
    const { data: existingBadge } = await supabaseAdmin
      .from('skill_badges')
      .select('id')
      .eq('skill_id', skillId)
      .eq('level', level)
      .maybeSingle()

    let badgeData
    let badgeError

    if (existingBadge) {
      // Actualizar badge existente
      const { data, error } = await supabaseAdmin
        .from('skill_badges')
        .update({
          badge_url: badge_url,
          storage_path: storage_path,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingBadge.id)
        .select()
        .single()
      
      badgeData = data
      badgeError = error
    } else {
      // Crear nuevo badge
      const { data, error } = await supabaseAdmin
        .from('skill_badges')
        .insert({
          skill_id: skillId,
          level: level,
          badge_url: badge_url,
          storage_path: storage_path,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      badgeData = data
      badgeError = error
    }

    if (badgeError) {
      logger.error('Error creating/updating badge:', badgeError)
      logger.error('Badge error details:', JSON.stringify(badgeError, null, 2))
      return NextResponse.json({
        success: false,
        error: `Error al crear el badge en la base de datos: ${badgeError.message || badgeError.code || 'Error desconocido'}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      badge: badgeData
    })
  } catch (error) {
    logger.error('💥 Error in /api/admin/skills/[id]/badges POST:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

