import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth/requireAdmin'

// Configurar para permitir uploads grandes
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutos para videos grandes

export async function POST(request: NextRequest) {
  // Wrapper para capturar CUALQUIER error y devolver JSON
  try {
    console.log('📥 Received upload request')
    
    // Verificar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables')
      return NextResponse.json(
        { 
          error: 'Configuración del servidor incompleta. Variables de entorno faltantes.',
          details: {
            hasUrl: !!supabaseUrl,
            hasServiceKey: !!supabaseServiceKey
          }
        },
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Environment variables OK')

    const auth = await requireAdmin()
    if (auth instanceof NextResponse) {
      // requireAdmin ya devuelve JSON, solo asegurar Content-Type
      const clonedResponse = auth.clone()
      clonedResponse.headers.set('Content-Type', 'application/json')
      return clonedResponse
    }
    
    console.log('✅ Authentication OK')

    // Intentar leer FormData con manejo de errores específico
    let formData: FormData
    try {
      console.log('📥 Reading FormData...')
      formData = await request.formData()
      console.log('✅ FormData read successfully')
    } catch (formDataError) {
      console.error('❌ Error reading FormData:', formDataError)
      return NextResponse.json(
        {
          error: 'Error al leer el archivo. El archivo puede ser demasiado grande o estar corrupto.',
          details: formDataError instanceof Error ? formDataError.message : 'Error desconocido al leer FormData'
        },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    const file = formData.get('file') as File

    if (!file) {
      console.error('❌ No file provided')
      return NextResponse.json(
        { error: 'No se proporcionó archivo de video' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ File received:', { name: file.name, size: file.size, type: file.type })

    // Validar tamaño (máximo 1GB para videos)
    const maxSize = 1024 * 1024 * 1024 // 1GB
    if (file.size > maxSize) {
      console.error('❌ File too large:', file.size)
      return NextResponse.json(
        { error: 'El video excede el tamaño máximo de 1GB' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Validar tipo de archivo
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de video no permitido. Solo se permiten MP4, WebM y OGG',
        receivedType: file.type
      }, { status: 400 })
    }

    // Cliente con service role key para bypass de RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verificar que el bucket existe
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError)
      return NextResponse.json(
        { error: 'Error al acceder al almacenamiento', details: bucketsError.message },
        { status: 500 }
      )
    }

    const bucketExists = buckets?.some(b => b.name === 'course-videos')
    if (!bucketExists) {
      console.error('❌ Bucket "course-videos" does not exist')
      return NextResponse.json(
        { 
          error: 'El bucket de almacenamiento no existe. Por favor, créalo en Supabase.',
          availableBuckets: buckets?.map(b => b.name) || []
        },
        { status: 500 }
      )
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp4'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `videos/${fileName}`

    console.log('📤 Uploading video:', { fileName, size: file.size, type: file.type })

    // Subir archivo usando service role key
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('course-videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (uploadError) {
      console.error('❌ Error uploading video:', uploadError)
      return NextResponse.json(
        { 
          error: 'Error al subir el video',
          details: uploadError.message,
          code: uploadError.statusCode || 'UNKNOWN'
        },
        { status: 500 }
      )
    }

    if (!uploadData) {
      console.error('❌ No upload data returned')
      return NextResponse.json(
        { error: 'No se recibió confirmación de la subida' },
        { status: 500 }
      )
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('course-videos')
      .getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      console.error('❌ Could not get public URL')
      return NextResponse.json(
        { error: 'Error al obtener la URL pública del video' },
        { status: 500 }
      )
    }

    console.log('✅ Video uploaded successfully:', urlData.publicUrl)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      name: file.name,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    // Asegurar que SIEMPRE devolvemos JSON, nunca HTML
    console.error('💥 Unexpected error in upload video API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // Intentar devolver JSON incluso si hay un error
    try {
      return NextResponse.json(
        { 
          success: false,
          error: 'Error interno del servidor',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
          stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    } catch (jsonError) {
      // Si incluso devolver JSON falla, devolver un string JSON simple
      console.error('💥 Error even creating JSON response:', jsonError)
      return new NextResponse(
        JSON.stringify({ 
          success: false,
          error: 'Error interno del servidor',
          message: errorMessage
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }
  }
}

