import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { cacheHeaders } from '../../../../lib/utils/cache-headers';
import { logger } from '../../../../lib/utils/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;
    
    logger.log('🔍 Fetching community detail for slug:', slug);
    
    // Obtener el usuario actual usando el sistema de sesiones personalizado
    const { SessionService } = await import('../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      logger.log('⚠️ User not authenticated, showing public community info only');
    } else {
      logger.log('✅ User authenticated:', user.id, 'Email:', user.email);
    }

    // Obtener la comunidad por slug
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (communityError || !community) {
      logger.error('❌ Community not found:', communityError);
      return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });
    }

    logger.log('📊 Found community:', community.name, 'ID:', community.id, 'Access type:', community.access_type);

    // Si no hay usuario autenticado, retornar comunidad sin enriquecimiento
    if (!user) {
      const publicCommunity = {
        ...community,
        is_member: false,
        has_pending_request: false,
        user_role: null
      };

      logger.log('🌐 Returning public community info');
      
      return NextResponse.json({
        community: publicCommunity
      }, {
        headers: cacheHeaders.static // Cache 1 hora - info de comunidad cambia raramente
      });
    }

    // Verificar si el usuario tiene CUALQUIER membresía activa en otras comunidades
    const { data: allMemberships, error: allMembershipsError } = await supabase
      .from('community_members')
      .select('community_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true);

    logger.log('🔍 All user memberships:', allMemberships);

    // Obtener membresía específica en esta comunidad
    logger.log('🔍 Checking membership for user:', user.id, 'in community:', community.id);
    
    const { data: membership, error: membershipError } = await supabase
      .from('community_members')
      .select('role, is_active')
      .eq('community_id', community.id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    logger.log('📊 Membership query result:', { membership, membershipError });

    if (membershipError && membershipError.code !== 'PGRST116') {
      logger.error('❌ Error fetching membership:', membershipError);
    }

    // Obtener solicitud pendiente del usuario
    const { data: pendingRequest, error: requestError } = await supabase
      .from('community_access_requests')
      .select('id, status')
      .eq('community_id', community.id)
      .eq('requester_id', user.id)
      .eq('status', 'pending')
      .single();

    if (requestError && requestError.code !== 'PGRST116') {
      logger.error('❌ Error fetching pending request:', requestError);
    }

    // Lógica especial para "Profesionales"
    let isMember = !!membership;
    let userRole = membership?.role || null;
    let canJoin = true;
    
    if (community.slug === 'profesionales') {
      const hasAnyMembership = allMemberships && allMemberships.length > 0;
      
      if (!hasAnyMembership) {
        // Usuario sin comunidad: acceso libre a Profesionales
        logger.log('🔓 User has no memberships: allowing free access to Profesionales');
        isMember = true;
        userRole = 'member';
      } else {
        // Usuario con comunidad: bloqueado de Profesionales
        logger.log('🔒 User has other memberships: blocking access to Profesionales');
        isMember = false;
        canJoin = false;
      }
    } else if (community.access_type === 'invitation_only') {
      // Para comunidades privadas: verificar membresía directa
      isMember = !!membership;
      userRole = membership?.role || null;
    }

    // Enriquecer comunidad con información del usuario
    const enrichedCommunity = {
      ...community,
      is_member: isMember,
      has_pending_request: !!pendingRequest,
      user_role: userRole,
      can_join: canJoin
    };

    logger.log('✅ Returning enriched community:', enrichedCommunity.name);

    return NextResponse.json({
      community: enrichedCommunity
    }, {
      headers: cacheHeaders.static // Cache 1 hora - info de comunidad cambia raramente
    });

  } catch (error) {
    logger.error('❌ Error in community detail API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
