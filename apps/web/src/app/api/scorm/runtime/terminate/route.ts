import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';
import { clearSessionCache } from '@/lib/scorm/session-cache';

export async function POST(req: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: '401' }, { status: 401 });
    }

    const supabase = await createClient();

    const { attemptId } = await req.json();

    if (!attemptId) {
      return NextResponse.json(
        { error: 'attemptId is required' },
        { status: 400 }
      );
    }

    // Verificar que el attempt pertenece al usuario
    const { data: attempt } = await supabase
      .from('scorm_attempts')
      .select('id')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single();

    if (!attempt) {
      return NextResponse.json({ error: '404' }, { status: 404 });
    }

    // Limpiar cache de sesión
    clearSessionCache(attemptId);

    // Actualizar última vez accedido
    await supabase
      .from('scorm_attempts')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', attemptId)
      .eq('user_id', user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to terminate' }, { status: 500 });
  }
}
