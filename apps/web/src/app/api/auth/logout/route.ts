import { NextResponse } from 'next/server'
import { SessionService } from '../../../../features/auth/services/session.service'

export async function POST() {
  try {
    console.log('🚪 API Logout: Iniciando...')
    
    // Destruir la sesión usando SessionService
    await SessionService.destroySession()
    
    console.log('✅ API Logout: Sesión destruida exitosamente')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Sesión cerrada exitosamente' 
    })
  } catch (error) {
    console.error('💥 API Logout Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error al cerrar sesión' 
    }, { status: 500 })
  }
}