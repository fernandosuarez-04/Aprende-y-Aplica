import { NextRequest, NextResponse } from 'next/server'
import { AdminPromptsService } from '@/features/admin/services/adminPrompts.service'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promptId } = await params
    const promptData = await request.json()
    
    console.log('🔄 Actualizando prompt:', promptId)
    console.log('📋 Datos recibidos:', promptData)
    
    const updatedPrompt = await AdminPromptsService.updatePrompt(promptId, promptData)

    console.log('✅ Prompt actualizado exitosamente:', updatedPrompt)
    return NextResponse.json({
      success: true,
      prompt: updatedPrompt
    })
  } catch (error) {
    console.error('💥 Error in PUT /api/admin/prompts/[id]:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar prompt'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promptId } = await params
    
    console.log('🔄 Eliminando prompt:', promptId)
    
    await AdminPromptsService.deletePrompt(promptId)

    console.log('✅ Prompt eliminado exitosamente')
    return NextResponse.json({
      success: true,
      message: 'Prompt eliminado exitosamente'
    })
  } catch (error) {
    console.error('💥 Error in DELETE /api/admin/prompts/[id]:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Error al eliminar prompt'
      },
      { status: 500 }
    )
  }
}
