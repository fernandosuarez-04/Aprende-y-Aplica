import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * GET /api/courses/[slug]/questions/[questionId]/responses
 * Obtiene todas las respuestas de una pregunta con respuestas anidadas
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; questionId: string }> }
) {
  try {
    const { slug, questionId } = await params;
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

    // Verificar que la pregunta existe
    const { data: question, error: questionError } = await supabase
      .from('course_questions')
      .select('id')
      .eq('id', questionId)
      .eq('course_id', course.id)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Pregunta no encontrada' },
        { status: 404 }
      );
    }

    // Obtener respuestas directas (sin parent_response_id)
    const { data: responses, error: responsesError } = await supabase
      .from('course_question_responses')
      .select(`
        *,
        user:users!course_question_responses_user_id_fkey(
          id,
          username,
          display_name,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .eq('question_id', questionId)
      .is('parent_response_id', null)
      .eq('is_deleted', false)
      .order('is_approved_answer', { ascending: false })
      .order('is_instructor_answer', { ascending: false })
      .order('created_at', { ascending: true });

    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
      return NextResponse.json(
        { error: 'Error al obtener respuestas' },
        { status: 500 }
      );
    }

    // Para cada respuesta, obtener sus respuestas anidadas
    const responsesWithReplies = await Promise.all(
      (responses || []).map(async (response) => {
        const { data: replies, error: repliesError } = await supabase
          .from('course_question_responses')
          .select(`
            *,
            user:users!course_question_responses_user_id_fkey(
              id,
              username,
              display_name,
              first_name,
              last_name,
              profile_picture_url
            )
          `)
          .eq('parent_response_id', response.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });

        if (repliesError) {
          console.error('Error fetching replies:', repliesError);
          return { ...response, replies: [] };
        }

        return { ...response, replies: replies || [] };
      })
    );

    return NextResponse.json(responsesWithReplies);
  } catch (error) {
    console.error('Error in responses API:', error);
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
 * POST /api/courses/[slug]/questions/[questionId]/responses
 * Crea una nueva respuesta a una pregunta
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; questionId: string }> }
) {
  try {
    const { slug, questionId } = await params;
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
      .select('id, instructor_id')
      .eq('slug', slug)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que la pregunta existe
    const { data: question, error: questionError } = await supabase
      .from('course_questions')
      .select('id')
      .eq('id', questionId)
      .eq('course_id', course.id)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Pregunta no encontrada' },
        { status: 404 }
      );
    }

    // Obtener datos del body
    const body = await request.json();
    const { content, parent_response_id, attachment_url, attachment_type, attachment_data } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'El contenido de la respuesta es requerido' },
        { status: 400 }
      );
    }

    // Determinar si es respuesta de instructor
    const isInstructorAnswer = course.instructor_id === user.id;

    // Crear la respuesta
    const { data: response, error: responseError } = await supabase
      .from('course_question_responses')
      .insert({
        question_id: questionId,
        course_id: course.id,
        user_id: user.id,
        content: content.trim(),
        parent_response_id: parent_response_id || null,
        is_instructor_answer: isInstructorAnswer,
        attachment_url: attachment_url || null,
        attachment_type: attachment_type || null,
        attachment_data: attachment_data || {}
      })
      .select(`
        *,
        user:users!course_question_responses_user_id_fkey(
          id,
          username,
          display_name,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .single();

    if (responseError) {
      console.error('Error creating response:', responseError);
      return NextResponse.json(
        { error: 'Error al crear respuesta' },
        { status: 500 }
      );
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error in responses API:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

