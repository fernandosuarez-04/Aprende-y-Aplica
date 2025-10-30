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
