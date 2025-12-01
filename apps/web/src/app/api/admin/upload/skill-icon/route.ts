import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { requireAdmin } from '@/lib/auth/requireAdmin'

/**
 * POST /api/admin/upload/skill-icon
 * Subir imagen de icono para una skill
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const formData = await request.formData()
    const file = formData.get('file') as File
    const skillSlug = formData.get('skillSlug') as string

    if (!file || !skillSlug) {
      return NextResponse.json({
        success: false,
        error: 'Faltan parámetros requeridos (file, skillSlug)'
      }, { status: 400 })
    }

    // Validar tipo de archivo (imágenes)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Solo se permiten archivos de imagen (PNG, JPEG, JPG, GIF, WebP, SVG)'
      }, { status: 400 })
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: 'El archivo no puede ser mayor a 5MB'
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

    // Generar nombre de archivo: {skill-slug}-icon.{ext}
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png'
    const fileName = `${skillSlug}-icon.${fileExt}`

    // Convertir File a Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Determinar content type
    const contentType = file.type || `image/${fileExt}`

    // Subir el archivo al bucket Skills usando service role (bypass RLS)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('Skills')
      .upload(fileName, buffer, {
        cacheControl: '3600',
        upsert: true, // Permitir sobrescribir si existe
        contentType: contentType
      })

    if (uploadError) {
      logger.error('Error uploading icon to storage:', uploadError)
      return NextResponse.json({
        success: false,
        error: 'Error al subir el icono al storage'
      }, { status: 500 })
    }

    // Obtener la URL pública del archivo
    const { data: urlData } = supabaseAdmin.storage
      .from('Skills')
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      icon: {
        url: urlData.publicUrl,
        storage_path: fileName
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/admin/upload/skill-icon POST:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

