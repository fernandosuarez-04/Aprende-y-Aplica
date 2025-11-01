import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/courses/[slug]/lessons/[lessonId]/activities
 * Obtiene todas las actividades de una lección
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  try {
    const { slug, lessonId } = await params;
    const supabase = await createClient();

    // Verificar que el curso existe
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que la lección existe y pertenece al curso
    const { data: lesson, error: lessonError } = await supabase
      .from('course_lessons')
      .select('lesson_id, module_id')
      .eq('lesson_id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'Lección no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el módulo pertenece al curso
    const { data: module, error: moduleError } = await supabase
      .from('course_modules')
      .select('module_id')
      .eq('module_id', lesson.module_id)
      .eq('course_id', course.id)
      .single();

    if (moduleError || !module) {
      return NextResponse.json(
        { error: 'Módulo no encontrado o no pertenece al curso' },
        { status: 404 }
      );
    }

    // Obtener actividades de la lección
    const { data: activities, error: activitiesError } = await supabase
      .from('lesson_activities')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('activity_order_index', { ascending: true });

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
      return NextResponse.json(
        { error: 'Error al obtener actividades' },
        { status: 500 }
      );
    }

    return NextResponse.json(activities || []);
  } catch (error) {
    console.error('Error in activities API:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

