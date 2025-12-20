import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';
import { setSessionValue } from '@/lib/scorm/session-cache';
import { sanitizeCMIValue, validateCMIKey } from '@/lib/scorm/sanitize';

export async function POST(req: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: '401' }, { status: 401 });
    }

    const supabase = await createClient();

    const { attemptId, key, value } = await req.json();

    if (!attemptId || !key || value === undefined) {
      return NextResponse.json(
        { error: 'attemptId, key and value are required' },
        { status: 400 }
      );
    }

    // Validar que el key es un CMI key válido
    if (!validateCMIKey(key)) {
      return NextResponse.json(
        { error: 'Invalid CMI key' },
        { status: 400 }
      );
    }

    // Validar que el attempt pertenece al usuario
    const { data: attempt } = await supabase
      .from('scorm_attempts')
      .select('id')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single();

    if (!attempt) {
      return NextResponse.json({ error: '404' }, { status: 404 });
    }

    // Sanitizar y guardar en cache de sesión
    const sanitizedValue = sanitizeCMIValue(key, String(value));
    setSessionValue(attemptId, key, sanitizedValue);

    // Log important SCORM values for debugging
    if (key.includes('status') || key.includes('score') || key.includes('exit') || key.includes('time')) {
      console.log(`[SCORM setValue] ${key} = ${sanitizedValue}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to set value' },
      { status: 500 }
    );
  }
}
