import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    logger.log('🔄 Iniciando GET /api/admin/user-stats/stats/users')
    const supabase = await createClient()
    
    // Obtener perfiles de usuario sin relaciones complejas
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_perfil')
      .select(`
        id,
        user_id,
        cargo_titulo,
        pais,
        rol_id,
        nivel_id,
        area_id,
        relacion_id,
        tamano_id,
        sector_id
      `)

    if (profilesError) {
      logger.error('❌ Error fetching user profiles for stats:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch user profiles' }, { status: 500 })
    }

    // Calcular estadísticas
    const totalUsers = userProfiles?.length || 0
    
    // Usuarios por rol (simplificado)
    const usersByRole = userProfiles?.reduce((acc: any[], profile) => {
      const roleName = `Rol ${profile.rol_id || 'Sin rol'}`
      const existing = acc.find(item => item.role === roleName)
      if (existing) {
        existing.count++
      } else {
        acc.push({ role: roleName, count: 1 })
      }
      return acc
    }, []) || []

    // Usuarios por nivel (simplificado)
    const usersByLevel = userProfiles?.reduce((acc: any[], profile) => {
      const levelName = `Nivel ${profile.nivel_id || 'Sin nivel'}`
      const existing = acc.find(item => item.level === levelName)
      if (existing) {
        existing.count++
      } else {
        acc.push({ level: levelName, count: 1 })
      }
      return acc
    }, []) || []

    // Usuarios por área (simplificado)
    const usersByArea = userProfiles?.reduce((acc: any[], profile) => {
      const areaName = `Área ${profile.area_id || 'Sin área'}`
      const existing = acc.find(item => item.area === areaName)
      if (existing) {
        existing.count++
      } else {
        acc.push({ area: areaName, count: 1 })
      }
      return acc
    }, []) || []

    // Usuarios por sector (simplificado)
    const usersBySector = userProfiles?.reduce((acc: any[], profile) => {
      const sectorName = `Sector ${profile.sector_id || 'Sin sector'}`
      const existing = acc.find(item => item.sector === sectorName)
      if (existing) {
        existing.count++
      } else {
        acc.push({ sector: sectorName, count: 1 })
      }
      return acc
    }, []) || []

    // Usuarios por país
    const usersByCountry = userProfiles?.reduce((acc: any[], profile) => {
      const country = profile.pais || 'Sin país'
      const existing = acc.find(item => item.country === country)
      if (existing) {
        existing.count++
      } else {
        acc.push({ country, count: 1 })
      }
      return acc
    }, []) || []

    // Usuarios por tamaño de empresa (simplificado)
    const usersByCompanySize = userProfiles?.reduce((acc: any[], profile) => {
      const sizeName = `Tamaño ${profile.tamano_id || 'Sin tamaño'}`
      const existing = acc.find(item => item.size === sizeName)
      if (existing) {
        existing.count++
      } else {
        acc.push({ size: sizeName, count: 1 })
      }
      return acc
    }, []) || []

    const stats = {
      totalUsers,
      usersByRole: usersByRole.sort((a, b) => b.count - a.count),
      usersByLevel: usersByLevel.sort((a, b) => b.count - a.count),
      usersByArea: usersByArea.sort((a, b) => b.count - a.count),
      usersBySector: usersBySector.sort((a, b) => b.count - a.count),
      usersByCountry: usersByCountry.sort((a, b) => b.count - a.count),
      usersByCompanySize: usersByCompanySize.sort((a, b) => b.count - a.count)
    }

    logger.log('✅ User stats calculadas:', stats)
    return NextResponse.json(stats)
  } catch (error) {
    logger.error('❌ Error in GET /api/admin/user-stats/stats/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
