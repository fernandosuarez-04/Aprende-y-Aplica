import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { requireAdmin } from '@/lib/auth/requireAdmin'

/**
 * POST /api/admin/upload/organization-image
 * Subir imágenes para organizaciones (logo, banner, favicon)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const formData = await request.formData()
    const file = formData.get('file') as File
    const organizationSlug = formData.get('organizationSlug') as string
    const imageType = formData.get('imageType') as 'logo' | 'banner' | 'favicon'

    if (!file || !organizationSlug || !imageType) {
      return NextResponse.json({
        success: false,
        error: 'Faltan parámetros requeridos (file, organizationSlug, imageType)'
      }, { status: 400 })
    }

    // Validar tipo de imagen
    const validImageTypes = ['logo', 'banner', 'favicon']
    if (!validImageTypes.includes(imageType)) {
      return NextResponse.json({
        success: false,
        error: 'Tipo de imagen inválido. Usar: logo, banner, o favicon'
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

    // Validar tamaño (máximo 5MB para logos/favicons, 10MB para banners)
    const maxSize = imageType === 'banner' ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      const maxMB = imageType === 'banner' ? 10 : 5
      return NextResponse.json({
        success: false,
        error: `El archivo no puede ser mayor a ${maxMB}MB`
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

    // Determinar la carpeta según el tipo de imagen
    const folderMap: Record<string, string> = {
      logo: 'Logo-Empresa',
      banner: 'Banner-Empresa',
      favicon: 'Favicon'
    }
    const folder = folderMap[imageType] || 'Logo-Empresa'

    // Generar nombre de archivo: {folder}/{slug}-{timestamp}.{ext}
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png'
    const timestamp = Date.now()
    const fileName = `${folder}/${organizationSlug}-${timestamp}.${fileExt}`

    // Convertir File a Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Determinar content type
    const contentType = file.type || `image/${fileExt}`

    // Subir el archivo al bucket 'Panel-Business' usando service role (bypass RLS)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('Panel-Business')
      .upload(fileName, buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: contentType
      })

    if (uploadError) {
      logger.error('Error uploading organization image to storage:', uploadError)
      return NextResponse.json({
        success: false,
        error: 'Error al subir la imagen al storage'
      }, { status: 500 })
    }

    // Obtener la URL pública del archivo
    const { data: urlData } = supabaseAdmin.storage
      .from('Panel-Business')
      .getPublicUrl(fileName)

    // Si es un logo, también subir como favicon
    let faviconUrl: string | null = null
    if (imageType === 'logo') {
      const faviconFileName = `Favicon/${organizationSlug}-${timestamp}.${fileExt}`
      
      const { error: faviconError } = await supabaseAdmin.storage
        .from('Panel-Business')
        .upload(faviconFileName, buffer, {
          cacheControl: '3600',
          upsert: true,
          contentType: contentType
        })

      if (!faviconError) {
        const { data: faviconUrlData } = supabaseAdmin.storage
          .from('Panel-Business')
          .getPublicUrl(faviconFileName)
        faviconUrl = faviconUrlData.publicUrl
      }
    }

    return NextResponse.json({
      success: true,
      image: {
        url: urlData.publicUrl,
        storage_path: fileName,
        type: imageType,
        favicon_url: faviconUrl
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/admin/upload/organization-image POST:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
