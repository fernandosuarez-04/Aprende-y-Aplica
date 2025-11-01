import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * GET /api/courses/[slug]/questions
 * Obtiene todas las preguntas de un curso
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // Obtener el curso por slug
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

    // Obtener parámetros de query para filtros
    const { searchParams } = new URL(request.url);
    const isResolved = searchParams.get('resolved');
    const isPinned = searchParams.get('pinned');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir query base
    let query = supabase
      .from('course_questions')
      .select(`
        *,
        user:users!course_questions_user_id_fkey(
          id,
          username,
          display_name,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .eq('course_id', course.id)
      .eq('is_hidden', false)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros
    if (isResolved === 'true') {
      query = query.eq('is_resolved', true);
    } else if (isResolved === 'false') {
      query = query.eq('is_resolved', false);
    }

    if (isPinned === 'true') {
      query = query.eq('is_pinned', true);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data: questions, error: questionsError } = await query;

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json(
        { error: 'Error al obtener preguntas' },
        { status: 500 }
      );
    }

    return NextResponse.json(questions || []);
  } catch (error) {
    console.error('Error in questions API:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses/[slug]/questions
 * Crea una nueva pregunta en el curso
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // Obtener usuario actual
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener el curso por slug
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

    // Obtener datos del body
    const body = await request.json();
    const { title, content, tags, attachment_url, attachment_type, attachment_data } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'El contenido de la pregunta es requerido' },
        { status: 400 }
      );
    }

    // Crear la pregunta
    const { data: question, error: questionError } = await supabase
      .from('course_questions')
      .insert({
        course_id: course.id,
        user_id: user.id,
        title: title?.trim() || null,
        content: content.trim(),
        tags: tags || [],
        attachment_url: attachment_url || null,
        attachment_type: attachment_type || null,
        attachment_data: attachment_data || {}
      })
      .select(`
        *,
        user:users!course_questions_user_id_fkey(
          id,
          username,
          display_name,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .single();

    if (questionError) {
      console.error('Error creating question:', questionError);
      return NextResponse.json(
        { error: 'Error al crear pregunta' },
        { status: 500 }
      );
    }

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Error in questions API:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

