import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // TODO: Agregar verificación de admin cuando esté funcionando
    // const { data: { user }, error: authError } = await supabase.auth.getUser()
    //
    // if (authError || !user) {
    //   return NextResponse.json(
    //     { error: 'No autorizado' },
    //     { status: 401 }
    //   )
    // }

    console.log('🔄 Obteniendo todas las noticias para admin...')

    const { data: news, error } = await supabase
      .from('news')
      .select(`
        id,
        title,
        slug,
        subtitle,
        intro,
        sections,
        hero_image_url,
        language,
        status,
        published_at,
        created_at,
        updated_at,
        created_by,
        tldr,
        metrics,
        links,
        cta
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching news:', error)
      return NextResponse.json(
        { error: 'Failed to fetch news' },
        { status: 500 }
      )
    }

    console.log('✅ Noticias obtenidas exitosamente:', news?.length || 0)
    return NextResponse.json({ news: news || [] })
  } catch (error) {
    console.error('💥 Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // TODO: Agregar verificación de admin cuando esté funcionando
    // const { data: { user }, error: authError } = await supabase.auth.getUser()
    //
    // if (authError || !user) {
    //   return NextResponse.json(
    //     { error: 'No autorizado' },
    //     { status: 401 }
    //   )
    // }

    const body = await request.json()

    console.log('🔄 Creando nueva noticia con datos:', JSON.stringify(body, null, 2))

    // Parsear campos JSON
    const parseJsonField = (field: any) => {
      if (field === undefined || field === null || field === '') return null
      if (typeof field !== 'string') return field // Si ya es un objeto/array, devolverlo tal como está
      try {
        return JSON.parse(field)
      } catch {
        return null
      }
    }

    const { data: newNews, error } = await supabase
      .from('news')
      .insert({
        title: body.title,
        slug: body.slug,
        subtitle: body.subtitle,
        intro: body.intro,
        sections: parseJsonField(body.sections),
        hero_image_url: body.hero_image_url,
        language: body.language || 'es',
        status: body.status || 'draft',
        published_at: body.status === 'published' ? new Date().toISOString() : null,
        created_by: body.created_by || 'admin-user-id',
        tldr: parseJsonField(body.tldr),
        metrics: parseJsonField(body.metrics) || { views: 0, comments: 0 },
        links: parseJsonField(body.links),
        cta: parseJsonField(body.cta),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating news:', error)
      return NextResponse.json(
        { error: 'Failed to create news' },
        { status: 500 }
      )
    }

    console.log('✅ Noticia creada exitosamente:', newNews)
    return NextResponse.json({ news: newNews }, { status: 201 })
  } catch (error) {
    console.error('💥 Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
