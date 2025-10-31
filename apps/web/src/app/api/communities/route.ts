import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { cacheHeaders } from '../../../lib/utils/cache-headers';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    logger.log('🔍 Fetching communities...');
    
    // Obtener el usuario actual usando el sistema de sesiones personalizado
    const { SessionService } = await import('../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      logger.log('⚠️ User not authenticated, showing public communities only');
    } else {
      logger.log('✅ User authenticated:', user.id);
    }

    // Obtener todas las comunidades activas
    const { data: communities, error: communitiesError } = await supabase
      .from('communities')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (communitiesError) {
      logger.error('❌ Error fetching communities:', communitiesError);
      return NextResponse.json({ error: 'Error al obtener comunidades' }, { status: 500 });
    }

    logger.log('📊 Found communities:', communities?.length || 0);

    // Si no hay usuario autenticado, retornar comunidades sin enriquecimiento
    if (!user) {
      const publicCommunities = communities?.map(community => ({
        ...community,
        is_member: false,
        has_pending_request: false,
        user_role: null
      })) || [];

      logger.log('🌐 Returning public communities:', publicCommunities.length);
      
      // Importar utilidades de cache
      const { withCache, semiStaticCache } = await import('../../../core/utils/cache-headers');
      
      return withCache(
        NextResponse.json({
          communities: publicCommunities,
          total: publicCommunities.length
        }),
        semiStaticCache // Cache 5 min - comunidades públicas
      );
    }

    // Obtener membresías del usuario
    const { data: memberships, error: membershipsError } = await supabase
      .from('community_members')
      .select('community_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (membershipsError) {
      logger.error('❌ Error fetching memberships:', membershipsError);
    }

    // Obtener solicitudes pendientes del usuario
    const { data: pendingRequests, error: requestsError } = await supabase
      .from('community_access_requests')
      .select('community_id')
      .eq('requester_id', user.id)
      .eq('status', 'pending');

    if (requestsError) {
      logger.error('❌ Error fetching pending requests:', requestsError);
    }

    // Crear mapas para búsqueda rápida
    const membershipMap = new Map(
      memberships?.map(m => [m.community_id, m.role]) || []
    );
    const pendingRequestsMap = new Set(
      pendingRequests?.map(r => r.community_id) || []
    );

    // Enriquecer comunidades con información del usuario
    const enrichedCommunities = communities?.map(community => ({
      ...community,
      is_member: membershipMap.has(community.id),
      has_pending_request: pendingRequestsMap.has(community.id),
      user_role: membershipMap.get(community.id) || null
    })) || [];

    logger.log('✅ Returning enriched communities:', enrichedCommunities.length);

    // Importar utilidades de cache
    const { withCache, privateCache } = await import('../../../core/utils/cache-headers');

    return withCache(
      NextResponse.json({
        communities: enrichedCommunities,
        total: enrichedCommunities.length
      }),
      privateCache // No cache - datos específicos del usuario autenticado
    );

  } catch (error) {
    logger.error('❌ Error in communities API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
