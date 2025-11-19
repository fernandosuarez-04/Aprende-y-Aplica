import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../../../features/auth/services/session.service';
import { StudyPlannerService } from '../../../../../../features/study-planner/services/studyPlannerService';
import { logger } from '@/lib/utils/logger';

/**
 * Endpoint para suscripción ICS (iCalendar feed)
 * GET /api/study-planner/calendar-integrations/subscribe/ics
 * 
 * Este endpoint genera un feed ICS dinámico que los calendarios pueden suscribirse
 * para recibir actualizaciones automáticas de las sesiones de estudio.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener todas las sesiones del usuario
    const sessions = await StudyPlannerService.getStudySessions(user.id);

    // Generar archivo ICS con headers para suscripción
    let icsContent = 'BEGIN:VCALENDAR\r\n';
    icsContent += 'VERSION:2.0\r\n';
    icsContent += 'PRODID:-//Study Planner//Aprende y Aplica//ES\r\n';
    icsContent += 'CALSCALE:GREGORIAN\r\n';
    icsContent += 'METHOD:PUBLISH\r\n';
    icsContent += `X-WR-CALNAME:Sesiones de Estudio - ${user.email || 'Usuario'}\r\n`;
    icsContent += `X-WR-CALDESC:Sesiones de estudio del Planificador de Aprende y Aplica\r\n`;
    icsContent += `X-WR-TIMEZONE:UTC\r\n`;
    icsContent += `REFRESH-INTERVAL;VALUE=DURATION:PT1H\r\n`; // Refrescar cada hora
    icsContent += `X-PUBLISHED-TTL:PT1H\r\n`; // TTL de 1 hora

    for (const session of sessions) {
      const startDate = new Date(session.start_time)
        .toISOString()
        .replace(/[-:]/g, '')
        .split('.')[0] + 'Z';
      const endDate = new Date(session.end_time)
        .toISOString()
        .replace(/[-:]/g, '')
        .split('.')[0] + 'Z';

      // Generar UID único y estable para el evento
      const eventUid = `${session.id}@study-planner.aprende-y-aplica.com`;

      icsContent += 'BEGIN:VEVENT\r\n';
      icsContent += `UID:${eventUid}\r\n`;
      icsContent += `DTSTART:${startDate}\r\n`;
      icsContent += `DTEND:${endDate}\r\n`;
      icsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
      icsContent += `SUMMARY:${session.title.replace(/,/g, '\\,').replace(/;/g, '\\;')}\r\n`;
      
      if (session.description) {
        icsContent += `DESCRIPTION:${session.description.replace(/,/g, '\\,').replace(/;/g, '\\;')}\r\n`;
      }
      
      // Estado según el status de la sesión
      if (session.status === 'completed') {
        icsContent += 'STATUS:CONFIRMED\r\n';
        icsContent += 'SEQUENCE:1\r\n';
      } else if (session.status === 'cancelled' || session.status === 'skipped') {
        icsContent += 'STATUS:CANCELLED\r\n';
      } else {
        icsContent += 'STATUS:TENTATIVE\r\n';
      }

      // URL para ver la sesión en la app
      const sessionUrl = `${request.nextUrl.origin}/study-planner/session/${session.id}`;
      icsContent += `URL:${sessionUrl}\r\n`;
      
      // Última modificación
      if (session.updated_at) {
        const lastModified = new Date(session.updated_at)
          .toISOString()
          .replace(/[-:]/g, '')
          .split('.')[0] + 'Z';
        icsContent += `LAST-MODIFIED:${lastModified}\r\n`;
      }

      icsContent += 'END:VEVENT\r\n';
    }

    icsContent += 'END:VCALENDAR\r\n';

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="study-sessions.ics"',
        'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    logger.error('Error generating ICS subscription:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error desconocido',
          code: 'ICS_SUBSCRIPTION_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

