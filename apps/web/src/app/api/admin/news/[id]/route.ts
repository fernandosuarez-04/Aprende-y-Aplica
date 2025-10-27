import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // TODO: Agregar verificación de admin cuando esté funcionando
    // const { data: { user }, error: authError } = await supabase.auth.getUser()
    //
    // if (authError || !user) {
    //   return NextResponse.json(
    //     { error: 'No autorizado' },
    //     { status: 401 }
    //   )
    // }

    console.log('🔄 Obteniendo noticia con ID:', params.id)

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
      .eq('id', id)
      .single()

    if (error) {
      console.error('❌ Error fetching news:', error)
      return NextResponse.json(
        { error: 'News not found' },
        { status: 404 }
      )
    }

    console.log('✅ Noticia obtenida exitosamente:', news)
    return NextResponse.json({ news })
  } catch (error) {
    console.error('💥 Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

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

    console.log('🔄 Body recibido:', JSON.stringify(body, null, 2))

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

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Solo actualizar campos que están presentes en el body
    if (body.title !== undefined) updateData.title = body.title
    if (body.slug !== undefined) updateData.slug = body.slug
    if (body.subtitle !== undefined) updateData.subtitle = body.subtitle
    if (body.intro !== undefined) updateData.intro = body.intro
    if (body.sections !== undefined) updateData.sections = parseJsonField(body.sections)
    if (body.hero_image_url !== undefined) updateData.hero_image_url = body.hero_image_url
    if (body.language !== undefined) updateData.language = body.language
    if (body.status !== undefined) {
      updateData.status = body.status
      // Si se cambia a publicado y no tiene fecha de publicación, agregarla
      if (body.status === 'published' && !body.published_at) {
        updateData.published_at = new Date().toISOString()
      }
    }
    if (body.created_by !== undefined) updateData.created_by = body.created_by
    if (body.tldr !== undefined) updateData.tldr = parseJsonField(body.tldr)
    if (body.links !== undefined) updateData.links = parseJsonField(body.links)
    if (body.cta !== undefined) updateData.cta = parseJsonField(body.cta)
    if (body.metrics !== undefined) updateData.metrics = parseJsonField(body.metrics)

    console.log('🔄 Actualizando noticia con ID:', id)
    console.log('📋 Datos a actualizar:', updateData)

    const { data: updatedNews, error } = await supabase
      .from('news')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating news:', error)
      return NextResponse.json(
        { error: 'Failed to update news' },
        { status: 500 }
      )
    }

    console.log('✅ Noticia actualizada exitosamente:', updatedNews)
    return NextResponse.json({ news: updatedNews })
  } catch (error) {
    console.error('💥 Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // TODO: Agregar verificación de admin cuando esté funcionando
    // const { data: { user }, error: authError } = await supabase.auth.getUser()
    //
    // if (authError || !user) {
    //   return NextResponse.json(
    //     { error: 'No autorizado' },
    //     { status: 401 }
    //   )
    // }

    console.log('🔄 Eliminando noticia con ID:', params.id)

    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ Error deleting news:', error)
      return NextResponse.json(
        { error: 'Failed to delete news' },
        { status: 500 }
      )
    }

    console.log('✅ Noticia eliminada exitosamente')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('💥 Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
