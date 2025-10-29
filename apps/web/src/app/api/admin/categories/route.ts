import { NextRequest, NextResponse } from 'next/server'
import { AdminPromptsService } from '@/features/admin/services/adminPrompts.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    console.log('🔄 Cargando categorías desde API...')
    
    const categories = await AdminPromptsService.getCategories()

    console.log('✅ Categorías cargadas:', categories?.length || 0)

    return NextResponse.json({
      success: true,
      categories: categories || []
    })
  } catch (error) {
    console.error('💥 Error in GET /api/admin/categories:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener categorías',
        categories: []
      },
      { status: 500 }
    )
  }
}
