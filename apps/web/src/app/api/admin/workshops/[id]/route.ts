import { NextRequest, NextResponse } from 'next/server'
import { AdminWorkshopsService } from '@/features/admin/services/adminWorkshops.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { UpdateWorkshopSchema } from '@/lib/schemas/workshop.schema'
import { z } from 'zod'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { id: workshopId } = await params
    
    // ✅ SEGURIDAD: Validar datos de entrada con Zod
    const body = await request.json()
    const workshopData = UpdateWorkshopSchema.parse(body)
    
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
    // ✅ SEGURIDAD: Manejo específico de errores de validación
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Datos inválidos',
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }, { status: 400 })
    }
    
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
