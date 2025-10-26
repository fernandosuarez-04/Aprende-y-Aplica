import { NextRequest, NextResponse } from 'next/server'
import { AdminPromptsService } from '@/features/admin/services/adminPrompts.service'

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Cargando prompts desde API...')
    
    const [prompts, stats] = await Promise.all([
      AdminPromptsService.getPrompts(),
      AdminPromptsService.getPromptStats()
    ])

    console.log('✅ Prompts cargados:', prompts?.length || 0)

    return NextResponse.json({
      success: true,
      prompts: prompts || [],
      stats: stats || {}
    })
  } catch (error) {
    console.error('💥 Error in GET /api/admin/prompts:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener prompts',
        prompts: [],
        stats: {}
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Creando nuevo prompt...')
    
    const promptData = await request.json()
    console.log('📋 Datos recibidos:', promptData)
    
    // Obtener información del administrador desde el token/sesión
    const adminUserId = 'admin-user-id' // TODO: Obtener del token JWT
    
    const newPrompt = await AdminPromptsService.createPrompt(promptData, adminUserId)

    console.log('✅ Prompt creado exitosamente:', newPrompt)
    return NextResponse.json({
      success: true,
      prompt: newPrompt
    })
  } catch (error) {
    console.error('💥 Error in POST /api/admin/prompts:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear prompt'
      },
      { status: 500 }
    )
  }
}
