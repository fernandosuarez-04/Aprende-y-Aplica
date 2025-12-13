import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const RejectRequestSchema = z.object({
  rejection_reason: z.string()
    .min(10, 'El motivo del rechazo debe tener al menos 10 caracteres')
    .max(500, 'El motivo del rechazo no puede exceder 500 caracteres')
    .trim()
})

// ✅ POST: Rechazar una solicitud de creación de comunidad
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

    // Validar body
    const body = await request.json()
    const { rejection_reason } = RejectRequestSchema.parse(body)

    logger.log('🔄 Rechazando solicitud de comunidad:', id)

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

    // Actualizar el estado de la solicitud
    const { error: updateError } = await supabase
      .from('community_creation_requests')
      .update({
        status: 'rejected',
        rejection_reason: rejection_reason,
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      logger.error('❌ Error rechazando solicitud:', updateError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Error al rechazar la solicitud',
          message: updateError.message
        },
        { status: 500 }
      )
    }

    logger.log('✅ Solicitud rechazada exitosamente:', id)
    
    return NextResponse.json({
      success: true,
      message: 'Solicitud rechazada exitosamente. El instructor será notificado del motivo del rechazo.',
      request_id: id
    }, { status: 200 })
  } catch (error) {
    logger.error('💥 Error rejecting community request:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Datos inválidos',
          details: error.errors
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false,
        message: 'Error al rechazar la solicitud',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

