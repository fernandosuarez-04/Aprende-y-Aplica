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
    
    // Obtener contexto completo del usuario
    const userContext = await UserContextService.getFullUserContext(user.id);
    
    // Enriquecer con información adicional de cursos si es necesario
    const enrichedCourses = await Promise.all(
      userContext.courses.map(async (courseAssignment) => {
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
      })
    );
    
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
