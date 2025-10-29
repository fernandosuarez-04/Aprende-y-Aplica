import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatApiError, logError } from '@/core/utils/api-errors'

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Iniciando subida de imagen...')
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const communityName = formData.get('communityName') as string

    console.log('📋 Datos recibidos:', { 
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type,
      communityName 
    })

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    if (!communityName) {
      return NextResponse.json(
        { success: false, error: 'Nombre de comunidad requerido' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Solo se permiten archivos de imagen (JPEG, PNG, WebP, GIF)' },
        { status: 400 }
      )
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'El archivo no puede ser mayor a 5MB' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    console.log('🔗 Cliente Supabase creado')

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const sanitizedName = communityName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)
    
    const fileExtension = file.name.split('.').pop()
    const fileName = `${sanitizedName}-${timestamp}.${fileExtension}`

    console.log('📝 Nombre de archivo generado:', fileName)

    // Convertir File a Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log('🔄 Buffer creado, tamaño:', buffer.length)

    // Verificar que el bucket existe
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    console.log('🪣 Buckets disponibles:', buckets?.map(b => b.name))
    
    if (bucketError) {
      console.error('Error listando buckets:', bucketError)
    }

    // Subir el archivo al bucket community-images
    console.log('⬆️ Subiendo archivo...')
    const { data, error } = await supabase.storage
      .from('community-images')
      .upload(fileName, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (error) {
      logError('POST /api/admin/upload/community-image - storage upload', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Error al subir la imagen'
        },
        { status: 500 }
      )
    }

    console.log('✅ Archivo subido exitosamente:', data.path)

    // Obtener la URL pública del archivo
    const { data: urlData } = supabase.storage
      .from('community-images')
      .getPublicUrl(data.path)

    console.log('🔗 URL generada:', urlData.publicUrl)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName: data.path
    })
  } catch (error) {
    logError('POST /api/admin/upload/community-image', error)
    return NextResponse.json(
      {
        success: false,
        ...formatApiError(error, 'Error al subir la imagen')
      },
      { status: 500 }
    )
  }
}
