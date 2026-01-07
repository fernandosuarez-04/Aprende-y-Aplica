import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { BusinessUsersServerService } from '@/features/business-panel/services/businessUsers.server.service'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { CreateBusinessUserRequest } from '@/features/business-panel/services/businessUsers.service'

export async function GET() {
  try {
    // Verificar autenticación y autorización de Business
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    console.log('🔍 [Users API] Auth result:', {
      userId: auth.userId,
      organizationId: auth.organizationId,
      role: auth.role
    })

    logger.log('🔄 Cargando usuarios de organización desde API...')

    if (!auth.organizationId) {
      console.log('🔍 [Users API] No organization ID found')
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes una organización asignada'
        },
        { status: 403 }
      )
    }

    // Validación adicional de seguridad: asegurar que organizationId no sea null/undefined
    if (!auth.organizationId || typeof auth.organizationId !== 'string') {
      logger.error('🚨 ERROR DE SEGURIDAD: organizationId inválido')
      return NextResponse.json(
        {
          success: false,
          error: 'Organización inválida'
        },
        { status: 403 }
      )
    }

    const [users, stats] = await Promise.all([
      BusinessUsersServerService.getOrganizationUsers(auth.organizationId),
      BusinessUsersServerService.getOrganizationStats(auth.organizationId)
    ])

    logger.log('✅ Usuarios de organización cargados:', users?.length || 0)
    logger.log('🔒 Validación de seguridad: Solo usuarios de organización', auth.organizationId)

    // Validación final: asegurar que todos los usuarios pertenecen a la organización correcta
    const validatedUsers = (users || []).filter((user: any) => {
      const belongsToOrg = !user.organization_id || user.organization_id === auth.organizationId
      if (!belongsToOrg) {
        logger.error('🚨 ERROR DE SEGURIDAD: Usuario con organization_id incorrecto filtrado', {
          user_id: user.id,
          user_org: user.organization_id,
          expected_org: auth.organizationId
        })
      }
      return belongsToOrg
    })

    return NextResponse.json({
      success: true,
      users: validatedUsers,
      stats: stats || {}
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/users:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener usuarios de la organización',
        users: []
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Verificar autenticación y autorización de Business
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes una organización asignada'
        },
        { status: 403 }
      )
    }

    const body = await request.json()

    const userData: CreateBusinessUserRequest = {
      username: body.username,
      email: body.email,
      password: body.password,
      first_name: body.first_name,
      last_name: body.last_name,
      display_name: body.display_name,
      job_title: body.job_title,
      org_role: body.org_role || 'member',
      send_invitation: body.send_invitation !== undefined ? body.send_invitation : !body.password
    }

    const newUser = await BusinessUsersServerService.createOrganizationUser(
      auth.organizationId,
      userData,
      auth.userId
    )

    return NextResponse.json({
      success: true,
      user: newUser
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/users POST:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear usuario'
      },
      { status: 500 }
    )
  }
}

