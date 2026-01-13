import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

interface RouteParams {
  params: Promise<{ zoneId: string }>;
}

/**
 * GET /api/business/hierarchy/zones/[zoneId]
 * Obtiene una zona por ID
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

    const { zoneId } = await params;
    const supabase = await createClient();

    const { data: zone, error } = await supabase
      .from('organization_zones')
      .select(`
        *,
        region:organization_regions!region_id (
          id,
          name,
          code
        )
      `)
      .eq('id', zoneId)
      .eq('organization_id', auth.organizationId)
      .single();

    if (error || !zone) {
      return NextResponse.json(
        { success: false, error: 'Zona no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      zone
    });
  } catch (error) {
    logger.error('Error en GET /api/business/hierarchy/zones/[zoneId]:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener la zona' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/business/hierarchy/zones/[zoneId]
 * Actualiza una zona
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
        { success: false, error: 'Solo el propietario o administrador puede modificar zonas' },
        { status: 403 }
      );
    }

    const { zoneId } = await params;
    const body = await request.json();
    const supabase = await createClient();

    // Debug: Log datos recibidos
    logger.info('📝 PUT /zones/[zoneId] - Datos recibidos:', {
      zoneId,
      latitude: body.latitude,
      longitude: body.longitude,
      latitudeType: typeof body.latitude,
      longitudeType: typeof body.longitude
    });

    // Verificar que la zona existe
    const { data: existingZone, error: fetchError } = await supabase
      .from('organization_zones')
      .select('id, region_id')
      .eq('id', zoneId)
      .eq('organization_id', auth.organizationId)
      .single();

    if (fetchError || !existingZone) {
      return NextResponse.json(
        { success: false, error: 'Zona no encontrada' },
        { status: 404 }
      );
    }

    // Si se cambia el nombre, verificar unicidad en la región
    if (body.name) {
      const { count: duplicateCount } = await supabase
        .from('organization_zones')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', auth.organizationId)
        .eq('region_id', existingZone.region_id)
        .ilike('name', body.name.trim())
        .neq('id', zoneId);

      if (duplicateCount && duplicateCount > 0) {
        return NextResponse.json(
          { success: false, error: 'Ya existe una zona con ese nombre en esta región' },
          { status: 400 }
        );
      }
    }

    // Preparar datos de actualización
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.code !== undefined) updateData.code = body.code?.trim() || null;
    if (typeof body.is_active === 'boolean') updateData.is_active = body.is_active;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;
    
    // Campos de ubicación
    if (body.address !== undefined) updateData.address = body.address?.trim() || null;
    if (body.city !== undefined) updateData.city = body.city?.trim() || null;
    if (body.state !== undefined) updateData.state = body.state?.trim() || null;
    if (body.country !== undefined) updateData.country = body.country?.trim() || null;
    if (body.postal_code !== undefined) updateData.postal_code = body.postal_code?.trim() || null;
    
    // Procesar coordenadas con mejor manejo
    if (body.latitude !== undefined) {
      if (body.latitude === null || body.latitude === '' || body.latitude === undefined) {
        updateData.latitude = null;
      } else {
        const latNum = typeof body.latitude === 'string' ? parseFloat(body.latitude) : body.latitude;
        updateData.latitude = !isNaN(latNum) ? latNum : null;
      }
    }
    if (body.longitude !== undefined) {
      if (body.longitude === null || body.longitude === '' || body.longitude === undefined) {
        updateData.longitude = null;
      } else {
        const lngNum = typeof body.longitude === 'string' ? parseFloat(body.longitude) : body.longitude;
        updateData.longitude = !isNaN(lngNum) ? lngNum : null;
      }
    }
    
    // Debug: Log datos que se van a guardar
    if (body.latitude !== undefined || body.longitude !== undefined) {
      logger.info('🗺️ Coordenadas a guardar:', {
        latitude: updateData.latitude,
        longitude: updateData.longitude,
        latitudeType: typeof updateData.latitude,
        longitudeType: typeof updateData.longitude
      });
    }
    
    // Campos de contacto
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null;
    if (body.email !== undefined) updateData.email = body.email?.trim() || null;
    
    // Gerente
    if (body.manager_id !== undefined) updateData.manager_id = body.manager_id || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay datos para actualizar' },
        { status: 400 }
      );
    }

    const { data: zone, error } = await supabase
      .from('organization_zones')
      .update(updateData)
      .eq('id', zoneId)
      .select(`
        *,
        region:organization_regions!region_id (
          id,
          name,
          code
        )
      `)
      .single();

    if (error) {
      logger.error('❌ Error actualizando zona:', error);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar la zona' },
        { status: 500 }
      );
    }

    // Debug: Verificar coordenadas guardadas
    logger.info('✅ Zona actualizada:', { 
      zoneId, 
      changes: Object.keys(updateData),
      savedLatitude: zone?.latitude,
      savedLongitude: zone?.longitude,
      latitudeType: typeof zone?.latitude,
      longitudeType: typeof zone?.longitude
    });

    return NextResponse.json({
      success: true,
      zone
    });
  } catch (error) {
    logger.error('Error en PUT /api/business/hierarchy/zones/[zoneId]:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar la zona' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/business/hierarchy/zones/[zoneId]
 * Elimina una zona (y sus equipos en cascada)
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
        { success: false, error: 'Solo el propietario o administrador puede eliminar zonas' },
        { status: 403 }
      );
    }

    const { zoneId } = await params;
    const supabase = await createClient();

    // Verificar que la zona existe
    const { data: existingZone, error: fetchError } = await supabase
      .from('organization_zones')
      .select('id, name')
      .eq('id', zoneId)
      .eq('organization_id', auth.organizationId)
      .single();

    if (fetchError || !existingZone) {
      return NextResponse.json(
        { success: false, error: 'Zona no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si hay usuarios asignados a esta zona
    const { count: usersInZone } = await supabase
      .from('organization_users')
      .select('id', { count: 'exact', head: true })
      .eq('zone_id', zoneId)
      .eq('status', 'active');

    if (usersInZone && usersInZone > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Hay ${usersInZone} usuario(s) asignados a esta zona. Reasígnelos antes de eliminar.`
        },
        { status: 400 }
      );
    }

    // Eliminar la zona (los equipos se eliminan en cascada por FK)
    const { error } = await supabase
      .from('organization_zones')
      .delete()
      .eq('id', zoneId);

    if (error) {
      logger.error('Error eliminando zona:', error);
      return NextResponse.json(
        { success: false, error: 'Error al eliminar la zona' },
        { status: 500 }
      );
    }

    logger.info('Zona eliminada:', { zoneId, name: existingZone.name });

    return NextResponse.json({
      success: true,
      message: 'Zona eliminada correctamente'
    });
  } catch (error) {
    logger.error('Error en DELETE /api/business/hierarchy/zones/[zoneId]:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar la zona' },
      { status: 500 }
    );
  }
}
