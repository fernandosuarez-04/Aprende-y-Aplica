import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../../../lib/supabase/server';
import { SessionService } from '../../../../../../../features/auth/services/session.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { slug, postId } = resolvedParams;
    
    const supabase = await createClient();
    
    // Verificar autenticación usando el sistema de sesiones personalizado
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { option, action } = body; // action: 'vote' o 'remove'

    if (!option) {
      return NextResponse.json({ error: 'Opción requerida' }, { status: 400 });
    }

    console.log('🗳️ [POLL VOTE] Procesando voto:', {
      postId,
      userId: user.id,
      option,
      action
    });

    // Obtener el post para verificar que es una encuesta
    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('id, attachment_type, attachment_data')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 });
    }

    if ((post as any).attachment_type !== 'poll') {
      return NextResponse.json({ error: 'Este post no es una encuesta' }, { status: 400 });
    }

    let pollData = (post as any).attachment_data;
    if (!pollData || !pollData.options) {
      return NextResponse.json({ error: 'Datos de encuesta inválidos' }, { status: 400 });
    }

    // Si no tiene estructura votes, inicializarla automáticamente
    if (!pollData.votes || typeof pollData.votes !== 'object') {
      console.log('⚠️ [POLL VOTE] Inicializando estructura votes para encuesta antigua...');
      const initialVotes: Record<string, string[]> = {};
      pollData.options.forEach((option: string) => {
        initialVotes[option] = [];
      });
      pollData.votes = initialVotes;
      pollData.userVotes = pollData.userVotes || {};
    }

    // Verificar que la opción existe
    if (!pollData.options.includes(option)) {
      return NextResponse.json({ error: 'Opción no válida' }, { status: 400 });
    }

    // Obtener el voto actual del usuario desde attachment_data
    const currentUserVote = pollData.userVotes?.[user.id] || null;

    console.log('🗳️ [POLL VOTE] Voto actual del usuario:', currentUserVote);

    // Crear una copia de los datos de la encuesta para modificar
    const updatedPollData = { ...pollData };
    const updatedVotes = { ...pollData.votes };
    const updatedUserVotes = { ...pollData.userVotes } || {};

    if (action === 'vote') {
      // Si ya votó por esta opción, no hacer nada
      if (currentUserVote === option) {
        return NextResponse.json({ 
          success: true, 
          message: 'Ya votaste por esta opción',
          pollData: updatedPollData
        });
      }

      // Remover voto anterior si existe
      if (currentUserVote && updatedVotes[currentUserVote]) {
        const currentVotes = Array.isArray(updatedVotes[currentUserVote]) 
          ? updatedVotes[currentUserVote] 
          : [];
        
        // Remover el usuario de la lista de votos
        const filteredVotes = currentVotes.filter((voterId: string) => voterId !== user.id);
        updatedVotes[currentUserVote] = filteredVotes;
      }

      // Agregar nuevo voto
      const currentOptionVotes = Array.isArray(updatedVotes[option]) 
        ? updatedVotes[option] 
        : [];
      
      if (!currentOptionVotes.includes(user.id)) {
        updatedVotes[option] = [...currentOptionVotes, user.id];
      }

      // Actualizar el voto del usuario
      updatedUserVotes[user.id] = option;

    } else if (action === 'remove') {
      // Solo remover si el usuario votó por esta opción
      if (currentUserVote !== option) {
        return NextResponse.json({ 
          success: true, 
          message: 'No has votado por esta opción',
          pollData: updatedPollData
        });
      }

      // Remover voto
      if (updatedVotes[option]) {
        const currentVotes = Array.isArray(updatedVotes[option]) 
          ? updatedVotes[option] 
          : [];
        
        const filteredVotes = currentVotes.filter((voterId: string) => voterId !== user.id);
        updatedVotes[option] = filteredVotes;
      }

      // Remover el voto del usuario
      delete updatedUserVotes[user.id];
    }

    // Actualizar los datos de la encuesta
    updatedPollData.votes = updatedVotes;
    updatedPollData.userVotes = updatedUserVotes;

    // Actualizar el post con los nuevos datos de la encuesta
    const { error: updatePostError } = await (supabase as any)
      .from('community_posts')
      .update({
        attachment_data: updatedPollData,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);

    if (updatePostError) {
      console.error('Error actualizando post:', updatePostError);
      return NextResponse.json({ error: 'Error actualizando encuesta' }, { status: 500 });
    }

    console.log('✅ [POLL VOTE] Voto procesado exitosamente');

    return NextResponse.json({
      success: true,
      message: action === 'vote' ? 'Voto registrado' : 'Voto eliminado',
      pollData: updatedPollData,
      userVote: action === 'vote' ? option : null
    });

  } catch (error) {
    console.error('Error en votación de encuesta:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// GET para obtener el voto actual del usuario
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { postId } = resolvedParams;
    
    const supabase = await createClient();
    
    // Verificar autenticación usando el sistema de sesiones personalizado
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener el post para acceder a los datos de la encuesta
    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('attachment_data')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 });
    }

    let pollData = (post as any).attachment_data;

    // Si no tiene estructura votes, inicializarla automáticamente
    if (pollData && pollData.options && (!pollData.votes || typeof pollData.votes !== 'object')) {
      console.log('⚠️ [POLL GET] Inicializando estructura votes para encuesta antigua...');
      const initialVotes: Record<string, string[]> = {};
      pollData.options.forEach((option: string) => {
        initialVotes[option] = [];
      });
      pollData.votes = initialVotes;
      pollData.userVotes = pollData.userVotes || {};
    }

    const userVote = pollData?.userVotes?.[user.id] || null;

    return NextResponse.json({
      success: true,
      userVote: userVote,
      pollData: pollData  // Agregar pollData completo para que el componente pueda actualizarse
    });

  } catch (error) {
    console.error('Error obteniendo voto de usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
