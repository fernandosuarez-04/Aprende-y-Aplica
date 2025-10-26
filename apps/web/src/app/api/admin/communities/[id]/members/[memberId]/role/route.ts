import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuditLogService } from '@/features/admin/services/auditLog.service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, memberId: string }> }
) {
  try {
    const { id: communityId, memberId } = await params
    const { role } = await request.json()
    const supabase = await createClient()

    // Obtener datos actuales del miembro para el log de auditoría
    const { data: currentMember, error: fetchError } = await supabase
      .from('community_members')
      .select('*')
      .eq('id', memberId)
      .eq('community_id', communityId)
      .single()

    if (fetchError || !currentMember) {
      return NextResponse.json({ 
        success: false, 
        message: 'Miembro no encontrado' 
      }, { status: 404 })
    }

    // Actualizar el rol del miembro
    const { data: updatedMember, error: updateError } = await supabase
      .from('community_members')
      .update({ 
        role: role,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .eq('community_id', communityId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating member role:', updateError)
      return NextResponse.json({ 
        success: false, 
        message: 'Error al actualizar el rol del miembro' 
      }, { status: 500 })
    }

    // Log de auditoría
    const adminUserId = 'admin-user-id' // TODO: Obtener del token JWT
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await AuditLogService.logAction({
      user_id: currentMember.user_id,
      admin_user_id: adminUserId,
      action: 'UPDATE',
      table_name: 'community_members',
      record_id: memberId,
      old_values: { role: currentMember.role },
      new_values: { role: role },
      ip_address: ip,
      user_agent: userAgent
    })

    return NextResponse.json({ 
      success: true, 
      member: updatedMember 
    })
  } catch (error: any) {
    console.error('Error in member role update API:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Error interno del servidor' 
    }, { status: 500 })
  }
}
