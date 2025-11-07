import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { SessionService } from '@/features/auth/services/session.service'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/certificates
 * Obtiene todos los certificados del usuario autenticado
 * Incluye información enriquecida: nombre del curso, instructor, fecha de emisión, etc.
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener usuario usando el sistema de sesiones
    const currentUser = await SessionService.getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Obtener certificados del usuario con información enriquecida
    const { data: certificates, error: certificatesError } = await supabase
      .from('user_course_certificates')
      .select(`
        certificate_id,
        certificate_url,
        certificate_hash,
        issued_at,
        expires_at,
        created_at,
        course_id,
        enrollment_id,
        courses (
          id,
          title,
          slug,
          thumbnail_url,
          instructor_id
        )
      `)
      .eq('user_id', currentUser.id)
      .order('issued_at', { ascending: false })

    if (certificatesError) {
      logger.error('Error fetching certificates:', certificatesError)
      return NextResponse.json(
        { 
          error: 'Error al obtener certificados',
          details: certificatesError.message
        },
        { status: 500 }
      )
    }

    // Obtener IDs de instructores únicos
    const instructorIds = [...new Set((certificates || [])
      .map((cert: any) => cert.courses?.instructor_id)
      .filter(Boolean))]

    // Obtener información de instructores
    const instructorMap = new Map()
    if (instructorIds.length > 0) {
      const { data: instructors } = await supabase
        .from('users')
        .select('id, first_name, last_name, username')
        .in('id', instructorIds)

      if (instructors) {
        instructors.forEach(instructor => {
          const fullName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim()
          instructorMap.set(instructor.id, {
            name: fullName || instructor.username || 'Instructor',
            username: instructor.username
          })
        })
      }
    }

    // Enriquecer certificados con datos del curso e instructor
    const enrichedCertificates = (certificates || []).map((cert: any) => {
      const course = cert.courses || {}
      const instructor = course.instructor_id ? instructorMap.get(course.instructor_id) : null
      
      return {
        certificate_id: cert.certificate_id,
        certificate_url: cert.certificate_url,
        certificate_hash: cert.certificate_hash,
        issued_at: cert.issued_at,
        expires_at: cert.expires_at,
        created_at: cert.created_at,
        course_id: cert.course_id,
        enrollment_id: cert.enrollment_id,
        course_title: course.title || 'Curso sin título',
        course_slug: course.slug || '',
        course_thumbnail: course.thumbnail_url || null,
        instructor_name: instructor?.name || 'Instructor',
        instructor_username: instructor?.username || null
      }
    })

    logger.log(`✅ Fetched ${enrichedCertificates.length} certificates for user ${currentUser.id}`)

    return NextResponse.json({
      success: true,
      certificates: enrichedCertificates,
      count: enrichedCertificates.length
    })
  } catch (error) {
    logger.error('Error in /api/certificates:', error)
    return NextResponse.json(
      { 
        error: 'Error al obtener certificados',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

