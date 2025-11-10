import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/ai-directory/apps/[slug]/view
 * Incrementa el contador de visualizaciones de una app
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // Obtener la app por slug
    const { data: app, error: appError } = await supabase
      .from('ai_apps')
      .select('app_id, view_count')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (appError || !app) {
      return NextResponse.json(
        { error: 'App no encontrada' },
        { status: 404 }
      );
    }

    // Incrementar contador de visualizaciones
    const newViewCount = (app.view_count || 0) + 1;
    
    const { error: updateError } = await supabase
      .from('ai_apps')
      .update({ 
        view_count: newViewCount,
        updated_at: new Date().toISOString()
      })
      .eq('app_id', app.app_id);

    if (updateError) {
      console.error('Error incrementing app view count:', updateError);
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
    console.error('Error in POST /api/ai-directory/apps/[slug]/view:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

