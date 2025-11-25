import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { requireAdmin } from '@/lib/auth/requireAdmin'

/**
 * POST /api/admin/upload/skill-badge
 * Subir imagen de badge para un nivel específico de skill
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const formData = await request.formData()
    const file = formData.get('file') as File
    const skillId = formData.get('skillId') as string
    const level = formData.get('level') as string
    const skillSlug = formData.get('skillSlug') as string

    if (!file || !skillId || !level || !skillSlug) {
      return NextResponse.json({
        success: false,
        error: 'Faltan parámetros requeridos (file, skillId, level, skillSlug)'
      }, { status: 400 })
    }

    // Validar tipo de archivo (solo PNG)
    if (file.type !== 'image/png') {
      return NextResponse.json({
        success: false,
        error: 'Solo se permiten archivos PNG'
      }, { status: 400 })
    }

    // Validar tamaño (máximo 2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: 'El archivo no puede ser mayor a 2MB'
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

    // Usar Service Role Key para bypass de RLS en Storage
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
      }
    })

    // Generar nombre de archivo: {skill-slug}-{level}.png
    const fileName = `${skillSlug}-${level}.png`

    // Convertir File a Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Subir el archivo al bucket Skills usando service role (bypass RLS)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('Skills')
      .upload(fileName, buffer, {
        cacheControl: '3600',
        upsert: true, // Permitir sobrescribir si existe
        contentType: 'image/png'
      })

    if (uploadError) {
      logger.error('Error uploading badge to storage:', uploadError)
      return NextResponse.json({
        success: false,
        error: 'Error al subir el badge al storage'
      }, { status: 500 })
    }

    // Obtener la URL pública del archivo
    const { data: urlData } = supabaseAdmin.storage
      .from('Skills')
      .getPublicUrl(fileName)

    // Guardar o actualizar en la tabla skill_badges usando cliente normal
    const supabase = await createClient()
    const { data: badgeData, error: badgeError } = await supabase
      .from('skill_badges')
      .upsert({
        skill_id: skillId,
        level: level,
        badge_url: urlData.publicUrl,
        storage_path: fileName,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'skill_id,level'
      })
      .select()
      .single()

    if (badgeError) {
      logger.error('Error saving badge to database:', badgeError)
      // Intentar eliminar el archivo subido si falla la BD
      await supabaseAdmin.storage.from('Skills').remove([fileName])
      return NextResponse.json({
        success: false,
        error: 'Error al guardar el badge en la base de datos'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      badge: {
        id: badgeData.id,
        skill_id: badgeData.skill_id,
        level: badgeData.level,
        badge_url: badgeData.badge_url,
        storage_path: badgeData.storage_path
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/admin/upload/skill-badge POST:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

