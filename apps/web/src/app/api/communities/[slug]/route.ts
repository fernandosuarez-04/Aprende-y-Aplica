import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = await createClient();
    const { slug } = params;
    
    console.log('🔍 Fetching community detail for slug:', slug);
    
    // Obtener el usuario actual (opcional)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('⚠️ User not authenticated, showing public community info only');
    } else {
      console.log('✅ User authenticated:', user?.id, 'Email:', user?.email);
    }

    // Obtener la comunidad por slug
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (communityError || !community) {
      console.error('❌ Community not found:', communityError);
      return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });
    }

    console.log('📊 Found community:', community.name, 'ID:', community.id, 'Access type:', community.access_type);

    // Si no hay usuario autenticado, retornar comunidad sin enriquecimiento
    if (!user) {
      const publicCommunity = {
        ...community,
        is_member: false,
        has_pending_request: false,
        user_role: null
      };

      console.log('🌐 Returning public community info');
      
      return NextResponse.json({
        community: publicCommunity
      });
    }

    // Verificar si el usuario tiene CUALQUIER membresía activa en otras comunidades
    // Buscar por ID directo primero, luego por email si no encuentra
    let allMemberships = null;
    let allMembershipsError = null;
    
    // Intentar con el ID directo de auth.users
    const { data: directMemberships, error: directError } = await supabase
      .from('community_members')
      .select('community_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true);
    
    if (directMemberships && directMemberships.length > 0) {
      allMemberships = directMemberships;
    } else {
      // Si no encuentra con el ID directo, buscar por email en public.users
      const { data: userByEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();
      
      if (userByEmail) {
        const { data: emailMemberships, error: emailError } = await supabase
          .from('community_members')
          .select('community_id, role')
          .eq('user_id', userByEmail.id)
          .eq('is_active', true);
        
        allMemberships = emailMemberships;
        allMembershipsError = emailError;
      } else {
        allMembershipsError = directError;
      }
    }

    console.log('🔍 All user memberships:', allMemberships);

    // Obtener membresía específica en esta comunidad
    console.log('🔍 Checking membership for user:', user.id, 'in community:', community.id);
    
    // Buscar membresía específica: primero por ID directo, luego por email
    let membership = null;
    let membershipError = null;
    
    // Intentar con el ID directo de auth.users
    const { data: directMembership, error: directMembershipError } = await supabase
      .from('community_members')
      .select('role, is_active')
      .eq('community_id', community.id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    
    if (directMembership) {
      membership = directMembership;
    } else {
      // Si no encuentra con el ID directo, buscar por email en public.users
      const { data: userByEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();
      
      if (userByEmail) {
        const { data: emailMembership, error: emailMembershipError } = await supabase
          .from('community_members')
          .select('role, is_active')
          .eq('community_id', community.id)
          .eq('user_id', userByEmail.id)
          .eq('is_active', true)
          .single();
        
        membership = emailMembership;
        membershipError = emailMembershipError;
      } else {
        membershipError = directMembershipError;
      }
    }

    console.log('📊 Membership query result:', { membership, membershipError });

    if (membershipError && membershipError.code !== 'PGRST116') {
      console.error('❌ Error fetching membership:', membershipError);
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
      console.error('❌ Error fetching pending request:', requestError);
    }

    // Lógica especial para "Profesionales"
    let isMember = !!membership;
    let userRole = membership?.role || null;
    let canJoin = true;
    
    if (community.slug === 'profesionales') {
      const hasAnyMembership = allMemberships && allMemberships.length > 0;
      
      if (!hasAnyMembership) {
        // Usuario sin comunidad: acceso libre a Profesionales
        console.log('🔓 User has no memberships: allowing free access to Profesionales');
        isMember = true;
        userRole = 'member';
      } else {
        // Usuario con comunidad: bloqueado de Profesionales
        console.log('🔒 User has other memberships: blocking access to Profesionales');
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

    console.log('✅ Returning enriched community:', enrichedCommunity.name);

    return NextResponse.json({
      community: enrichedCommunity
    });

  } catch (error) {
    console.error('❌ Error in community detail API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
