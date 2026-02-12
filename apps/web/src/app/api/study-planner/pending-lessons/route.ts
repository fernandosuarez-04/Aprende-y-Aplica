import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * GET /api/study-planner/pending-lessons
 * 
 * Obtiene las lecciones PENDIENTES (no completadas) de los cursos asignados
 * directamente de la base de datos para evitar alucinaciones de la IA.
 * 
 * Similar al patrón Bridge de IRIS: consulta directa a BD = datos verídicos.
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await SessionService.getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const courseIdParam = searchParams.get('courseId');
    const supabase = await createClient();

    // =========================================================================
    // 1. OBTENER CURSOS DE MÚLTIPLES FUENTES (B2B + Enrollments tradicionales)
    // =========================================================================

    interface CourseSource {
      course_id: string;
      due_date: string | null;
      source: 'enrollment' | 'org_assignment' | 'hierarchy_assignment';
      courseInfo?: { id: string; title: string; description?: string };
    }

    interface ModuleData {
      module_id: string;
      module_title: string;
      module_order_index: number;
      is_published: boolean;
    }

    interface LessonData {
      lesson_id: string;
      lesson_title: string;
      lesson_description: string | null;
      lesson_order_index: number;
      duration_seconds: number | null;
      total_duration_minutes: number | null;
      module_id: string;
      is_published: boolean;
    }

    interface ProgressData {
      lesson_id: string;
      lesson_status: string | null;
      is_completed: boolean;
    }

    interface PendingLessonWithModule {
      lessonId: string;
      lessonTitle: string;
      lessonOrderIndex: number;
      durationMinutes: number;
      durationSeconds: number;
      moduleId: string;
      moduleTitle: string;
      moduleOrderIndex: number;
    }

    const allCourseSources: CourseSource[] = [];

    // 1a. Verificar si es usuario B2B
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id, team_id, zone_id, region_id')
      .eq('user_id', currentUser.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    const isB2BUser = !!orgUser?.organization_id;
 console.log(` [pending-lessons] Usuario ${currentUser.id}: isB2B=${isB2BUser}`);

    // 1b. Si es B2B, obtener asignaciones de organization_course_assignments
    if (isB2BUser) {
      const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
 console.log(` [B2B] Fecha actual para filtrado: ${today}`);

      const { data: orgAssignments, error: orgAssignmentsError } = await supabase
        .from('organization_course_assignments')
        .select(`
          course_id,
          due_date,
          status,
          courses:course_id (
            id,
            title,
            description
          )
        `)
        .eq('user_id', currentUser.id)
        .neq('status', 'cancelled')
        .neq('status', 'completed');

      if (orgAssignmentsError) {
 console.error(' Error obteniendo org_assignments:', orgAssignmentsError);
      } else if (orgAssignments && orgAssignments.length > 0) {
 console.log(` [B2B] Encontradas ${orgAssignments.length} asignaciones directas (antes de filtrar por fecha)`);

        // Filtrar asignaciones vencidas
        const validAssignments = orgAssignments.filter((assignment: any) => {
          // Si no tiene due_date, incluir (sin fecha límite)
          if (!assignment.due_date) {
 console.log(` Curso ${assignment.course_id}: sin fecha límite - INCLUIDO`);
            return true;
          }

          const dueDate = new Date(assignment.due_date);
          const todayDate = new Date(today);
          dueDate.setHours(0, 0, 0, 0);
          todayDate.setHours(0, 0, 0, 0);

          const isValid = dueDate >= todayDate;
 console.log(` ${isValid ? '' : ''} Curso ${assignment.course_id}: due_date=${assignment.due_date} ${isValid ? '- INCLUIDO' : '- EXPIRADO (omitido)'}`);
          return isValid;
        });

 console.log(` [B2B] ${validAssignments.length} asignaciones válidas después de filtrar expiradas`);

        for (const assignment of validAssignments) {
          const courseData = assignment.courses as any;
          allCourseSources.push({
            course_id: assignment.course_id,
            due_date: assignment.due_date,
            source: 'org_assignment',
            courseInfo: courseData ? {
              id: courseData.id,
              title: courseData.title,
              description: courseData.description
            } : undefined
          });
        }
      }

      // 1c. Obtener asignaciones jerárquicas (team/zone/region)
      let hierarchyAssignmentIds: string[] = [];

      if (orgUser.team_id) {
        const { data: teamAssigns } = await supabase
          .from('team_course_assignments')
          .select('hierarchy_assignment_id')
          .eq('team_id', orgUser.team_id);
        hierarchyAssignmentIds = teamAssigns?.map((a: { hierarchy_assignment_id: string }) => a.hierarchy_assignment_id) || [];
      } else if (orgUser.zone_id) {
        const { data: zoneAssigns } = await supabase
          .from('zone_course_assignments')
          .select('hierarchy_assignment_id')
          .eq('zone_id', orgUser.zone_id);
        hierarchyAssignmentIds = zoneAssigns?.map((a: { hierarchy_assignment_id: string }) => a.hierarchy_assignment_id) || [];
      } else if (orgUser.region_id) {
        const { data: regionAssigns } = await supabase
          .from('region_course_assignments')
          .select('hierarchy_assignment_id')
          .eq('region_id', orgUser.region_id);
        hierarchyAssignmentIds = regionAssigns?.map((a: { hierarchy_assignment_id: string }) => a.hierarchy_assignment_id) || [];
      }

      if (hierarchyAssignmentIds.length > 0) {
        const { data: hierarchyAssignments, error: hierarchyError } = await supabase
          .from('hierarchy_course_assignments')
          .select(`
            course_id,
            due_date,
            courses:course_id (
              id,
              title,
              description
            )
          `)
          .in('id', hierarchyAssignmentIds)
          .eq('status', 'active');

        if (hierarchyError) {
 console.error(' Error obteniendo hierarchy_assignments:', hierarchyError);
        } else if (hierarchyAssignments && hierarchyAssignments.length > 0) {
 console.log(` [B2B] Encontradas ${hierarchyAssignments.length} asignaciones jerárquicas (antes de filtrar por fecha)`);

          // Filtrar asignaciones jerárquicas vencidas
          const validHierarchyAssignments = hierarchyAssignments.filter((assignment: any) => {
            if (!assignment.due_date) {
              return true; // Sin fecha límite = incluir
            }
            const dueDate = new Date(assignment.due_date);
            const todayDate = new Date(today);
            dueDate.setHours(0, 0, 0, 0);
            todayDate.setHours(0, 0, 0, 0);
            const isValid = dueDate >= todayDate;
            if (!isValid) {
 console.log(` Curso jerárquico ${assignment.course_id}: due_date=${assignment.due_date} - EXPIRADO (omitido)`);
            }
            return isValid;
          });

 console.log(` [B2B] ${validHierarchyAssignments.length} asignaciones jerárquicas válidas`);

          for (const assignment of validHierarchyAssignments) {
            const exists = allCourseSources.some(c => c.course_id === assignment.course_id);
            if (!exists) {
              const courseData = assignment.courses as any;
              allCourseSources.push({
                course_id: assignment.course_id,
                due_date: assignment.due_date,
                source: 'hierarchy_assignment',
                courseInfo: courseData ? {
                  id: courseData.id,
                  title: courseData.title,
                  description: courseData.description
                } : undefined
              });
            }
          }
        }
      }
    }

    // 1d. Obtener enrollments tradicionales (para B2C o cursos adicionales)
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('user_course_enrollments')
      .select(`
        enrollment_id,
        course_id,
        courses (
          id,
          title,
          description
        )
      `)
      .eq('user_id', currentUser.id)
      .eq('enrollment_status', 'active');

    if (enrollmentsError) {
 console.error(' Error obteniendo enrollments:', enrollmentsError);
    } else if (enrollments && enrollments.length > 0) {
      for (const enrollment of enrollments) {
        const exists = allCourseSources.some(c => c.course_id === enrollment.course_id);
        if (!exists) {
          const courseData = enrollment.courses as any;
          allCourseSources.push({
            course_id: enrollment.course_id,
            due_date: null,
            source: 'enrollment',
            courseInfo: courseData ? {
              id: courseData.id,
              title: courseData.title,
              description: courseData.description
            } : undefined
          });
        }
      }
    }

    // Si no hay cursos de ninguna fuente
    if (allCourseSources.length === 0) {
 console.log(` [pending-lessons] Usuario ${currentUser.id}: Sin cursos asignados ni enrollments`);
      return NextResponse.json({
        success: true,
        totalPendingLessons: 0,
        courses: [],
        allPendingLessons: []
      });
    }

 console.log(` [pending-lessons] Total de cursos encontrados: ${allCourseSources.length}`);

    // Filtrar por courseId si se especificó
    const coursesToProcess = courseIdParam
      ? allCourseSources.filter(c => c.course_id === courseIdParam)
      : allCourseSources;

    // 2. Para cada curso, obtener módulos, lecciones y progreso
    const coursesWithLessons = await Promise.all(
      coursesToProcess.map(async (courseSource) => {
        const courseId = courseSource.course_id;
        const courseInfo = courseSource.courseInfo;
        const courseDueDate = courseSource.due_date;

        // 2a. Obtener módulos del curso
        const { data: modules, error: modulesError } = await supabase
          .from('course_modules')
          .select(`
            module_id,
            module_title,
            module_order_index,
            is_published
          `)
          .eq('course_id', courseId)
          .eq('is_published', true)
          .order('module_order_index', { ascending: true });

        if (modulesError || !modules || modules.length === 0) {
          return null;
        }

        const moduleIds = (modules as ModuleData[]).map((m: ModuleData) => m.module_id);

        // 2b. Obtener TODAS las lecciones de los módulos
        const { data: lessons, error: lessonsError } = await supabase
          .from('course_lessons')
          .select(`
            lesson_id,
            lesson_title,
            lesson_description,
            lesson_order_index,
            duration_seconds,
            total_duration_minutes,
            module_id,
            is_published
          `)
          .in('module_id', moduleIds)
          .eq('is_published', true)
          .order('lesson_order_index', { ascending: true });

        if (lessonsError || !lessons) {
 console.error(` Error obteniendo lecciones del curso ${courseId}:`, lessonsError);
          return null;
        }

        // 2c. Obtener lecciones COMPLETADAS del usuario
        const lessonIds = (lessons as LessonData[]).map((l: LessonData) => l.lesson_id);
        const { data: completedProgress, error: progressError } = await supabase
          .from('user_lesson_progress')
          .select('lesson_id, lesson_status, is_completed')
          .eq('user_id', currentUser.id)
          .eq('is_completed', true) // Usar el flag explícito de completado
          .in('lesson_id', lessonIds);

        if (progressError) {
 console.error(` Error consultando progreso para curso ${courseId}:`, progressError);
        }

        const completedLessonIds = new Set(
          (completedProgress || []).map((p: ProgressData) => p.lesson_id)
        );

 console.log(` [Progreso] Curso ${courseId}: ${completedLessonIds.size} lecciones completadas encontradas en user_lesson_progress`);

        // 2d. Filtrar solo lecciones PENDIENTES (no completadas)
        const pendingLessons = (lessons as LessonData[]).filter(
          (lesson: LessonData) => !completedLessonIds.has(lesson.lesson_id)
        );

        // 2e. Construir estructura con información del módulo
        const pendingLessonsWithModules: PendingLessonWithModule[] = pendingLessons.map((lesson: LessonData) => {
          const module = (modules as ModuleData[]).find((m: ModuleData) => m.module_id === lesson.module_id);

          // Calcular duración en minutos
          let durationMinutes = 15; // fallback
          if (lesson.total_duration_minutes && lesson.total_duration_minutes > 0) {
            durationMinutes = lesson.total_duration_minutes;
          } else if (lesson.duration_seconds && lesson.duration_seconds > 0) {
            durationMinutes = Math.ceil(lesson.duration_seconds / 60);
          }

          return {
            lessonId: lesson.lesson_id,
            lessonTitle: lesson.lesson_title, // ⚠️ NOMBRE EXACTO DE LA BD
            lessonOrderIndex: lesson.lesson_order_index,
            durationMinutes,
            durationSeconds: lesson.duration_seconds || 0,
            moduleId: lesson.module_id,
            moduleTitle: module?.module_title || 'Módulo',
            moduleOrderIndex: module?.module_order_index || 0,
          };
        });

        // Ordenar por módulo y luego por lección
        pendingLessonsWithModules.sort((a: PendingLessonWithModule, b: PendingLessonWithModule) => {
          if (a.moduleOrderIndex !== b.moduleOrderIndex) {
            return a.moduleOrderIndex - b.moduleOrderIndex;
          }
          return a.lessonOrderIndex - b.lessonOrderIndex;
        });

        return {
          courseId,
          courseTitle: courseInfo?.title || 'Curso',
          dueDate: courseDueDate,
          totalLessons: lessons.length,
          completedLessons: completedLessonIds.size,
          pendingLessons: pendingLessonsWithModules,
          pendingCount: pendingLessonsWithModules.length,
        };
      })
    );

    // Filtrar cursos nulos
    const validCourses = coursesWithLessons.filter(c => c !== null);

    // Calcular total de lecciones pendientes
    const totalPendingLessons = validCourses.reduce(
      (sum, course) => sum + (course?.pendingCount || 0),
      0
    );

    // Combinar todas las lecciones pendientes en una lista plana
    const allPendingLessons = validCourses.flatMap(course =>
      (course?.pendingLessons || []).map((lesson: PendingLessonWithModule) => ({
        ...lesson,
        courseId: course?.courseId,
        courseTitle: course?.courseTitle,
      }))
    );

 console.log(` [pending-lessons] Usuario ${currentUser.id}: ${totalPendingLessons} lecciones pendientes de ${validCourses.length} cursos`);

    // Log de ejemplo de las primeras lecciones (para debug)
    if (allPendingLessons.length > 0) {
 console.log(' Primeras 5 lecciones pendientes:');
      allPendingLessons.slice(0, 5).forEach((l, i) => {
        console.log(`   ${i + 1}. "${l.lessonTitle}" (${l.durationMinutes} min)`);
      });
    }

    return NextResponse.json({
      success: true,
      userId: currentUser.id,
      totalPendingLessons,
      courses: validCourses,
      allPendingLessons, // Lista plana para uso directo
    });

  } catch (error) {
 console.error(' Error en pending-lessons:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
