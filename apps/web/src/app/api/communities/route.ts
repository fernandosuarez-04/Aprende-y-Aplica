import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    console.log('🔍 Fetching communities...');
    
    // Obtener el usuario actual (opcional)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('⚠️ User not authenticated, showing public communities only');
    } else {
      console.log('✅ User authenticated:', user?.id);
    }

    // Obtener todas las comunidades activas
    const { data: communities, error: communitiesError } = await supabase
      .from('communities')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (communitiesError) {
      console.error('❌ Error fetching communities:', communitiesError);
      return NextResponse.json({ error: 'Error al obtener comunidades' }, { status: 500 });
    }

    console.log('📊 Found communities:', communities?.length || 0);

    // Si no hay usuario autenticado, retornar comunidades sin enriquecimiento
    if (!user) {
      const publicCommunities = communities?.map(community => ({
        ...community,
        is_member: false,
        has_pending_request: false,
        user_role: null
      })) || [];

      console.log('🌐 Returning public communities:', publicCommunities.length);
      
      return NextResponse.json({
        communities: publicCommunities,
        total: publicCommunities.length
      });
    }

    // Obtener membresías del usuario
    const { data: memberships, error: membershipsError } = await supabase
      .from('community_members')
      .select('community_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (membershipsError) {
      console.error('❌ Error fetching memberships:', membershipsError);
    }

    // Obtener solicitudes pendientes del usuario
    const { data: pendingRequests, error: requestsError } = await supabase
      .from('community_access_requests')
      .select('community_id')
      .eq('requester_id', user.id)
      .eq('status', 'pending');

    if (requestsError) {
      console.error('❌ Error fetching pending requests:', requestsError);
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

    console.log('✅ Returning enriched communities:', enrichedCommunities.length);

    return NextResponse.json({
      communities: enrichedCommunities,
      total: enrichedCommunities.length
    });

  } catch (error) {
    console.error('❌ Error in communities API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
