import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '../../../../lib/supabase/server';
import { SessionService } from '../../../../features/auth/services/session.service';
import { PromptFavoritesService } from '../../../../features/ai-directory/services/prompt-favorites.service';

// ✅ Función de sanitización para prevenir inyección PostgREST
function sanitizeSearchInput(input: string): string {
  // Remover caracteres especiales de PostgREST y limitar longitud
  return input
    .replace(/[%_{}()]/g, '\\$&') // Escapar caracteres especiales
    .trim()
    .substring(0, 100); // Limitar longitud a 100 caracteres
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const difficulty = searchParams.get('difficulty');
    const featured = searchParams.get('featured');
    const favorites = searchParams.get('favorites');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const offset = (page - 1) * limit;

    // Get favorite prompt IDs if favorites filter is enabled
    let favoritePromptIds: string[] = [];
    if (favorites === 'true') {
      try {
        const currentUser = await SessionService.getCurrentUser();
        if (currentUser) {
          favoritePromptIds = await PromptFavoritesService.getUserPromptFavorites(currentUser.id);
          // If user has no favorites, return empty result
          if (favoritePromptIds.length === 0) {
            return NextResponse.json({
              prompts: [],
              pagination: {
                page,
                limit,
                total: 0,
                totalPages: 0
              }
            });
          }
        } else {
          // If not authenticated and favorites is requested, return empty
          return NextResponse.json({
            prompts: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0
            }
          });
        }
      } catch (error) {
        logger.error('Error fetching favorite prompts:', error);
        // If error fetching favorites, return empty result
        return NextResponse.json({
          prompts: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        });
      }
    }

    // Build query
    let query = supabase
      .from('ai_prompts')
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

    // ✅ Sanitizar búsqueda antes de usar
    if (search) {
      const sanitizedSearch = sanitizeSearchInput(search);
      
      // Validar que la búsqueda no esté vacía después de sanitizar
      if (!sanitizedSearch) {
        return NextResponse.json(
          { error: 'Búsqueda inválida' },
          { status: 400 }
        );
      }
      
      query = query.or(`title.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`);
    }

    if (difficulty) {
      query = query.eq('difficulty_level', difficulty);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    // Apply favorites filter
    if (favorites === 'true' && favoritePromptIds.length > 0) {
      query = query.in('prompt_id', favoritePromptIds);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: prompts, error } = await query;

    if (error) {
      logger.error('Error fetching prompts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch prompts' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('ai_prompts')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (category) {
      countQuery = countQuery.eq('category_id', category);
    }

    // ✅ Aplicar la misma sanitización al countQuery
    if (search) {
      const sanitizedSearch = sanitizeSearchInput(search);
      if (sanitizedSearch) {
        countQuery = countQuery.or(`title.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`);
      }
    }

    if (difficulty) {
      countQuery = countQuery.eq('difficulty_level', difficulty);
    }

    if (featured === 'true') {
      countQuery = countQuery.eq('is_featured', true);
    }

    // Apply favorites filter to count query
    if (favorites === 'true' && favoritePromptIds.length > 0) {
      countQuery = countQuery.in('prompt_id', favoritePromptIds);
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
      prompts,
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
