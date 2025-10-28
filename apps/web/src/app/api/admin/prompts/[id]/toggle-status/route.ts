import { NextRequest, NextResponse } from 'next/server'
import { AdminPromptsService } from '@/features/admin/services/adminPrompts.service'
import { formatApiError, logError } from '@/core/utils/api-errors'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promptId } = await params
    const { isActive } = await request.json()

    console.log('🔄 Cambiando estado del prompt:', promptId, 'isActive:', isActive)

    const updatedPrompt = await AdminPromptsService.togglePromptStatus(promptId, isActive)

    console.log('✅ Estado del prompt actualizado:', updatedPrompt)
    return NextResponse.json({
      success: true,
      prompt: updatedPrompt
    })
  } catch (error) {
    logError('PATCH /api/admin/prompts/[id]/toggle-status', error)
    return NextResponse.json(
      formatApiError(error, 'Error al cambiar estado del prompt'),
      { status: 500 }
    )
  }
}
