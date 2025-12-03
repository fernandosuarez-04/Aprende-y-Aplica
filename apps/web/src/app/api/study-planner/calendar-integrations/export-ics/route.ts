import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * GET /api/study-planner/calendar-integrations/export-ics
 * Exporta todas las sesiones en formato ICS
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await SessionService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Obtener todas las sesiones futuras
    const now = new Date().toISOString();
    const { data: sessions, error: sessionsError } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', currentUser.id)
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
`;

    sessions?.forEach((session) => {
      const startDate = new Date(session.start_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endDate = new Date(session.end_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const createdDate = new Date(session.created_at).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      icsContent += `BEGIN:VEVENT
UID:${session.id}@aprende-y-aplica.com
DTSTAMP:${createdDate}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${escapeICS(session.title)}
DESCRIPTION:${escapeICS(session.description || '')}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
`;
    });

    icsContent += 'END:VCALENDAR';

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="plan-estudio.ics"',
      },
    });
  } catch (error) {
    console.error('Error in export ICS API:', error);
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


