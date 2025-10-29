import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuditLogService } from '@/features/admin/services/auditLog.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, requestId: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { id: communityId, requestId } = await params
    const supabase = await createClient()

    // Obtener datos actuales de la solicitud para el log de auditoría
    const { data: currentRequest, error: fetchError } = await supabase
      .from('community_access_requests')
      .select('*')
      .eq('id', requestId)
      .eq('community_id', communityId)
      .single()

    if (fetchError || !currentRequest) {
      return NextResponse.json({ 
        success: false, 
        message: 'Solicitud no encontrada' 
      }, { status: 404 })
    }

    if (currentRequest.status !== 'pending') {
      return NextResponse.json({ 
        success: false, 
        message: 'La solicitud ya ha sido procesada' 
      }, { status: 400 })
    }

    // Actualizar el status de la solicitud a 'rejected'
    const { data: updatedRequest, error: updateError } = await supabase
      .from('community_access_requests')
      .update({ 
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: currentRequest.requester_id // Usar el mismo usuario temporalmente
      })
      .eq('id', requestId)
      .eq('community_id', communityId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating access request:', updateError)
      return NextResponse.json({ 
        success: false, 
        message: 'Error al rechazar la solicitud' 
      }, { status: 500 })
    }

    // Log de auditoría (temporalmente deshabilitado para debug)
    try {
      const adminUserId = currentRequest.requester_id // Usar el mismo usuario temporalmente
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'

      await AuditLogService.logAction({
        user_id: currentRequest.requester_id,
        admin_user_id: adminUserId,
        action: 'UPDATE',
        table_name: 'community_access_requests',
        record_id: requestId,
        old_values: { status: currentRequest.status },
        new_values: { status: 'rejected', reviewed_at: new Date().toISOString() },
        ip_address: ip,
        user_agent: userAgent
      })
    } catch (auditError) {
      console.warn('Error en log de auditoría (no crítico):', auditError)
      // No fallar la operación por esto
    }

    return NextResponse.json({ 
      success: true, 
      request: updatedRequest,
      message: 'Solicitud rechazada exitosamente' 
    })
  } catch (error: unknown) {
    console.error('Error in reject access request API:', error)
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ 
      success: false, 
      message 
    }, { status: 500 })
  }
}
