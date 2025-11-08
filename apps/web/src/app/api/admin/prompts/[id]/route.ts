import { NextRequest, NextResponse } from 'next/server'
import { AdminPromptsService } from '@/features/admin/services/adminPrompts.service'
import { formatApiError, logError } from '@/core/utils/api-errors'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { UpdatePromptSchema } from '@/lib/schemas/content.schema'
import { z } from 'zod'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { id: promptId } = await params
    
    // ✅ SEGURIDAD: Validar datos de entrada con Zod
    const body = await request.json()
    const promptData = UpdatePromptSchema.parse(body)
    
    const updatedPrompt = await AdminPromptsService.updatePrompt(promptId, promptData)

    return NextResponse.json({
      success: true,
      prompt: updatedPrompt
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
    
    logError('PUT /api/admin/prompts/[id]', error)
    return NextResponse.json(
      formatApiError(error, 'Error al actualizar prompt'),
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { id: promptId } = await params

    await AdminPromptsService.deletePrompt(promptId)

    return NextResponse.json({
      success: true,
      message: 'Prompt eliminado exitosamente'
    })
  } catch (error) {
    logError('DELETE /api/admin/prompts/[id]', error)
    return NextResponse.json(
      formatApiError(error, 'Error al eliminar prompt'),
      { status: 500 }
    )
  }
}
