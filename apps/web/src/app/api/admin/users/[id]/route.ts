import { NextRequest, NextResponse } from 'next/server'
import { AdminUsersService } from '@/features/admin/services/adminUsers.service'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const userData = await request.json()
    
    // Obtener información del administrador desde el token/sesión
    // Por ahora usamos un ID temporal, en producción debería venir del token JWT
    const adminUserId = 'admin-user-id' // TODO: Obtener del token JWT
    
    // Obtener información de la request para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const updatedUser = await AdminUsersService.updateUser(
      userId, 
      userData, 
      adminUserId,
      { ip, userAgent }
    )

    return NextResponse.json({
      success: true,
      user: updatedUser
    })
  } catch (error) {
    console.error('Error in PUT /api/admin/users/[id]:', error)
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    
    // Obtener información del administrador desde el token/sesión
    const adminUserId = 'admin-user-id' // TODO: Obtener del token JWT
    
    // Obtener información de la request para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await AdminUsersService.deleteUser(userId, adminUserId, { ip, userAgent })

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado correctamente'
    })
  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[id]:', error)
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}
