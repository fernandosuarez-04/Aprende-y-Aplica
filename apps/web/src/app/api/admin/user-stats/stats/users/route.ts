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
    
    // Obtener todos los perfiles de usuario sin relaciones complejas usando paginación
    let allUserProfiles: any[] = []
    let page = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
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
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (profilesError) {
        logger.error('❌ Error fetching user profiles for stats:', profilesError)
        return NextResponse.json({ error: 'Failed to fetch user profiles' }, { status: 500 })
      }

      if (userProfiles && userProfiles.length > 0) {
        allUserProfiles = [...allUserProfiles, ...userProfiles]
        hasMore = userProfiles.length === pageSize
        page++
      } else {
        hasMore = false
      }
    }

    // Obtener datos de lookup para roles, áreas, niveles, sectores y tamaños
    const [rolesResult, areasResult, nivelesResult, sectoresResult, tamanosResult] = await Promise.all([
      supabase.from('roles').select('id, nombre').order('nombre'),
      supabase.from('areas').select('id, nombre').order('nombre'),
      supabase.from('niveles').select('id, nombre').order('nombre'),
      supabase.from('sectores').select('id, nombre').order('nombre'),
      supabase.from('tamanos_empresa').select('id, nombre').order('nombre')
    ])

    // Crear mapas para lookup rápido
    const rolesMap = new Map(rolesResult.data?.map(r => [r.id, r.nombre]) || [])
    const areasMap = new Map(areasResult.data?.map(a => [a.id, a.nombre]) || [])
    const nivelesMap = new Map(nivelesResult.data?.map(n => [n.id, n.nombre]) || [])
    const sectoresMap = new Map(sectoresResult.data?.map(s => [s.id, s.nombre]) || [])
    const tamanosMap = new Map(tamanosResult.data?.map(t => [t.id, t.nombre]) || [])

    // Calcular estadísticas
    const totalUsers = allUserProfiles.length
    const userProfiles = allUserProfiles
    
    // Usuarios por rol (con nombres reales)
    const usersByRole = userProfiles?.reduce((acc: any[], profile) => {
      const roleName = profile.rol_id ? (rolesMap.get(profile.rol_id) || `Rol ${profile.rol_id}`) : 'Sin rol'
      const existing = acc.find(item => item.role === roleName)
      if (existing) {
        existing.count++
      } else {
        acc.push({ role: roleName, count: 1 })
      }
      return acc
    }, []) || []

    // Usuarios por nivel (con nombres reales)
    const usersByLevel = userProfiles?.reduce((acc: any[], profile) => {
      const levelName = profile.nivel_id ? (nivelesMap.get(profile.nivel_id) || `Nivel ${profile.nivel_id}`) : 'Sin nivel'
      const existing = acc.find(item => item.level === levelName)
      if (existing) {
        existing.count++
      } else {
        acc.push({ level: levelName, count: 1 })
      }
      return acc
    }, []) || []

    // Usuarios por área (con nombres reales)
    const usersByArea = userProfiles?.reduce((acc: any[], profile) => {
      const areaName = profile.area_id ? (areasMap.get(profile.area_id) || `Área ${profile.area_id}`) : 'Sin área'
      const existing = acc.find(item => item.area === areaName)
      if (existing) {
        existing.count++
      } else {
        acc.push({ area: areaName, count: 1 })
      }
      return acc
    }, []) || []

    // Usuarios por sector (con nombres reales)
    const usersBySector = userProfiles?.reduce((acc: any[], profile) => {
      const sectorName = profile.sector_id ? (sectoresMap.get(profile.sector_id) || `Sector ${profile.sector_id}`) : 'Sin sector'
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

    // Usuarios por tamaño de empresa (con nombres reales)
    const usersByCompanySize = userProfiles?.reduce((acc: any[], profile) => {
      const sizeName = profile.tamano_id ? (tamanosMap.get(profile.tamano_id) || `Tamaño ${profile.tamano_id}`) : 'Sin tamaño'
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
