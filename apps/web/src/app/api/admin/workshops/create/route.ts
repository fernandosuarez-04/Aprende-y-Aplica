import { NextRequest, NextResponse } from 'next/server'
import { AdminWorkshopsService } from '@/features/admin/services/adminWorkshops.service'

export async function POST(request: NextRequest) {
  try {
    const workshopData = await request.json()
    
    // Obtener información del administrador desde el token/sesión
    const adminUserId = 'admin-user-id' // TODO: Obtener del token JWT
    
    // Obtener información de la request para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const newWorkshop = await AdminWorkshopsService.createWorkshop(
      workshopData, 
      adminUserId,
      { ip, userAgent }
    )

    return NextResponse.json({
      success: true,
      workshop: newWorkshop
    })
  } catch (error) {
    console.error('Error in POST /api/admin/workshops/create:', error)
    return NextResponse.json(
      { error: 'Error al crear taller' },
      { status: 500 }
    )
  }
}
