import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/features/auth/services/session.service'
import { generateCertificate } from '@/lib/services/certificate.service'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    console.log('📝 [Certificate Generate] Iniciando generación de certificado para curso:', slug)

    const supabase = await createClient()

    // Obtener usuario autenticado
    const currentUser = await SessionService.getCurrentUser()

    if (!currentUser) {
      console.error('❌ [Certificate Generate] Usuario no autenticado')
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    console.log('✅ [Certificate Generate] Usuario autenticado:', { userId: currentUser.id, email: currentUser.email })

    // Obtener el curso por slug
    console.log('🔍 [Certificate Generate] Buscando curso por slug:', slug)
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('slug', slug)
      .single()

    if (courseError) {
      console.error('❌ [Certificate Generate] Error obteniendo curso:', {
        slug,
        error: courseError,
        message: courseError.message,
        details: courseError.details,
        hint: courseError.hint
      })
      return NextResponse.json(
        {
          error: 'Curso no encontrado',
          details: courseError.message,
          slug: slug
        },
        { status: 404 }
      )
    }

    if (!course) {
      console.error('❌ [Certificate Generate] Curso no existe con slug:', slug)
      return NextResponse.json(
        { error: 'Curso no encontrado', slug: slug },
        { status: 404 }
      )
    }

    console.log('✅ [Certificate Generate] Curso encontrado:', { id: course.id, title: course.title, slug })

    // Obtener el enrollment del usuario para este curso
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('user_course_enrollments')
      .select('enrollment_id')
      .eq('user_id', currentUser.id)
      .eq('course_id', course.id)
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: 'No estás inscrito en este curso' },
        { status: 404 }
      )
    }

    // Generar el certificado
    const certificate = await generateCertificate(
      enrollment.enrollment_id,
      course.id,
      currentUser.id
    )

    // Obtener el curso con información del instructor
    const { data: courseWithInstructor } = await supabase
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
      .eq('id', course.id)
      .single()

    // Obtener datos del estudiante
    const { data: studentData } = await supabase
      .from('users')
      .select('display_name, first_name, last_name, username')
      .eq('id', currentUser.id)
      .single()

    // Obtener el certificado recién generado con todos los datos
    const { data: certificateData } = await supabase
      .from('user_course_certificates')
      .select('certificate_id, certificate_url, certificate_hash, issued_at')
      .eq('certificate_id', certificate.certificate_id)
      .single()

    // Datos del instructor
    const instructor = courseWithInstructor?.users as any
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
        id: certificateData?.certificate_id || certificate.certificate_id,
        url: certificateData?.certificate_url || certificate.certificate_url,
        hash: certificateData?.certificate_hash || certificate.certificate_hash,
        issuedAt: certificateData?.issued_at || new Date().toISOString()
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
        title: courseWithInstructor?.title || course.title || 'Curso'
      }
    })
  } catch (error) {
    console.error('Error generando certificado:', error)
    return NextResponse.json(
      {
        error: 'Error al generar el certificado',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

