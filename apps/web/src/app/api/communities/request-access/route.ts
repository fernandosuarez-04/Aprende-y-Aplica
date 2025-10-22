import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Obtener el usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { communityId, note } = await request.json();

    if (!communityId) {
      return NextResponse.json({ error: 'ID de comunidad requerido' }, { status: 400 });
    }

    // Verificar que la comunidad existe y requiere invitación
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('*')
      .eq('id', communityId)
      .eq('is_active', true)
      .single();

    if (communityError || !community) {
      return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });
    }

    if (community.access_type === 'free') {
      return NextResponse.json({ 
        error: 'Esta comunidad permite unirse directamente' 
      }, { status: 400 });
    }

    // Verificar si el usuario ya es miembro
    const { data: existingMembership, error: membershipError } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (membershipError && membershipError.code !== 'PGRST116') {
      console.error('Error checking membership:', membershipError);
      return NextResponse.json({ error: 'Error al verificar membresía' }, { status: 500 });
    }

    if (existingMembership) {
      return NextResponse.json({ error: 'Ya eres miembro de esta comunidad' }, { status: 400 });
    }

    // Verificar si ya existe una solicitud pendiente
    const { data: existingRequest, error: requestError } = await supabase
      .from('community_access_requests')
      .select('id')
      .eq('community_id', communityId)
      .eq('requester_id', user.id)
      .eq('status', 'pending')
      .single();

    if (requestError && requestError.code !== 'PGRST116') {
      console.error('Error checking existing request:', requestError);
      return NextResponse.json({ error: 'Error al verificar solicitud existente' }, { status: 500 });
    }

    if (existingRequest) {
      return NextResponse.json({ 
        error: 'Ya tienes una solicitud pendiente para esta comunidad' 
      }, { status: 400 });
    }

    // Crear solicitud de acceso
    const { error: createRequestError } = await supabase
      .from('community_access_requests')
      .insert({
        community_id: communityId,
        requester_id: user.id,
        status: 'pending',
        note: note || null,
        created_at: new Date().toISOString()
      });

    if (createRequestError) {
      console.error('Error creating access request:', createRequestError);
      return NextResponse.json({ error: 'Error al crear solicitud de acceso' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitud de acceso enviada exitosamente'
    });

  } catch (error) {
    console.error('Error in request access API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
