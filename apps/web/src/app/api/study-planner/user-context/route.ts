/**
 * API Endpoint: User Context for Study Planner
 * 
 * GET /api/study-planner/user-context
 * 
 * Obtiene el contexto completo del usuario para el planificador de estudios,
 * incluyendo tipo (B2B/B2C), perfil profesional, cursos y preferencias.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../features/auth/services/session.service';
import { UserContextService } from '../../../../features/study-planner/services/user-context.service';
import { CourseAnalysisService } from '../../../../features/study-planner/services/course-analysis.service';
import type { UserContext, UserContextResponse } from '../../../../features/study-planner/types/user-context.types';

export async function GET(request: NextRequest): Promise<NextResponse<UserContextResponse>> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener contexto completo del usuario con manejo de errores robusto
    let userContext;
    try {
      userContext = await UserContextService.getFullUserContext(user.id);
    } catch (contextError) {
      console.error('Error obteniendo contexto completo del usuario:', contextError);
      // Retornar un contexto mínimo en lugar de fallar
      return NextResponse.json({
        success: true,
        data: {
          userId: user.id,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
            displayName: user.display_name,
          },
          userType: 'b2c' as const, // Default a B2C si no se puede determinar
          courses: [],
        } as any,
      });
    }

    // Enriquecer con información adicional de cursos si hay cursos disponibles
    let enrichedCourses = userContext.courses || [];

    if (enrichedCourses.length > 0) {
      try {
        enrichedCourses = await Promise.all(
          enrichedCourses.map(async (courseAssignment) => {
            try {
              // Calcular tiempo restante para cada curso
              const progress = await CourseAnalysisService.getUserCourseProgress(
                user.id,
                courseAssignment.courseId
              );

              return {
                ...courseAssignment,
                completionPercentage: progress.progressPercentage,
                completedLessons: progress.completedLessons,
                totalLessons: progress.totalLessons,
                lastAccessedAt: progress.lastAccessedAt,
              };
            } catch (progressError) {
              console.warn('Error obteniendo progreso del curso:', courseAssignment.courseId, progressError);
              // Retornar el curso sin el progreso enriquecido
              return {
                ...courseAssignment,
                completionPercentage: 0,
                completedLessons: 0,
                totalLessons: 0,
              };
            }
          })
        );
      } catch (enrichError) {
        console.warn('Error enriqueciendo cursos:', enrichError);
        // Usar cursos sin enriquecer
      }
    }

    const enrichedContext: UserContext = {
      ...userContext,
      userId: user.id, // Incluir userId para detectar cambios de sesión
      courses: enrichedCourses as any,
    };

    return NextResponse.json({
      success: true,
      data: enrichedContext,
    });

  } catch (error) {
    console.error('Error obteniendo contexto de usuario:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
