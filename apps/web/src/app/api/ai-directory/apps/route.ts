import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '../../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const pricing = searchParams.get('pricing');
    const featured = searchParams.get('featured');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const lang = searchParams.get('lang') || 'es';

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
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
      .eq('is_active', true);

    // Apply filters
    if (category) {
      query = query.eq('category_id', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`);
    }

    if (pricing) {
      query = query.eq('pricing_model', pricing);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: apps, error } = await query;

    console.log('🌐 [API] Idioma recibido:', lang);
    console.log('📦 [API] Apps encontradas:', apps?.length || 0);

    // Si idioma no es español, buscar traducciones y sobrescribir campos
    if (lang !== 'es' && Array.isArray(apps)) {
      const appIds = apps.map(app => app.app_id);
      console.log('🔍 [API] Buscando traducciones para:', appIds.length, 'apps');

      if (appIds.length > 0) {
        const { data: translations, error: translationsError } = await supabase
          .from('app_directory_translations')
          .select('*')
          .in('app_id', appIds)
          .eq('language', lang);

        console.log('✨ [API] Traducciones encontradas:', translations?.length || 0);
        if (translationsError) {
          console.error('❌ [API] Error buscando traducciones:', translationsError);
        }

        if (translations && translations.length > 0) {
          console.log('📝 [API] Aplicando traducciones...');
          const translationMap = Object.fromEntries(translations.map(t => [t.app_id, t]));

          apps.forEach(app => {
            const translation = translationMap[app.app_id];
            if (translation) {
              console.log(`  ✅ Traduciendo "${app.name}" → "${translation.name}"`);
              app.name = translation.name || app.name;
              app.description = translation.description || app.description;
              app.long_description = translation.long_description || app.long_description;
              app.features = translation.features || app.features;
              app.use_cases = translation.use_cases || app.use_cases;
              app.advantages = translation.advantages || app.advantages;
              app.disadvantages = translation.disadvantages || app.disadvantages;
            } else {
              console.log(`  ⚠️ Sin traducción para app_id: ${app.app_id}`);
            }
          });
          console.log('✅ [API] Traducciones aplicadas correctamente');
        } else {
          console.log('⚠️ [API] No se encontraron traducciones en la tabla');
        }
      }
    } else {
      console.log('🇪🇸 [API] Usando español (sin traducciones)');
    }

    if (error) {
      logger.error('Error fetching apps:', error);
      return NextResponse.json(
        { error: 'Failed to fetch apps' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('ai_apps')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (category) {
      countQuery = countQuery.eq('category_id', category);
    }

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`);
    }

    if (pricing) {
      countQuery = countQuery.eq('pricing_model', pricing);
    }

    if (featured === 'true') {
      countQuery = countQuery.eq('is_featured', true);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      logger.error('Error fetching count:', countError);
      return NextResponse.json(
        { error: 'Failed to fetch count' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      apps,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    logger.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
