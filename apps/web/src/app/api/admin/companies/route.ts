import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { AdminCompaniesService } from '@/features/admin/services/adminCompanies.service'

export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const companies = await AdminCompaniesService.getCompanies()
    const stats = AdminCompaniesService.calculateStats(companies)

    return NextResponse.json({
      success: true,
      companies,
      stats
    })
  } catch (error) {
    logger.error('💥 Error in GET /api/admin/companies:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener empresas',
        companies: [],
        stats: null
      },
      { status: 500 }
    )
  }
}

