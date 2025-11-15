import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { AdminCompaniesService, CompanyUpdatePayload } from '@/features/admin/services/adminCompanies.service'

interface RouteParams {
  params: {
    id: string
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const companyId = params.id

  if (!companyId) {
    return NextResponse.json(
      {
        success: false,
        error: 'ID de empresa inválido'
      },
      { status: 400 }
    )
  }

  try {
    const body = await request.json()
    const payload: CompanyUpdatePayload = {}

    if (body.is_active !== undefined) {
      payload.is_active = Boolean(body.is_active)
    }

    if (body.subscription_status !== undefined) {
      payload.subscription_status = String(body.subscription_status)
    }

    if (body.subscription_plan !== undefined) {
      payload.subscription_plan = String(body.subscription_plan)
    }

    if (body.max_users !== undefined) {
      const maxUsersNumber = Number(body.max_users)
      if (Number.isNaN(maxUsersNumber) || maxUsersNumber < 1) {
        return NextResponse.json(
          {
            success: false,
            error: 'max_users debe ser un número mayor a 0'
          },
          { status: 400 }
        )
      }
      payload.max_users = maxUsersNumber
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se enviaron cambios'
        },
        { status: 400 }
      )
    }

    const company = await AdminCompaniesService.updateCompany(companyId, payload)

    return NextResponse.json({
      success: true,
      company
    })
  } catch (error) {
    logger.error(`💥 Error updating company ${params.id}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al actualizar la empresa'
      },
      { status: 500 }
    )
  }
}

