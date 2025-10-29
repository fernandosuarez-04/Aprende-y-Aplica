import { NextRequest, NextResponse } from 'next/server'
import { AdminWorkshopsService } from '@/features/admin/services/adminWorkshops.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { id: workshopId } = await params
    const workshopData = await request.json()
    
    // ✅ SEGURIDAD: Usar ID real del administrador autenticado
    const adminUserId = auth.userId
    
    // Obtener información de la request para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const updatedWorkshop = await AdminWorkshopsService.updateWorkshop(
      workshopId, 
      workshopData, 
      adminUserId,
      { ip, userAgent }
    )

    return NextResponse.json({
      success: true,
      workshop: updatedWorkshop
    })
  } catch (error) {
    console.error('Error in PUT /api/admin/workshops/[id]:', error)
    return NextResponse.json(
      { error: 'Error al actualizar taller' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { id: workshopId } = await params
    
    // ✅ SEGURIDAD: Usar ID real del administrador autenticado
    const adminUserId = auth.userId
    
    // Obtener información de la request para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await AdminWorkshopsService.deleteWorkshop(workshopId, adminUserId, { ip, userAgent })

    return NextResponse.json({
      success: true,
      message: 'Taller eliminado correctamente'
    })
  } catch (error) {
    console.error('Error in DELETE /api/admin/workshops/[id]:', error)
    return NextResponse.json(
      { error: 'Error al eliminar taller' },
      { status: 500 }
    )
  }
}
