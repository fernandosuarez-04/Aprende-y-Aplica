import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth/requireAdmin'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cliente con service role key para bypass de RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo de video' }, { status: 400 })
    }

    // Validar tamaño (máximo 1GB para videos)
    const maxSize = 1024 * 1024 * 1024 // 1GB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'El video excede el tamaño máximo de 1GB' }, { status: 400 })
    }

    // Validar tipo de archivo
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de video no permitido. Solo se permiten MP4, WebM y OGG' }, { status: 400 })
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `videos/${fileName}`

    // Subir archivo usando service role key
    const { data, error } = await supabase.storage
      .from('course-videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      logger.error('Error uploading video:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('course-videos')
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      name: file.name,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    logger.error('Error in upload video API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}

