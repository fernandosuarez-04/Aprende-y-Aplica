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
      
      // Importar utilidades de cache
      const { withCache, semiStaticCache } = await import('../../../../core/utils/cache-headers');
      
      return withCache(
        NextResponse.json({
          community: publicCommunity
        }),
        semiStaticCache // Cache 5 min - info pública de comunidad
      );
    }

    // Verificar si el usuario necesita completar el cuestionario
    // Solo requerir cuestionario para comunidades privadas o para acciones que requieren membresía
    // Las comunidades públicas (access_type === 'open') pueden ser vistas sin cuestionario
    let requiresQuestionnaire = false;
    if (community.access_type === 'invitation_only' || community.access_type === 'request') {
      const { QuestionnaireValidationService } = await import('../../../../features/auth/services/questionnaire-validation.service');
      requiresQuestionnaire = await QuestionnaireValidationService.requiresQuestionnaire(user.id);
      
      if (requiresQuestionnaire) {
        logger.log('🔒 User needs to complete questionnaire before accessing private communities');
        return NextResponse.json({ 
          error: 'Debes completar el cuestionario de Mis Estadísticas antes de acceder a comunidades privadas',
          requiresQuestionnaire: true,
          redirectUrl: '/statistics'
        }, { status: 403 });
      }
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
      // Verificar si el usuario tiene membresías en OTRAS comunidades (excluir Profesionales)
      const hasOtherMemberships = allMemberships && allMemberships.some(m => m.community_id !== community.id);
      
      if (!hasOtherMemberships) {
        // Usuario sin otras comunidades: mostrar como miembro automático de Profesionales
        logger.log('🔓 User has no other memberships: showing as auto-member of Profesionales');
        isMember = true;
        userRole = 'member';
      } else {
        // Usuario con otra comunidad: bloqueado de Profesionales
        logger.log('🔒 User has other memberships: blocking access to Profesionales');
        isMember = false;
        canJoin = false;
      }
    } else if (community.access_type === 'invitation_only') {
      // Para comunidades privadas: verificar membresía directa
      isMember = !!membership;
      userRole = membership?.role || null;
    }

    // Para "Profesionales", calcular el member_count real (solo usuarios sin otras comunidades)
    let realMemberCount = community.member_count;

    if (community.slug === 'profesionales') {
      // Obtener todos los miembros de "Profesionales"
      const { data: profMembers } = await supabase
        .from('community_members')
        .select('id, user_id')
        .eq('community_id', community.id)
        .eq('is_active', true);

      if (profMembers && profMembers.length > 0) {
        let validCount = 0;

        // Contar solo usuarios que NO tienen otras comunidades
        for (const member of profMembers) {
          const { data: otherMemberships } = await supabase
            .from('community_members')
            .select('community_id')
            .eq('user_id', member.user_id)
            .eq('is_active', true)
            .neq('community_id', community.id);

          // Solo contar si NO tiene otras comunidades
          if (!otherMemberships || otherMemberships.length === 0) {
            validCount++;
          }
        }

        realMemberCount = validCount;
        logger.log(`📊 Profesionales real member count: ${validCount} (database: ${community.member_count})`);
      } else {
        realMemberCount = 0;
      }
    }

    // Enriquecer comunidad con información del usuario
    const enrichedCommunity = {
      ...community,
      member_count: realMemberCount,
      is_member: isMember,
      has_pending_request: !!pendingRequest,
      user_role: userRole,
      can_join: canJoin
    };

    logger.log('✅ Returning enriched community:', enrichedCommunity.name);

    // Importar utilidades de cache
    const { withCache, privateCache } = await import('../../../../core/utils/cache-headers');

    return withCache(
      NextResponse.json({
        community: enrichedCommunity
      }),
      privateCache // No cache - datos específicos del usuario autenticado
    );

  } catch (error) {
    logger.error('❌ Error in community detail API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
