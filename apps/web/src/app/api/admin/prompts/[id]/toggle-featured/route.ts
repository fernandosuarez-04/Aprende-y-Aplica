import { NextRequest, NextResponse } from 'next/server'
import { AdminPromptsService } from '@/features/admin/services/adminPrompts.service'
import { formatApiError, logError } from '@/core/utils/api-errors'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { id: promptId } = await params
    const { isFeatured } = await request.json()

    const updatedPrompt = await AdminPromptsService.togglePromptFeatured(promptId, isFeatured)

    return NextResponse.json({
      success: true,
      prompt: updatedPrompt
    })
  } catch (error) {
    logError('PATCH /api/admin/prompts/[id]/toggle-featured', error)
    return NextResponse.json(
      formatApiError(error, 'Error al cambiar estado destacado del prompt'),
      { status: 500 }
    )
  }
}
