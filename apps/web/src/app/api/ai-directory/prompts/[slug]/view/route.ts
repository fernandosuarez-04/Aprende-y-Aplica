import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/ai-directory/prompts/[slug]/view
 * Incrementa el contador de visualizaciones de un prompt
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // Obtener el prompt por slug
    const { data: prompt, error: promptError } = await supabase
      .from('ai_prompts')
      .select('prompt_id, view_count')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (promptError || !prompt) {
      return NextResponse.json(
        { error: 'Prompt no encontrado' },
        { status: 404 }
      );
    }

    // Incrementar contador de visualizaciones
    const newViewCount = (prompt.view_count || 0) + 1;
    
    const { error: updateError } = await supabase
      .from('ai_prompts')
      .update({ 
        view_count: newViewCount,
        updated_at: new Date().toISOString()
      })
      .eq('prompt_id', prompt.prompt_id);

    if (updateError) {
      console.error('Error incrementing prompt view count:', updateError);
      return NextResponse.json(
        { error: 'Error al incrementar visualizaciones' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      view_count: newViewCount
    });
  } catch (error) {
    console.error('Error in POST /api/ai-directory/prompts/[slug]/view:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

