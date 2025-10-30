import { NextRequest, NextResponse } from 'next/server'
import { AdminPromptsService } from '@/features/admin/services/adminPrompts.service'
import { formatApiError, logError } from '@/core/utils/api-errors'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { CreatePromptSchema } from '@/lib/schemas/content.schema'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
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
    logError('GET /api/admin/prompts', error)
    return NextResponse.json(
      {
        ...formatApiError(error, 'Error al obtener prompts'),
        prompts: [],
        stats: {}
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    console.log('🔄 Creando nuevo prompt...')

    // ✅ SEGURIDAD: Validar datos de entrada con Zod
    const body = await request.json()
    const promptData = CreatePromptSchema.parse(body)
    console.log('📋 Datos recibidos:', promptData)

    // ✅ SEGURIDAD: Usar ID real del administrador autenticado
    const adminUserId = auth.userId

    const newPrompt = await AdminPromptsService.createPrompt(promptData, adminUserId)

    console.log('✅ Prompt creado exitosamente:', newPrompt)
    return NextResponse.json({
      success: true,
      prompt: newPrompt
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
    
    logError('POST /api/admin/prompts', error)
    return NextResponse.json(
      formatApiError(error, 'Error al crear prompt'),
      { status: 500 }
    )
  }
}
