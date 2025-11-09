import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params

    if (!hash || hash.trim().length === 0) {
      return NextResponse.json(
        { error: 'Hash de certificado requerido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Consultar directamente la tabla de certificados
    const { data: certificate, error } = await supabase
      .from('user_course_certificates')
      .select(`
        certificate_id,
        user_id,
        course_id,
        enrollment_id,
        certificate_url,
        issued_at,
        expires_at,
        certificate_hash
      `)
      .eq('certificate_hash', hash.trim())
      .single()

    if (error) {
      // Si no se encuentra el certificado, retornar 404
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { 
            error: 'Certificado no encontrado o inválido',
            valid: false
          },
          { status: 404 }
        )
      }

      console.error('Error validating certificate:', error)
      return NextResponse.json(
        { 
          error: 'Error al validar el certificado',
          details: error.message 
        },
        { status: 500 }
      )
    }

    // Si no hay datos, el certificado no existe
    if (!certificate) {
      return NextResponse.json(
        { 
          error: 'Certificado no encontrado o inválido',
          valid: false
        },
        { status: 404 }
      )
    }

    // Obtener información del usuario
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('username, display_name, first_name, last_name')
      .eq('id', certificate.user_id)
      .single()

    // Obtener información del curso
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('title')
      .eq('id', certificate.course_id)
      .single()

    // Verificar si el certificado está expirado
    const now = new Date()
    const expiresAt = certificate.expires_at ? new Date(certificate.expires_at) : null
    const isExpired = expiresAt ? expiresAt < now : false

    // Construir nombre de usuario
    const username = user?.display_name || 
      `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 
      user?.username || 
      'Usuario'

    // Obtener título del curso
    const courseTitle = course?.title || 'Curso'

    return NextResponse.json({
      valid: !isExpired,
      expired: isExpired,
      certificate: {
        id: certificate.certificate_id,
        userId: certificate.user_id,
        courseTitle: courseTitle,
        username: username,
        issuedAt: certificate.issued_at,
        expiresAt: certificate.expires_at,
        blockchainHash: certificate.certificate_hash
      }
    })
  } catch (error) {
    console.error('Error in /api/certificates/verify/[hash]:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

