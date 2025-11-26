import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;

    // Obtener idioma de querystring
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'es';

    // Buscar app base
    const { data: app, error } = await supabase
      .from('ai_apps')
      .select(`
        *,
        ai_categories (
          name,
          slug,
          color,
          icon
        )
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !app) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 }
      );
    }

    // Si idioma no es español, buscar traducción
    console.log('🌐 [API Detail] Idioma recibido:', lang);
    console.log('📦 [API Detail] App encontrada:', app.name);

    if (lang !== 'es') {
      console.log('🔍 [API Detail] Buscando traducción para app_id:', app.app_id);

      const { data: translation, error: translationError } = await supabase
        .from('app_directory_translations')
        .select('*')
        .eq('app_id', app.app_id)
        .eq('language', lang)
        .single();

      console.log('✨ [API Detail] Traducción encontrada:', translation ? 'SÍ' : 'NO');
      if (translationError) {
        console.error('❌ [API Detail] Error buscando traducción:', translationError);
      }

      if (translation) {
        console.log(`✅ [API Detail] Traduciendo "${app.name}" → "${translation.name}"`);
        // Sobrescribir campos traducibles
        app.name = translation.name || app.name;
        app.description = translation.description || app.description;
        app.long_description = translation.long_description || app.long_description;
        app.features = translation.features || app.features;
        app.use_cases = translation.use_cases || app.use_cases;
        app.advantages = translation.advantages || app.advantages;
        app.disadvantages = translation.disadvantages || app.disadvantages;
      } else {
        console.log('⚠️ [API Detail] No se encontró traducción');
      }
    } else {
      console.log('🇪🇸 [API Detail] Usando español (sin traducciones)');
    }

    // Log de los datos finales devueltos
    console.log('Datos finales enviados:', app);
    return NextResponse.json({ app });
  } catch (error) {
    // console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
