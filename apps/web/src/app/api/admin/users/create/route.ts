import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { AdminUsersService } from '@/features/admin/services/adminUsers.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { CreateUserSchema } from '@/lib/schemas/user.schema'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    // ✅ SEGURIDAD: Validar datos de entrada con Zod
    const body = await request.json()
    const userData = CreateUserSchema.parse(body)
    
    // ✅ SEGURIDAD: Usar ID real del administrador autenticado
    const adminUserId = auth.userId
    
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
    
    logger.error('Error in POST /api/admin/users/create:', error)
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    )
  }
}
