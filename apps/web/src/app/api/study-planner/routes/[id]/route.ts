import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * GET /api/study-planner/routes/[id]
 * Obtiene una ruta de aprendizaje específica con sus cursos
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await SessionService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const supabase = await createClient();

    // Verificar que la ruta pertenece al usuario
    const { data: route, error: routeError } = await supabase
      .from('learning_routes')
      .select('id, name, description, user_id')
      .eq('id', id)
      .eq('user_id', currentUser.id)
      .single();

    if (routeError || !route) {
      return NextResponse.json(
        { error: 'Ruta no encontrada' },
        { status: 404 }
      );
    }

    // Obtener cursos de la ruta
    const { data: routeCourses, error: coursesError } = await supabase
      .from('learning_route_courses')
      .select('course_id, course_order')
      .eq('route_id', id)
      .order('course_order', { ascending: true });

    if (coursesError) {
      console.error('Error fetching route courses:', coursesError);
      return NextResponse.json(
        { error: 'Error al obtener cursos de la ruta' },
        { status: 500 }
      );
    }

    const courseIds = (routeCourses || []).map(rc => rc.course_id);

    if (courseIds.length === 0) {
      return NextResponse.json({
        route: {
          id: route.id,
          name: route.name,
          description: route.description,
        },
        courses: [],
      });
    }

    // Obtener información completa de los cursos
    const { data: courses, error: coursesDataError } = await supabase
      .from('courses')
      .select('id, title, description, thumbnail_url, slug, category, duration_total_minutes, level')
      .in('id', courseIds);

    if (coursesDataError) {
      console.error('Error fetching courses data:', coursesDataError);
      return NextResponse.json(
        { error: 'Error al obtener información de cursos' },
        { status: 500 }
      );
    }

    // Ordenar cursos según course_order
    const orderedCourses = (courses || []).sort((a, b) => {
      const orderA = routeCourses.find(rc => rc.course_id === a.id)?.course_order || 0;
      const orderB = routeCourses.find(rc => rc.course_id === b.id)?.course_order || 0;
      return orderA - orderB;
    });

    return NextResponse.json({
      route: {
        id: route.id,
        name: route.name,
        description: route.description,
      },
      courses: orderedCourses,
    });
  } catch (error) {
    console.error('Error in route detail API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


