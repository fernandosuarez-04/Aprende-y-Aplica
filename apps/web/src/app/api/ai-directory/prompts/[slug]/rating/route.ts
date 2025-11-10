import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * GET /api/ai-directory/prompts/[slug]/rating
 * Verifica si el usuario actual ya calificó el prompt y retorna el rating si existe
 */
export async function GET(
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

    // Obtener el prompt por slug
    const { data: prompt, error: promptError } = await supabase
      .from('ai_prompts')
      .select('prompt_id')
      .eq('slug', slug)
      .single();

    if (promptError || !prompt) {
      return NextResponse.json(
        { error: 'Prompt no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el usuario ya calificó el prompt
    const { data: rating, error: ratingError } = await supabase
      .from('prompt_ratings')
      .select('rating_id, rating, review, created_at, updated_at')
      .eq('prompt_id', prompt.prompt_id)
      .eq('user_id', user.id)
      .single();

    if (ratingError && ratingError.code !== 'PGRST116') {
      // PGRST116 es "no rows returned", que es esperado si no hay rating
      return NextResponse.json(
        { error: 'Error al verificar rating' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      hasRating: !!rating,
      rating: rating || null,
    });
  } catch (error) {
    console.error('Error in GET /api/ai-directory/prompts/[slug]/rating:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai-directory/prompts/[slug]/rating
 * Crea o actualiza el rating de un prompt (UPSERT)
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

    // Obtener datos del body
    const body = await request.json();
    const { rating, review } = body;

    // Validar rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'El rating debe ser un número entre 1 y 5' },
        { status: 400 }
      );
    }

    // Obtener el prompt por slug
    const { data: prompt, error: promptError } = await supabase
      .from('ai_prompts')
      .select('prompt_id')
      .eq('slug', slug)
      .single();

    if (promptError || !prompt) {
      return NextResponse.json(
        { error: 'Prompt no encontrado' },
        { status: 404 }
      );
    }

    // Preparar datos para UPSERT
    const ratingData = {
      prompt_id: prompt.prompt_id,
      user_id: user.id,
      rating: Math.round(rating), // Asegurar que sea entero
      review: review || null,
      updated_at: new Date().toISOString(),
    };

    // UPSERT usando ON CONFLICT (maneja la restricción UNIQUE)
    const { data: ratingResult, error: upsertError } = await supabase
      .from('prompt_ratings')
      .upsert(ratingData, {
        onConflict: 'prompt_id,user_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error upserting prompt rating:', upsertError);
      return NextResponse.json(
        { error: 'Error al guardar la calificación' },
        { status: 500 }
      );
    }

    // Actualizar rating y rating_count en la tabla ai_prompts
    // Primero calcular el promedio y conteo
    const { data: allRatings, error: ratingsError } = await supabase
      .from('prompt_ratings')
      .select('rating')
      .eq('prompt_id', prompt.prompt_id);

    if (ratingsError) {
      console.error('Error fetching ratings for average:', ratingsError);
      // No fallar la operación si no podemos actualizar el promedio
    } else {
      // Siempre actualizar, incluso si no hay ratings (para poner 0)
      const ratingCount = allRatings?.length || 0;
      const averageRating = ratingCount > 0
        ? allRatings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingCount
        : 0;

      // Actualizar el prompt con el nuevo promedio y conteo
      const { error: updateError } = await supabase
        .from('ai_prompts')
        .update({
          rating: ratingCount > 0 ? Math.round(averageRating * 10) / 10 : 0, // 0 si no hay ratings
          rating_count: ratingCount,
          updated_at: new Date().toISOString(),
        })
        .eq('prompt_id', prompt.prompt_id);

      if (updateError) {
        console.error('Error updating prompt rating stats:', updateError);
        // No fallar la operación si no podemos actualizar las estadísticas
      }
    }

    return NextResponse.json({
      success: true,
      rating: ratingResult,
      message: 'Calificación guardada exitosamente',
    });
  } catch (error) {
    console.error('Error in POST /api/ai-directory/prompts/[slug]/rating:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

