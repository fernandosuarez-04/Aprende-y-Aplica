import { NextRequest, NextResponse } from 'next/server'
import { AdminModulesService, CreateModuleData } from '@/features/admin/services/adminModules.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { id: courseId } = await params

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID es requerido' },
        { status: 400 }
      )
    }

    const modules = await AdminModulesService.getCourseModules(courseId)

    return NextResponse.json({
      success: true,
      modules
    })
  } catch (error) {
    console.error('Error in GET /api/admin/courses/[id]/modules:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener módulos' 
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const body = await request.json() as CreateModuleData

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID es requerido' },
        { status: 400 }
      )
    }

    if (!body.module_title) {
      return NextResponse.json(
        { error: 'module_title es requerido' },
        { status: 400 }
      )
    }

    const module = await AdminModulesService.createModule(courseId, body)

    return NextResponse.json({
      success: true,
      module
    })
  } catch (error) {
    console.error('Error in POST /api/admin/courses/[id]/modules:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al crear módulo' 
      },
      { status: 500 }
    )
  }
}

