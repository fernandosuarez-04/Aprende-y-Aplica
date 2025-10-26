import { NextRequest, NextResponse } from 'next/server'
import { AdminPromptsService } from '@/features/admin/services/adminPrompts.service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promptId } = await params
    const { isFeatured } = await request.json()
    
    console.log('🔄 Cambiando estado destacado del prompt:', promptId, 'isFeatured:', isFeatured)
    
    const updatedPrompt = await AdminPromptsService.togglePromptFeatured(promptId, isFeatured)

    console.log('✅ Estado destacado del prompt actualizado:', updatedPrompt)
    return NextResponse.json({
      success: true,
      prompt: updatedPrompt
    })
  } catch (error) {
    console.error('💥 Error in PATCH /api/admin/prompts/[id]/toggle-featured:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Error al cambiar estado destacado del prompt'
      },
      { status: 500 }
    )
  }
}
