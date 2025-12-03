import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/study-planner/calendar-integrations/subscribe/ics/[token]
 * Endpoint público de suscripción ICS (para Apple Calendar y otros)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token requerido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Buscar usuario por token
    const { data: subscriptionToken, error: tokenError } = await supabase
      .from('calendar_subscription_tokens')
      .select('user_id')
      .eq('token', token)
      .single();

    if (tokenError || !subscriptionToken) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Actualizar uso del token
    const { data: currentToken } = await supabase
      .from('calendar_subscription_tokens')
      .select('usage_count')
      .eq('token', token)
      .single();
    
    await supabase
      .from('calendar_subscription_tokens')
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: (currentToken?.usage_count || 0) + 1,
      })
      .eq('token', token);

    // Obtener sesiones futuras del usuario
    const now = new Date().toISOString();
    const { data: sessions, error: sessionsError } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', subscriptionToken.user_id)
      .gte('start_time', now)
      .in('status', ['planned', 'in_progress']);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Error al obtener sesiones' },
        { status: 500 }
      );
    }

    // Generar contenido ICS
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Aprende y Aplica//Plan de Estudio//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Plan de Estudio
X-WR-CALDESC:Sesiones de estudio planificadas
`;

    sessions?.forEach((session) => {
      const startDate = new Date(session.start_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endDate = new Date(session.end_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const createdDate = new Date(session.created_at).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const lastModified = new Date(session.updated_at || session.created_at).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      icsContent += `BEGIN:VEVENT
UID:${session.id}@aprende-y-aplica.com
DTSTAMP:${createdDate}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${escapeICS(session.title)}
DESCRIPTION:${escapeICS(session.description || '')}
STATUS:CONFIRMED
SEQUENCE:0
LAST-MODIFIED:${lastModified}
END:VEVENT
`;
    });

    icsContent += 'END:VCALENDAR';

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error in ICS subscription API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

