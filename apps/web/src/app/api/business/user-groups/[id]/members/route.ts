import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/business/user-groups/[id]/members
 * Obtiene todos los miembros de un grupo
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    const { id: groupId } = await params

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organización'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar que el grupo exista y pertenezca a la organización
    const { data: group } = await supabase
      .from('user_groups')
      .select('id')
      .eq('id', groupId)
      .eq('organization_id', auth.organizationId)
      .single()

    if (!group) {
      return NextResponse.json({
        success: false,
        error: 'Grupo no encontrado'
      }, { status: 404 })
    }

    // Obtener miembros con información del usuario
    const { data: members, error: membersError } = await supabase
      .from('user_group_members')
      .select(`
        id,
        group_id,
        user_id,
        role,
        joined_at,
        added_by,
        created_at,
        users!user_group_members_user_id_fkey (
          id,
          username,
          email,
          display_name,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .eq('group_id', groupId)
      .order('joined_at', { ascending: false })

    if (membersError) {
      logger.error('Error fetching group members:', membersError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener miembros',
        members: []
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      members: members || []
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/user-groups/[id]/members GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      members: []
    }, { status: 500 })
  }
}

/**
 * POST /api/business/user-groups/[id]/members
 * Agrega un miembro a un grupo
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    const { id: groupId } = await params

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organización'
      }, { status: 400 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { user_id, role } = body

    if (!user_id) {
      return NextResponse.json({
        success: false,
        error: 'user_id es requerido'
      }, { status: 400 })
    }

    // Verificar que el grupo exista y pertenezca a la organización
    const { data: group } = await supabase
      .from('user_groups')
      .select('id')
      .eq('id', groupId)
      .eq('organization_id', auth.organizationId)
      .single()

    if (!group) {
      return NextResponse.json({
        success: false,
        error: 'Grupo no encontrado'
      }, { status: 404 })
    }

    // Verificar que el usuario pertenezca a la organización
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('user_id')
      .eq('user_id', user_id)
      .eq('organization_id', auth.organizationId)
      .eq('status', 'active')
      .single()

    if (!orgUser) {
      return NextResponse.json({
        success: false,
        error: 'El usuario no pertenece a tu organización o no está activo'
      }, { status: 400 })
    }

    // Verificar que el usuario no esté ya en el grupo
    const { data: existingMember } = await supabase
      .from('user_group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user_id)
      .single()

    if (existingMember) {
      return NextResponse.json({
        success: false,
        error: 'El usuario ya está en este grupo'
      }, { status: 400 })
    }

    // Agregar miembro al grupo
    const { data: newMember, error: addError } = await supabase
      .from('user_group_members')
      .insert({
        group_id: groupId,
        user_id: user_id,
        role: role || 'member',
        added_by: auth.userId
      })
      .select(`
        id,
        group_id,
        user_id,
        role,
        joined_at,
        added_by,
        created_at,
        users!user_group_members_user_id_fkey (
          id,
          username,
          email,
          display_name,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .single()

    if (addError || !newMember) {
      logger.error('Error adding group member:', addError)
      return NextResponse.json({
        success: false,
        error: 'Error al agregar miembro al grupo'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      member: newMember
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/user-groups/[id]/members POST:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

