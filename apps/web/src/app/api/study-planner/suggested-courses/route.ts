import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * GET /api/study-planner/suggested-courses
 * Obtiene cursos sugeridos para el usuario (cursos populares, nuevos, relacionados)
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

    // Obtener cursos que el usuario ya tiene
    const { data: purchasedCourses } = await supabase
      .from('course_purchases')
      .select('course_id')
      .eq('user_id', currentUser.id)
      .eq('access_status', 'active');

    const purchasedCourseIds = (purchasedCourses || []).map(pc => pc.course_id);

    // Obtener cursos sugeridos (cursos activos, populares, excluyendo los que ya tiene)
    let query = supabase
      .from('courses')
      .select('id, title, description, thumbnail_url, slug, category, duration_total_minutes, level, student_count, average_rating')
      .eq('is_active', true)
      .order('student_count', { ascending: false })
      .limit(20);

    if (purchasedCourseIds.length > 0) {
      query = query.not('id', 'in', `(${purchasedCourseIds.join(',')})`);
    }

    const { data: courses, error: coursesError } = await query;

    if (coursesError) {
      console.error('Error fetching suggested courses:', coursesError);
      return NextResponse.json(
        { error: 'Error al obtener cursos sugeridos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      courses: courses || [],
    });
  } catch (error) {
    console.error('Error in suggested courses API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}





