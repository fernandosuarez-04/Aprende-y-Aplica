import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()

    // Obtener el usuario actual autenticado
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    // Primero, obtener todos los usuarios para ver qué valores tiene cargo_rol
    const { data: allUsers, error: allError } = await supabase
      .from('users')
      .select('id, cargo_rol, display_name, first_name, last_name, username')

    logger.log('🔍 Todos los usuarios:', allUsers?.slice(0, 5))
    logger.log('🔍 Valores únicos de cargo_rol:', [...new Set(allUsers?.map(u => u.cargo_rol))])

    // Obtener todos los instructores y administradores (probar con diferentes variaciones)
    const { data: instructors, error } = await supabase
      .from('users')
      .select('id, display_name, first_name, last_name, username, cargo_rol')
      .or('cargo_rol.eq.instructor,cargo_rol.eq.administrador,cargo_rol.eq.Instructor,cargo_rol.eq.Administrador')
      .order('cargo_rol', { ascending: true })
      .order('display_name', { ascending: true })

    logger.log('🔍 Instructores encontrados:', instructors)

    if (error) {
      logger.error('Error fetching instructors:', error)
      return NextResponse.json(
        { error: 'Error al obtener instructores', details: error.message },
        { status: 500 }
      )
    }

    // Si hay un usuario autenticado y es instructor/administrador, ponerlo primero
    let sortedInstructors = instructors || []
    
    if (currentUser) {
      const currentUserIndex = sortedInstructors.findIndex(u => u.id === currentUser.id)
      
      if (currentUserIndex > -1) {
        // Mover el usuario actual al inicio
        const [currentUserData] = sortedInstructors.splice(currentUserIndex, 1)
        sortedInstructors = [currentUserData, ...sortedInstructors]
      }
    }

    const formattedInstructors = sortedInstructors.map(user => ({
      id: user.id,
      name: user.display_name || 
            `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
            user.username ||
            'Usuario sin nombre'
    }))

    logger.log('✅ Instructores formateados:', formattedInstructors)

    return NextResponse.json({
      success: true,
      instructors: formattedInstructors,
      debug: {
        totalFound: instructors?.length || 0,
        currentUser: currentUser?.id
      }
    })
  } catch (error) {
    logger.error('Error in GET /api/admin/instructors:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener instructores' 
      },
      { status: 500 }
    )
  }
}

