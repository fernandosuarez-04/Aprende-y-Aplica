import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../lib/utils/logger';
import { SessionService } from '@/features/auth/services/session.service';
import { PurchasedCoursesService } from '@/features/courses/services/purchased-courses.service';

/**
 * GET /api/my-courses
 * Obtiene todos los cursos comprados por el usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener usuario usando el sistema de sesiones
    const currentUser = await SessionService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener parámetros opcionales
    const { searchParams } = new URL(request.url);
    const statsOnly = searchParams.get('stats_only') === 'true';

    if (statsOnly) {
      // Retornar solo estadísticas
      const stats = await PurchasedCoursesService.getUserLearningStats(currentUser.id);
      return NextResponse.json(stats);
    }

    // Obtener cursos comprados
    const courses = await PurchasedCoursesService.getUserPurchasedCourses(currentUser.id);

    return NextResponse.json(courses);
  } catch (error) {
    logger.error('Error in my-courses API:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener tus cursos',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

