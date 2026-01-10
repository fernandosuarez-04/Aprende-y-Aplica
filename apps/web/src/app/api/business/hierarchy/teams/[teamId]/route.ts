import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

/**
 * GET /api/business/hierarchy/teams/[teamId]
 * Obtiene un equipo por ID
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      );
    }

    const { teamId } = await params;
    const supabase = await createClient();

    const { data: team, error } = await supabase
      .from('organization_teams')
      .select(`
        *,
        zone:organization_zones!zone_id (
          id,
          name,
          code,
          region:organization_regions!region_id (
            id,
            name,
            code
          )
        )
      `)
      .eq('id', teamId)
      .eq('organization_id', auth.organizationId)
      .single();

    if (error || !team) {
      return NextResponse.json(
        { success: false, error: 'Equipo no encontrado' },
        { status: 404 }
      );
    }

    // Contar miembros
    const { count: membersCount } = await supabase
      .from('organization_users')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .eq('status', 'active');

    return NextResponse.json({
      success: true,
      team: {
        ...team,
        members_count: membersCount || 0
      }
    });
  } catch (error) {
    logger.error('Error en GET /api/business/hierarchy/teams/[teamId]:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener el equipo' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/business/hierarchy/teams/[teamId]
 * Actualiza un equipo
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      );
    }

    if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Solo el propietario o administrador puede modificar equipos' },
        { status: 403 }
      );
    }

    const { teamId } = await params;
    const body = await request.json();
    const supabase = await createClient();

    // Verificar que el equipo existe
    const { data: existingTeam, error: fetchError } = await supabase
      .from('organization_teams')
      .select('id, zone_id')
      .eq('id', teamId)
      .eq('organization_id', auth.organizationId)
      .single();

    if (fetchError || !existingTeam) {
      return NextResponse.json(
        { success: false, error: 'Equipo no encontrado' },
        { status: 404 }
      );
    }

    // Si se cambia el nombre, verificar unicidad en la zona
    if (body.name) {
      const { count: duplicateCount } = await supabase
        .from('organization_teams')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', auth.organizationId)
        .eq('zone_id', existingTeam.zone_id)
        .ilike('name', body.name.trim())
        .neq('id', teamId);

      if (duplicateCount && duplicateCount > 0) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un equipo con ese nombre en esta zona' },
          { status: 400 }
        );
      }
    }

    // Si se reduce max_members, verificar que no hay más miembros actuales
    if (body.max_members !== undefined && body.max_members !== null) {
      const { count: currentMembers } = await supabase
        .from('organization_users')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('status', 'active');

      if (currentMembers && body.max_members < currentMembers) {
        return NextResponse.json(
          {
            success: false,
            error: `El equipo tiene ${currentMembers} miembros. No puede establecer un límite menor.`
          },
          { status: 400 }
        );
      }
    }

    // Preparar datos de actualización
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.code !== undefined) updateData.code = body.code?.trim() || null;
    if (body.max_members !== undefined) updateData.max_members = body.max_members;
    if (typeof body.is_active === 'boolean') updateData.is_active = body.is_active;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay datos para actualizar' },
        { status: 400 }
      );
    }

    const { data: team, error } = await supabase
      .from('organization_teams')
      .update(updateData)
      .eq('id', teamId)
      .select(`
        *,
        zone:organization_zones!zone_id (
          id,
          name,
          code,
          region:organization_regions!region_id (
            id,
            name,
            code
          )
        )
      `)
      .single();

    if (error) {
      logger.error('Error actualizando equipo:', error);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar el equipo' },
        { status: 500 }
      );
    }

    logger.info('Equipo actualizado:', { teamId, changes: Object.keys(updateData) });

    return NextResponse.json({
      success: true,
      team
    });
  } catch (error) {
    logger.error('Error en PUT /api/business/hierarchy/teams/[teamId]:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el equipo' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/business/hierarchy/teams/[teamId]
 * Elimina un equipo
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      );
    }

    if (auth.organizationRole !== 'owner' && auth.organizationRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Solo el propietario o administrador puede eliminar equipos' },
        { status: 403 }
      );
    }

    const { teamId } = await params;
    const supabase = await createClient();

    // Verificar que el equipo existe
    const { data: existingTeam, error: fetchError } = await supabase
      .from('organization_teams')
      .select('id, name')
      .eq('id', teamId)
      .eq('organization_id', auth.organizationId)
      .single();

    if (fetchError || !existingTeam) {
      return NextResponse.json(
        { success: false, error: 'Equipo no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si hay usuarios asignados a este equipo
    const { count: usersInTeam } = await supabase
      .from('organization_users')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .eq('status', 'active');

    if (usersInTeam && usersInTeam > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Hay ${usersInTeam} usuario(s) asignados a este equipo. Reasígnelos antes de eliminar.`
        },
        { status: 400 }
      );
    }

    // Eliminar el equipo
    const { error } = await supabase
      .from('organization_teams')
      .delete()
      .eq('id', teamId);

    if (error) {
      logger.error('Error eliminando equipo:', error);
      return NextResponse.json(
        { success: false, error: 'Error al eliminar el equipo' },
        { status: 500 }
      );
    }

    logger.info('Equipo eliminado:', { teamId, name: existingTeam.name });

    return NextResponse.json({
      success: true,
      message: 'Equipo eliminado correctamente'
    });
  } catch (error) {
    logger.error('Error en DELETE /api/business/hierarchy/teams/[teamId]:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar el equipo' },
      { status: 500 }
    );
  }
}
