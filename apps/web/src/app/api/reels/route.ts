import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const language = searchParams.get('language') || 'es';
    const featured = searchParams.get('featured') === 'true';
    
    const offset = (page - 1) * limit;

    console.log('🔍 Fetching reels with params:', { page, limit, category, language, featured });

    try {
      // Construir la consulta base
      let query = supabase
        .from('reels')
        .select(`
          id,
          title,
          description,
          video_url,
          thumbnail_url,
          duration_seconds,
          category,
          language,
          is_featured,
          view_count,
          like_count,
          share_count,
          comment_count,
          created_by,
          created_at,
          published_at,
          users!reels_created_by_fkey (
            id,
            username,
            first_name,
            last_name,
            profile_picture_url
          )
        `)
        .eq('is_active', true)
        .eq('language', language);

      // Aplicar filtros
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      if (featured) {
        query = query.eq('is_featured', true);
      }

      // Ordenar por fecha de publicación o creación
      query = query
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: reels, error: reelsError } = await query;

      if (reelsError) {
        console.log('⚠️ Error fetching reels from database, tables may not exist:', reelsError.message);
        // Retornar array vacío si las tablas no existen
        return NextResponse.json({
          reels: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasMore: false
          }
        });
      }

      // Obtener hashtags para cada reel
      const reelsWithHashtags = await Promise.all(
        (reels || []).map(async (reel) => {
          try {
            const { data: hashtags } = await supabase
              .from('reel_hashtag_relations')
              .select(`
                reel_hashtags (
                  name
                )
              `)
              .eq('reel_id', reel.id);

            return {
              ...reel,
              hashtags: hashtags?.map(h => h.reel_hashtags.name) || []
            };
          } catch (error) {
            return {
              ...reel,
              hashtags: []
            };
          }
        })
      );

      // Obtener total de reels para paginación
      let countQuery = supabase
        .from('reels')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('language', language);

      if (category && category !== 'all') {
        countQuery = countQuery.eq('category', category);
      }

      if (featured) {
        countQuery = countQuery.eq('is_featured', true);
      }

      const { count } = await countQuery;

      console.log('✅ Reels fetched successfully:', reelsWithHashtags.length);

      return NextResponse.json({
        reels: reelsWithHashtags,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          hasMore: (offset + limit) < (count || 0)
        }
      });

    } catch (dbError) {
      console.log('⚠️ Database error, returning empty reels:', dbError);
      // Retornar array vacío si hay error de base de datos
      return NextResponse.json({
        reels: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasMore: false
        }
      });
    }

  } catch (error) {
    console.error('❌ Error in reels API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { SessionService } = await import('../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      video_url,
      thumbnail_url,
      duration_seconds,
      category,
      language = 'es',
      hashtags = []
    } = body;

    // Validar datos requeridos
    if (!title || !video_url) {
      return NextResponse.json({ error: 'Título y URL del video son requeridos' }, { status: 400 });
    }

    console.log('🔍 Creating new reel:', { title, category, language });

    // Crear el reel
    const { data: newReel, error: reelError } = await supabase
      .from('reels')
      .insert({
        title,
        description,
        video_url,
        thumbnail_url,
        duration_seconds,
        category,
        language,
        created_by: user.id,
        published_at: new Date().toISOString()
      })
      .select()
      .single();

    if (reelError) {
      console.error('❌ Error creating reel:', reelError);
      return NextResponse.json({ error: 'Error al crear el reel' }, { status: 500 });
    }

    // Procesar hashtags si existen
    if (hashtags.length > 0) {
      for (const hashtagName of hashtags) {
        // Crear o obtener hashtag
        const { data: hashtag } = await supabase
          .from('reel_hashtags')
          .upsert(
            { name: hashtagName.toLowerCase() },
            { onConflict: 'name' }
          )
          .select()
          .single();

        if (hashtag) {
          // Crear relación
          await supabase
            .from('reel_hashtag_relations')
            .insert({
              reel_id: newReel.id,
              hashtag_id: hashtag.id
            });
        }
      }
    }

    console.log('✅ Reel created successfully:', newReel.id);

    return NextResponse.json({
      reel: newReel,
      message: 'Reel creado exitosamente'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error in reels POST API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
