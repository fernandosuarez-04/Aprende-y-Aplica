import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    console.log('🔄 Iniciando GET /api/admin/user-stats/profiles')
    const supabase = await createClient()
    console.log('✅ Supabase client creado')
    
    // Primero obtener perfiles básicos
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_perfil')
      .select(`
        id,
        user_id,
        cargo_titulo,
        pais,
        creado_en,
        actualizado_en,
        rol_id,
        nivel_id,
        area_id,
        relacion_id,
        tamano_id,
        sector_id,
        users!user_perfil_user_id_fkey (
          id,
          username,
          profile_picture_url,
          email
        )
      `)
      .order('creado_en', { ascending: false })

    if (profilesError) {
      console.error('❌ Error fetching user profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch user profiles', details: profilesError.message }, { status: 500 })
    }

    console.log('✅ User profiles obtenidos:', userProfiles?.length)

    // Obtener datos de lookup tables por separado
    const [rolesResult, nivelesResult, areasResult, relacionesResult, tamanosResult, sectoresResult] = await Promise.all([
      supabase.from('roles').select('id, nombre, slug'),
      supabase.from('niveles').select('id, nombre, slug'),
      supabase.from('areas').select('id, nombre, slug'),
      supabase.from('relaciones').select('id, nombre, slug'),
      supabase.from('tamanos_empresa').select('id, nombre, slug, min_empleados, max_empleados'),
      supabase.from('sectores').select('id, nombre, slug')
    ])

    console.log('📊 Lookup tables:', {
      roles: rolesResult.data?.length || 0,
      niveles: nivelesResult.data?.length || 0,
      areas: areasResult.data?.length || 0,
      relaciones: relacionesResult.data?.length || 0,
      tamanos: tamanosResult.data?.length || 0,
      sectores: sectoresResult.data?.length || 0
    })

    // Crear mapas para lookup rápido
    const rolesMap = new Map(rolesResult.data?.map(r => [r.id, r]) || [])
    const nivelesMap = new Map(nivelesResult.data?.map(n => [n.id, n]) || [])
    const areasMap = new Map(areasResult.data?.map(a => [a.id, a]) || [])
    const relacionesMap = new Map(relacionesResult.data?.map(r => [r.id, r]) || [])
    const tamanosMap = new Map(tamanosResult.data?.map(t => [t.id, t]) || [])
    const sectoresMap = new Map(sectoresResult.data?.map(s => [s.id, s]) || [])

    // Enriquecer los perfiles con datos de lookup
    const enrichedProfiles = userProfiles?.map(profile => ({
      ...profile,
      roles: profile.rol_id ? rolesMap.get(profile.rol_id) : null,
      niveles: profile.nivel_id ? nivelesMap.get(profile.nivel_id) : null,
      areas: profile.area_id ? areasMap.get(profile.area_id) : null,
      relaciones: profile.relacion_id ? relacionesMap.get(profile.relacion_id) : null,
      tamanos_empresa: profile.tamano_id ? tamanosMap.get(profile.tamano_id) : null,
      sectores: profile.sector_id ? sectoresMap.get(profile.sector_id) : null
    })) || []

    console.log('✅ Profiles enriquecidos:', enrichedProfiles.length)
    console.log('🔍 Ejemplo de perfil enriquecido:', enrichedProfiles[0])
    return NextResponse.json(enrichedProfiles)
  } catch (error) {
    console.error('❌ Error in GET /api/admin/user-stats/profiles:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}