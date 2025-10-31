import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'

// ✅ POST: Aprobar una solicitud de creación de comunidad
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const adminUserId = auth.userId
    const { id } = await params
    const supabase = await createClient()

    logger.log('🔄 Aprobando solicitud de comunidad:', id)

    // Obtener la solicitud
    const { data: requestData, error: fetchError } = await supabase
      .from('community_creation_requests')
      .select('*')
      .eq('id', id)
      .eq('status', 'pending')
      .single()

    if (fetchError || !requestData) {
      logger.error('❌ Solicitud no encontrada o ya procesada:', fetchError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Solicitud no encontrada o ya procesada'
        },
        { status: 404 }
      )
    }

    // Verificar que el slug no exista en communities
    const { data: existingCommunity } = await supabase
      .from('communities')
      .select('slug')
      .eq('slug', requestData.slug)
      .single()

    if (existingCommunity) {
      logger.error('❌ El slug ya existe en communities:', requestData.slug)
      return NextResponse.json(
        { 
          success: false,
          error: 'El slug de la comunidad ya existe'
        },
        { status: 400 }
      )
    }

    // Crear la comunidad
    const { data: newCommunity, error: createError } = await supabase
      .from('communities')
      .insert({
        name: requestData.name,
        description: requestData.description,
        slug: requestData.slug,
        image_url: requestData.image_url,
        member_count: 0,
        is_active: true,
        visibility: requestData.visibility,
        access_type: requestData.access_type,
        course_id: requestData.course_id,
        creator_id: requestData.requester_id, // El creator_id es el instructor
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      logger.error('❌ Error creando comunidad:', createError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Error al crear la comunidad',
          message: createError.message
        },
        { status: 500 }
      )
    }

    // Agregar al instructor como admin de la comunidad
    const { error: memberError } = await supabase
      .from('community_members')
      .insert({
        community_id: newCommunity.id,
        user_id: requestData.requester_id,
        role: 'admin',
        joined_at: new Date().toISOString(),
        is_active: true
      })

    if (memberError) {
      logger.warn('⚠️ Error agregando instructor como admin (no crítico):', memberError)
      // No fallar si esto falla, pero registrar el warning
    }

    // Actualizar el estado de la solicitud
    const { error: updateError } = await supabase
      .from('community_creation_requests')
      .update({
        status: 'approved',
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      logger.error('❌ Error actualizando solicitud:', updateError)
      // No fallar si esto falla, la comunidad ya está creada
    }

    logger.log('✅ Comunidad aprobada y creada exitosamente:', newCommunity.id)
    
    return NextResponse.json({
      success: true,
      message: 'Solicitud aprobada y comunidad creada exitosamente',
      community: newCommunity,
      request_id: id
    }, { status: 200 })
  } catch (error) {
    logger.error('💥 Error approving community request:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Error al aprobar la solicitud',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

