import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/features/auth/services/session.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createClient()
    
    // Obtener usuario autenticado
    const currentUser = await SessionService.getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener el curso por slug con información del instructor
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        instructor_id,
        users!courses_instructor_id_fkey (
          id,
          display_name,
          first_name,
          last_name,
          username,
          signature_url,
          signature_name
        )
      `)
      .eq('slug', slug)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    // Obtener el certificado del usuario para este curso
    const { data: enrollment } = await supabase
      .from('user_course_enrollments')
      .select('enrollment_id')
      .eq('user_id', currentUser.id)
      .eq('course_id', course.id)
      .single()

    if (!enrollment) {
      return NextResponse.json(
        { error: 'No estás inscrito en este curso' },
        { status: 404 }
      )
    }

    const { data: certificate, error: certificateError } = await supabase
      .from('user_course_certificates')
      .select('certificate_id, certificate_url, certificate_hash, issued_at')
      .eq('user_id', currentUser.id)
      .eq('course_id', course.id)
      .eq('enrollment_id', enrollment.enrollment_id)
      .single()

    if (certificateError || !certificate) {
      return NextResponse.json(
        { error: 'Certificado no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que la URL no sea un placeholder
    if (certificate.certificate_url && certificate.certificate_url.includes('placeholder-certificate')) {
      console.error('Certificado con URL placeholder detectado:', certificate.certificate_id)
      return NextResponse.json(
        { 
          error: 'El certificado está en proceso de generación. Por favor, intenta nuevamente en unos momentos.',
          details: 'La URL del certificado aún no está disponible.'
        },
        { status: 202 } // 202 Accepted - El certificado está siendo procesado
      )
    }

    // Obtener datos del estudiante
    const { data: studentData } = await supabase
      .from('users')
      .select('display_name, first_name, last_name, username')
      .eq('id', currentUser.id)
      .single()

    // Datos del instructor
    const instructor = course.users as any
    const instructorName = instructor?.display_name || 
      (instructor?.first_name && instructor?.last_name 
        ? `${instructor.first_name} ${instructor.last_name}` 
        : instructor?.username) || 'Instructor'

    // Nombre del estudiante
    const studentName = studentData?.display_name || 
      (studentData?.first_name && studentData?.last_name 
        ? `${studentData.first_name} ${studentData.last_name}` 
        : studentData?.username) || 'Estudiante'

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.certificate_id,
        url: certificate.certificate_url,
        hash: certificate.certificate_hash,
        issuedAt: certificate.issued_at
      },
      student: {
        name: studentName
      },
      instructor: {
        name: instructorName,
        signatureUrl: instructor?.signature_url || null,
        signatureName: instructor?.signature_name || null
      },
      course: {
        title: course.title || 'Curso'
      }
    })
  } catch (error) {
    console.error('Error obteniendo certificado:', error)
    return NextResponse.json(
      {
        error: 'Error al obtener el certificado',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

