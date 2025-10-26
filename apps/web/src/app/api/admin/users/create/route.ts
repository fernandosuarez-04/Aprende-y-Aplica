import { NextRequest, NextResponse } from 'next/server'
import { AdminUsersService } from '@/features/admin/services/adminUsers.service'

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()
    
    // Obtener información del administrador desde el token/sesión
    // Por ahora usamos un ID temporal, en producción debería venir del token JWT
    const adminUserId = 'admin-user-id' // TODO: Obtener del token JWT
    
    // Obtener información de la request para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const newUser = await AdminUsersService.createUser(
      userData, 
      adminUserId,
      { ip, userAgent }
    )

    return NextResponse.json({
      success: true,
      user: newUser
    })
  } catch (error) {
    console.error('Error in POST /api/admin/users/create:', error)
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    )
  }
}
