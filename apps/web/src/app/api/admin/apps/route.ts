import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { createClient } from '../../../../lib/supabase/server'
import { sanitizeSlug, generateUniqueSlugAsync } from '../../../../lib/slug'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { CreateAppSchema } from '@/lib/schemas/app.schema'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()

    const { data: apps, error } = await supabase
      .from('ai_apps')
      .select(`
        app_id,
        name,
        slug,
        description,
        long_description,
        category_id,
        website_url,
        logo_url,
        pricing_model,
        pricing_details,
        features,
        use_cases,
        advantages,
        disadvantages,
        alternatives,
        tags,
        supported_languages,
        integrations,
        api_available,
        mobile_app,
        desktop_app,
        browser_extension,
        is_featured,
        is_verified,
        view_count,
        like_count,
        rating,
        rating_count,
        is_active,
        created_at,
        updated_at,
        ai_categories!inner(
          category_id,
          name,
          slug,
          description,
          icon,
          color
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching admin apps:', error)
      return NextResponse.json(
        { error: 'Failed to fetch apps' },
        { status: 500 }
      )
    }

    return NextResponse.json({ apps: apps || [] })
  } catch (error) {
    logger.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()
    
    // ✅ SEGURIDAD: Validar datos de entrada con Zod
    const bodyRaw = await request.json()
    const body = CreateAppSchema.parse(bodyRaw)
    
    logger.log('🔄 Creando nueva app con datos validados:', body)
    
    // ✅ SEGURIDAD: Sanitizar y generar slug único
    let slug: string;
    
    if (body.slug) {
      slug = sanitizeSlug(body.slug);
    } else if (body.name) {
      slug = sanitizeSlug(body.name);
    } else {
      return NextResponse.json(
        { error: 'Se requiere nombre o slug' },
        { status: 400 }
      );
    }

    // Verificar unicidad
    slug = await generateUniqueSlugAsync(slug, async (testSlug) => {
      const { data } = await supabase
        .from('ai_apps')
        .select('slug')
        .eq('slug', testSlug)
        .single();
      return !!data;
    });
    
    const { data: newApp, error } = await supabase
      .from('ai_apps')
      .insert({
        name: body.name,
        slug,
        description: body.description,
        long_description: body.long_description,
        category_id: body.category_id,
        website_url: body.website_url,
        logo_url: body.logo_url,
        pricing_model: body.pricing_model || 'free',
        pricing_details: body.pricing_details || {},
        features: body.features || [],
        use_cases: body.use_cases || [],
        advantages: body.advantages || [],
        disadvantages: body.disadvantages || [],
        alternatives: body.alternatives || [],
        tags: body.tags || [],
        supported_languages: body.supported_languages || [],
        integrations: body.integrations || [],
        api_available: body.api_available || false,
        mobile_app: body.mobile_app || false,
        desktop_app: body.desktop_app || false,
        browser_extension: body.browser_extension || false,
        is_featured: body.is_featured || false,
        is_verified: body.is_verified || false,
        view_count: 0,
        like_count: 0,
        rating: 0,
        rating_count: 0,
        is_active: body.is_active !== undefined ? body.is_active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      logger.error('❌ Error creating app:', error)
      return NextResponse.json(
        { error: 'Failed to create app' },
        { status: 500 }
      )
    }

    logger.log('✅ App creada exitosamente:', newApp)
    return NextResponse.json({ app: newApp }, { status: 201 })
  } catch (error) {
    // ✅ SEGURIDAD: Manejo específico de errores de validación
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Datos inválidos',
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }, { status: 400 })
    }
    
    logger.error('💥 Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
