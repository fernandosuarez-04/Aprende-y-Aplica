import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

/**
 * POST /api/admin/certificates/regenerate
 *
 * Regenera un certificado eliminando el existente.
 * El certificado se regenerará automáticamente la próxima vez que el usuario lo solicite.
 *
 * Body:
 * - certificateId: string (ID del certificado a regenerar)
 * O
 * - enrollmentId: string (ID del enrollment para regenerar su certificado)
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { certificateId, enrollmentId } = body

    if (!certificateId && !enrollmentId) {
      return NextResponse.json(
        { error: 'Se requiere certificateId o enrollmentId' },
        { status: 400 }
      )
    }

    // Obtener el certificado a eliminar
    let certificate: any = null

    if (certificateId) {
      const { data, error } = await supabaseAdmin
        .from('user_course_certificates')
        .select('certificate_id, certificate_url, enrollment_id, user_id, course_id')
        .eq('certificate_id', certificateId)
        .single()

      if (error || !data) {
        return NextResponse.json(
          { error: 'Certificado no encontrado' },
          { status: 404 }
        )
      }

      certificate = data
    } else if (enrollmentId) {
      const { data, error } = await supabaseAdmin
        .from('user_course_certificates')
        .select('certificate_id, certificate_url, enrollment_id, user_id, course_id')
        .eq('enrollment_id', enrollmentId)
        .single()

      if (error || !data) {
        return NextResponse.json(
          { error: 'Certificado no encontrado para este enrollment' },
          { status: 404 }
        )
      }

      certificate = data
    }

    console.log('🔄 Regenerando certificado:', {
      certificate_id: certificate.certificate_id,
      enrollment_id: certificate.enrollment_id,
      user_id: certificate.user_id,
      course_id: certificate.course_id,
      url: certificate.certificate_url,
      admin_user: auth.userId
    })

    // NOTA: La tabla user_course_certificates es append-only, no permite DELETE
    // No podemos eliminar el certificado para forzar regeneración
    console.log('⚠️ FUNCIÓN DE REGENERACIÓN DESHABILITADA')
    console.log('   La tabla user_course_certificates es append-only y no permite DELETE')
    console.log('   El certificado se regenerará automáticamente si tiene URL placeholder')

    return NextResponse.json({
      success: false,
      error: 'Función de regeneración deshabilitada',
      message: 'La tabla user_course_certificates es append-only. Los certificados con placeholder se regenerarán automáticamente.',
      certificate: {
        certificate_id: certificate.certificate_id,
        certificate_url: certificate.certificate_url,
        enrollment_id: certificate.enrollment_id,
        user_id: certificate.user_id,
        course_id: certificate.course_id,
        isPlaceholder: certificate.certificate_url?.includes('placeholder-certificate') || false
      }
    })
  } catch (error) {
    console.error('Error regenerando certificado:', error)
    return NextResponse.json(
      {
        error: 'Error al regenerar certificado',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/certificates/regenerate?enrollmentId=xxx
 *
 * Obtiene información sobre un certificado para verificar si necesita regeneración
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const enrollmentId = searchParams.get('enrollmentId')
    const certificateId = searchParams.get('certificateId')

    if (!enrollmentId && !certificateId) {
      return NextResponse.json(
        { error: 'Se requiere enrollmentId o certificateId' },
        { status: 400 }
      )
    }

    // Construir la query
    let query = supabaseAdmin
      .from('user_course_certificates')
      .select(`
        certificate_id,
        certificate_url,
        certificate_hash,
        enrollment_id,
        user_id,
        course_id,
        issued_at,
        created_at,
        updated_at
      `)

    if (certificateId) {
      query = query.eq('certificate_id', certificateId)
    } else if (enrollmentId) {
      query = query.eq('enrollment_id', enrollmentId)
    }

    const { data: certificate, error } = await query.single()

    if (error || !certificate) {
      return NextResponse.json(
        { error: 'Certificado no encontrado' },
        { status: 404 }
      )
    }

    // Analizar el certificado
    const isPlaceholder = certificate.certificate_url &&
                          certificate.certificate_url.includes('placeholder-certificate')

    const needsRegeneration = isPlaceholder

    return NextResponse.json({
      success: true,
      certificate: {
        ...certificate,
        analysis: {
          isPlaceholder,
          needsRegeneration,
          reason: isPlaceholder ? 'URL es placeholder' : 'Certificado válido'
        }
      }
    })
  } catch (error) {
    console.error('Error obteniendo información del certificado:', error)
    return NextResponse.json(
      {
        error: 'Error al obtener información del certificado',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
