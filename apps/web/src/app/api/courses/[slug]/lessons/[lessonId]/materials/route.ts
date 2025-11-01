import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/courses/[slug]/lessons/[lessonId]/materials
 * Obtiene todos los materiales de una lección
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

    // Obtener materiales de la lección
    const { data: materials, error: materialsError } = await supabase
      .from('lesson_materials')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('material_order_index', { ascending: true });

    if (materialsError) {
      console.error('Error fetching materials:', materialsError);
      return NextResponse.json(
        { error: 'Error al obtener materiales' },
        { status: 500 }
      );
    }

    return NextResponse.json(materials || []);
  } catch (error) {
    console.error('Error in materials API:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

