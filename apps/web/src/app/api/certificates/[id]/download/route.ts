import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { SessionService } from '@/features/auth/services/session.service'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/certificates/[id]/download
 * Descarga un certificado específico del usuario autenticado
 * Valida que el certificado pertenezca al usuario antes de permitir la descarga
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de certificado requerido' },
        { status: 400 }
      )
    }

    // Obtener usuario usando el sistema de sesiones
    const currentUser = await SessionService.getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Verificar que el certificado pertenece al usuario
    const { data: certificate, error: certificateError } = await supabase
      .from('user_course_certificates')
      .select('certificate_id, certificate_url, user_id, courses(title)')
      .eq('certificate_id', id)
      .eq('user_id', currentUser.id)
      .single()

    if (certificateError || !certificate) {
      logger.error('Error fetching certificate for download:', certificateError)
      return NextResponse.json(
        { 
          error: 'Certificado no encontrado o no autorizado',
          details: certificateError?.message
        },
        { status: 404 }
      )
    }

    // Obtener la URL del certificado
    const certificateUrl = certificate.certificate_url

    if (!certificateUrl) {
      return NextResponse.json(
        { error: 'URL del certificado no disponible' },
        { status: 404 }
      )
    }

    // Si la URL es una URL pública, redirigir directamente
    if (certificateUrl.startsWith('http://') || certificateUrl.startsWith('https://')) {
      // Intentar obtener el archivo desde Supabase Storage
      try {
        // Extraer el path del bucket de la URL
        // Formato esperado: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
        const urlMatch = certificateUrl.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/)
        
        if (urlMatch) {
          const [, bucket, path] = urlMatch
          
          // Obtener el archivo desde Supabase Storage
          const { data, error: downloadError } = await supabase.storage
            .from(bucket)
            .download(path)

          if (downloadError || !data) {
            logger.error('Error downloading from storage:', downloadError)
            // Si falla, redirigir a la URL pública
            return NextResponse.redirect(certificateUrl)
          }

          // Convertir blob a array buffer
          const arrayBuffer = await data.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)

          // Determinar el tipo de contenido basado en la extensión
          const extension = path.split('.').pop()?.toLowerCase()
          let contentType = 'application/pdf'
          if (extension === 'png') contentType = 'image/png'
          else if (extension === 'jpg' || extension === 'jpeg') contentType = 'image/jpeg'
          else if (extension === 'pdf') contentType = 'application/pdf'

          // Obtener nombre del archivo
          const fileName = path.split('/').pop() || `certificate-${id}.${extension || 'pdf'}`

          // Retornar el archivo con headers apropiados para descarga
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `attachment; filename="${fileName}"`,
              'Content-Length': buffer.length.toString()
            }
          })
        } else {
          // Si no es una URL de Supabase Storage, redirigir directamente
          return NextResponse.redirect(certificateUrl)
        }
      } catch (error) {
        logger.error('Error processing certificate download:', error)
        // Si hay error, redirigir a la URL pública
        return NextResponse.redirect(certificateUrl)
      }
    }

    // Si no es una URL válida, retornar error
    return NextResponse.json(
      { error: 'URL de certificado inválida' },
      { status: 400 }
    )
  } catch (error) {
    logger.error('Error in /api/certificates/[id]/download:', error)
    return NextResponse.json(
      { 
        error: 'Error al descargar certificado',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

