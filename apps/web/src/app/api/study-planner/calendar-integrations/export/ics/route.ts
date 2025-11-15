import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../../../features/auth/services/session.service';
import { StudyPlannerService } from '../../../../../../features/study-planner/services/studyPlannerService';
import { logger } from '@/lib/utils/logger';

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

    // Generar archivo ICS
    let icsContent = 'BEGIN:VCALENDAR\r\n';
    icsContent += 'VERSION:2.0\r\n';
    icsContent += 'PRODID:-//Study Planner//Aprende y Aplica//ES\r\n';
    icsContent += 'CALSCALE:GREGORIAN\r\n';
    icsContent += 'METHOD:PUBLISH\r\n';

    for (const session of sessions) {
      const startDate = new Date(session.start_time)
        .toISOString()
        .replace(/[-:]/g, '')
        .split('.')[0] + 'Z';
      const endDate = new Date(session.end_time)
        .toISOString()
        .replace(/[-:]/g, '')
        .split('.')[0] + 'Z';

      icsContent += 'BEGIN:VEVENT\r\n';
      icsContent += `UID:${session.id}@study-planner\r\n`;
      icsContent += `DTSTART:${startDate}\r\n`;
      icsContent += `DTEND:${endDate}\r\n`;
      icsContent += `SUMMARY:${session.title.replace(/,/g, '\\,').replace(/;/g, '\\;')}\r\n`;
      if (session.description) {
        icsContent += `DESCRIPTION:${session.description.replace(/,/g, '\\,').replace(/;/g, '\\;')}\r\n`;
      }
      icsContent += `STATUS:${session.status === 'completed' ? 'CONFIRMED' : 'TENTATIVE'}\r\n`;
      icsContent += 'END:VEVENT\r\n';
    }

    icsContent += 'END:VCALENDAR\r\n';

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="study-sessions.ics"',
      },
    });
  } catch (error) {
    logger.error('Error exporting ICS:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error desconocido',
          code: 'ICS_EXPORT_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

