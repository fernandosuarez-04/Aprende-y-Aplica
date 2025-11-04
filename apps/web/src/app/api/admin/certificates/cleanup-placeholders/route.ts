import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/admin/certificates/cleanup-placeholders?dryRun=true
 *
 * Encuentra y elimina certificados con URLs placeholder.
 *
 * Query params:
 * - dryRun: boolean (default: true) - Si es true, solo muestra los certificados sin eliminarlos
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const dryRun = searchParams.get('dryRun') !== 'false' // Por defecto true

    console.log('🔍 Buscando certificados con URL placeholder...')
    console.log('   Modo:', dryRun ? 'DRY RUN (sin eliminar)' : 'ELIMINACIÓN REAL')

    // Buscar certificados con URLs placeholder
    const { data: certificates, error } = await supabaseAdmin
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
      .ilike('certificate_url', '%placeholder-certificate%')

    if (error) {
      console.error('❌ Error buscando certificados:', error)
      return NextResponse.json(
        {
          error: 'Error al buscar certificados',
          details: error.message
        },
        { status: 500 }
      )
    }

    if (!certificates || certificates.length === 0) {
      console.log('✅ No se encontraron certificados con URL placeholder')
      return NextResponse.json({
        success: true,
        message: 'No se encontraron certificados con URL placeholder',
        found: 0,
        deleted: 0,
        certificates: []
      })
    }

    console.log(`📋 Se encontraron ${certificates.length} certificados con URL placeholder`)

    // Si es dry run, solo retornar la lista sin eliminar
    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        message: `Se encontraron ${certificates.length} certificados con URL placeholder (no eliminados)`,
        found: certificates.length,
        deleted: 0,
        certificates: certificates.map(cert => ({
          certificate_id: cert.certificate_id,
          certificate_url: cert.certificate_url,
          enrollment_id: cert.enrollment_id,
          user_id: cert.user_id,
          course_id: cert.course_id,
          created_at: cert.created_at
        }))
      })
    }

    // NOTA: La tabla user_course_certificates es append-only, no permite DELETE
    // Los certificados con placeholder se regenerarán automáticamente en el siguiente intento
    console.log('⚠️ FUNCIÓN DE ELIMINACIÓN DESHABILITADA')
    console.log('   La tabla user_course_certificates es append-only y no permite DELETE')
    console.log('   Los certificados con placeholder se regenerarán automáticamente cuando el usuario los solicite')

    return NextResponse.json({
      success: false,
      error: 'Función de eliminación deshabilitada',
      message: 'La tabla user_course_certificates es append-only. Los certificados con placeholder se regenerarán automáticamente.',
      found: certificates.length,
      deleted: 0,
      certificates: certificates.map(cert => ({
        certificate_id: cert.certificate_id,
        certificate_url: cert.certificate_url,
        enrollment_id: cert.enrollment_id,
        user_id: cert.user_id,
        course_id: cert.course_id
      }))
    })
  } catch (error) {
    console.error('Error en cleanup de certificados:', error)
    return NextResponse.json(
      {
        error: 'Error al limpiar certificados',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/certificates/cleanup-placeholders
 *
 * Elimina certificados con URLs placeholder (modo POST para evitar ejecución accidental)
 *
 * Body:
 * - confirm: boolean (debe ser true para ejecutar)
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { confirm } = body

    if (!confirm) {
      return NextResponse.json(
        { error: 'Debes confirmar la eliminación con confirm: true' },
        { status: 400 }
      )
    }

    // Redirigir a GET con dryRun=false
    return GET(request)
  } catch (error) {
    console.error('Error en cleanup de certificados:', error)
    return NextResponse.json(
      {
        error: 'Error al limpiar certificados',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
