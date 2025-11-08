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

    // Llamar a la función SQL validate_certificate
    const { data, error } = await supabase.rpc('validate_certificate', {
      cert_hash: hash.trim()
    })

    if (error) {
      // console.error('Error validating certificate:', error)
      return NextResponse.json(
        { 
          error: 'Error al validar el certificado',
          details: error.message 
        },
        { status: 500 }
      )
    }

    // Si no hay datos, el certificado no existe o no es válido
    if (!data || data.length === 0) {
      return NextResponse.json(
        { 
          error: 'Certificado no encontrado o inválido',
          valid: false
        },
        { status: 404 }
      )
    }

    const certificate = data[0]

    return NextResponse.json({
      valid: certificate.is_valid === true,
      expired: certificate.is_expired === true,
      certificate: {
        id: certificate.certificate_id,
        userId: certificate.user_id,
        courseTitle: certificate.course_title,
        username: certificate.username,
        issuedAt: certificate.issued_at,
        expiresAt: certificate.expires_at,
        blockchainHash: certificate.blockchain_hash || certificate.certificate_hash
      }
    })
  } catch (error) {
    // console.error('Error in /api/certificates/verify/[hash]:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

