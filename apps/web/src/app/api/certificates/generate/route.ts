import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { SessionService } from '@/features/auth/services/session.service'
import { createClient } from '@/lib/supabase/server'
import { CertificateService } from '@/core/services/certificate.service'

/**
 * POST /api/certificates/generate
 * Genera un certificado para un curso completado (útil para cursos ya completados antes de la implementación)
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await SessionService.getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { course_id } = body

    if (!course_id) {
      return NextResponse.json(
        { error: 'course_id es requerido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar que el usuario tiene el curso completado
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('user_course_enrollments')
      .select('enrollment_id, overall_progress_percentage, enrollment_status')
      .eq('user_id', currentUser.id)
      .eq('course_id', course_id)
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: 'No estás inscrito en este curso' },
        { status: 404 }
      )
    }

    // Verificar que el curso está completado al 100%
    if (enrollment.enrollment_status !== 'completed' && enrollment.overall_progress_percentage < 100) {
      return NextResponse.json(
        { error: 'Debes completar el curso al 100% para obtener un certificado' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un certificado
    const { data: existingCertificate } = await supabase
      .from('user_course_certificates')
      .select('certificate_id, certificate_url')
      .eq('user_id', currentUser.id)
      .eq('course_id', course_id)
      .single()

    if (existingCertificate) {
      return NextResponse.json({
        success: true,
        message: 'Certificado ya existe',
        certificate_id: existingCertificate.certificate_id,
        certificate_url: existingCertificate.certificate_url
      })
    }

    // Obtener información del curso e instructor
    const { data: courseInfo } = await supabase
      .from('courses')
      .select('id, title, instructor_id')
      .eq('id', course_id)
      .single()

    if (!courseInfo) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    // Obtener información del instructor
    let instructorName = 'Instructor'
    if (courseInfo.instructor_id) {
      const { data: instructor } = await supabase
        .from('users')
        .select('first_name, last_name, username')
        .eq('id', courseInfo.instructor_id)
        .single()

      if (instructor) {
        const fullName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim()
        instructorName = fullName || instructor.username || 'Instructor'
      }
    }

    // Obtener información del usuario
    const { data: userInfo } = await supabase
      .from('users')
      .select('first_name, last_name, username, display_name')
      .eq('id', currentUser.id)
      .single()

    const userName = userInfo?.display_name || 
      `${userInfo?.first_name || ''} ${userInfo?.last_name || ''}`.trim() || 
      userInfo?.username || 
      'Usuario'

    // Generar certificado
    const certificateUrl = await CertificateService.generateCertificate({
      userId: currentUser.id,
      courseId: course_id,
      enrollmentId: enrollment.enrollment_id,
      courseTitle: courseInfo.title,
      instructorName: instructorName,
      userName: userName
    })

    if (!certificateUrl) {
      return NextResponse.json(
        { error: 'Error al generar el certificado' },
        { status: 500 }
      )
    }

    // Crear registro del certificado en la BD
    const certificateId = await CertificateService.createCertificateRecord(
      currentUser.id,
      course_id,
      enrollment.enrollment_id,
      certificateUrl
    )

    if (!certificateId) {
      return NextResponse.json(
        { error: 'Error al crear el registro del certificado' },
        { status: 500 }
      )
    }

    logger.log(`✅ Certificado generado manualmente: ${certificateId}`)

    return NextResponse.json({
      success: true,
      message: 'Certificado generado exitosamente',
      certificate_id: certificateId,
      certificate_url: certificateUrl
    })
  } catch (error) {
    logger.error('Error en /api/certificates/generate:', error)
    return NextResponse.json(
      { 
        error: 'Error al generar certificado',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

