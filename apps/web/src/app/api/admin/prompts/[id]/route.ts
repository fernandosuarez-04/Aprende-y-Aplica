import { NextRequest, NextResponse } from 'next/server'
import { AdminPromptsService } from '@/features/admin/services/adminPrompts.service'
import { formatApiError, logError } from '@/core/utils/api-errors'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
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

    console.log('🔄 Eliminando prompt:', promptId)

    await AdminPromptsService.deletePrompt(promptId)

    console.log('✅ Prompt eliminado exitosamente')
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
